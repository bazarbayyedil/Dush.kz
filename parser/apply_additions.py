#!/usr/bin/env python3
"""Подмешивает parser/additions.json в web/src/data/{products,products-index}.json.

Идемпотентно: по slug. Гоняется после build_web_data.py (и вручную) — добавленные
из прайсов товары переживают пересборку каталога парсером.
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).parent.parent
DATA = ROOT / 'web/src/data'
ADD = Path(__file__).parent / 'additions.json'

# Категории, где различаем скрытый/наружный монтаж — как в build_web_data.
BATH_CATS = {'akrilovye-vanny', 'chugunnye-vanny', 'mramornye-vanny',
             'stalnye-vanny', 'vanny-iz-santekhnicheskogo-akrila-abs-pmma'}


def _dim_cm(v):
    m = re.search(r'\d{2,4}', str(v or ''))
    if not m:
        return None
    n = int(m.group())
    return round(n / 10) if n >= 500 else n


def bath_dims(title, category):
    if category not in BATH_CATS:
        return None, None
    m = re.search(r'(\d{2,4})\s*[xхX*×]\s*(\d{2,4})', title or '')
    if not m:
        return None, None
    length, width = _dim_cm(m.group(1)), _dim_cm(m.group(2))
    if length and width and 50 <= length <= 250 and 50 <= width <= 250:
        return length, width
    return None, None


def index_record(p):
    attrs = p.get('attrs') or {}
    length, width_cm = bath_dims(p['title'], p['category'])
    rec = {
        'slug': p['slug'], 'sku': p['sku'], 'title': p['title'],
        'brand': p['brand'], 'category': p['category'],
        'category_title': p['category_title'], 'price': p['price'],
        'old_price': p['old_price'], 'in_stock': p['in_stock'],
        'on_sale': p['on_sale'],
        'image': p['images'][0] if p['images'] else '',
        'img_kb': p.get('img_kb', 0),
        'color': (attrs.get('Цвет') or '').strip(),
        'material': (attrs.get('Материал') or attrs.get('Материал изготовления') or '').strip(),
        'width': None,
        'size': f'{length}×{width_cm}' if length and width_cm else '',
        'length': length, 'width_cm': width_cm, 'mount': '',
    }
    if p.get('dims'):
        rec['dimL'], rec['dimW'] = p['dims']['L'], p['dims']['W']
    return rec


def main():
    additions = json.loads(ADD.read_text()) if ADD.exists() else []
    if not additions:
        print('additions.json пуст — нечего подмешивать')
        return
    data_dir = Path(sys.argv[1]) if len(sys.argv) > 1 else DATA

    prods_f = data_dir / 'products.json'
    index_f = data_dir / 'products-index.json'
    prods = json.loads(prods_f.read_text())
    index = json.loads(index_f.read_text())

    have = {p['slug'] for p in prods}
    added = 0
    for p in additions:
        if p['slug'] in have:
            continue
        prods.append(p)
        index.append(index_record(p))
        added += 1
    prods_f.write_text(json.dumps(prods, ensure_ascii=False, indent=2))
    index_f.write_text(json.dumps(index, ensure_ascii=False))
    print(f'подмешано {added} из {len(additions)}; каталог теперь {len(prods)}')


if __name__ == '__main__':
    main()
