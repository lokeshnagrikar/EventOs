#!/bin/bash

# Production Database Restore Script for EventOS
# Validates archive integrity, drops active connections, reconstructs databases, and prepares schema.

set -euo pipefail

# Configuration
BACKUP_DIR="${BACKUP_DIR:-./backups}"
CONTAINER_NAME="${CONTAINER_NAME:-eventos-postgres-prod}"
DB_USER="${DB_USER:-eventos_admin}"
DATABASES=("auth_db" "crm_db" "event_db" "gallery_db")
LOG_FILE="$BACKUP_DIR/restore_ledger.log"

# Redirect stdout/stderr to log ledger
mkdir -p "$BACKUP_DIR"
exec > >(tee -a "$LOG_FILE") 2>&1

echo "========================================================="
echo "=== DATABASE RESTORE INITIALIZED: $(date) ==="
echo "========================================================="

# Check arguments
if [ "$#" -ne 1 ]; then
  echo "Usage: $0 <timestamp_or_backup_file_suffix>"
  echo "Example: $0 20260616_234755"
  echo "This will search for files matching '*_<timestamp>.sql.gz' in $BACKUP_DIR"
  exit 1
fi

SUFFIX="$1"

# Verify PostgreSQL container is running
if ! docker ps --filter "name=$CONTAINER_NAME" --filter "status=running" | grep -q "$CONTAINER_NAME"; then
  echo "ERROR: PostgreSQL container $CONTAINER_NAME is not running! Cannot perform restore."
  exit 1
fi

# Loop through databases and perform restore
for DB in "${DATABASES[@]}"; do
  # Resolve file paths
  GZ_FILE=""
  # If SUFFIX is a full path to a file, use it directly if it contains the DB name
  if [[ -f "$SUFFIX" && "$SUFFIX" == *"$DB"* ]]; then
    GZ_FILE="$SUFFIX"
  else
    # Otherwise search in backup directory
    GZ_FILE=$(find "$BACKUP_DIR" -type f -name "${DB}_${SUFFIX}.sql.gz" | head -n 1)
  fi

  if [ -z "$GZ_FILE" ] || [ ! -f "$GZ_FILE" ]; then
    echo "CRITICAL: Backup file not found for database: $DB (search pattern: ${DB}_${SUFFIX}.sql.gz)"
    exit 1
  fi

  SHA_FILE="${GZ_FILE}.sha256"
  echo "Processing restore of $DB from $GZ_FILE..."

  # 1. Integrity Verification
  if [ -f "$SHA_FILE" ]; then
    echo "Verifying SHA256 integrity hash..."
    # Run sha256sum check relative to directory of GZ_FILE to prevent path mismatches
    (cd "$(dirname "$GZ_FILE")" && sha256sum -c "$(basename "$SHA_FILE")")
    echo "SUCCESS: Checksum verified."
  else
    echo "WARNING: SHA256 checksum file ($SHA_FILE) not found! Proceeding with restore without verification."
  fi

  # 2. Decompress archive to temporary SQL file
  SQL_FILE="${GZ_FILE%.gz}"
  echo "Decompressing archive..."
  gunzip -c "$GZ_FILE" > "$SQL_FILE"

  # 3. Terminate open connection pools to prevent blocking
  echo "Terminating active database connections for $DB..."
  docker exec -i "$CONTAINER_NAME" psql -U "$DB_USER" -d "eventos_root" -c \
    "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${DB}' AND pid <> pg_backend_pid();" || true

  # 4. Recreate Database to ensure clean state
  echo "Dropping and recreating database: $DB..."
  docker exec -i "$CONTAINER_NAME" psql -U "$DB_USER" -d "eventos_root" -c "DROP DATABASE IF EXISTS ${DB};"
  docker exec -i "$CONTAINER_NAME" psql -U "$DB_USER" -d "eventos_root" -c "CREATE DATABASE ${DB} WITH OWNER ${DB_USER};"

  # 5. Restore DB Schema and Data
  echo "Reconstructing database $DB..."
  if docker exec -i "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB" < "$SQL_FILE"; then
    echo "SUCCESS: Database $DB successfully restored!"
  else
    echo "CRITICAL: Database reconstruction failed for $DB."
    rm -f "$SQL_FILE"
    exit 1
  fi

  # Clean up temporary sql file
  rm -f "$SQL_FILE"
done

echo "========================================================="
echo "=== DATABASE RESTORE PROCESS COMPLETE ==="
echo "=== Note: Please run 'mvn flyway:repair' or restart services to validate schemas ==="
echo "========================================================="
