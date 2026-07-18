import json, re
from collections import Counter

# Ожидаемый след на полу в мм: (бОльшая сторона от, до, меньшая от, до)
RANGE = {
 'ванна':    (1000, 2100,  600, 1800),
 'унитаз':   ( 430,  900,  300,  480),
 'биде':     ( 430,  800,  300,  460),
 'тумба':    ( 300, 1800,  180,  700),
 'пенал':    ( 250,  800,  150,  550),
 'душ':      ( 650, 1800,  650, 1800),
 'раковина': ( 250, 1500,  200,  750),
 'зеркало':  ( 250, 1800,   30,  260),
}
CAT_GROUP = {
 'Акриловые ванны':'ванна','Чугунные ванны':'ванна','Стальные ванны':'ванна','Мраморные ванны':'ванна',
 'Ванны из сантехнического акрила АБС/ПММА':'ванна',
 'Подвесные унитазы':'унитаз','Напольные отдельностоящие унитазы':'унитаз',
 'Напольные приставные унитазы':'унитаз',
 'Унитаз приставной напольный, для монтажа с системой инсталляции':'унитаз',
 'Подвесные биде':'биде','Напольные биде':'биде',
 'Тумбы с умывальником':'тумба','Пеналы':'пенал',
 'Душевые кабины':'душ','Душевые ограждения':'душ',
 'Раковина накладная':'раковина','Раковина подвесная':'раковина','Раковина напольная':'раковина',
 'Раковина встраиваемая в столешницу':'раковина','Раковина встраиваемая под столешницу':'раковина',
 'Раковины на стиральную машину':'раковина',
 'Зеркала с LED подсветкой':'зеркало','Шкаф-зеркало':'зеркало','Зеркала Эконом':'зеркало',
}
def group(cat):
    return CAT_GROUP.get(cat)

NUM = re.compile(r'(\d+(?:[.,]\d+)?)')
def parse(v):
    if v is None: return None
    s = str(v).replace('﻿','').replace('\xa0',' ').strip().lower().replace(',', '.')
    m = NUM.findall(s)
    if not m: return None
    n = float(m[0])
    if 'см' in s or 'cm' in s: n *= 10
    elif n < 300 and 'мм' not in s and 'mm' not in s: n *= 10
    return round(n)

TITLE_PAIR = re.compile(r'(\d{2,4})\s*[x*х×]\s*(\d{2,4})')
TITLE_SIZE = re.compile(r'(?<![\d.,])(\d{2,3})(?![\d.,]*\s*(?:мм|mm|см|л\b))')

def candidates(p):
    """Все правдоподобные числа-габариты: из полей и из названия."""
    a = p.get('attrs') or {}
    vals = []
    for k in ('Длина','Ширина','Глубина','Длина ванны','Ширина ванны','Размер','Диаметр'):
        v = parse(a.get(k))
        if v: vals.append(v)
    m = TITLE_PAIR.search(p['title'])
    if m:
        for g in m.groups():
            n = int(g)
            vals.append(n*10 if n < 300 else n)
    return vals

def title_hint(title):
    """Размер из названия модели: «LARA 60», «Норма 2 - 50» → 600 мм."""
    t = re.sub(r'\d{2,4}\s*[x*х×]\s*\d{2,4}', ' ', title)   # уже учтён как пара
    out = []
    for m in TITLE_SIZE.finditer(t):
        n = int(m.group(1))
        if 30 <= n <= 180: out.append(n*10)
    return out

def pick(vals, hints, g):
    """Выбираем пару габаритов. Опора — согласие разных полей между собой
    (одно и то же число в нескольких полях) и совпадение с размером в названии.
    Каждая подсказка засчитывается один раз, иначе побеждает квадрат."""
    from collections import Counter
    lo1, hi1, lo2, hi2 = RANGE[g]
    freq = Counter(v for v in vals if 100 <= v <= 2200)
    uniq = sorted(freq, reverse=True)
    best = None
    for i, A in enumerate(uniq):
        for B in uniq[i:]:
            if not (lo1 <= A <= hi1 and lo2 <= B <= hi2): continue
            score = -(freq[A] + freq[B])
            left = list(hints)
            hA = next((h for h in left if abs(A - h) <= 25), None)
            if hA is not None: score -= 3; left.remove(hA)
            hB = next((h for h in left if abs(B - h) <= 25), None)
            if hB is not None: score -= 2
            if A == B and g != 'душ': score += 4
            if best is None or score < best[0]: best = (score, A, B)
    return (best[1], best[2]) if best else (None, None)

if __name__ == '__main__':
    d = json.load(open('web/src/data/products.json'))
    out, stats, review = {}, Counter(), []
    for p in d:
        g = group(p['category_title'])
        if not g: continue
        stats['всего'] += 1
        if g == 'зеркало':
            # У зеркала второе число в полях — высота, а не глубина.
            # На плане оно занимает ширину и толщину корпуса.
            depth = parse((p.get('attrs') or {}).get('Глубина'))
            W = depth if depth and 20 <= depth <= 260 else 40
            cands = [v for v in candidates(p) if 250 <= v <= 1800]
            hints = title_hint(p['title'])
            L = next((h for h in hints if any(abs(h-c) <= 25 for c in cands)), None) \
                or (max(cands) if cands else None)
            if L and L == W: W = 40
        else:
            L, W = pick(candidates(p), title_hint(p['title']), g)
        if L and W:
            out[p['slug']] = {'L': L, 'W': W, 'g': g}
            stats['разобрано'] += 1
        else:
            stats['не разобрано'] += 1
            review.append({'slug':p['slug'],'cat':p['category_title'],'sku':p.get('sku'),
                           'title':p['title'][:62],'vals':candidates(p),
                           'raw':{k:(p.get('attrs') or {}).get(k) for k in ('Длина','Ширина','Глубина','Высота') if (p.get('attrs') or {}).get(k)}})
    json.dump(out, open('parser/dims-clean.json','w'), ensure_ascii=False, indent=1)
    json.dump(review, open('/tmp/dims_review.json','w'), ensure_ascii=False, indent=1)
    for k,v in stats.items(): print(f'  {k:14} {v}')
    print()
    for c,n in Counter(r['cat'] for r in review).most_common(8): print(f'  {n:4}  {c}')
