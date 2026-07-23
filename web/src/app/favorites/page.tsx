"use client";
import Link from "next/link";
import { Heart } from "lucide-react";
import { useFavorites, useHydrated } from "@/lib/cart";
import { useCatalog } from "@/lib/useCatalog";
import { ProductCard } from "@/components/ProductCard";
import { ProductCardSkeleton } from "@/components/ProductCardSkeleton";

export default function FavoritesPage() {
  const slugs = useFavorites((s) => s.slugs);
  const hydrated = useHydrated();
  const catalogItems = useCatalog();

  const items = (catalogItems ?? []).filter((p) => slugs.includes(p.slug));

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
        <Link href="/" className="hover:text-foreground">Главная</Link>
        <span>/</span>
        <span className="text-foreground">Избранное</span>
      </div>
      <h1 className="text-3xl font-semibold mb-6 flex items-center gap-2">
        <Heart className="text-sale" /> Избранное
      </h1>

      {!hydrated || !catalogItems ? (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-16 text-center">
          <Heart size={40} className="mx-auto text-muted-foreground mb-3" />
          <div className="text-muted-foreground">В избранном пока пусто</div>
          <Link
            href="/catalog"
            className="inline-block mt-4 px-5 py-2.5 bg-accent text-accent-foreground rounded-xl text-sm font-medium hover:bg-accent-hover"
          >
            Перейти в каталог
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {items.map((p) => (
            <ProductCard key={p.slug} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
