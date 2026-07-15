#!/usr/bin/env python3
"""Validate Dush.kz catalog structure and optional local media coverage."""

from __future__ import annotations

import argparse
import json
import sys
from collections import Counter
from pathlib import Path


ROOT = Path(__file__).resolve().parents[4]
DATA_DIR = ROOT / "web" / "src" / "data"
PUBLIC_DIR = ROOT / "web" / "public"


def load_list(path: Path) -> list[dict]:
    try:
        value = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise ValueError(f"cannot read {path.relative_to(ROOT)}: {exc}") from exc
    if not isinstance(value, list):
        raise ValueError(f"{path.relative_to(ROOT)} must contain a JSON array")
    return value


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--require-images",
        action="store_true",
        help="fail when a referenced web/public product image is absent",
    )
    args = parser.parse_args()

    errors: list[str] = []
    warnings: list[str] = []

    try:
        full = load_list(DATA_DIR / "products.json")
        index = load_list(DATA_DIR / "products-index.json")
    except ValueError as exc:
        print(f"ERROR: {exc}")
        return 1

    full_by_slug = {item.get("slug"): item for item in full if item.get("slug")}
    index_by_slug = {item.get("slug"): item for item in index if item.get("slug")}

    for label, items in (("products.json", full), ("products-index.json", index)):
        slugs = [item.get("slug") for item in items]
        duplicates = sorted(slug for slug, count in Counter(slugs).items() if slug and count > 1)
        if duplicates:
            errors.append(f"{label} has {len(duplicates)} duplicate slugs")
        missing_slugs = sum(not slug for slug in slugs)
        if missing_slugs:
            errors.append(f"{label} has {missing_slugs} records without a slug")

    if len(full) != len(index):
        errors.append(f"record count differs: full={len(full)}, index={len(index)}")

    missing_from_index = set(full_by_slug) - set(index_by_slug)
    missing_from_full = set(index_by_slug) - set(full_by_slug)
    if missing_from_index:
        errors.append(f"{len(missing_from_index)} full records are absent from the index")
    if missing_from_full:
        errors.append(f"{len(missing_from_full)} index records are absent from full data")

    bad_index_images = 0
    bad_prices = 0
    image_refs: list[str] = []
    for slug, item in full_by_slug.items():
        price = item.get("price")
        if not isinstance(price, (int, float)) or isinstance(price, bool) or price <= 0:
            bad_prices += 1

        images = item.get("images") or []
        if not isinstance(images, list):
            errors.append(f"{slug}: images must be a list")
            continue
        image_refs.extend(path for path in images if isinstance(path, str) and path)

        indexed = index_by_slug.get(slug)
        if indexed is not None and indexed.get("image", "") != (images[0] if images else ""):
            bad_index_images += 1

    if bad_prices:
        errors.append(f"{bad_prices} products have a missing or non-positive price")
    if bad_index_images:
        errors.append(f"{bad_index_images} index image values do not match full data")

    invalid_image_refs = [path for path in image_refs if not path.startswith("/products/")]
    if invalid_image_refs:
        errors.append(f"{len(invalid_image_refs)} image references are outside /products/")

    missing_images = [path for path in image_refs if not (PUBLIC_DIR / path.lstrip("/")).is_file()]
    if missing_images:
        message = f"{len(missing_images)} of {len(image_refs)} referenced product images are absent locally"
        if args.require_images:
            errors.append(message)
        else:
            warnings.append(message + " (expected in a media-less clone)")

    categories = {item.get("category") for item in full if item.get("category")}
    print(
        f"Catalog: {len(full)} products, {len(categories)} categories, "
        f"{len(image_refs)} image references"
    )
    for warning in warnings:
        print(f"WARN: {warning}")
    for error in errors:
        print(f"ERROR: {error}")
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main())
