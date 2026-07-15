import { notFound } from "next/navigation";
import Link from "next/link";
import { getProduct, products, formatPrice } from "@/lib/products";
import { catalogItems } from "@/lib/catalog";
import { ProductCard } from "@/components/ProductCard";
import { ProductGallery } from "./ProductGallery";
import { AddToCartButton } from "./AddToCartButton";
import { BuyOneClickButton } from "./BuyOneClickButton";

export function generateStaticParams() {
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata(props: { params: Promise<{ slug: string }> }) {
  const { slug } = await props.params;
  const p = getProduct(slug);
  if (!p) return {};
  return {
    title: `${p.title} — dush.kz`,
    description: p.description.slice(0, 160),
  };
}

export default async function ProductPage(props: { params: Promise<{ slug: string }> }) {
  const { slug } = await props.params;
  const product = getProduct(slug);
  if (!product) notFound();

  const discount =
    product.old_price && product.price
      ? Math.round(((product.old_price - product.price) / product.old_price) * 100)
      : 0;

  const related = catalogItems
    .filter((p) => p.slug !== product.slug && p.category === product.category)
    .slice(0, 4);

  const attrEntries = Object.entries(product.attrs).filter(([k]) => !!k);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-5 flex-wrap">
        <Link href="/" className="hover:text-foreground">Главная</Link>
        <span>/</span>
        <Link href="/catalog" className="hover:text-foreground">Каталог</Link>
        <span>/</span>
        <Link href={`/catalog?category=${product.category}`} className="hover:text-foreground">
          {product.category_title}
        </Link>
        <span>/</span>
        <span className="text-foreground line-clamp-1">{product.title}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
        <ProductGallery images={product.images} alt={product.title} />

        <div>
          <div className="text-sm text-muted-foreground mb-2">{product.brand}</div>
          <h1 className="text-2xl md:text-3xl font-semibold leading-tight">{product.title}</h1>
          <div className="flex items-center gap-3 text-sm mt-2">
            <span className="text-muted-foreground">Артикул: <span className="text-foreground">{product.sku}</span></span>
            {product.in_stock && (
              <span className="inline-flex items-center gap-1 text-success">
                <span className="w-1.5 h-1.5 rounded-full bg-success" /> В наличии
              </span>
            )}
          </div>

          <div className="mt-6 flex items-baseline gap-3">
            <span className="text-3xl font-bold">{formatPrice(product.price)}</span>
            {product.old_price && product.old_price > (product.price ?? 0) && (
              <>
                <span className="text-lg text-muted-foreground line-through">
                  {formatPrice(product.old_price)}
                </span>
                <span className="px-2 py-0.5 bg-danger text-white text-xs rounded font-medium">
                  −{discount}%
                </span>
              </>
            )}
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <AddToCartButton product={product} />
            <BuyOneClickButton slug={product.slug} title={product.title} price={product.price ?? 0} />
          </div>

          <div className="mt-8 grid grid-cols-3 gap-3 text-xs text-muted-foreground">
            <div className="p-3 rounded-lg border border-border">
              <div className="text-foreground font-medium mb-0.5">Доставка</div>
              По Астане — 24ч
            </div>
            <div className="p-3 rounded-lg border border-border">
              <div className="text-foreground font-medium mb-0.5">Гарантия</div>
              2 года
            </div>
            <div className="p-3 rounded-lg border border-border">
              <div className="text-foreground font-medium mb-0.5">Оригинал</div>
              Прямые поставки
            </div>
          </div>

          {attrEntries.length > 0 && (
            <div className="mt-8">
              <h3 className="text-lg font-semibold mb-3">Характеристики</h3>
              <dl className="divide-y divide-border border-y border-border">
                {attrEntries.slice(0, 20).map(([k, v]) => (
                  <div key={k} className="flex py-2.5 text-sm">
                    <dt className="w-1/2 text-muted-foreground">{k}</dt>
                    <dd className="w-1/2">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </div>
      </div>

      {product.description && (
        <section className="mt-12 max-w-3xl">
          <h2 className="text-xl font-semibold mb-3">Описание</h2>
          <div className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
            {product.description.slice(0, 2000)}
          </div>
        </section>
      )}

      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="text-2xl font-semibold mb-6">Похожие товары</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {related.map((p) => (
              <ProductCard key={p.slug} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
