#!/usr/bin/env bash
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-./backups}"
RETENTION_DAYS="${RETENTION_DAYS:-7}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DB_URL="${DATABASE_URL:-postgresql://reza:postgres@localhost:5432/pres_manage}"

# Strip query params (?schema=public etc.) — pg_dump doesn't support them
DB_URL="${DB_URL%%\?*}"

mkdir -p "$BACKUP_DIR"

pg_dump "$DB_URL" --clean --if-exists --no-owner | gzip > "$BACKUP_DIR/pres_manage_$TIMESTAMP.sql.gz"

find "$BACKUP_DIR" -name 'pres_manage_*.sql.gz' -mtime +$RETENTION_DAYS -delete

echo "Backup saved: $BACKUP_DIR/pres_manage_$TIMESTAMP.sql.gz"
