#!/usr/bin/env bash
set -euo pipefail
# Stea Code D1 backup — runs from project root
# Usage: bash scripts/backup-db.sh
DB_NAME="stea-code-db"
BACKUP_DIR="$HOME/Desktop/backups"
TIMESTAMP=$(date +%Y-%m-%d_%H%M%S)
OUT="$BACKUP_DIR/stea-code-db-$TIMESTAMP.sql"
mkdir -p "$BACKUP_DIR"
cd "$(dirname "$0")/../workers/stea-api"
echo "→ Dumping $DB_NAME to $OUT ..."
npx wrangler d1 export "$DB_NAME" --remote --output="$OUT"
SIZE=$(du -h "$OUT" | cut -f1)
echo "✓ Backup complete: $OUT ($SIZE)"
# Prune: keep only the 8 most recent backups
ls -1t "$BACKUP_DIR"/stea-code-db-*.sql | tail -n +9 | while read -r old; do
  echo "→ Removing old backup: $old"
  rm -f "$old"
done
echo "✓ Done. Kept 8 most recent backups."
