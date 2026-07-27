"use client";
import Link from "next/link";
import { useState } from "react";
import { Check, Heart, Share2 } from "lucide-react";
import { useFavorites, useHydrated } from "@/lib/cart";
import { useCatalog } from "@/lib/useCatalog";
import { ProductCard } from "@/components/ProductCard";
import { ProductCardSkeleton } from "@/components/ProductCardSkeleton";

export default function FavoritesPage() {
  const slugs = useFavorites((s) => s.slugs);
  const hydrated = useHydrated();
  const catalogItems = useCatalog();
  const [copied, setCopied] = useState(false);

  const items = (catalogItems ?? []).filter((p) => slugs.includes(p.slug));

  // Подборка ссылкой: состав кодируется прямо в URL, бекенд не нужен.
  const share = async () => {
    const url = `${window.location.origin}/selection?items=${items
      .map((p) => p.slug)
      .join(",")}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "Подборка сантехники — dush.kz", url });
        return;
      } catch {
        // отменил системный диалог — падаем в копирование
      }
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
        <Link href="/" className="hover:text-foreground">Главная</Link>
        <span>/</span>
        <span className="text-foreground">Избранное</span>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="text-3xl font-semibold flex items-center gap-2">
          <Heart className="text-sale" /> Избранное
        </h1>
        {items.length > 0 && (
          <button
            onClick={share}
            className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-medium hover:border-brand transition-colors"
          >
            {copied ? <Check size={17} className="text-brand" /> : <Share2 size={17} />}
            {copied ? "Ссылка скопирована" : "Поделиться подборкой"}
          </button>
        )}
      </div>

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
