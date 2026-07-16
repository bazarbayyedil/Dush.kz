import { catalogItems, type CatalogItem } from "./catalog";
import { catalogTree } from "./catalogTree";

// Премиум-бренды для кураторских подборок на главной
const PREMIUM = new Set([
  "Grohe",
  "Hansgrohe",
  "Jacob Delafon",
  "Paffoni",
  "BRAVAT",
  "BLANCO",
  "ABBER",
]);

function groupCats(title: string): Set<string> {
  const g = catalogTree.find((x) => x.title === title);
  return new Set(g ? g.categories : []);
}

// Только товары с нормальным фото (мелкие миниатюры < 15 KB не тащим в карусели).
const MIN_PHOTO_KB = 15;
const withImg = catalogItems.filter(
  (p) => p.image && p.price && p.price > 0 && (p.img_kb ?? 0) >= MIN_PHOTO_KB,
);

// Убираем почти-дубли (варианты размера одной модели): по бренду + началу названия
function dedupe(list: CatalogItem[], limit: number): CatalogItem[] {
  const seen = new Set<string>();
  const out: CatalogItem[] = [];
  for (const p of list) {
    const key = p.brand + "|" + p.title.replace(/\d+/g, "").slice(0, 22).trim().toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(p);
    if (out.length >= limit) break;
  }
  return out;
}

const byPriceDesc = (a: CatalogItem, b: CatalogItem) => (b.price ?? 0) - (a.price ?? 0);

// Приоритетные бренды для блока «Популярное» (по договорённости с магазином)
const PRIORITY_BRANDS = ["Frap", "Gappo", "Grohe", "LE MARK"];

const dedupeKey = (p: CatalogItem) =>
  p.brand + "|" + p.title.replace(/\d+/g, "").slice(0, 22).trim().toLowerCase();

// «Популярное»: смесь приоритетных брендов по кругу (не один бренд подряд),
// только в наличии, без почти-дублей. Не «самое дорогое», как было раньше.
export const topPicks = (() => {
  // лучшие фото вперёд — карусель на главной должна выглядеть чисто
  const inStock = withImg.filter((p) => p.in_stock).sort((a, b) => (b.img_kb ?? 0) - (a.img_kb ?? 0));
  const buckets = PRIORITY_BRANDS.map((brand) => {
    const seen = new Set<string>();
    const list: CatalogItem[] = [];
    for (const p of inStock) {
      if (p.brand !== brand) continue;
      const k = dedupeKey(p);
      if (seen.has(k)) continue;
      seen.add(k);
      list.push(p);
    }
    return list;
  });
  const out: CatalogItem[] = [];
  for (let i = 0; out.length < 16; i++) {
    let any = false;
    for (const bucket of buckets) {
      if (bucket[i]) {
        out.push(bucket[i]);
        any = true;
        if (out.length >= 16) break;
      }
    }
    if (!any) break;
  }
  return out;
})();

// Инсталляции и готовые комплекты (с унитазом) — без «ванн в комплекте с ножками»
export const installations = dedupe(
  withImg
    .filter((p) => /инсталляц/i.test(p.title) || /комплект[^.]*унитаз/i.test(p.title) || /\b3\s*в\s*1\b/i.test(p.title))
    .sort(byPriceDesc),
  16,
);

// Премиум-ванны (акрил/чугун/мрамор/стекло) — по убыванию цены
const bathCats = groupCats("Ванны");
export const premiumBaths = dedupe(
  withImg.filter((p) => bathCats.has(p.category)).sort(byPriceDesc),
  16,
);

// Смесители топ-брендов
const faucetCats = groupCats("Смесители");
export const topFaucets = dedupe(
  withImg.filter((p) => faucetCats.has(p.category) && PREMIUM.has(p.brand)).sort(byPriceDesc),
  16,
);

// Лучшие скидки (по абсолютной выгоде, не мелочь)
export const bestDeals = dedupe(
  withImg
    .filter((p) => (p.on_sale || (p.old_price && p.old_price > (p.price ?? 0))) && (p.price ?? 0) >= 20000)
    .sort((a, b) => (b.old_price ?? 0) - (b.price ?? 0) - ((a.old_price ?? 0) - (a.price ?? 0))),
  16,
);
