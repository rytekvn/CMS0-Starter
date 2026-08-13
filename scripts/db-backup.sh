#!/usr/bin/env bash
set -euo pipefail

# Backup Postgres bang pg_dump (custom format, -Fc: nen san + dung duoc cho
# pg_restore chon bang/thu tu). Doc DATABASE_URL tu env hien tai, hoac fallback
# doc tu apps/api/.env. Xem docs/runbooks/backup-restore.md.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
BACKUP_DIR="${BACKUP_DIR:-$ROOT_DIR/backups}"

if [ -z "${DATABASE_URL:-}" ] && [ -f "$ROOT_DIR/apps/api/.env" ]; then
  DATABASE_URL="$(grep -E '^DATABASE_URL=' "$ROOT_DIR/apps/api/.env" | tail -n1 | cut -d= -f2- | tr -d '"')"
fi

if [ -z "${DATABASE_URL:-}" ]; then
  echo "Loi: khong tim thay DATABASE_URL (set bien env, hoac tao apps/api/.env tu .env.example)." >&2
  exit 1
fi

# libpq khong hieu query param "?schema=..." (rieng cua Prisma) -> bo di truoc khi dung.
PG_URL="${DATABASE_URL%%\?*}"
DB_NAME="$(basename "$PG_URL")"
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
OUT_FILE="$BACKUP_DIR/${DB_NAME}_${TIMESTAMP}.dump"

mkdir -p "$BACKUP_DIR"

echo "Backup '$DB_NAME' -> $OUT_FILE"
pg_dump "$PG_URL" -Fc -f "$OUT_FILE"
echo "Xong: $OUT_FILE ($(du -h "$OUT_FILE" | cut -f1))"
