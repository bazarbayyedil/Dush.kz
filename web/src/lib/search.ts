import type { CatalogItem } from "./catalog";

/**
 * Умный поиск по каталогу сантехники.
 * - учитывает русские словоформы (унитаз / унитаза / унитазы / унитазов)
 * - ищет по названию, категории, бренду, артикулу, характеристикам и описанию
 * - расширяет запрос синонимами домена (кран → смеситель, ободок → сиденье…)
 * - ранжирует по релевантности (совпадение в названии важнее описания)
 */

// Лёгкий стеммер: срезает частые окончания существительных/прилагательных.
const ENDINGS = [
  "ами", "ями", "ого", "его", "ому", "ему", "ыми", "ими", "ыx",
  "ой", "ей", "ов", "ев", "ам", "ям", "ах", "ях", "ые", "ие",
  "ый", "ий", "ая", "яя", "ое", "ее", "ом", "ем", "их", "ых",
  "а", "я", "о", "е", "ы", "и", "у", "ю", "й", "ь",
];

export function stem(word: string): string {
  const w = word.toLowerCase().replace(/ё/g, "е");
  if (w.length <= 4) return w;
  for (const end of ENDINGS) {
    if (w.length - end.length >= 4 && w.endsWith(end)) {
      return w.slice(0, w.length - end.length);
    }
  }
  return w;
}

// Синонимы / связанные термины. Ключ и значения хранятся уже в «стем»-форме.
// Запрос по любому слову группы находит товары со всеми словами группы.
const SYNONYM_GROUPS: string[][] = [
  ["унитаз", "ободок", "сиден", "крышк", "бачок", "инсталляц", "арматур"],
  ["смесител", "кран", "излив", "картридж", "аэратор"],
  ["раковин", "умывальник", "мойк", "чаш", "пьедестал", "тюльпан"],
  ["душ", "лейк", "гарнитур", "штанг", "стойк", "гигиеническ"],
  ["ванн", "экран", "слив", "перелив", "ножк"],
  ["кабин", "ограждени", "шторк", "поддон", "уголок"],
  ["полотенцесушител", "полотенцесуш"],
  ["сифон", "гофр", "слив", "трап"],
  ["биде", "гигиеническ"],
  ["зеркал", "шкафчик", "мебел", "тумб"],
];

function expandToken(stemmed: string): Set<string> {
  const out = new Set<string>([stemmed]);
  for (const group of SYNONYM_GROUPS) {
    if (group.some((g) => stemmed.startsWith(g) || g.startsWith(stemmed))) {
      group.forEach((g) => out.add(g));
    }
  }
  return out;
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/ё/g, "е")
    .split(/[^a-zа-я0-9]+/i)
    .filter((t) => t.length >= 2);
}

type Indexed = {
  product: CatalogItem;
  // взвешенные наборы стем-токенов по полям
  titleTokens: Set<string>;
  strongTokens: Set<string>; // категория + бренд + артикул
  raw: string; // сырой текст для подстрочного совпадения
};

let INDEX: Indexed[] | null = null;

function buildIndex(products: CatalogItem[]): Indexed[] {
  return products.map((p) => {
    const title = p.title || "";
    const strong = [p.category_title, p.brand, p.sku].join(" ");

    return {
      product: p,
      titleTokens: new Set(tokenize(title).map(stem)),
      strongTokens: new Set(tokenize(strong).map(stem)),
      raw: `${title} ${strong}`.toLowerCase().replace(/ё/g, "е"),
    };
  });
}

function matchToken(variants: Set<string>, docTokens: Set<string>): boolean {
  for (const v of variants) {
    for (const t of docTokens) {
      // префиксное совпадение в обе стороны: «унита» ~ «унитаз»
      if (t === v || t.startsWith(v) || v.startsWith(t)) return true;
    }
  }
  return false;
}

/** Возвращает продукты, отсортированные по релевантности запросу. */
export function searchProducts(products: CatalogItem[], query: string): CatalogItem[] {
  const q = query.trim();
  if (!q) return products;

  if (!INDEX || INDEX.length !== products.length) {
    INDEX = buildIndex(products);
  }

  const queryTokens = tokenize(q).map(stem);
  if (queryTokens.length === 0) return products;

  const qLower = q.toLowerCase().replace(/ё/g, "е");
  const expanded = queryTokens.map(expandToken);

  const scored: { product: CatalogItem; score: number }[] = [];

  for (const doc of INDEX) {
    let score = 0;
    let allMatched = true;

    for (let i = 0; i < queryTokens.length; i++) {
      const variants = expanded[i];
      const exact = queryTokens[i];

      const exactSet = new Set([exact]);
      let tokenScore = 0;
      // Точное слово запроса весит больше. Синонимы применяем к названию
      // и категории/бренду — там они дают связанные типы товаров.
      if (matchToken(exactSet, doc.titleTokens)) tokenScore += 10;
      else if (matchToken(variants, doc.titleTokens)) tokenScore += 6;
      else if (matchToken(exactSet, doc.strongTokens)) tokenScore += 5;
      else if (matchToken(variants, doc.strongTokens)) tokenScore += 3;

      if (tokenScore === 0) allMatched = false;
      else score += tokenScore;
    }

    // бонус за точное вхождение всей фразы в название
    if (doc.raw.includes(qLower)) score += 8;

    if (allMatched && score > 0) {
      scored.push({ product: doc.product, score });
    }
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.map((s) => s.product);
}
