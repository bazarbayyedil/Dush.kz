#!/usr/bin/env python3
"""Выделяет инсталляции в собственную категорию.

Парсер поставщика складывает рамы, кнопки и чаши в «Для подвесного унитаза».
Покупатель же ищет именно «инсталляцию» — поэтому раскладываем по смыслу:
рамы и системы, кнопки смыва и сами унитазы становятся разными категориями.

Запускается после build_web_data.py и apply_combos.py.
"""

from __future__ import annotations  # локальный python 3.9 не понимает "X | None" в аннотациях

import json
from pathlib import Path

ROOT = Path(__file__).parent.parent
DATA = ROOT / "web/src/data"
CATEGORIES = ROOT / "parser/categories.json"

INSTALL = "installyacii"
INSTALL_TITLE = "Инсталляции"
BUTTONS = "knopki-dlya-installyacij"
BUTTONS_TITLE = "Кнопки для инсталляций"
BOWLS = "podvesnye-unitazy"
BOWLS_TITLE = "Подвесные унитазы"

# Категории, которые раскладываем. Остальные не трогаем.
SOURCE = {"dlya-podvesnogo-unitaza"}


def classify(title: str) -> tuple[str, str] | None:
    low = title.lower()
    if low.startswith(("кнопка", "клавиша", "панель смыва")):
        return BUTTONS, BUTTONS_TITLE
    if "инсталляц" in low or "инстялляц" in low:  # в прайсе встречается опечатка
        return INSTALL, INSTALL_TITLE
    if "унитаз" in low:
        return BOWLS, BOWLS_TITLE
    return None


def main() -> int:
    moved: dict[str, int] = {}
    for name in ("products.json", "products-index.json"):
        path = DATA / name
        rows = json.loads(path.read_text())
        for row in rows:
            if row.get("category") not in SOURCE:
                continue
            target = classify(row["title"])
            if not target:
                continue
            row["category"], row["category_title"] = target
            moved[target[0]] = moved.get(target[0], 0) + 1
        path.write_text(json.dumps(rows, ensure_ascii=False))

    titles = json.loads(CATEGORIES.read_text())
    titles[INSTALL] = INSTALL_TITLE
    CATEGORIES.write_text(json.dumps(titles, ensure_ascii=False, indent=1, sort_keys=True))

    # Счётчик двойной: правим два файла, поэтому делим пополам.
    for slug, count in sorted(moved.items()):
        print(f"{slug}: {count // 2}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
