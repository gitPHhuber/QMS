#!/usr/bin/env bash
set -euo pipefail

# ─── Configuration ───
BACKUP_DIR="${BACKUP_DIR:-/home/user/QMS/backups}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5434}"
DB_NAME="${DB_NAME:-asvo_qms}"
DB_USER="${DB_USER:-qms}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/${DB_NAME}_${TIMESTAMP}.sql.gz"

# ─── Ensure backup directory exists ───
mkdir -p "${BACKUP_DIR}"

echo "[$(date)] Starting backup of database '${DB_NAME}'..."

# ─── Create compressed backup ───
PGPASSWORD="${DB_PASSWORD}" pg_dump \
  -h "${DB_HOST}" \
  -p "${DB_PORT}" \
  -U "${DB_USER}" \
  -d "${DB_NAME}" \
  --format=custom \
  --compress=9 \
  --verbose \
  -f "${BACKUP_FILE%.gz}" 2>&1

# Compress with gzip if plain format used
if [ -f "${BACKUP_FILE%.gz}" ]; then
  gzip "${BACKUP_FILE%.gz}"
fi

echo "[$(date)] Backup created: ${BACKUP_FILE}"
echo "[$(date)] Size: $(du -h "${BACKUP_FILE}" | cut -f1)"

# ─── Cleanup old backups ───
echo "[$(date)] Removing backups older than ${RETENTION_DAYS} days..."
find "${BACKUP_DIR}" -name "${DB_NAME}_*.sql.gz" -mtime +${RETENTION_DAYS} -delete 2>/dev/null || true
find "${BACKUP_DIR}" -name "${DB_NAME}_*.sql" -mtime +${RETENTION_DAYS} -delete 2>/dev/null || true

# ─── List remaining backups ───
echo "[$(date)] Current backups:"
ls -lh "${BACKUP_DIR}"/${DB_NAME}_* 2>/dev/null || echo "  (none)"

echo "[$(date)] Backup completed successfully."
