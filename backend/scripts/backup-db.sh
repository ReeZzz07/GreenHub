#!/usr/bin/env bash
# Бэкап PostgreSQL в MinIO (dev) / Yandex Object Storage (прод, тот же S3 API — см. TZ.md, docker-compose.yml).
# Формат -Fc (custom) — компактный и restore-совместимый с pg_restore (backend/scripts/restore-db.sh).
#
# Использование:
#   ./scripts/backup-db.sh              # бэкап + заливка в бакет, чистка старых по ретеншну
#   RETENTION_COUNT=30 ./scripts/backup-db.sh
#
# Планирование (это НЕ делается автоматически — системный cron/Task Scheduler вне репозитория):
#   cron:            0 3 * * * cd /path/to/GreenHub/backend && ./scripts/backup-db.sh >> backups.log 2>&1
#   Windows (Git Bash через Task Scheduler): запустить bash.exe с этим скриптом как Action.
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."

DB_USER="${POSTGRES_USER:-greenhub}"
DB_NAME="${POSTGRES_DB:-greenhub}"
BACKUP_BUCKET="${S3_BUCKET_BACKUPS:-greenhub-backups}"
RETENTION_COUNT="${RETENTION_COUNT:-14}"
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
FILENAME="greenhub-${TIMESTAMP}.dump"
LOCAL_DIR="backups"
LOCAL_PATH="${LOCAL_DIR}/${FILENAME}"

mkdir -p "$LOCAL_DIR"

echo "==> Снимаю дамп БД (${DB_NAME})..."
docker compose exec -T postgres pg_dump -U "$DB_USER" -Fc "$DB_NAME" > "$LOCAL_PATH"
DUMP_SIZE=$(du -h "$LOCAL_PATH" | cut -f1)
echo "==> Дамп готов: ${LOCAL_PATH} (${DUMP_SIZE})"

echo "==> Заливаю в бакет ${BACKUP_BUCKET}..."
docker compose exec -T minio mc mb --ignore-existing "local/${BACKUP_BUCKET}" > /dev/null
docker compose exec -T minio mc pipe "local/${BACKUP_BUCKET}/${FILENAME}" < "$LOCAL_PATH"
echo "==> Загружено: ${BACKUP_BUCKET}/${FILENAME}"

# Локальную копию не храним в репозитории — оставляем на диске лишь как самый последний бэкап
# на случай недоступности S3-хранилища; более старые локальные копии не нужны, раз есть бакет.
find "$LOCAL_DIR" -name 'greenhub-*.dump' ! -name "$FILENAME" -delete

echo "==> Чищу старые бэкапы в бакете (оставляю последние ${RETENTION_COUNT})..."
docker compose exec -T minio mc ls "local/${BACKUP_BUCKET}" \
  | awk '{print $NF}' \
  | sort \
  | head -n -"${RETENTION_COUNT}" \
  | while read -r old; do
      [ -n "$old" ] && docker compose exec -T minio mc rm "local/${BACKUP_BUCKET}/${old}"
    done

echo "==> Готово."
