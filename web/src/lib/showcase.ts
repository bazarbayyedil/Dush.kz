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

// Слайды хиро — витрина лучших фото по трём ключевым брендам. Отобраны вручную:
// высокое разрешение, чистый кадр без чертежей, вотермарок и инфографики.
// Бренды чередуются, поэтому в подборку любого дня попадают все три.
// Скидка берётся из данных товара и отрисовывается сама.
const HERO_SLUGS = [
  "bide-podvesnoe-grohe-39208000-euro-ceramic-germania",
  "smesitel-dla-rakoviny-lemark-bronx-lm-3706-gm",
  "smesitel-dla-rakoviny-gappo-g1006-9-oruzejnaa-stal",
  "smesitel-dla-dusa-grohe-bauclassic-vnesnaa-i-vstraivaemaa-casti-hrom-29048000",
  "lemark-mista-lm6426wg",
  "rakovina-nakladnaa-bez-pereliva-gappo-gt-302-620mm-400mm-150mm-oval-naa",
  "smesitel-dla-vanny-grohe-bauclassic-hrom-32867000",
  "smesitel-lemark-bronx-s-gigieniceskim-dusem-vstraivaemyj-lm-3720-bl",
  "smesitel-vstraivaemyj-dla-rakoviny-gappo-g-1206-6-cernyj",
  "smesitel-dla-umyval-nika-eurostyle-grohe-23707003",
  "smesitel-dla-vanny-s-korotkim-izlivom-lemark-lm-0414-c-linara-cehia",
  "rakovina-nakladnaa-bez-pereliva-gappo-gt-403-8-370mm-480mm-130mm-pramougol-naa-cvet-cernyj",
  "smesitel-dla-vanny-grohe-eurostyle-hrom-23726003",
  "nabor-smesitelej-3-v-1-dla-vanny-dla-umyval-nika-dus-garnitur-hrom-lm-0380-c",
  "gigieniceskij-dus-gappo-g7206-3-vstraivaemyj-zoloto-satin",
  "smesitel-dla-dusa-grohe-eurosmart-cosmopolitan-hrom-24044000",
  "gigieniceskij-dus-lemark-bronx-lm-3718-bl",
  "smesitel-dla-rakoviny-gappo-hrom-g1006",
  "smesitel-dla-dusa-grohe-eurostyle-33635003",
  "smesitel-dla-vanny-s-korotkim-izlivom-lemark-lm-0614-c-aura-cehia",
  "smesitel-dla-rakoviny-gappo-g1006-6-cernyj",
  "smesitel-dla-dusa-grohe-eurostyle-cosmopolitan-33590002",
  "smesitel-dla-umyval-nika-monolitnyj-lemark-lm-0606-c-aura-cehia",
  "smesitel-dla-rakoviny-gappo-g1006-29-oruzejnaa-stal",
  "dusevaa-sistema-grohe-euphoria-smartcontrol-310-duo-s-termostatom-hrom-26507000",
  "smesitel-dla-vanny-s-korotkim-izlivom-hrom-lm-0314-c-point",
  "dusevaa-stojka-gappo-g2491-3-s-termostatom-zolotoj-satin",
  "smesitel-dla-dusa-grohe-essence-hrom-33636001",
  "smesitel-dla-umyval-nika-monolitnyj-lemark-lm-0506-c-evitta-cehia",
  "smesitel-dla-kuhni-gappo-g-4398-16-cernyj-s-gibkim-gusakom-i-s-vyhodom-pod-fil-tr",
  "gigieniceskij-smesitel-komplekt-bauedge",
  "dusevaa-stojka-gappo-g-2417-8-belyj",
];

const bySlugInStock = (slug: string) => {
  const p = catalogItems.find((x) => x.slug === slug);
  return p && p.in_stock ? p : null;
};

// Дефолт для SSR/первой отрисовки — 6 GROHE (стабильно, без рассинхрона гидрации).
export const heroPicks: CatalogItem[] = HERO_SLUGS.map(bySlugInStock).filter(
  (p): p is CatalogItem => !!p,
);

// Полный пул для hero — из него слайдер каждый день детерминированно берёт 6.
export const heroPool: CatalogItem[] = HERO_SLUGS.map(bySlugInStock).filter(
  (p): p is CatalogItem => !!p,
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
