"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useEffect, useState } from "react";

export type CartItem = {
  slug: string;
  sku: string;
  title: string;
  price: number;
  image: string;
  qty: number;
};

type CartState = {
  items: CartItem[];
  isOpen: boolean;
  add: (item: Omit<CartItem, "qty">, qty?: number) => void;
  remove: (slug: string) => void;
  setQty: (slug: string, qty: number) => void;
  clear: () => void;
  open: () => void;
  close: () => void;
  toggle: () => void;
  total: () => number;
  count: () => number;
};

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      add: (item, qty = 1) => {
        set((s) => {
          const existing = s.items.find((i) => i.slug === item.slug);
          if (existing) {
            return {
              items: s.items.map((i) => (i.slug === item.slug ? { ...i, qty: i.qty + qty } : i)),
              isOpen: true,
            };
          }
          return { items: [...s.items, { ...item, qty }], isOpen: true };
        });
      },
      remove: (slug) =>
        set((s) => ({ items: s.items.filter((i) => i.slug !== slug) })),
      setQty: (slug, qty) =>
        set((s) => ({
          items: s.items
            .map((i) => (i.slug === slug ? { ...i, qty: Math.max(1, qty) } : i))
            .filter((i) => i.qty > 0),
        })),
      clear: () => set({ items: [] }),
      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
      toggle: () => set((s) => ({ isOpen: !s.isOpen })),
      total: () => get().items.reduce((s, i) => s + i.price * i.qty, 0),
      count: () => get().items.reduce((s, i) => s + i.qty, 0),
    }),
    {
      name: "dush-cart",
      // isOpen не сохраняем — иначе корзина открывалась бы сама после перезагрузки
      partialize: (s) => ({ items: s.items }),
    },
  ),
);

/**
 * true только после монтирования на клиенте. Нужно, чтобы части UI,
 * зависящие от localStorage (счётчик корзины), не рендерились на сервере
 * и не вызывали hydration mismatch.
 */
export function useHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return hydrated;
}

// Избранное — храним slug'и, persist в localStorage
type FavState = {
  slugs: string[];
  toggle: (slug: string) => void;
  has: (slug: string) => boolean;
  count: () => number;
};

export const useFavorites = create<FavState>()(
  persist(
    (set, get) => ({
      slugs: [],
      toggle: (slug) =>
        set((s) => ({
          slugs: s.slugs.includes(slug) ? s.slugs.filter((x) => x !== slug) : [...s.slugs, slug],
        })),
      has: (slug) => get().slugs.includes(slug),
      count: () => get().slugs.length,
    }),
    { name: "dush-favorites" },
  ),
);

// Модалка оформления заказа. items = позиции заказа (вся корзина или один товар).
export type OrderItem = { slug: string; title: string; price: number; qty: number };

type OrderState = {
  isOpen: boolean;
  items: OrderItem[];
  fromCart: boolean; // если true — после отправки чистим корзину
  open: (items: OrderItem[], fromCart?: boolean) => void;
  close: () => void;
};

export const useOrder = create<OrderState>((set) => ({
  isOpen: false,
  items: [],
  fromCart: false,
  open: (items, fromCart = false) => set({ isOpen: true, items, fromCart }),
  close: () => set({ isOpen: false }),
}));
