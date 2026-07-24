import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { catalogItems, getCategoryMap } from "@/lib/catalog";
import { SITE_URL } from "@/lib/site";
import { CatalogView } from "../CatalogView";
import { ProductCardSkeleton } from "@/components/ProductCardSkeleton";

// Выделенная SSG-страница категории: серверные title/H1/описание под
// коммерческие запросы. Фильтры и сетка — тот же клиентский CatalogView.

export function generateStaticParams() {
  return Object.keys(getCategoryMap()).map((category) => ({ category }));
}

export const dynamicParams = false;

type Props = { params: Promise<{ category: string }> };

function statsOf(slug: string) {
  const items = catalogItems.filter((p) => p.category === slug && p.in_stock && p.price);
  const prices = items.map((p) => p.price!);
  const brands = [...new Set(items.map((p) => p.brand))].filter((b) => b !== "Без бренда");
  return {
    count: items.length,
    min: prices.length ? Math.min(...prices) : null,
    brands: brands.slice(0, 4),
  };
}

const fmt = (n: number) => n.toLocaleString("ru-RU");

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category } = await params;
  const cat = getCategoryMap()[category];
  if (!cat) return {};
  const { count, min } = statsOf(category);
  const title = min
    ? `${cat.title} — купить в Астане, цены от ${fmt(min)} ₸ | dush.kz`
    : `${cat.title} — купить в Астане | dush.kz`;
  const description =
    `${cat.title} в интернет-магазине dush.kz: ${count} моделей в наличии. ` +
    `Официальная гарантия производителя, бесплатная доставка по Астане за 24 часа, доставка по Казахстану.`;
  return {
    title,
    description,
    alternates: { canonical: `${SITE_URL}/catalog/${category}` },
    openGraph: { title, description, url: `${SITE_URL}/catalog/${category}` },
  };
}

export default async function CategoryPage({ params }: Props) {
  const { category } = await params;
  const cat = getCategoryMap()[category];
  if (!cat) notFound();
  const { count, min, brands } = statsOf(category);

  return (
    <div>
      <div className="max-w-7xl mx-auto px-4 pt-6">
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
          <Link href="/" className="hover:text-foreground">Главная</Link>
          <span>/</span>
          <Link href="/catalog" className="hover:text-foreground">Каталог</Link>
          <span>/</span>
          <span className="text-foreground">{cat.title}</span>
        </nav>
        <h1 className="text-2xl md:text-3xl font-bold">{cat.title} в Астане</h1>
        <p className="text-sm text-muted-foreground mt-2 max-w-3xl">
          {count > 0 ? `${count} моделей в наличии` : "Товары под заказ"}
          {min ? `, цены от ${fmt(min)} ₸` : ""}
          {brands.length ? `. ${brands.join(", ")}` : ""}
          {" — официальная гарантия, бесплатная доставка по Астане за 24 часа."}
        </p>
      </div>
      <Suspense
        fallback={
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          </div>
        }
      >
        <CatalogView fixedCategory={category} headless />
      </Suspense>
    </div>
  );
}
