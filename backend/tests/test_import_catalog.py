import pytest

from app.media import normalize_image_url


def test_local_product_image_is_mapped_to_media_url():
    assert normalize_image_url("/products/tap-1/front.webp", "/media") == "/media/products/tap-1/front.webp"


def test_external_cdn_url_is_preserved():
    url = "https://cdn.example.kz/products/tap-1/front.webp"
    assert normalize_image_url(url, "/media") == url


@pytest.mark.parametrize(
    "value",
    [
        "data:image/png;base64,AAAA",
        "file:///tmp/front.webp",
        "/products/../secret",
        "/products/%2e%2e/secret",
        "/products/tap-1\\front.webp",
        "/not-products/front.webp",
    ],
)
def test_binary_or_unsafe_image_values_are_rejected(value):
    with pytest.raises(ValueError):
        normalize_image_url(value, "/media")


def test_import_keeps_fields_edited_in_admin(tmp_path):
    """Правка в панели переживает импорт каталога — иначе релиз затирал бы работу."""
    import json
    import subprocess
    import sys
    from pathlib import Path

    from sqlalchemy import select

    from app.database import SessionLocal
    from app.models import Product

    with SessionLocal.begin() as db:
        product = db.scalar(select(Product).where(Product.slug == "tap-1"))
        product.title = "Название из панели"
        # Панель хранит уже готовые публичные адреса — с /media/.
        product.images = ["/media/products/tap-1/kept.jpeg"]
        product.price = 55555
        product.manual_fields = ["images", "price", "title"]

    catalog = tmp_path / "products.json"
    catalog.write_text(
        json.dumps(
            [
                {
                    "slug": "tap-1",
                    "sku": "SKU-1",
                    "title": "Название из парсера",
                    "brand": "Dush",
                    "category": "taps",
                    "category_title": "Taps",
                    "price": 10000,
                    "in_stock": True,
                    "images": ["/products/tap-1/from-parser.jpeg"],
                    "attrs": {},
                    "description": "Описание из парсера",
                }
            ]
        )
    )
    root = Path(__file__).resolve().parent.parent
    result = subprocess.run(
        [sys.executable, "scripts/import_catalog.py", str(catalog)],
        cwd=root, capture_output=True, text=True,
    )
    assert result.returncode == 0, result.stderr

    with SessionLocal() as db:
        product = db.scalar(select(Product).where(Product.slug == "tap-1"))
        assert product.title == "Название из панели"
        assert product.images == ["/media/products/tap-1/kept.jpeg"]
        assert int(product.price) == 55555
        # Поля, которых в панели не касались, обновляются парсером как раньше.
        assert product.description == "Описание из парсера"
