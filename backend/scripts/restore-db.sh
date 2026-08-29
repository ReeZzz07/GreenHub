#!/usr/bin/env bash
# Восстановление PostgreSQL из бэкапа, снятого backup-db.sh. ДЕСТРУКТИВНО — перезаписывает текущую БД.
#
# Использование:
#   ./scripts/restore-db.sh                       # что будет сделано (сухой прогон, без --yes ничего не меняет)
#   ./scripts/restore-db.sh --yes                  # восстановить из САМОГО СВЕЖЕГО бэкапа в бакете
#   ./scripts/restore-db.sh --yes greenhub-20260101-030000.dump   # восстановить конкретный файл
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."

DB_USER="${POSTGRES_USER:-greenhub}"
DB_NAME="${POSTGRES_DB:-greenhub}"
BACKUP_BUCKET="${S3_BUCKET_BACKUPS:-greenhub-backups}"

CONFIRM=""
FILENAME=""
for arg in "$@"; do
  if [ "$arg" = "--yes" ]; then CONFIRM="yes"; else FILENAME="$arg"; fi
done

if [ -z "$FILENAME" ]; then
  FILENAME=$(docker compose exec -T minio mc ls "local/${BACKUP_BUCKET}" | awk '{print $NF}' | sort | tail -1)
  if [ -z "$FILENAME" ]; then
    echo "В бакете ${BACKUP_BUCKET} нет ни одного бэкапа." >&2
    exit 1
  fi
fi

echo "Бэкап для восстановления: ${BACKUP_BUCKET}/${FILENAME}"
echo "Целевая БД: ${DB_NAME} (текущие данные будут ПОЛНОСТЬЮ ЗАМЕНЕНЫ)"

if [ -z "$CONFIRM" ]; then
  echo
  echo "Сухой прогон — ничего не изменено. Добавьте --yes, чтобы выполнить восстановление."
  exit 0
fi

mkdir -p backups
LOCAL_PATH="backups/${FILENAME}"
echo "==> Скачиваю бэкап..."
docker compose exec -T minio mc cat "local/${BACKUP_BUCKET}/${FILENAME}" > "$LOCAL_PATH"

echo "==> Восстанавливаю (pg_restore --clean --if-exists)..."
docker compose exec -T postgres pg_restore -U "$DB_USER" -d "$DB_NAME" --clean --if-exists --no-owner < "$LOCAL_PATH"

echo "==> Готово. Не забудьте перезапустить backend (Prisma-клиент кэширует соединение)."
