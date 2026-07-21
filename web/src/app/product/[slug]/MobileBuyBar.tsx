"use client";
import { ArrowRight, ShoppingCart } from "lucide-react";
import { useCart, useOrder, useHydrated } from "@/lib/cart";
import { formatPrice } from "@/lib/format";
import { useT } from "@/lib/i18n";
import { CartQty } from "@/components/CartQty";

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
  const cartItems = useCart((s) => s.items);
  const openOrder = useOrder((s) => s.open);
  const inCart = useCart((s) => s.items.some((i) => i.slug === slug));
  const hydrated = useHydrated();
  const t = useT();

  const handleAdd = () => add({ slug, sku, title, price: price ?? 0, image });
  const checkout = () =>
    openOrder(
      cartItems.map((i) => ({ slug: i.slug, title: i.title, price: i.price, qty: i.qty })),
      true,
    );

  return (
    <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur border-t border-border px-4 py-2.5 flex items-center gap-2.5">
      <div className="flex flex-col leading-none shrink-0">
        <span className="text-lg font-bold">{formatPrice(price)}</span>
        {inStock ? (
          <span className="text-[11px] text-success font-medium">{t("card.in_stock")}</span>
        ) : (
          <span className="text-[11px] text-muted-foreground">{t("card.on_order")}</span>
        )}
      </div>
      {hydrated && inCart ? (
        <>
          <CartQty slug={slug} className="ml-auto h-11 w-28 shrink-0" />
          <button
            onClick={checkout}
            className="h-11 px-4 rounded-xl font-semibold inline-flex items-center gap-1.5 transition-colors bg-sale text-sale-foreground hover:bg-sale-hover"
          >
            {t("prod.checkout")}
            <ArrowRight size={16} />
          </button>
        </>
      ) : (
        <button
          onClick={handleAdd}
          className="ml-auto h-11 px-6 rounded-xl font-medium inline-flex items-center gap-2 transition-colors bg-accent text-accent-foreground hover:bg-accent-hover"
        >
          <ShoppingCart size={18} />
          {t("prod.buy")}
        </button>
      )}
    </div>
  );
}
