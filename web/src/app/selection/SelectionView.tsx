"use client";
import Link from "next/link";
import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { ClipboardList, MessageCircle, ShoppingCart } from "lucide-react";
import { useCatalog } from "@/lib/useCatalog";
import { useCart } from "@/lib/cart";
import { productImageUrl } from "@/lib/media";
import { formatPrice } from "@/lib/format";
import { WHATSAPP_NUMBER } from "@/lib/contacts";

/** Подборка товаров, состав зашит в ссылку (?items=slug,slug,…). */
export function SelectionView() {
  const sp = useSearchParams();
  const catalogItems = useCatalog();
  const add = useCart((s) => s.add);
  const openCart = useCart((s) => s.open);

  const slugs = useMemo(
    () => (sp.get("items") || "").split(",").map((s) => s.trim()).filter(Boolean),
    [sp],
  );

  const items = useMemo(() => {
    if (!catalogItems) return null;
    const bySlug = new Map(catalogItems.map((p) => [p.slug, p]));
    return slugs.map((s) => bySlug.get(s)).filter((p) => p != null);
  }, [catalogItems, slugs]);

  const total = (items ?? []).reduce((s, p) => s + (p.price ?? 0), 0);

  const addAll = () => {
    for (const p of items ?? []) {
      if (p.in_stock && p.price) {
        add({ slug: p.slug, sku: p.sku, title: p.title, price: p.price,
              image: p.image });
      }
    }
    openCart();
  };

  const waText = `Здравствуйте! Интересует подборка с dush.kz (${slugs.length} поз.): ${
    typeof window !== "undefined" ? window.location.href : ""
  }`;

  if (!items) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 rounded-2xl skeleton" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border p-16 text-center">
        <ClipboardList size={40} className="mx-auto text-muted-foreground mb-3" />
        <div className="text-muted-foreground">
          Подборка пуста или ссылка неполная
        </div>
        <Link
          href="/catalog"
          className="inline-block mt-4 px-5 py-2.5 bg-accent text-accent-foreground rounded-xl text-sm font-medium hover:bg-accent-hover"
        >
          Перейти в каталог
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="space-y-3">
        {items.map((p, i) => (
          <Link
            key={p.slug}
            href={`/product/${p.slug}`}
            className="flex items-center gap-4 rounded-2xl border border-border bg-card p-3 hover:border-brand transition-colors"
          >
            <span className="w-8 text-center text-sm text-muted-foreground tabular-nums shrink-0">
              {i + 1}
            </span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={productImageUrl(p.image)}
              alt={p.title}
              loading="lazy"
              className="w-20 h-20 object-contain rounded-xl bg-white shrink-0"
            />
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium leading-snug line-clamp-2">{p.title}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {p.sku && p.sku !== "-" ? `Арт. ${p.sku} · ` : ""}
                {p.in_stock ? "В наличии" : "Под заказ"}
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="font-semibold tabular-nums">{formatPrice(p.price)}</div>
              {p.old_price ? (
                <div className="text-xs text-muted-foreground line-through tabular-nums">
                  {formatPrice(p.old_price)}
                </div>
              ) : null}
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-6 rounded-2xl border border-border bg-card p-5 flex flex-wrap items-center gap-4 justify-between">
        <div>
          <div className="text-sm text-muted-foreground">
            {items.length} поз. на сумму
          </div>
          <div className="text-2xl font-bold tabular-nums">{formatPrice(total)}</div>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={addAll}
            className="inline-flex items-center gap-2 rounded-xl bg-brand text-white px-5 py-3 text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <ShoppingCart size={18} />
            Добавить всё в корзину
          </button>
          <a
            href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(waText)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl border border-border px-5 py-3 text-sm font-medium hover:border-brand transition-colors"
          >
            <MessageCircle size={18} />
            Обсудить в WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}
