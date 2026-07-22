"use client";
import Link from "next/link";
import { useState } from "react";
import { Check, Plus, ShoppingCart } from "lucide-react";
import type { Suggestion } from "@/lib/crosssell";
import { formatPrice } from "@/lib/format";
import { productImageUrl } from "@/lib/media";
import { useCart } from "@/lib/cart";
import { useT } from "@/lib/i18n";

/**
 * «Нужно докупить» — блок рядом с кнопкой покупки, а не в подвале страницы.
 * Позиции отмечены заранее: покупатель снимает лишнее, а не ищет, что добавить.
 */
export function BuyTogether({
  base,
  items,
}: {
  base: { slug: string; sku: string; title: string; price: number; image: string };
  items: Suggestion[];
}) {
  const t = useT();
  const add = useCart((s) => s.add);
  const openCart = useCart((s) => s.open);
  const [picked, setPicked] = useState<string[]>(items.map((s) => s.item.slug));
  const [done, setDone] = useState(false);

  if (items.length === 0) return null;

  const chosen = items.filter((s) => picked.includes(s.item.slug));
  const total = base.price + chosen.reduce((sum, s) => sum + (s.item.price ?? 0), 0);

  const toggle = (slug: string) =>
    setPicked((cur) => (cur.includes(slug) ? cur.filter((s) => s !== slug) : [...cur, slug]));

  const addAll = () => {
    add(base);
    for (const s of chosen) {
      add({
        slug: s.item.slug,
        sku: s.item.sku,
        title: s.item.title,
        price: s.item.price ?? 0,
        image: s.item.image,
      });
    }
    setDone(true);
    openCart();
  };

  return (
    <div className="mt-6 rounded-2xl border border-brand/25 bg-brand/[0.04] p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="w-6 h-6 rounded-lg bg-brand text-white grid place-items-center shrink-0">
          <Plus size={14} strokeWidth={3} />
        </span>
        <div className="text-sm font-semibold">{t("xs.title")}</div>
      </div>

      <div className="space-y-2">
        {items.map((s) => {
          const on = picked.includes(s.item.slug);
          return (
            <div
              key={s.item.slug}
              className={`flex gap-3 rounded-xl border p-2.5 transition-colors ${
                on ? "border-brand/40 bg-white" : "border-border bg-white/60"
              }`}
            >
              <button
                onClick={() => toggle(s.item.slug)}
                aria-pressed={on}
                aria-label={s.item.title}
                className={`w-[18px] h-[18px] mt-0.5 rounded-[5px] border shrink-0 grid place-items-center transition-colors ${
                  on ? "bg-accent border-accent text-white" : "border-border"
                }`}
              >
                {on && <Check size={13} strokeWidth={3} />}
              </button>

              <Link href={`/product/${s.item.slug}`} className="shrink-0">
                <img
                  src={productImageUrl(s.item.image)}
                  alt=""
                  className="w-12 h-12 object-contain mix-blend-multiply"
                  loading="lazy"
                />
              </Link>

              <div className="min-w-0 flex-1">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-accent">
                  {t(s.need)}
                </div>
                <Link
                  href={`/product/${s.item.slug}`}
                  className="block text-[13px] leading-snug line-clamp-1 hover:text-accent"
                >
                  {s.item.title}
                </Link>
                <div className="text-[11px] text-muted-foreground leading-snug line-clamp-1">
                  {t(s.why)}
                </div>
              </div>

              <div className="text-sm font-semibold whitespace-nowrap self-center">
                {formatPrice(s.item.price)}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-3.5 flex items-center gap-3">
        <div className="text-sm">
          <span className="text-muted-foreground">{t("xs.total")} </span>
          <span className="font-bold text-base">{formatPrice(total)}</span>
        </div>
        <button
          onClick={addAll}
          className="ml-auto h-10 px-4 rounded-xl bg-accent text-accent-foreground text-sm font-medium flex items-center gap-2 hover:bg-accent-hover transition-colors"
        >
          <ShoppingCart size={16} />
          {done ? t("xs.added") : t("xs.add_all")}
        </button>
      </div>
    </div>
  );
}
