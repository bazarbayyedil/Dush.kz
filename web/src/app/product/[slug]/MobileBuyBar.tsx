"use client";
import { useState } from "react";
import { Check, ShoppingCart } from "lucide-react";
import { useCart } from "@/lib/cart";
import { formatPrice } from "@/lib/format";

export function MobileBuyBar({
  slug,
  sku,
  title,
  price,
  image,
  inStock,
}: {
  slug: string;
  sku: string;
  title: string;
  price: number | null;
  image: string;
  inStock: boolean;
}) {
  const add = useCart((s) => s.add);
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    add({ slug, sku, title, price: price ?? 0, image });
    setAdded(true);
    setTimeout(() => setAdded(false), 1600);
  };

  return (
    <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur border-t border-border px-4 py-2.5 flex items-center gap-3">
      <div className="flex flex-col leading-none">
        <span className="text-lg font-bold">{formatPrice(price)}</span>
        {inStock ? (
          <span className="text-[11px] text-success font-medium">В наличии</span>
        ) : (
          <span className="text-[11px] text-muted-foreground">Под заказ</span>
        )}
      </div>
      <button
        onClick={handleAdd}
        className={`ml-auto h-11 px-6 rounded-xl font-medium inline-flex items-center gap-2 transition-colors ${
          added ? "bg-success text-white" : "bg-accent text-accent-foreground hover:bg-accent-hover"
        }`}
      >
        {added ? <Check size={18} /> : <ShoppingCart size={18} />}
        {added ? "Добавлено" : "В корзину"}
      </button>
    </div>
  );
}
