// Утилиты форматирования без импорта данных — безопасны для клиентских бандлов.
export function formatPrice(n: number | null | undefined): string {
  if (n == null) return "—";
  return n.toLocaleString("ru-RU") + " ₸";
}

// Стабильный псевдо-рейтинг из slug (4.0–5.0) + число отзывов — для витрины.
export function pseudoRating(slug: string): { rating: number; reviews: number } {
  let h = 0;
  for (let i = 0; i < slug.length; i++) h = (h * 31 + slug.charCodeAt(i)) >>> 0;
  const rating = 4 + (h % 11) / 10; // 4.0 … 5.0
  const reviews = 3 + (h % 180); // 3 … 182
  return { rating: Math.round(rating * 10) / 10, reviews };
}

export function discountPercent(price: number | null, oldPrice: number | null): number {
  if (!price || !oldPrice || oldPrice <= price) return 0;
  return Math.round(((oldPrice - price) / oldPrice) * 100);
}
