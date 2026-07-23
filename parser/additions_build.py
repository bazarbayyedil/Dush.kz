#!/usr/bin/env python3
"""Собирает parser/additions.json из scraped.json (прайсы 1Марка/Домино/МАРКО).

Запуск: python3 additions_build.py <путь к scraped.json> <папка photos>
Фото копируются в web/public/products/<slug>/, записи — в parser/additions.json.
apply_additions.py подмешивает их в products.json (переживает пересборку парсером).
"""
import json
import re
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).parent.parent
DST_IMG = ROOT / 'web/public/products'
OUT = Path(__file__).parent / 'additions.json'

TR = {'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'e',
      'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'j', 'к': 'k', 'л': 'l', 'м': 'm',
      'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
      'ф': 'f', 'х': 'h', 'ц': 'c', 'ч': 'ch', 'ш': 'sh', 'щ': 'shch',
      'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya'}


def slugify(name: str) -> str:
    s = ''.join(TR.get(c, c) for c in name.lower())
    s = re.sub(r'[^a-z0-9]+', '-', s).strip('-')
    return re.sub(r'-+', '-', s)[:90] or 'item'


# --- категория по названию ---
RULES = [
    (r'^ванна|ванна "', {
        'абс|пмма': ('vanny-iz-santekhnicheskogo-akrila-abs-pmma', 'Ванны из сантехнического акрила АБС/ПММА'),
        '': ('akrilovye-vanny', 'Акриловые ванны')}),
    (r'^(рама|каркас|панель|лицевая|боковая|фронтальная|торцевая|экран|комплект ножек|ножки|подголовник|ручк|слив|сифон для ванн|крепеж|карниз)', {
        '': ('komplektuyushhie-dlya-vann', 'Комплектующие для ванн')}),
    (r'^(душевой поддон|поддон)', {'': ('dushevye-poddony', 'Душевые поддоны')}),
    (r'^шторка', {'': ('shtorki-steklyannye', 'Шторки стеклянные')}),
    (r'^(зеркало-шкаф|зеркальный шкаф|шкаф-зеркало|шкаф зеркальный)', {'': ('shkaf-zerkalo', 'Шкаф-зеркало')}),
    (r'^зеркал', {
        r'led|подсветк': ('zerkala-s-led-podsvetkoj', 'Зеркала с LED подсветкой'),
        '': ('zerkala-ekonom', 'Зеркала Эконом')}),
    (r'^пенал|^колонна|^шкаф', {'': ('penaly', 'Пеналы')}),
    (r'^(тумба|комод)', {'': ('tumby-s-umyvalnikom', 'Тумбы с умывальником')}),
    (r'^(умывальник|раковина)', {
        r'стирал': ('rakoviny-na-stiralnuyu-mashinu', 'Раковины на стиральную машину'),
        '': ('rakoviny-mebelnye', 'Раковины мебельные')}),
    (r'^столешниц|^полка', {'': ('komplektuyushhie-dlya-vann', 'Комплектующие для ванн')}),
]


def category_of(name: str):
    low = name.lower()
    for head, subs in RULES:
        if re.search(head, low):
            for sub, cat in subs.items():
                if sub and re.search(sub, low):
                    return cat
            return subs['']
    return None


def clean_title(name: str, brand: str) -> str:
    t = re.sub(r'\s+', ' ', name).strip().strip('*')
    if brand == 'МАРКО' and not re.match(r'(?i)^(раковина|умывальник|тумба)', t):
        t = 'Раковина ' + t
    t = t.replace('"', '«', 1).replace('"', '»', 1) if t.count('"') == 2 else t
    low = t.lower()
    tags = {'1 Марка': ('марка', 'marka'), 'Домино (Россия)': ('домино', 'айсберг', 'graffo'),
            'МАРКО': ('марко',)}
    if not any(x in low for x in tags.get(brand, ())):
        t += ' ' + {'1 Марка': '1 Марка', 'Домино (Россия)': 'Домино', 'МАРКО': 'МАРКО'}[brand]
    return t


def dims_from_name(name: str):
    m = re.search(r'\((\d{3,4})[хx](\d{2,4})[хx](\d{2,4})\)', name)
    if m:
        return int(m.group(1)), int(m.group(2))
    return None


def main():
    scraped = json.load(open(sys.argv[1]))
    photos_root = Path(sys.argv[2])
    out, seen, skipped = [], set(), []
    for r in scraped:
        if not r['photos']:
            continue
        cat = category_of(r['name'])
        if not cat and r['src'] in ('marko', 'santehopt', 'stiralka'):
            # прайсы МАРКО зовут раковины голым именем модели («Амур 60 Белый»)
            if 'stiralnoy' in r.get('url', ''):
                cat = ('rakoviny-na-stiralnuyu-mashinu', 'Раковины на стиральную машину')
            else:
                cat = ('rakoviny-mebelnye', 'Раковины мебельные')
        if not cat:
            skipped.append(r['name'])
            continue
        slug = slugify(clean_title(r['name'], r['brand']))
        if slug in seen:
            continue
        seen.add(slug)
        dstdir = DST_IMG / slug
        dstdir.mkdir(parents=True, exist_ok=True)
        images = []
        for i, ph in enumerate(r['photos']):
            src = photos_root.parent / ph
            dst = dstdir / f'{i + 1}.jpg'
            shutil.copy(src, dst)
            images.append(f'/products/{slug}/{i + 1}.jpg')
        attrs = {k: v for k, v in (r.get('attrs') or {}).items() if len(k) < 40 and len(str(v)) < 90}
        attrs.setdefault('Производитель', r['brand'].replace(' (Россия)', ''))
        title = clean_title(r['name'], r['brand'])
        rec = {
            'slug': slug,
            'sku': r.get('art') or '-',
            'title': title,
            'brand': r['brand'],
            'category': cat[0],
            'category_title': cat[1],
            'price': r['price'],
            'old_price': None,
            'in_stock': True,
            'on_sale': False,
            'images': images,
            'img_kb': max((src.stat().st_size // 1024 for src in [photos_root.parent / p for p in r['photos'][:1]]), default=0),
            'attrs': attrs,
            'description': '',
        }
        d = dims_from_name(r['name'])
        if d:
            rec['dims'] = {'L': d[0], 'W': d[1]}
        out.append(rec)
    OUT.write_text(json.dumps(out, ensure_ascii=False, indent=1))
    import collections
    print('карточек:', len(out), dict(collections.Counter(r['category'] for r in out)))
    if skipped:
        print('без категории:', len(skipped), skipped[:6])


if __name__ == '__main__':
    main()
