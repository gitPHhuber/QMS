#!/usr/bin/env bash
set -euo pipefail

# ─── Configuration ───
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5434}"
DB_NAME="${DB_NAME:-asvo_qms}"
DB_USER="${DB_USER:-qms}"

if [ $# -eq 0 ]; then
  echo "Usage: $0 <backup_file>"
  echo "Example: $0 backups/asvo_qms_20250101_120000.sql.gz"
  exit 1
fi

BACKUP_FILE="$1"

if [ ! -f "${BACKUP_FILE}" ]; then
  echo "Error: Backup file '${BACKUP_FILE}' not found."
  exit 1
fi

echo "[$(date)] WARNING: This will restore database '${DB_NAME}' from '${BACKUP_FILE}'."
echo "[$(date)] All current data will be OVERWRITTEN."
read -p "Are you sure? (yes/no): " CONFIRM

if [ "${CONFIRM}" != "yes" ]; then
  echo "Restore cancelled."
  exit 0
fi

echo "[$(date)] Starting restore..."

# Handle both .gz and plain .sql files
if [[ "${BACKUP_FILE}" == *.gz ]]; then
  TEMP_FILE=$(mktemp)
  gunzip -c "${BACKUP_FILE}" > "${TEMP_FILE}"
  PGPASSWORD="${DB_PASSWORD}" pg_restore \
    -h "${DB_HOST}" \
    -p "${DB_PORT}" \
    -U "${DB_USER}" \
    -d "${DB_NAME}" \
    --clean \
    --if-exists \
    --verbose \
    "${TEMP_FILE}" 2>&1
  rm -f "${TEMP_FILE}"
else
  PGPASSWORD="${DB_PASSWORD}" pg_restore \
    -h "${DB_HOST}" \
    -p "${DB_PORT}" \
    -U "${DB_USER}" \
    -d "${DB_NAME}" \
    --clean \
    --if-exists \
    --verbose \
    "${BACKUP_FILE}" 2>&1
fi

echo "[$(date)] Restore completed successfully."
