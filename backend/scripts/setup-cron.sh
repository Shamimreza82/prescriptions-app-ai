#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
CRON_JOB="0 2 * * * cd $PROJECT_DIR && docker compose exec -T backend bash scripts/backup-db.sh >> /var/log/db-backup.log 2>&1"

if crontab -l 2>/dev/null | grep -q "$PROJECT_DIR"; then
  echo "Cron job already exists for this project"
  exit 0
fi

(crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -
echo "Cron job added — runs daily at 2am"
echo "Backups stored in: $PROJECT_DIR/backend/backups/"
