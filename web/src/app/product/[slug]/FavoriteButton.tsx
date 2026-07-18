"use client";
import { Heart } from "lucide-react";
import { useFavorites, useHydrated } from "@/lib/cart";
import { useT } from "@/lib/i18n";

export function FavoriteButton({ slug }: { slug: string }) {
  const toggle = useFavorites((s) => s.toggle);
  const slugs = useFavorites((s) => s.slugs);
  const hydrated = useHydrated();
  const isFav = hydrated && slugs.includes(slug);
  const t = useT();

  return (
    <button
      onClick={() => toggle(slug)}
      aria-pressed={isFav}
      className={`h-11 px-4 rounded-lg border flex items-center gap-2 text-sm font-medium transition-colors ${
        isFav
          ? "border-sale text-sale bg-sale/5"
          : "border-border text-foreground hover:border-accent/60"
      }`}
    >
      <Heart size={18} fill={isFav ? "currentColor" : "none"} />
      <span className="hidden sm:inline">{t(isFav ? "prod.in_fav" : "prod.to_fav")}</span>
    </button>
  );
}
