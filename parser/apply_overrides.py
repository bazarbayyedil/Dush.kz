#!/usr/bin/env python3
"""Накладывает правки из панели на данные витрины.

Запускается после build_web_data.py и apply_combos.py: парсер задаёт структуру
каталога, панель — последнее слово по редактируемым полям.

    python3 apply_overrides.py overrides.json [каталог с данными]

Второй аргумент нужен на сервере: там данные лежат не в web/src/data.
"""

import json
import sys
from pathlib import Path

ROOT = Path(__file__).parent.parent
DEFAULT_DATA = ROOT / "web/src/data"
DATA = DEFAULT_DATA

# Адреса фото в базе публичные (/media/...), в данных витрины — исходные (/products/...).
MEDIA_PREFIX = "/media"


def to_site_path(url: str) -> str:
    return url[len(MEDIA_PREFIX):] if url.startswith(f"{MEDIA_PREFIX}/products/") else url


def main() -> int:
    if len(sys.argv) not in (2, 3):
        print("укажите файл с правками и, при необходимости, каталог данных", file=sys.stderr)
        return 2
    global DATA
    DATA = Path(sys.argv[2]) if len(sys.argv) == 3 else DEFAULT_DATA
    overrides = json.loads(Path(sys.argv[1]).read_text())
    if not overrides:
        print("правок нет")
        return 0

    products = json.loads((DATA / "products.json").read_text())
    index = json.loads((DATA / "products-index.json").read_text())
    index_by_slug = {row["slug"]: row for row in index}

    hidden: set[str] = set()
    touched = 0
    for product in products:
        patch = overrides.get(product["slug"])
        if not patch:
            continue
        touched += 1
        for field, value in patch.items():
            if field == "active":
                if not value:
                    hidden.add(product["slug"])
                continue
            if field == "images":
                value = [to_site_path(url) for url in value]
            if field in ("price", "old_price"):
                value = float(value) if value is not None else None
            product[field] = value

        row = index_by_slug.get(product["slug"])
        if row:
            for field in ("title", "brand", "price", "old_price", "in_stock", "on_sale"):
                if field in patch:
                    row[field] = product[field]
            if "images" in patch:
                row["image"] = product["images"][0] if product["images"] else ""

    if hidden:
        products = [p for p in products if p["slug"] not in hidden]
        index = [r for r in index if r["slug"] not in hidden]

    (DATA / "products.json").write_text(json.dumps(products, ensure_ascii=False))
    (DATA / "products-index.json").write_text(json.dumps(index, ensure_ascii=False))
    print(f"наложено правок: {touched}" + (f", скрыто товаров: {len(hidden)}" if hidden else ""))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
