"use client";
import type { Product } from "@/lib/products";
import { formatPrice } from "@/lib/format";
import { useCart, useOrder, useHydrated } from "@/lib/cart";
import { useState } from "react";
import { ArrowRight, ShoppingCart } from "lucide-react";
import { useT } from "@/lib/i18n";
import { CartQty } from "@/components/CartQty";

export function AddToCartButton({ product }: { product: Product }) {
  const add = useCart((s) => s.add);
  const cartItems = useCart((s) => s.items);
  const openOrder = useOrder((s) => s.open);
  const inCartQty = useCart((s) => s.items.find((i) => i.slug === product.slug)?.qty ?? 0);
  const hydrated = useHydrated();
  const t = useT();
  const [qty, setQty] = useState(1);
  const unit = product.price ?? 0;

  // Оформление со всей корзиной — тот же поток, что из корзины-шторки.
  const checkout = () =>
    openOrder(
      cartItems.map((i) => ({ slug: i.slug, title: i.title, price: i.price, qty: i.qty })),
      true,
    );

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
    setQty(1);
  };

  // Товар уже в корзине — управляем количеством и даём явную кнопку оформления.
  if (hydrated && inCartQty > 0) {
    return (
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center gap-3 flex-wrap">
          <CartQty slug={product.slug} className="h-12 w-40" />
          <button
            onClick={checkout}
            className="h-12 px-6 rounded-lg font-semibold inline-flex items-center gap-2 bg-sale text-sale-foreground hover:bg-sale-hover transition-colors"
          >
            {t("prod.checkout")}
            <ArrowRight size={18} />
          </button>
        </div>
        <div className="text-xs text-muted-foreground">
          {inCartQty} × {formatPrice(unit)} ={" "}
          <span className="text-foreground font-medium">{formatPrice(unit * inCartQty)}</span>
        </div>
      </div>
    );
  }

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
          className="px-6 h-11 rounded-lg font-medium transition-colors inline-flex items-center gap-2 bg-accent text-accent-foreground hover:bg-accent-hover"
        >
          <ShoppingCart size={18} />
          {`${t("prod.buy")} · ${formatPrice(unit * qty)}`}
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
