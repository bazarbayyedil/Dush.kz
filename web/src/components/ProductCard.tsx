"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { Heart, ShoppingCart, Check } from "lucide-react";
import { useState } from "react";
import { CatalogItem } from "@/lib/catalog";
import { formatPrice, discountPercent, effectiveOldPrice } from "@/lib/format";
import { useCart, useFavorites, useHydrated } from "@/lib/cart";
import { productImageUrl } from "@/lib/media";
import { useT } from "@/lib/i18n";

export function ProductCard({ product }: { product: CatalogItem }) {
  const add = useCart((s) => s.add);
  const favToggle = useFavorites((s) => s.toggle);
  const favSlugs = useFavorites((s) => s.slugs);
  const hydrated = useHydrated();
  const t = useT();
  const [added, setAdded] = useState(false);

  const img = product.image;
  const oldPrice = effectiveOldPrice(product.slug, product.price, product.old_price);
  const discount = discountPercent(product.price, oldPrice);
  const isFav = hydrated && favSlugs.includes(product.slug);

  const handleAdd = () => {
    add({
      slug: product.slug,
      sku: product.sku,
      title: product.title,
      price: product.price ?? 0,
      image: img ?? "",
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1400);
  };

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
      className="group relative flex flex-col rounded-2xl border border-border bg-card overflow-hidden hover:shadow-[0_12px_32px_-12px_rgba(15,23,42,0.18)] hover:border-border transition-shadow"
    >
      {/* Бейдж скидки */}
      {discount > 0 && (
        <div className="absolute top-2.5 left-2.5 z-10">
          <span className="px-2 py-0.5 text-[11px] bg-sale text-sale-foreground rounded-md font-semibold">
            −{discount}%
          </span>
        </div>
      )}

      {/* Избранное */}
      <button
        onClick={() => favToggle(product.slug)}
        className="absolute top-2.5 right-2.5 z-10 w-8 h-8 rounded-full bg-white/90 border border-border flex items-center justify-center hover:bg-white transition-colors"
        aria-label="В избранное"
      >
        <Heart
          size={16}
          className={isFav ? "text-sale" : "text-muted-foreground"}
          fill={isFav ? "currentColor" : "none"}
        />
      </button>

      <Link href={`/product/${product.slug}`} className="relative aspect-square bg-surface overflow-hidden">
        {img ? (
          <img
            src={productImageUrl(img)}
            alt={product.title}
            className="relative w-full h-full object-contain p-2 mix-blend-multiply group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
            onError={(event) => {
              event.currentTarget.style.display = "none";
            }}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-xs">
            Нет фото
          </div>
        )}
      </Link>

      <div className="p-3.5 flex flex-col flex-1 gap-1.5">
        <div className="text-[11px] text-muted-foreground uppercase tracking-wide">{product.brand}</div>
        <Link
          href={`/product/${product.slug}`}
          className="text-sm leading-snug line-clamp-2 hover:text-accent min-h-[2.5rem]"
        >
          {product.title}
        </Link>

        <div className="flex items-baseline gap-2 mt-auto pt-1">
          <span className="text-lg font-bold">{formatPrice(product.price)}</span>
          {discount > 0 && (
            <span className="text-xs text-muted-foreground line-through">{formatPrice(oldPrice)}</span>
          )}
        </div>

        {/* Наличие + срок доставки — видно всегда, в т.ч. со скидкой */}
        <div className="flex items-center gap-1.5 text-[11px] leading-none">
          {product.in_stock ? (
            <>
              <span className="inline-flex items-center gap-1 text-success font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-success" /> {t("card.in_stock")}
              </span>
              <span className="text-muted-foreground">· {t("card.delivery")}</span>
            </>
          ) : (
            <span className="text-muted-foreground">{t("card.on_order")}</span>
          )}
        </div>

        <button
          onClick={handleAdd}
          className={`mt-1.5 w-full h-10 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
            added
              ? "bg-success text-white"
              : "bg-accent text-accent-foreground hover:bg-accent-hover"
          }`}
        >
          {added ? <Check size={17} /> : <ShoppingCart size={17} />}
          {added ? t("card.added") : t("card.add")}
        </button>
      </div>
    </motion.div>
  );
}
