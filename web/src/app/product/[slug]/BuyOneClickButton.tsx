"use client";
import { useOrder } from "@/lib/cart";

export function BuyOneClickButton({ slug, title, price }: { slug: string; title: string; price: number }) {
  const openOrder = useOrder((s) => s.open);
  return (
    <button
      onClick={() => openOrder([{ slug, title, price, qty: 1 }], false)}
      className="px-5 py-3 border border-border rounded-lg font-medium hover:bg-muted"
    >
      Купить в 1 клик
    </button>
  );
}
