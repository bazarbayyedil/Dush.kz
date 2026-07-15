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
        for record in records:
            slug = record["slug"]
            seen.add(slug)
            product = existing.get(slug) or Product(slug=slug)
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
                value = record.get(field)
                setattr(product, field, defaults[field] if value is None else value)
            product.images = [
                normalized for image in product.images if (normalized := normalize_image_url(image, media_base_url))
            ]
            product.price = Decimal(str(record["price"]))
            product.old_price = Decimal(str(record["old_price"])) if record.get("old_price") else None
            product.active = True
            db.add(product)
        for slug, product in existing.items():
            if slug not in seen:
                product.active = False
    print(f"Imported {len(seen)} products")


if __name__ == "__main__":
    main()
