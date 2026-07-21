#!/usr/bin/env python3
"""Выгружает правки, сделанные в панели, для наложения на сборку витрины.

Полный каталог из базы не выгружаем: комплекты и фасеты каталога живут только
в данных парсера. Отдаём лишь поля, отмеченные как ручные, — их база и хранит.

    python scripts/export_overrides.py > overrides.json
"""

import json
import sys
from decimal import Decimal
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sqlalchemy import select  # noqa: E402

from app.database import SessionLocal  # noqa: E402
from app.models import Product  # noqa: E402

EXPORTABLE = {
    "title", "description", "images", "attrs", "brand",
    "price", "old_price", "in_stock", "on_sale", "active",
}


def plain(value):
    return str(value) if isinstance(value, Decimal) else value


def main() -> int:
    overrides: dict[str, dict] = {}
    with SessionLocal() as db:
        products = db.scalars(select(Product).order_by(Product.slug)).all()
        for product in products:
            fields = set(product.manual_fields or []) & EXPORTABLE
            if not fields:
                continue
            overrides[product.slug] = {field: plain(getattr(product, field)) for field in sorted(fields)}

    json.dump(overrides, sys.stdout, ensure_ascii=False, indent=1, sort_keys=True)
    print(f"\nтоваров с правками: {len(overrides)}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
