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

const withImg = catalogItems.filter((p) => p.image && p.price && p.price > 0);

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

// Флагманы: премиум-бренды или просто дорогие позиции, самое-самое сверху
export const topPicks = dedupe(
  withImg.filter((p) => PREMIUM.has(p.brand) || (p.price ?? 0) >= 130000).sort(byPriceDesc),
  16,
);

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
