#!/usr/bin/env bash
set -euo pipefail

release="$1"
archive="$2"
root=/var/www/dush.kz
release_dir="$root/releases/$release"

mkdir -p "$release_dir" "$root/shared"
tar --warning=no-unknown-keyword -xzf "$archive" -C "$release_dir"

python3 -m venv "$root/shared/venv"
"$root/shared/venv/bin/pip" install --disable-pip-version-check "$release_dir/backend"

set -a
source /etc/dush.kz/backend.env
set +a
cd "$release_dir/backend"
"$root/shared/venv/bin/python" -c 'from app import models; from app.database import Base, engine; Base.metadata.create_all(engine)'
"$root/shared/venv/bin/python" scripts/import_catalog.py "$release_dir/catalog/products.json"

ln -sfn "$release_dir" "$root/current"
sudo systemctl restart dush-api
sudo nginx -t
sudo systemctl reload nginx
curl --fail --silent --show-error http://127.0.0.1:8000/api/v1/health

find "$root/releases" -mindepth 1 -maxdepth 1 -type d -printf '%T@ %p\n' \
  | sort -nr | tail -n +4 | cut -d' ' -f2- | xargs -r rm -rf
