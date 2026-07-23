import indexData from "@/data/products-index.json";
import type { CatalogItem } from "./catalog-core";

// СЕРВЕРНЫЙ вход в индекс каталога: статический импорт 2.8 МБ данных.
// Использовать только в серверных компонентах (страница товара, sitemap)
// и в build-time коде. Клиентские компоненты берут типы и функции из
// "./catalog-core", а данные — лениво через "./useCatalog", иначе индекс
// приезжает в JS-бандл целиком.

export const catalogItems: CatalogItem[] = indexData as CatalogItem[];

export type { CatalogItem, FilterState } from "./catalog-core";
export { filterCatalog, itemSize } from "./catalog-core";

// Карта slug → {title, count} для серверных страниц
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
