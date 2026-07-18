#!/usr/bin/env python3
"""Normalize scraped JSON into web/src/data/products.json and copy images."""
import json, re, shutil
from pathlib import Path

ROOT = Path(__file__).parent.parent
SRC_IMG = ROOT / "parser/images"
DST_IMG = ROOT / "web/public/products"
DATA_DIR = ROOT / "web/src/data"
PARSE_DIR = ROOT / "parser/data"

DST_IMG.mkdir(parents=True, exist_ok=True)
DATA_DIR.mkdir(parents=True, exist_ok=True)

# Чистые русские названия категорий (slug→title), сгенерированы из fontanero.
_cat_map_file = ROOT / "parser/categories.json"
CATEGORY_TITLES = json.loads(_cat_map_file.read_text()) if _cat_map_file.exists() else {}


def slugify(name: str) -> str:
    s = re.sub(r"[^\w\-]+", "-", name.strip(), flags=re.UNICODE).strip("-")
    return re.sub(r"-+", "-", s).lower() or "item"


def parse_desc_to_attrs(desc: str) -> dict:
    if not desc:
        return {}
    lines = [l.strip() for l in desc.split("\n") if l.strip()]
    ignore = {"характеристика", "характеристики", "описание", "особенности"}
    lines = [l for l in lines if l.lower().strip(":") not in ignore]
    attrs, i = {}, 0
    while i < len(lines) - 1:
        label, value = lines[i].strip(":"), lines[i + 1]
        is_label = len(label.split()) <= 4 and not re.match(r"^\d", label) and len(label) < 40
        if is_label and len(value) < 200:
            attrs[label] = value
            i += 2
        else:
            i += 1
    return attrs


# Характеристики-«мусор», которые не показываем в таблице
NOISE_ATTRS = {"состояние", "доставка", "характеристика", "описание"}


def build_description(attrs: dict) -> str:
    """Собирает аккуратное человеческое описание из характеристик."""
    def get(*names):
        for n in names:
            for k, v in attrs.items():
                if k.strip().lower() == n and v and v.strip():
                    return v.strip()
        return None

    parts = []
    brand = get("производитель", "бренд")
    country = get("производство", "страна", "страна производства")
    if brand and country:
        parts.append(f"Производитель — {brand} ({country}).")
    elif brand:
        parts.append(f"Производитель — {brand}.")
    elif country:
        parts.append(f"Страна производства — {country}.")

    mc = []
    mat = get("материал", "материал изготовления")
    color = get("цвет")
    if mat:
        mc.append(f"материал — {mat.lower()}")
    if color:
        mc.append(f"цвет — {color.lower()}")
    if mc:
        s = ", ".join(mc)
        parts.append(s[0].upper() + s[1:] + ".")

    w, l, h = get("ширина"), get("длина"), get("высота")
    dims = [d for d in (w, l, h) if d]
    if len(dims) >= 2:
        parts.append("Габариты: " + " × ".join(dims) + ".")

    cartridge = get("картридж")
    if cartridge:
        parts.append(f"Картридж — {cartridge.lower()}.")

    comp = get("комплектация")
    if comp:
        parts.append(f"В комплекте: {comp}.")

    war = get("гарантия производителя", "гарантия")
    if war:
        parts.append(f"Гарантия производителя — {war}.")

    return " ".join(parts)


all_products, seen_slugs = [], set()
for jf in sorted(PARSE_DIR.glob("*.json")):
    category = jf.stem
    items = json.loads(jf.read_text())
    for p in items:
        # Пропускаем без названия и без цены (на fontanero это «0 ₸ / нет в наличии»)
        if not p.get("title") or not p.get("price") or p.get("price") <= 0:
            continue
        if p["slug"] in seen_slugs:
            continue
        seen_slugs.add(p["slug"])

        # Папка фото — по уникальному slug (sku может быть "-" или общим у вариантов)
        folder = slugify(p["slug"])
        src_folder = SRC_IMG / folder
        dst_folder = DST_IMG / folder
        images_web = []
        main_kb = 0
        if src_folder.exists():
            dst_folder.mkdir(exist_ok=True)
            files = [f for f in src_folder.iterdir() if f.is_file()]
            # Качество: сортируем по размеру файла (крупнее ≈ выше разрешение),
            # чтобы самое качественное фото стало главным.
            files.sort(key=lambda f: f.stat().st_size, reverse=True)
            # Отбрасываем крохотные миниатюры, если есть нормальные фото.
            biggest = files[0].stat().st_size if files else 0
            main_kb = round(biggest / 1024)
            if biggest >= 15_000:
                files = [f for f in files if f.stat().st_size >= 6_000]
            for img in files:
                dst = dst_folder / img.name
                if not dst.exists():
                    shutil.copy2(img, dst)
                images_web.append(f"/products/{folder}/{img.name}")

        merged = {**p.get("attrs", {}), **parse_desc_to_attrs(p.get("description_text", ""))}
        description = build_description(merged)
        # Таблица характеристик — без мусорных и служебных строк
        # Строки со «строчным» ключом — это разобранные не туда пункты
        # маркированного списка, а не характеристики: у настоящих названий
        # всегда заглавная («Материал», «Цвет»).
        attrs_display = {
            k: v for k, v in merged.items()
            if k and k.strip().lower() not in NOISE_ATTRS and k.strip().lower() != "артикул"
            and k.strip()[:1].isupper()
        }
        all_products.append({
            "slug": p["slug"],
            "sku": p.get("sku") or "",
            "title": p["title"],
            "brand": p.get("brand") or "Без бренда",
            "category": category,
            "category_title": CATEGORY_TITLES.get(category, category.replace("-", " ").capitalize()),
            "price": p.get("price"),
            "old_price": p.get("old_price"),
            "in_stock": p.get("in_stock", False),
            "on_sale": p.get("on_sale", False),
            "images": images_web,
            "img_kb": main_kb,
            "attrs": attrs_display,
            "description": description,
        })

# Выверенные габариты (см. parser/dims-clean.json) накладываем поверх разбора:
# в исходных полях единицы и смысл разъезжаются от поставщика к поставщику.
_dims_file = ROOT / "parser/dims-clean.json"
DIMS_CLEAN = json.loads(_dims_file.read_text()) if _dims_file.exists() else {}
for p in all_products:
    d = DIMS_CLEAN.get(p["slug"])
    if d:
        p["dims"] = {"L": d["L"], "W": d["W"]}

out = DATA_DIR / "products.json"
out.write_text(json.dumps(all_products, ensure_ascii=False, indent=2))

def facet_color(attrs: dict) -> str:
    return (attrs.get("Цвет") or "").strip()


def facet_material(attrs: dict) -> str:
    return (attrs.get("Материал") or attrs.get("Материал изготовления") or "").strip()


def facet_width(attrs: dict):
    for key in ("Ширина", "Ширина ванны", "Длина", "Длина ванны"):
        v = attrs.get(key)
        if not v:
            continue
        m = re.search(r"\d{2,4}", str(v))
        if m:
            return int(m.group())
    return None


# Габариты «длина×ширина» в см — показываем в карточке ванны рядом с брендом.
# Только для самих ванн: панели, сливы и смесители «для ванны» размер не несут.
BATH_CATS = {
    "akrilovye-vanny",
    "chugunnye-vanny",
    "mramornye-vanny",
    "stalnye-vanny",
    "vanny-iz-santekhnicheskogo-akrila-abs-pmma",
}


def _dim_cm(value):
    m = re.search(r"\d{2,4}", str(value or ""))
    if not m:
        return None
    n = int(m.group())
    return round(n / 10) if n >= 500 else n  # в данных бывают и мм, и см


def bath_dims(attrs: dict, title: str, category: str):
    """(длина, ширина) ванны в см или (None, None)."""
    if category not in BATH_CATS:
        return None, None
    a = attrs or {}
    length = _dim_cm(a.get("Длина ванны") or a.get("Длина"))
    width = _dim_cm(a.get("Ширина ванны") or a.get("Ширина"))
    if not (length and width):
        m = re.search(r"(\d{2,4})\s*[xхX×*]\s*(\d{2,4})", title or "")
        if m:
            length, width = _dim_cm(m.group(1)), _dim_cm(m.group(2))
    if length and width and 50 <= length <= 250 and 50 <= width <= 250:
        return length, width
    return None, None


def facet_size(attrs: dict, title: str, category: str) -> str:
    length, width = bath_dims(attrs, title, category)
    return f"{length}×{width}" if length and width else ""


def facet_length(attrs: dict, title: str, category: str):
    return bath_dims(attrs, title, category)[0]


def facet_width_cm(attrs: dict, title: str, category: str):
    return bath_dims(attrs, title, category)[1]


# Тонкий индекс для клиента (каталог + поиск): без attrs/description и без
# лишних фото — только то, что нужно карточке и фильтрам. Полные данные
# (products.json) читаются только на серверной странице товара.
index = [{
    "slug": p["slug"],
    "sku": p["sku"],
    "title": p["title"],
    "brand": p["brand"],
    "category": p["category"],
    "category_title": p["category_title"],
    "price": p["price"],
    "old_price": p["old_price"],
    "in_stock": p["in_stock"],
    "on_sale": p["on_sale"],
    "image": (p["images"][0] if p["images"] else ""),
    "img_kb": p["img_kb"],
    "color": facet_color(p.get("attrs") or {}),
    "material": facet_material(p.get("attrs") or {}),
    "width": facet_width(p.get("attrs") or {}),
    "size": facet_size(p.get("attrs") or {}, p["title"], p["category"]),
    "length": facet_length(p.get("attrs") or {}, p["title"], p["category"]),
    "width_cm": facet_width_cm(p.get("attrs") or {}, p["title"], p["category"]),
    **({"dimL": p["dims"]["L"], "dimW": p["dims"]["W"]} if p.get("dims") else {}),
} for p in all_products]
idx_out = DATA_DIR / "products-index.json"
idx_out.write_text(json.dumps(index, ensure_ascii=False))
full_kb = out.stat().st_size // 1024
slim_kb = idx_out.stat().st_size // 1024
print(f"Wrote {len(all_products)} products (full {full_kb} KB, index {slim_kb} KB)")
cats = {}
for p in all_products:
    cats[p["category_title"]] = cats.get(p["category_title"], 0) + 1
for c, n in sorted(cats.items(), key=lambda x: -x[1]):
    print(f"  {n:4}  {c}")
