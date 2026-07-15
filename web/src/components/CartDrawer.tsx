"use client";
import { useCart, useOrder } from "@/lib/cart";
import { formatPrice } from "@/lib/format";
import Link from "next/link";
import { useEffect } from "react";
import { productImageUrl } from "@/lib/media";

export function CartDrawer() {
  const { items, isOpen, close, remove, setQty } = useCart();
  const total = useCart((s) => s.total());
  const openOrder = useOrder((s) => s.open);

  const checkout = () => {
    close();
    openOrder(
      items.map((i) => ({ slug: i.slug, title: i.title, price: i.price, qty: i.qty })),
      true,
    );
  };

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={close}
        aria-hidden
      />
      <aside className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col">
        <header className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-lg font-semibold">Корзина</h2>
          <button
            onClick={close}
            className="p-2 rounded-lg hover:bg-muted"
            aria-label="Закрыть"
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </header>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-8 gap-3">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
              <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.5l2.7 12.6a2.25 2.25 0 002.2 1.8h8.7a2.25 2.25 0 002.2-1.8L21 6.75H6" />
              </svg>
            </div>
            <p className="text-muted-foreground">Корзина пуста</p>
            <Link
              href="/catalog"
              onClick={close}
              className="mt-2 px-4 py-2 bg-accent text-accent-foreground rounded-lg text-sm hover:bg-accent-hover"
            >
              Перейти в каталог
            </Link>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-5 py-3 space-y-3">
              {items.map((item) => (
                <div key={item.slug} className="flex gap-3 p-3 rounded-lg border border-border">
                  <div className="w-20 h-20 shrink-0 bg-muted rounded overflow-hidden">
                    {item.image && (
                      <img
                        src={productImageUrl(item.image)}
                        alt={item.title}
                        className="w-full h-full object-contain"
                        onError={(event) => event.currentTarget.remove()}
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/product/${item.slug}`}
                      onClick={close}
                      className="text-sm font-medium line-clamp-2 hover:text-accent"
                    >
                      {item.title}
                    </Link>
                    <div className="text-xs text-muted-foreground mt-1">
                      {formatPrice(item.price)} × {item.qty}
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex items-center border border-border rounded">
                        <button
                          onClick={() => setQty(item.slug, item.qty - 1)}
                          className="w-7 h-7 hover:bg-muted"
                          aria-label="Уменьшить"
                        >−</button>
                        <span className="w-8 text-center text-sm">{item.qty}</span>
                        <button
                          onClick={() => setQty(item.slug, item.qty + 1)}
                          className="w-7 h-7 hover:bg-muted"
                          aria-label="Увеличить"
                        >+</button>
                      </div>
                      <span className="text-sm font-semibold ml-auto">
                        {formatPrice(item.price * item.qty)}
                      </span>
                      <button
                        onClick={() => remove(item.slug)}
                        className="text-muted-foreground hover:text-danger"
                        aria-label="Удалить"
                        title="Удалить"
                      >
                        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 7h12M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2m-7 0v12a1 1 0 001 1h6a1 1 0 001-1V7" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <footer className="border-t border-border p-5 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Итого</span>
                <span className="text-lg font-semibold">{formatPrice(total)}</span>
              </div>
              <button
                onClick={checkout}
                className="w-full bg-accent text-accent-foreground py-3 rounded-lg font-medium hover:bg-accent-hover transition-colors"
              >
                Оформить заказ
              </button>
              <p className="text-xs text-muted-foreground text-center">
                Оплата и доставка обсуждаются с менеджером после оформления
              </p>
            </footer>
          </>
        )}
      </aside>
    </div>
  );
}
