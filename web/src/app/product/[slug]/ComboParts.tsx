"use client";
import Link from "next/link";
import { PackageCheck } from "lucide-react";
import type { Product } from "@/lib/products";
import { formatPrice } from "@/lib/format";
import { useT } from "@/lib/i18n";

/** Состав комплекта и арифметика выгоды — ради неё комплект и берут. */
export function ComboParts({ product }: { product: Product }) {
  const t = useT();
  const parts = product.combo_parts ?? [];
  if (!product.is_combo || parts.length === 0) return null;

  const sum = product.old_price ?? parts.reduce((s, p) => s + p.price, 0);
  const saved = sum - (product.price ?? 0);

  return (
    <section className="rounded-2xl border border-border bg-card overflow-hidden">
      <header className="flex items-center gap-2 px-5 py-3.5 border-b border-border">
        <span className="w-8 h-8 rounded-lg bg-sale/10 text-sale flex items-center justify-center">
          <PackageCheck size={17} strokeWidth={2.2} />
        </span>
        <h2 className="font-semibold">{t("combo.contents")}</h2>
        <span className="ml-auto text-sm text-muted-foreground">{parts.length}</span>
      </header>

      <ul className="divide-y divide-border">
        {parts.map((p) => (
          <li key={p.slug} className="flex items-baseline gap-3 px-5 py-3">
            <Link href={`/product/${p.slug}`} className="text-sm leading-snug hover:text-accent flex-1">
              {p.title}
            </Link>
            <span className="text-sm text-muted-foreground tabular-nums shrink-0">
              {formatPrice(p.price)}
            </span>
          </li>
        ))}
      </ul>

      <div className="px-5 py-4 bg-sale/[0.06] border-t border-border space-y-1.5">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">{t("combo.separately")}</span>
          <span className="line-through text-muted-foreground tabular-nums">{formatPrice(sum)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="font-medium">{t("combo.as_set")}</span>
          <span className="font-bold text-lg tabular-nums">{formatPrice(product.price)}</span>
        </div>
        <div className="flex justify-between items-center pt-1.5 border-t border-sale/20">
          <span className="text-sale font-semibold">{t("combo.you_save")}</span>
          <span className="text-sale font-bold text-lg tabular-nums">{formatPrice(saved)}</span>
        </div>
      </div>
    </section>
  );
}
