"use client";
import { Minus, Plus } from "lucide-react";
import { useCart } from "@/lib/cart";
import { useT } from "@/lib/i18n";

/**
 * Шаг количества для товара, уже лежащего в корзине. Показывается вместо
 * кнопки «В корзину», чтобы покупатель видел: этот товар он уже добавил.
 * Минус на единице удаляет позицию и возвращает обычную кнопку.
 */
export function CartQty({
  slug,
  className = "",
  onOpenCart,
}: {
  slug: string;
  className?: string;
  onOpenCart?: () => void;
}) {
  const qty = useCart((s) => s.items.find((i) => i.slug === slug)?.qty ?? 0);
  const setQty = useCart((s) => s.setQty);
  const openCart = useCart((s) => s.open);
  const t = useT();

  if (qty === 0) return null;

  const step = (d: number) => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setQty(slug, qty + d);
  };

  return (
    <div
      className={`flex items-center rounded-xl border border-accent bg-accent/10 text-accent overflow-hidden ${className}`}
    >
      <button
        onClick={step(-1)}
        className="w-11 h-full flex items-center justify-center hover:bg-accent/20 transition-colors"
        aria-label={qty === 1 ? t("cart.remove") : t("cart.less")}
        title={qty === 1 ? t("cart.remove") : t("cart.less")}
      >
        <Minus size={16} />
      </button>
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          (onOpenCart ?? openCart)();
        }}
        className="flex-1 h-full text-sm font-medium truncate px-1 hover:bg-accent/20 transition-colors"
        title={t("cart.open")}
      >
        {t("card.added")} · {qty}
      </button>
      <button
        onClick={step(1)}
        className="w-11 h-full flex items-center justify-center hover:bg-accent/20 transition-colors"
        aria-label={t("cart.more")}
        title={t("cart.more")}
      >
        <Plus size={16} />
      </button>
    </div>
  );
}
