"use client";
import type { Product } from "@/lib/products";
import { formatPrice } from "@/lib/format";
import { useCart } from "@/lib/cart";
import { useState } from "react";
import { Check, ShoppingCart } from "lucide-react";
import { useT } from "@/lib/i18n";

export function AddToCartButton({ product }: { product: Product }) {
  const add = useCart((s) => s.add);
  const t = useT();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const unit = product.price ?? 0;

  const handleAdd = () => {
    add(
      {
        slug: product.slug,
        sku: product.sku,
        title: product.title,
        price: unit,
        image: product.images[0] ?? "",
      },
      qty,
    );
    setAdded(true);
    setTimeout(() => setAdded(false), 1600);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-3">
        <div className="flex items-center border border-border rounded-lg">
          <button
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            className="w-10 h-11 hover:bg-muted rounded-l-lg text-lg"
            aria-label="Меньше"
          >−</button>
          <span className="w-10 text-center text-sm font-medium">{qty}</span>
          <button
            onClick={() => setQty((q) => q + 1)}
            className="w-10 h-11 hover:bg-muted rounded-r-lg text-lg"
            aria-label="Больше"
          >+</button>
        </div>
        <button
          onClick={handleAdd}
          className={`px-6 h-11 rounded-lg font-medium transition-colors inline-flex items-center gap-2 ${
            added
              ? "bg-success text-white"
              : "bg-accent text-accent-foreground hover:bg-accent-hover"
          }`}
        >
          {added ? <Check size={18} /> : <ShoppingCart size={18} />}
          {added ? t("prod.added") : `${t("prod.buy")} · ${formatPrice(unit * qty)}`}
        </button>
      </div>
      {qty > 1 && (
        <div className="text-xs text-muted-foreground">
          {qty} × {formatPrice(unit)} = <span className="text-foreground font-medium">{formatPrice(unit * qty)}</span>
        </div>
      )}
    </div>
  );
}
