import { searchProducts } from "./search";

// Типы и чистые функции каталога — БЕЗ импорта данных.
// Клиентские компоненты берут отсюда, а сам индекс (2.8 МБ) приезжает
// лениво через useCatalog() и не сидит в JS-бандле.

export type CatalogItem = {
  slug: string;
  sku: string;
  title: string;
  brand: string;
  category: string;
  category_title: string;
  price: number | null;
  old_price: number | null;
  in_stock: boolean;
  on_sale: boolean;
  image: string;
  img_kb?: number;
  color?: string;
  material?: string;
  width?: number | null;
  size?: string; // габариты ванны «длина×ширина» в см
  length?: number | null; // длина ванны в см — для фильтра
  width_cm?: number | null; // ширина ванны в см — для фильтра
  dimL?: number; // выверенные габариты в мм — для подписи размера в карточке
  dimW?: number;
  mount?: string; // "hidden" | "open" — тип монтажа смесителя/душевой системы
  is_combo?: boolean; // готовый комплект: цена = сумма позиций минус 15%
};

// Подпись размера рядом с названием: у ванн уже посчитаны см, у остальных
// (тумбы, унитазы, зеркала) переводим выверенные миллиметры в сантиметры.
export function itemSize(p: CatalogItem): string | null {
  if (p.size) return p.size;
  if (!p.dimL || !p.dimW) return null;
  // У зеркал вторая величина — толщина в пару сантиметров, «80×3» читается как
  // размер полотна и путает. Показываем только ширину.
  if (p.dimW / p.dimL < 0.2) return `${Math.round(p.dimL / 10)}`;
  return `${Math.round(p.dimL / 10)}×${Math.round(p.dimW / 10)}`;
}

export type FilterState = {
  q?: string;
  brand?: string[];
  category?: string[];
  color?: string[];
  material?: string[];
  length?: string[]; // выбранные длины ванн в см
  widthCm?: string[]; // выбранные ширины ванн в см
  mount?: string[]; // тип монтажа: hidden / open
  priceMin?: number;
  priceMax?: number;
  widthMin?: number;
  widthMax?: number;
  inStock?: boolean;
  onSale?: boolean;
  sort?: "popular" | "price_asc" | "price_desc" | "name";
};

export function filterCatalog(all: CatalogItem[], f: FilterState): CatalogItem[] {
  let out = all;
  if (f.q && f.q.trim()) {
    out = searchProducts(out, f.q);
  }
  if (f.brand?.length) out = out.filter((p) => f.brand!.includes(p.brand));
  if (f.category?.length) out = out.filter((p) => f.category!.includes(p.category));
  if (f.color?.length) out = out.filter((p) => p.color && f.color!.includes(p.color));
  if (f.material?.length) out = out.filter((p) => p.material && f.material!.includes(p.material));
  if (f.length?.length) out = out.filter((p) => p.length != null && f.length!.includes(String(p.length)));
  if (f.widthCm?.length)
    out = out.filter((p) => p.width_cm != null && f.widthCm!.includes(String(p.width_cm)));
  if (f.mount?.length) out = out.filter((p) => p.mount && f.mount!.includes(p.mount));
  if (f.priceMin != null) out = out.filter((p) => (p.price ?? 0) >= f.priceMin!);
  if (f.priceMax != null) out = out.filter((p) => (p.price ?? 0) <= f.priceMax!);
  if (f.widthMin != null) out = out.filter((p) => p.width != null && p.width >= f.widthMin!);
  if (f.widthMax != null) out = out.filter((p) => p.width != null && p.width <= f.widthMax!);
  if (f.inStock) out = out.filter((p) => p.in_stock);
  if (f.onSale) out = out.filter((p) => p.on_sale || (p.old_price && p.old_price > (p.price ?? 0)));

  switch (f.sort) {
    case "price_asc":
      out = [...out].sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
      break;
    case "price_desc":
      out = [...out].sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
      break;
    case "name":
      out = [...out].sort((a, b) => a.title.localeCompare(b.title, "ru"));
      break;
    default:
      // Если распроданное показывают намеренно, оно всё равно уходит в конец.
      out = [...out].sort((a, b) => Number(b.in_stock) - Number(a.in_stock));
  }
  return out;
}

// --- фасеты, считаемые от переданного массива (не от глобальных данных) ---

export function allBrands(items: CatalogItem[]): { name: string; count: number }[] {
  const map = new Map<string, number>();
  for (const p of items) map.set(p.brand, (map.get(p.brand) ?? 0) + 1);
  return [...map.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

function facetCounts(items: CatalogItem[], key: "color" | "material") {
  const map = new Map<string, number>();
  for (const p of items) {
    const v = p[key];
    if (v) map.set(v, (map.get(v) ?? 0) + 1);
  }
  return [...map.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

export const allColors = (items: CatalogItem[]) => facetCounts(items, "color");
export const allMaterials = (items: CatalogItem[]) => facetCounts(items, "material");

export function lengthCategories(items: CatalogItem[]): Set<string> {
  const s = new Set<string>();
  for (const p of items) if (p.length != null) s.add(p.category);
  return s;
}

export function mountCategories(items: CatalogItem[]): Set<string> {
  const s = new Set<string>();
  for (const p of items) if (p.mount) s.add(p.category);
  return s;
}

function dimValues(items: CatalogItem[], key: "length" | "width_cm") {
  const map = new Map<number, number>();
  for (const p of items) {
    const v = p[key];
    if (v != null) map.set(v, (map.get(v) ?? 0) + 1);
  }
  return [...map.entries()].map(([value, count]) => ({ value, count }));
}

export const allLengths = (items: CatalogItem[]) =>
  dimValues(items, "length").sort((a, b) => b.value - a.value);
export const allWidthsCm = (items: CatalogItem[]) =>
  dimValues(items, "width_cm").sort((a, b) => a.value - b.value);

export function widthRange(items: CatalogItem[]): { min: number; max: number } {
  let min = Infinity;
  let max = 0;
  for (const p of items) {
    const w = p.width ?? 0;
    if (w > 0) {
      if (w < min) min = w;
      if (w > max) max = w;
    }
  }
  return { min: min === Infinity ? 0 : min, max };
}

export function allCategories(items: CatalogItem[]): { slug: string; title: string; count: number }[] {
  const map = new Map<string, { title: string; count: number }>();
  for (const p of items) {
    const cur = map.get(p.category) ?? { title: p.category_title, count: 0 };
    cur.count += 1;
    map.set(p.category, cur);
  }
  return [...map.entries()]
    .map(([slug, v]) => ({ slug, ...v }))
    .sort((a, b) => b.count - a.count);
}

export function priceRange(items: CatalogItem[]): { min: number; max: number } {
  let min = Infinity;
  let max = 0;
  for (const p of items) {
    const v = p.price ?? 0;
    if (v > 0) {
      if (v < min) min = v;
      if (v > max) max = v;
    }
  }
  return { min: min === Infinity ? 0 : Math.floor(min), max: Math.ceil(max) };
}
