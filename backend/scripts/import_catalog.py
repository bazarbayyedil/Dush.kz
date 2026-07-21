import argparse
import json
from decimal import Decimal
from pathlib import Path

from sqlalchemy import select

from app.config import get_settings
from app.database import SessionLocal
from app.media import normalize_image_url
from app.models import Product


def main() -> None:
    parser = argparse.ArgumentParser(description="Upsert generated Dush.kz catalog into the database")
    parser.add_argument("path", type=Path)
    args = parser.parse_args()
    records = json.loads(args.path.read_text())
    media_base_url = get_settings().media_base_url
    seen: set[str] = set()
    with SessionLocal.begin() as db:
        existing = {product.slug: product for product in db.scalars(select(Product)).all()}
        defaults = {
            "sku": "",
            "title": "",
            "brand": "Без бренда",
            "category": "",
            "category_title": "",
            "in_stock": False,
            "on_sale": False,
            "images": [],
            "attrs": {},
            "description": "",
        }
        kept = 0
        for record in records:
            slug = record["slug"]
            seen.add(slug)
            product = existing.get(slug) or Product(slug=slug)
            # Поля, изменённые в панели, остаются как есть: база для них — источник правды.
            manual = set(product.manual_fields or [])
            kept += len(manual)
            for field in (
                "sku",
                "title",
                "brand",
                "category",
                "category_title",
                "in_stock",
                "on_sale",
                "images",
                "attrs",
                "description",
            ):
                if field in manual:
                    continue
                value = record.get(field)
                setattr(product, field, defaults[field] if value is None else value)
            if "images" not in manual:
                # Пути из панели уже приведены к /media/... — повторная нормализация их отвергнет.
                product.images = [
                    normalized
                    for image in product.images
                    if (normalized := normalize_image_url(image, media_base_url))
                ]
            if "price" not in manual:
                product.price = Decimal(str(record["price"]))
            if "old_price" not in manual:
                product.old_price = Decimal(str(record["old_price"])) if record.get("old_price") else None
            if "active" not in manual:
                product.active = True
            db.add(product)
        for slug, product in existing.items():
            if slug not in seen:
                product.active = False
    print(f"Imported {len(seen)} products, kept {kept} manually edited fields")


if __name__ == "__main__":
    main()
