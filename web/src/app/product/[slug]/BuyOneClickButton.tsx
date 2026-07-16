"use client";
import { useOrder } from "@/lib/cart";
import { useT } from "@/lib/i18n";

export function BuyOneClickButton({ slug, title, price }: { slug: string; title: string; price: number }) {
  const openOrder = useOrder((s) => s.open);
  const t = useT();
  return (
    <button
      onClick={() => openOrder([{ slug, title, price, qty: 1 }], false)}
      className="px-5 py-3 border border-border rounded-lg font-medium hover:bg-muted"
    >
      {t("order.one_click")}
    </button>
  );
}
