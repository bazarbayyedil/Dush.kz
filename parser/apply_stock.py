#!/usr/bin/env python3
"""Наличие по складским остаткам: parser/stock-override.json {slug: bool}.

Файл генерируется сверкой выгрузки «Остатки Астана …» с каталогом
(скрипт match_stock в scratchpad-сессии). Применяется к products.json
и products-index.json после подмешивания additions и комплектов, чтобы
пересборка каталога не возвращала наличие поставщика.
"""
import json
from pathlib import Path

ROOT = Path(__file__).parent.parent
OVERRIDE = ROOT / "parser/stock-override.json"
DATA = ROOT / "web/src/data"


def main() -> None:
    if not OVERRIDE.exists():
        return
    ov = json.loads(OVERRIDE.read_text())
    for name in ("products.json", "products-index.json"):
        path = DATA / name
        rows = json.loads(path.read_text())
        n = 0
        for r in rows:
            v = ov.get(r["slug"])
            if v is not None and r.get("in_stock") != v:
                r["in_stock"] = v
                n += 1
        path.write_text(json.dumps(rows, ensure_ascii=False,
                                   indent=2 if name == "products.json" else None))
        print(f"{name}: наличие изменено у {n}")


if __name__ == "__main__":
    main()
