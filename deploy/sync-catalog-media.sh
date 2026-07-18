#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 1 ]]; then
  echo "Usage: $0 <ssh-user@host>" >&2
  exit 2
fi

target="$1"
catalog=web/src/data/products.json
media_dir=web/public/products
remote_media=/var/www/dush.kz/shared/media/products
remote_catalog="/tmp/dush-products-import-$$.json"

if [[ ! -f "$catalog" ]]; then
  echo "Catalog not found: $catalog" >&2
  exit 1
fi
if [[ ! -d "$media_dir" ]]; then
  echo "Media directory not found: $media_dir" >&2
  exit 1
fi

python3 .agents/skills/dush-catalog-pipeline/scripts/check_catalog.py --require-images

ssh "$target" "mkdir -p '$remote_media'"
# --delete: сервер повторяет локальную папку один в один. Без него заменённые
# фото копились годами и оставались доступны по прямым ссылкам — включая кадры
# с водяными знаками конкурентов, которые мы убрали с витрины.
# --exclude '._*': AppleDouble от macOS-tar, на сервере они мусор.
rsync -az --partial --progress --delete --exclude '._*' "$media_dir/" "$target:$remote_media/"
scp "$catalog" "$target:$remote_catalog"
ssh "$target" "set -a; source /etc/dush.kz/backend.env; set +a; cd /var/www/dush.kz/current/backend; /var/www/dush.kz/shared/venv/bin/python scripts/import_catalog.py '$remote_catalog'; rm -f '$remote_catalog'"

echo "Media files uploaded outside PostgreSQL; catalog URLs imported successfully."
