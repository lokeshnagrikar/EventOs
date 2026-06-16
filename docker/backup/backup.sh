#!/bin/bash

# Production Database Backup Script for EventOS
# Saves SQL dumps, compresses them, and prunes older archives.

# Configuration
BACKUP_DIR="./backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
CONTAINER_NAME="eventos-postgres-prod"
DB_USER="eventos_admin"
DATABASES=("auth_db" "crm_db" "event_db" "gallery_db")
LOG_FILE="./backups/backup_ledger.log"

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
  
  # Trigger pg_dump on postgres container and save file
  docker exec "$CONTAINER_NAME" pg_dump -U "$DB_USER" -d "$DB" > "$FILE"
  
  if [ $? -eq 0 ]; then
    # Gzip compress dump
    gzip -f "$FILE"
    echo "SUCCESS: Backup created and compressed for: $DB"
  else
    echo "CRITICAL: pg_dump execution failed for: $DB"
    rm -f "$FILE" # Clean up empty/broken files
  fi
done

# Database Rotation - delete backups older than 7 days
echo "Pruning backups older than 7 days..."
find "$BACKUP_DIR" -type f -name "*.sql.gz" -mtime +7 -exec echo "Removing stale backup: {}" \; -exec rm -f {} \;

echo "=== BACKUP CYCLE COMPLETED: $(date) ==="
echo "========================================================="
