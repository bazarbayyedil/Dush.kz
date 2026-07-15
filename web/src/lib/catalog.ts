import indexData from "@/data/products-index.json";
import { searchProducts } from "./search";

// Тонкий тип для каталога/поиска/карточек — без attrs и description.
// Полные данные товара (Product) читаются только на серверной странице товара.
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
};

export const catalogItems: CatalogItem[] = indexData as CatalogItem[];

export type FilterState = {
  q?: string;
  brand?: string[];
  category?: string[];
  priceMin?: number;
  priceMax?: number;
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
  if (f.priceMin != null) out = out.filter((p) => (p.price ?? 0) >= f.priceMin!);
  if (f.priceMax != null) out = out.filter((p) => (p.price ?? 0) <= f.priceMax!);
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
  }
  return out;
}

export function getAllBrands(): { name: string; count: number }[] {
  const map = new Map<string, number>();
  for (const p of catalogItems) map.set(p.brand, (map.get(p.brand) ?? 0) + 1);
  return [...map.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

export function getAllCategories(): { slug: string; title: string; count: number }[] {
  const map = new Map<string, { title: string; count: number }>();
  for (const p of catalogItems) {
    const cur = map.get(p.category) ?? { title: p.category_title, count: 0 };
    cur.count += 1;
    map.set(p.category, cur);
  }
  return [...map.entries()]
    .map(([slug, v]) => ({ slug, ...v }))
    .sort((a, b) => b.count - a.count);
}

export function getPriceRange(): { min: number; max: number } {
  const prices = catalogItems.map((p) => p.price ?? 0).filter((p) => p > 0);
  return { min: Math.floor(Math.min(...prices)), max: Math.ceil(Math.max(...prices)) };
}

// Карта slug → {title, count} для мега-меню и хлебных крошек
let _catMap: Record<string, { title: string; count: number }> | null = null;
export function getCategoryMap(): Record<string, { title: string; count: number }> {
  if (_catMap) return _catMap;
  const map: Record<string, { title: string; count: number }> = {};
  for (const p of catalogItems) {
    if (!map[p.category]) map[p.category] = { title: p.category_title, count: 0 };
    map[p.category].count += 1;
  }
  _catMap = map;
  return map;
}

// Товары для превью в разделах (первый попавшийся с фото из группы категорий)
export function sampleByCategories(cats: string[], limit = 4): CatalogItem[] {
  const set = new Set(cats);
  const out: CatalogItem[] = [];
  for (const p of catalogItems) {
    if (set.has(p.category) && p.image) {
      out.push(p);
      if (out.length >= limit) break;
    }
  }
  return out;
}
