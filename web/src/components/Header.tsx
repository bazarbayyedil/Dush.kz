"use client";
import Link from "next/link";
import { useState } from "react";
import { Menu, Search, Heart, ShoppingCart, X } from "lucide-react";
import { useCart, useFavorites, useHydrated } from "@/lib/cart";
import { SearchBar } from "./SearchBar";
import { MegaMenu } from "./MegaMenu";
import { MobileCatalog } from "./MobileCatalog";

export function Header() {
  const cartCount = useCart((s) => s.count());
  const openCart = useCart((s) => s.open);
  const favCount = useFavorites((s) => s.count());
  const hydrated = useHydrated();

  const [catOpen, setCatOpen] = useState(false);
  const [mobileCat, setMobileCat] = useState(false);
  const [mobileSearch, setMobileSearch] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-border [--header-h:64px]">
      <div className="relative">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center gap-3 md:gap-5">
          {/* Бургер (mobile) */}
          <button
            onClick={() => setMobileCat(true)}
            className="md:hidden p-2 -ml-2 rounded-lg hover:bg-muted"
            aria-label="Каталог"
          >
            <Menu size={22} />
          </button>

          <Link href="/" className="shrink-0" aria-label="dush.kz — на главную">
            <img src="/logo-teal.svg" alt="dush.kz — сантехника" className="h-9 md:h-10 w-auto" />
          </Link>

          {/* Кнопка Каталог (desktop) */}
          <div
            className="hidden md:block"
            onMouseEnter={() => setCatOpen(true)}
            onMouseLeave={() => setCatOpen(false)}
          >
            <button
              onClick={() => setCatOpen((v) => !v)}
              className={`flex items-center gap-2 px-4 h-10 rounded-xl font-medium text-sm transition-colors ${
                catOpen ? "bg-accent text-accent-foreground" : "bg-surface hover:bg-muted text-foreground"
              }`}
            >
              {catOpen ? <X size={18} /> : <Menu size={18} />}
              Каталог
            </button>
            <MegaMenu open={catOpen} onClose={() => setCatOpen(false)} />
          </div>

          <SearchBar className="hidden md:block flex-1 max-w-2xl" />

          <div className="flex-1 md:flex-none" />

          <a
            href="tel:+77022525438"
            className="hidden xl:block text-sm text-muted-foreground hover:text-foreground shrink-0"
          >
            +7 702 252 54 38
          </a>

          {/* Поиск (mobile toggle) */}
          <button
            onClick={() => setMobileSearch((v) => !v)}
            className="md:hidden p-2 rounded-lg hover:bg-muted"
            aria-label="Поиск"
          >
            <Search size={22} />
          </button>

          {/* Избранное */}
          <Link
            href="/favorites"
            className="relative p-2 rounded-lg hover:bg-muted shrink-0"
            aria-label="Избранное"
          >
            <Heart size={22} />
            {hydrated && favCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-sale text-sale-foreground text-[10px] min-w-4 h-4 px-1 rounded-full flex items-center justify-center font-medium">
                {favCount}
              </span>
            )}
          </Link>

          {/* Корзина */}
          <button
            onClick={openCart}
            className="relative flex items-center gap-2 px-2.5 md:px-3 h-10 rounded-xl bg-accent text-accent-foreground hover:bg-accent-hover transition-colors shrink-0"
            aria-label="Корзина"
          >
            <ShoppingCart size={20} />
            <span className="hidden sm:inline text-sm font-medium">Корзина</span>
            {hydrated && cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-sale text-sale-foreground text-[10px] min-w-5 h-5 px-1 rounded-full flex items-center justify-center font-medium">
                {cartCount}
              </span>
            )}
          </button>
        </div>

        {/* Строка поиска на мобильных */}
        {mobileSearch && (
          <div className="md:hidden px-4 pb-3">
            <SearchBar />
          </div>
        )}
      </div>

      <MobileCatalog open={mobileCat} onClose={() => setMobileCat(false)} />
    </header>
  );
}
