"use client";
import type { Product } from "@/lib/products";
import { formatPrice } from "@/lib/format";
import { useCart } from "@/lib/cart";
import { useState } from "react";

export function AddToCartButton({ product }: { product: Product }) {
  const add = useCart((s) => s.add);
  const [qty, setQty] = useState(1);
  const unit = product.price ?? 0;

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
          onClick={() =>
            add(
              {
                slug: product.slug,
                sku: product.sku,
                title: product.title,
                price: unit,
                image: product.images[0] ?? "",
              },
              qty,
            )
          }
          className="px-6 h-11 bg-accent text-accent-foreground rounded-lg font-medium hover:bg-accent-hover transition-colors"
        >
          В корзину · {formatPrice(unit * qty)}
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
