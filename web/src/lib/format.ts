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

// Витринная «старая цена». Реальная — если есть в данных; иначе синтетическая
// для части ассортимента, детерминированно по slug (как pseudoRating). Нужна
// только для отображения зачёркнутой цены и бейджа скидки; в корзине/заказе
// всегда используется настоящая price.
const SALE_PCTS = [10, 12, 15, 18, 20, 22, 25];
export function effectiveOldPrice(
  slug: string,
  price: number | null | undefined,
  realOld?: number | null,
): number | null {
  if (realOld && price && realOld > price) return realOld;
  if (!price || price <= 0) return null;
  let h = 0;
  for (let i = 0; i < slug.length; i++) h = (h * 31 + slug.charCodeAt(i)) >>> 0;
  if (h % 100 >= 40) return null; // скидка примерно у 40% товаров
  const pct = SALE_PCTS[(h >>> 5) % SALE_PCTS.length];
  const old = Math.round(price / (1 - pct / 100) / 100) * 100; // ровное число
  return old > price ? old : price + 100;
}
