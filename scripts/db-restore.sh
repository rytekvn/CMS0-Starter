#!/usr/bin/env bash
set -euo pipefail

# Restore Postgres tu file .dump (custom format) sinh boi scripts/db-backup.sh.
# CANH BAO: ghi de toan bo du lieu trong database dich (--clean). Bat buoc go
# dung ten database de xac nhan truoc khi chay. Xem docs/runbooks/backup-restore.md.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

DUMP_FILE="${1:-}"
if [ -z "$DUMP_FILE" ] || [ ! -f "$DUMP_FILE" ]; then
  echo "Dung: scripts/db-restore.sh <duong-dan-file.dump>" >&2
  exit 1
fi

if [ -z "${DATABASE_URL:-}" ] && [ -f "$ROOT_DIR/apps/api/.env" ]; then
  DATABASE_URL="$(grep -E '^DATABASE_URL=' "$ROOT_DIR/apps/api/.env" | tail -n1 | cut -d= -f2- | tr -d '"')"
fi

if [ -z "${DATABASE_URL:-}" ]; then
  echo "Loi: khong tim thay DATABASE_URL (set bien env, hoac tao apps/api/.env tu .env.example)." >&2
  exit 1
fi

PG_URL="${DATABASE_URL%%\?*}"
DB_NAME="$(basename "$PG_URL")"

echo "CANH BAO: restore se GHI DE toan bo du lieu trong database '$DB_NAME'."
echo "Nguon: $DUMP_FILE"
read -r -p "Go chinh xac ten database ('$DB_NAME') de xac nhan: " CONFIRM
if [ "$CONFIRM" != "$DB_NAME" ]; then
  echo "Khong khop ten database, huy restore." >&2
  exit 1
fi

pg_restore -d "$PG_URL" --clean --if-exists --no-owner "$DUMP_FILE"
echo "Restore xong."
