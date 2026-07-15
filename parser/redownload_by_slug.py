#!/usr/bin/env python3
"""Ремедиация C1: раскладывает фото по УНИКАЛЬНЫМ slug-папкам.

- Если старая (sku) папка принадлежит одному товару — просто копируем её в slug.
- Если старую папку делили несколько товаров (коллизия) — перекачиваем фото
  этого товара из URL (в parser/data/*.json есть корректные URL для каждого).
"""
import json, shutil, sys
from collections import Counter
from pathlib import Path
from scrape import slugify, download_image, IMG_DIR, DATA_DIR


def load_all():
    items = []
    for jf in sorted(DATA_DIR.glob("*.json")):
        for p in json.loads(jf.read_text()):
            if p.get("images"):
                items.append(p)
    return items


def main():
    items = load_all()
    # сколько товаров делят каждую старую (sku) папку
    old_folder = {}
    for p in items:
        old_folder[p["slug"]] = p.get("img_folder") or slugify(p.get("sku") or p["slug"])
    shared = Counter(old_folder.values())

    copied = redownloaded = skipped = 0
    for i, p in enumerate(items, 1):
        slug = p["slug"]
        new_dir = IMG_DIR / slugify(slug)
        if new_dir.exists() and any(new_dir.iterdir()):
            skipped += 1
            continue
        old = old_folder[slug]
        old_dir = IMG_DIR / old
        # безопасно копировать, только если старую папку не делили с другими
        if shared[old] == 1 and old_dir.exists() and old_dir != new_dir and any(old_dir.iterdir()):
            shutil.copytree(old_dir, new_dir, dirs_exist_ok=True)
            copied += 1
        else:
            new_dir.mkdir(parents=True, exist_ok=True)
            for j, url in enumerate(p["images"], 1):
                download_image(url, new_dir, j)
            redownloaded += 1
        if i % 300 == 0:
            print(f"  …{i}/{len(items)} (копий {copied}, перекачано {redownloaded}, пропущено {skipped})", flush=True)

    print(f"Готово: копий {copied}, перекачано {redownloaded}, пропущено {skipped}, всего {len(items)}", flush=True)


if __name__ == "__main__":
    main()
