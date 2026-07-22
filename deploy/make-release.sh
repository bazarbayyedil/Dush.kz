#!/usr/bin/env bash
# Собирает архив релиза: бэкенд, данные каталога и готовую витрину.
#
# Фото товаров в архив не попадают — они живут в shared/media на сервере
# и переживают релизы (см. sync-catalog-media.sh).
set -euo pipefail

root="$(cd "$(dirname "$0")/.." && pwd)"
out="${1:-/tmp/dush-release.tar.gz}"
stage="$(mktemp -d)"
trap 'rm -rf "$stage"' EXIT

if [ ! -d "$root/web/out" ]; then
  echo "нет web/out — сначала npm run build" >&2
  exit 1
fi

mkdir -p "$stage/catalog"
rsync -a --exclude '__pycache__' --exclude '*.egg-info' "$root/backend" "$stage/"
# Публикация на сервере накладывает правки панели этим скриптом.
cp "$root/parser/apply_overrides.py" "$stage/backend/scripts/apply_overrides.py"
cp "$root/web/src/data/products.json" "$stage/catalog/products.json"
cp "$root/web/src/data/products-index.json" "$stage/catalog/products-index.json"
# Слэш в начале обязателен: без него шаблон отбрасывал и _next/static/media,
# то есть шрифты, и сайт на проде рендерился системным начертанием.
rsync -a --exclude '/products/' --exclude '/media' "$root/web/out/" "$stage/web-out/"

# Исходники витрины: по ним кнопка «Опубликовать» пересобирает сайт из базы.
# Без них сборочная директория отстаёт от релиза и публикация откатывает вёрстку.
mkdir -p "$stage/web-src"
rsync -a "$root/web/src" "$stage/web-src/"
# Шаблон якорится от корня передачи, а он здесь — сама папка public.
rsync -a --exclude '/public/products/' "$root/web/public" "$stage/web-src/"

# COPYFILE_DISABLE убирает ресурсные вилки macOS, иначе tar на сервере ругается.
COPYFILE_DISABLE=1 tar czf "$out" -C "$stage" backend catalog web-out web-src
ls -lh "$out"
