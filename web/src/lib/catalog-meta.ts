import meta from "@/data/catalog-meta.json";

// Лёгкая мета каталога (~43 КБ) для клиентских меню и плиток:
// карта категорий и превью товаров. Генерится scripts/gen-meta.mjs.

export type PreviewItem = { slug: string; title: string; image: string; price: number };

const categories = meta.categories as Record<string, { title: string; count: number }>;
const previews = meta.previews as Record<string, PreviewItem[]>;

export function getCategoryMap(): Record<string, { title: string; count: number }> {
  return categories;
}

/** До `limit` товаров-превью из списка категорий (для мегаменю). */
export function previewByCategories(cats: string[], limit = 3): PreviewItem[] {
  const out: PreviewItem[] = [];
  for (const c of cats) {
    for (const p of previews[c] ?? []) {
      out.push(p);
      if (out.length >= limit) return out;
    }
  }
  return out;
}
