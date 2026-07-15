#!/usr/bin/env python3
"""Находит фото с логотипом FONTANERO (композиты «Готовый комплект 3в1» и т.п.)
и удаляет их из parser/images. Запускать ПОСЛЕ scrape и ДО build_web_data.

Метод: NCC-шаблонный поиск логотипа в верхнем-левом углу (fontanero_logo.png).
У всех затронутых товаров есть чистые фото производителя — они и останутся.
"""
import json
from pathlib import Path
import numpy as np
from PIL import Image

ROOT = Path(__file__).parent
TEMPLATE = ROOT / "fontanero_logo.png"
IMG_DIR = ROOT / "images"
DATA_DIR = ROOT / "data"

THRESH = 0.45
TW, TH, NORM_W, BX, BY = 150, 60, 500, 12, 22
OFFS = [-22, -14, -7, 0, 7, 14, 22]
SCALES = [0.75, 0.9, 1.0, 1.1, 1.25]

_TPL = {}
for s in SCALES:
    w, h = max(8, int(TW * s)), max(8, int(TH * s))
    a = np.asarray(Image.open(TEMPLATE).convert("L").resize((w, h)), dtype=np.float32)
    a = a - a.mean()
    _TPL[s] = (a, np.sqrt((a * a).sum()) + 1e-6, (w, h))


def score(path: Path) -> float:
    try:
        im = Image.open(path).convert("L")
    except Exception:
        return -1.0
    W, H = im.size
    if W < 40:
        return -1.0
    nh = max(1, int(H * NORM_W / W))
    arr = np.asarray(im.resize((NORM_W, nh)), dtype=np.float32)
    best = -1.0
    for s in SCALES:
        tpl, tnorm, (w, h) = _TPL[s]
        for dx in OFFS:
            for dy in OFFS:
                x0, y0 = BX + dx, BY + dy
                if x0 < 0 or y0 < 0 or x0 + w > NORM_W or y0 + h > nh:
                    continue
                win = arr[y0:y0 + h, x0:x0 + w]
                win = win - win.mean()
                wn = np.sqrt((win * win).sum()) + 1e-6
                v = float((win * tpl).sum() / (wn * tnorm))
                if v > best:
                    best = v
    return best


def main():
    seen = set()
    removed = 0
    products = 0
    for jf in sorted(DATA_DIR.glob("*.json")):
        for p in json.loads(jf.read_text()):
            folder = p.get("img_folder")
            if not folder or folder in seen:
                continue
            seen.add(folder)
            d = IMG_DIR / folder
            if not d.is_dir():
                continue
            hit = False
            for f in sorted(d.iterdir()):
                if f.suffix.lower() in (".jpg", ".jpeg", ".png", ".webp") and score(f) >= THRESH:
                    f.unlink()
                    removed += 1
                    hit = True
            if hit:
                products += 1
    print(f"Удалено фото с логотипом: {removed} у {products} товаров")


if __name__ == "__main__":
    main()
