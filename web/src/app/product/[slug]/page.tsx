import { notFound } from "next/navigation";
import Link from "next/link";
import { getProduct, products, formatPrice } from "@/lib/products";
import { effectiveOldPrice, discountPercent } from "@/lib/format";
import { catalogItems } from "@/lib/catalog";
import { crossSell } from "@/lib/crosssell";
import { ProductCard } from "@/components/ProductCard";
import { T } from "@/components/T";
import { ProductGallery } from "./ProductGallery";
import { AddToCartButton } from "./AddToCartButton";
import { BuyOneClickButton } from "./BuyOneClickButton";
import { MobileBuyBar } from "./MobileBuyBar";

// Ключевые характеристики выбора — показываем первыми, если есть у товара.
const KEY_ATTRS = [
  "Производство",
  "Материал изготовления",
  "Материал",
  "Цвет",
  "Тип крепления",
  "Тип монтажа",
  "Назначение",
  "Длина ванны",
  "Ширина ванны",
  "Ширина",
  "Высота",
  "Глубина",
  "Объем",
  "Гарантия производителя",
];

const hasSku = (sku: string) => !!sku && sku !== "-" && !!sku.trim();

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

  const oldPrice = effectiveOldPrice(product.slug, product.price, product.old_price);
  const discount = discountPercent(product.price, oldPrice);

  const related = catalogItems
    .filter((p) => p.slug !== product.slug && p.category === product.category)
    .slice(0, 4);

  const withYou = crossSell(product.category, product.slug, 4);

  const attrEntries = Object.entries(product.attrs).filter(([k]) => !!k);
  const keyFacts = KEY_ATTRS.map((k) => [k, product.attrs[k]] as const).filter(
    ([, v]) => !!v && String(v).trim(),
  );

  return (
    <div className="max-w-7xl mx-auto px-4 pt-6 pb-28 lg:pb-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-5 flex-wrap">
        <Link href="/" className="hover:text-foreground"><T k="cat.home" /></Link>
        <span>/</span>
        <Link href="/catalog" className="hover:text-foreground"><T k="prod.catalog" /></Link>
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
            {hasSku(product.sku) && (
              <span className="text-muted-foreground"><T k="prod.sku" />: <span className="text-foreground">{product.sku}</span></span>
            )}
            {product.in_stock && (
              <span className="inline-flex items-center gap-1 text-success">
                <span className="w-1.5 h-1.5 rounded-full bg-success" /> <T k="card.in_stock" />
              </span>
            )}
          </div>

          <div className="mt-6 flex items-baseline gap-3">
            <span className="text-3xl font-bold">{formatPrice(product.price)}</span>
            {oldPrice && oldPrice > (product.price ?? 0) && (
              <>
                <span className="text-lg text-muted-foreground line-through">
                  {formatPrice(oldPrice)}
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
              <div className="text-foreground font-medium mb-0.5"><T k="prod.delivery" /></div>
              <T k="prod.delivery_v" />
            </div>
            <div className="p-3 rounded-lg border border-border">
              <div className="text-foreground font-medium mb-0.5"><T k="prod.warranty" /></div>
              <T k="prod.warranty_v" />
            </div>
            <div className="p-3 rounded-lg border border-border">
              <div className="text-foreground font-medium mb-0.5"><T k="prod.original" /></div>
              <T k="prod.original_v" />
            </div>
          </div>

          {keyFacts.length > 0 && (
            <div className="mt-8 rounded-xl border border-border p-4">
              <div className="text-sm font-semibold mb-3"><T k="prod.key" /></div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
                {keyFacts.slice(0, 6).map(([k, v]) => (
                  <div key={k} className="text-sm">
                    <div className="text-xs text-muted-foreground">{k}</div>
                    <div className="text-foreground">{v}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {attrEntries.length > 0 && (
            <div className="mt-8">
              <h3 className="text-lg font-semibold mb-3"><T k="prod.specs" /></h3>
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
          <h2 className="text-xl font-semibold mb-3"><T k="prod.desc" /></h2>
          <div className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
            {product.description.slice(0, 2000)}
          </div>
        </section>
      )}

      {withYou.length > 0 && (
        <section className="mt-16">
          <h2 className="text-2xl font-semibold mb-6"><T k="prod.with_this" /></h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {withYou.map((p) => (
              <ProductCard key={p.slug} product={p} />
            ))}
          </div>
        </section>
      )}

      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="text-2xl font-semibold mb-6"><T k="prod.similar" /></h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {related.map((p) => (
              <ProductCard key={p.slug} product={p} />
            ))}
          </div>
        </section>
      )}

      <MobileBuyBar
        slug={product.slug}
        sku={product.sku}
        title={product.title}
        price={product.price}
        image={product.images[0] ?? ""}
        inStock={product.in_stock}
      />
    </div>
  );
}
