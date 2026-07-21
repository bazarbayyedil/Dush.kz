#!/usr/bin/env python3
"""Вносит готовые комплекты в web/src/data как обычные товары каталога.

Комплекты живут в parser/combos.json — это источник правды. Пересборка
каталога их не потеряет: build_web_data.py дочитывает тот же файл.
"""
import json
from pathlib import Path

ROOT = Path(__file__).parent.parent
COMBOS = ROOT / "parser/combos.json"
DATA = ROOT / "web/src/data"

CAT_TITLES = json.loads((ROOT / "parser/categories.json").read_text())


def money(n: float) -> str:
    return f"{round(n):,}".replace(",", " ")


def build_record(c: dict) -> dict:
    parts = c["parts"]
    saved = c["old_price"] - c["price"]
    lines = "\n".join(f"• {p['title']} — {money(p['price'])} ₸" for p in parts)
    description = (
        f"{c['lead']}\n\n"
        f"Что входит ({len(parts)} позиции):\n{lines}\n\n"
        f"По отдельности эти позиции стоят {money(c['old_price'])} ₸. "
        f"Комплектом — {money(c['price'])} ₸: скидка {c.get('discount_pct', 15)}%, "
        f"выгода {money(saved)} ₸.\n\n"
        "Позиции комплекта есть в наличии и отгружаются вместе. "
        "Состав можно поменять — напишите менеджеру, пересчитаем."
    )
    return {
        "slug": c["slug"],
        "sku": "КОМПЛЕКТ",
        "title": c["title"],
        "brand": c["brand"],
        "category": c["category"],
        "category_title": CAT_TITLES.get(c["category"], c["category"]),
        "price": c["price"],
        "old_price": c["old_price"],
        "in_stock": True,
        "on_sale": True,
        "is_combo": True,
        "combo_parts": [
            {"slug": p["slug"], "title": p["title"], "price": p["price"], "sku": p["sku"]}
            for p in parts
        ],
        "images": c["images"],
        "img_kb": 0,
        "attrs": {
            "Тип": "Готовый комплект",
            "Позиций в комплекте": str(len(parts)),
            "Бренд": c["brand"],
            **({"Отделка": c["color"].capitalize()} if c.get("color") else {}),
            "Скидка на комплект": f"{c.get('discount_pct', 15)}%",
            "Выгода": f"{money(saved)} ₸",
        },
        "description": description,
    }


def index_record(r: dict) -> dict:
    return {
        "slug": r["slug"], "sku": r["sku"], "title": r["title"], "brand": r["brand"],
        "category": r["category"], "category_title": r["category_title"],
        "price": r["price"], "old_price": r["old_price"], "in_stock": True,
        "on_sale": True, "is_combo": True,
        "image": r["images"][0] if r["images"] else "",
        "color": r["attrs"].get("Отделка", ""), "material": "", "width": None,
        "img_kb": 0, "size": None, "length": None, "width_cm": None,
    }


def main() -> None:
    combos = json.loads(COMBOS.read_text())
    for name, make in (("products.json", build_record), ("products-index.json", index_record)):
        path = DATA / name
        rows = json.loads(path.read_text())
        rows = [r for r in rows if not r.get("is_combo")]
        new = [make(build_record(c) if make is index_record else c) for c in combos]
        path.write_text(json.dumps(new + rows, ensure_ascii=False))
        print(f"{name}: комплектов {len(new)}, всего {len(new) + len(rows)}")


if __name__ == "__main__":
    main()
