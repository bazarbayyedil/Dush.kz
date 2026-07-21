#!/usr/bin/env bash
# Пересобирает витрину из базы: правки контент-менеджера попадают на сайт.
#
# Запускается службой dush-publish по появлению файла-сигнала — сама панель
# работает в изоляции и права на переключение релиза не имеет.
set -uo pipefail

root=/var/www/dush.kz
builder="$root/shared/builder"
status="$root/shared/publish.status"
request="$root/shared/publish.request"
lock="$root/shared/publish.lock"
log="$root/shared/publish.log"
venv="$root/shared/venv/bin/python"

exec 9>"$lock"
if ! flock -n 9; then
  echo "публикация уже идёт" >&2
  exit 0
fi

write_status() {
  printf '{"state":"%s","message":"%s","at":"%s"}\n' \
    "$1" "$2" "$(date -Iseconds)" > "$status"
}

fail() {
  write_status failed "$1"
  rm -f "$request"
  exit 1
}

: > "$log"
exec >>"$log" 2>&1
rm -f "$request"
write_status running "Готовим данные"
echo "=== публикация $(date -Iseconds) ==="

cd "$builder" || fail "нет сборочной директории"

# 1. Эталон каталога из последнего релиза + правки из базы поверх.
cp "$root/current/catalog/products.json" src/data/products.json || fail "нет products.json"
cp "$root/current/catalog/products-index.json" src/data/products-index.json || fail "нет products-index.json"

set -a
source /etc/dush.kz/backend.env
set +a
"$venv" "$root/current/backend/scripts/export_overrides.py" > /tmp/publish-overrides.json \
  || fail "не удалось выгрузить правки"
python3 "$root/current/backend/scripts/apply_overrides.py" /tmp/publish-overrides.json "$builder/src/data" \
  || fail "не удалось наложить правки"

# 2. Сборка. nice, чтобы сайт продолжал отвечать на слабом сервере.
write_status running "Собираем страницы"
if ! nice -n 10 npx next build; then
  fail "сборка не прошла"
fi

pages=$(find out/product -name '*.html' | wc -l)
if [ "$pages" -lt 1000 ]; then
  fail "собрано подозрительно мало страниц: $pages"
fi

# 3. Новый релиз: backend и каталог переиспользуем жёсткими ссылками, витрину кладём свежую.
write_status running "Публикуем"
release="$root/releases/publish-$(date +%s)"
mkdir -p "$release" || fail "не создать релиз"
cp -al "$root/current/backend" "$release/backend" || fail "не скопировать backend"
cp -al "$root/current/catalog" "$release/catalog" || fail "не скопировать каталог"
cp -a out "$release/web-out" || fail "не скопировать витрину"
# Фото товаров отдаются из shared/media, в релизе они не нужны.
rm -rf "$release/web-out/products"

ln -sfn "$release" "$root/current" || fail "не переключить релиз"
nginx -t >/dev/null 2>&1 && systemctl reload nginx

find "$root/releases" -mindepth 1 -maxdepth 1 -type d -printf '%T@ %p\n' \
  | sort -nr | tail -n +4 | cut -d' ' -f2- | xargs -r rm -rf

write_status done "Опубликовано, страниц: $pages"
echo "=== готово: $pages страниц ==="
