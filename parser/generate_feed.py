#!/usr/bin/env python3
"""Товарный фид Google Merchant Center → web/public/merchant-feed.xml.

RSS 2.0 с g:-полями. Только товары в наличии и с фото: фид — витрина,
распроданное в бесплатных листингах только портит показатели.
Запускается из make-release.sh; можно руками после обновления каталога.
"""
import json
import re
from pathlib import Path
from xml.sax.saxutils import escape

ROOT = Path(__file__).parent.parent
SITE = 'https://dush.kz'
OUT = ROOT / 'web/public/merchant-feed.xml'

# Наши разделы → Google product taxonomy (числовые id стабильнее строк)
GCAT = {
    'akrilovye-vanny': 2610,      # Home & Garden > Bathtubs
    'vanny-iz-santekhnicheskogo-akrila-abs-pmma': 2610,
    'stalnye-vanny': 2610,
    'mramornye-vanny': 2610,
    'chugunnye-vanny': 2610,
    'dushevye-kabiny': 5027,      # Shower Stalls & Kits
    'dushevye-poddony': 2743,     # Shower Bases
    'tumby-s-umyvalnikom': 2206,  # Bathroom Vanities
    'penaly': 6357,               # Bathroom Cabinets
    'shkaf-zerkalo': 6357,
    'zerkala-s-led-podsvetkoj': 590,   # Mirrors
    'zerkala-ekonom': 590,
    'podvesnye-unitazy': 2849,    # Toilets
    'napolnye-otdelnostoyashhie-unitazy': 2849,
    'installyacii': 2849,
    'mojki-iz-kamnya': 2886,      # Kitchen Sinks
    'mojki-iz-nerzhaveyushhej-stali': 2886,
}
FAUCET_RX = re.compile(r'^(dlya-|vysokij-smesitel|dushevaya-|gigienicheskij|dushevoj-)')
SINK_RX = re.compile(r'^rakovin')


def gcat(category: str):
    if category in GCAT:
        return GCAT[category]
    if FAUCET_RX.match(category):
        return 1458  # Faucets
    if SINK_RX.match(category):
        return 2032  # Bathroom Sinks
    return None


def cdata(s: str) -> str:
    # управляющие символы из кривых исходников ломают XML
    s = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f]', '', str(s))
    return escape(re.sub(r'\s+', ' ', s).strip())


def description_of(p) -> str:
    if p.get('description'):
        return p['description'][:4900]
    attrs = p.get('attrs') or {}
    bits = [f'{k}: {v}' for k, v in list(attrs.items())[:8]]
    base = f"{p['title']}. Официальный поставщик, гарантия производителя. Доставка по Астане за 24 часа."
    return (base + (' ' + '; '.join(bits) if bits else ''))[:4900]


def main():
    products = json.loads((ROOT / 'web/src/data/products.json').read_text())
    items = []
    for p in products:
        if not p.get('in_stock') or not p.get('price') or not p.get('images'):
            continue
        img = p['images'][0]
        if not img.startswith('/products/'):
            continue
        sku_ok = p.get('sku') and p['sku'] not in ('-', '')
        cat_id = gcat(p['category'])
        item = [
            f"<g:id>{cdata(p['slug'][:50])}</g:id>",
            f"<g:title>{cdata(p['title'][:150])}</g:title>",
            f"<g:description>{cdata(description_of(p))}</g:description>",
            f"<g:link>{SITE}/product/{p['slug']}</g:link>",
            f"<g:image_link>{SITE}/media{cdata(img)}</g:image_link>",
            "<g:availability>in_stock</g:availability>",
            f"<g:price>{int(p['price'])} KZT</g:price>",
            "<g:condition>new</g:condition>",
            f"<g:brand>{cdata(p['brand'][:70])}</g:brand>",
            f"<g:product_type>{cdata(p['category_title'])}</g:product_type>",
        ]
        if cat_id:
            item.append(f"<g:google_product_category>{cat_id}</g:google_product_category>")
        if sku_ok:
            item.append(f"<g:mpn>{cdata(p['sku'][:70])}</g:mpn>")
        else:
            item.append("<g:identifier_exists>no</g:identifier_exists>")
        extra = p['images'][1:4]
        for e in extra:
            item.append(f"<g:additional_image_link>{SITE}/media{cdata(e)}</g:additional_image_link>")
        items.append('<item>' + ''.join(item) + '</item>')

    xml = (
        '<?xml version="1.0" encoding="UTF-8"?>'
        '<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">'
        '<channel>'
        '<title>dush.kz — сантехника в Астане</title>'
        f'<link>{SITE}</link>'
        '<description>Каталог dush.kz: ванны, смесители, унитазы, мебель для ванной</description>'
        + ''.join(items) +
        '</channel></rss>'
    )
    OUT.write_text(xml)
    print(f'фид: {len(items)} товаров, {OUT.stat().st_size // 1024} KB → {OUT}')


if __name__ == '__main__':
    main()
