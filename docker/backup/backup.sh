#!/bin/bash

# Production Database Backup Script for EventOS
# Saves SQL dumps, compresses them, computes integrity hashes, and prunes older archives.

set -euo pipefail

# Configuration
BACKUP_DIR="${BACKUP_DIR:-./backups}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
CONTAINER_NAME="${CONTAINER_NAME:-eventos-postgres-prod}"
DB_USER="${DB_USER:-eventos_admin}"
DATABASES=("auth_db" "crm_db" "event_db" "gallery_db")
LOG_FILE="$BACKUP_DIR/backup_ledger.log"
S3_BUCKET="${S3_BUCKET:-}" # Optional S3 bucket name for uploads

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Redirect stdout/stderr to log ledger
exec > >(tee -a "$LOG_FILE") 2>&1

echo "========================================================="
echo "=== DATABASE BACKUP INITIALIZED: $(date) ==="
echo "========================================================="

# Loop through and dump databases
for DB in "${DATABASES[@]}"; do
  echo "Backing up database: $DB..."
  FILE="$BACKUP_DIR/${DB}_$TIMESTAMP.sql"
  GZ_FILE="${FILE}.gz"
  SHA_FILE="${GZ_FILE}.sha256"
  
  # Trigger pg_dump on postgres container and save file
  if ! docker ps --filter "name=$CONTAINER_NAME" --filter "status=running" | grep -q "$CONTAINER_NAME"; then
    echo "ERROR: PostgreSQL container $CONTAINER_NAME is not running!"
    exit 1
  fi

  if docker exec "$CONTAINER_NAME" pg_dump -U "$DB_USER" -d "$DB" > "$FILE"; then
    # Gzip compress dump
    gzip -f "$FILE"
    
    # Compute sha256 checksum for integrity validation
    sha256sum "$GZ_FILE" > "$SHA_FILE"
    echo "SUCCESS: Backup created, compressed, and integrity hashed for: $DB"
    echo "Integrity hash: $(cat "$SHA_FILE")"
    
    # Optional S3 Upload Trigger
    if [ -n "$S3_BUCKET" ]; then
      echo "S3 Upload enabled. Uploading $GZ_FILE to s3://$S3_BUCKET/backups/..."
      if aws s3 cp "$GZ_FILE" "s3://$S3_BUCKET/backups/$(basename "$GZ_FILE")" && \
         aws s3 cp "$SHA_FILE" "s3://$S3_BUCKET/backups/$(basename "$SHA_FILE")"; then
        echo "S3 Upload completed successfully for: $DB"
      else
        echo "WARNING: S3 upload failed for: $DB. Backup is still preserved locally."
      fi
    fi
  else
    echo "CRITICAL: pg_dump execution failed for: $DB"
    rm -f "$FILE" "$GZ_FILE" "$SHA_FILE" # Clean up empty/broken files
    exit 1
  fi
done

# Database Rotation - delete backups and hash files older than 7 days
echo "Pruning backups and checksums older than 7 days..."
find "$BACKUP_DIR" -type f \( -name "*.sql.gz" -o -name "*.sha256" \) -mtime +7 -exec echo "Removing stale backup file: {}" \; -exec rm -f {} \;

echo "=== BACKUP CYCLE COMPLETED: $(date) ==="
echo "========================================================="
