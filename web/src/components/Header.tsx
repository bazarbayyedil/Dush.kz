"use client";
import Link from "next/link";
import { useState } from "react";
import { Menu, Heart, ShoppingCart, X, MapPin, Phone } from "lucide-react";
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

          <div className="hidden lg:flex flex-col items-end leading-tight shrink-0">
            <a href="tel:+77022525438" className="text-sm font-medium hover:text-accent">
              +7 702 252 54 38
            </a>
            <a
              href="https://2gis.kz/astana/firm/70000001018116894?m=71.46823%2C51.164252%2F16"
              target="_blank"
              rel="noopener"
              className="text-xs text-muted-foreground hover:text-accent inline-flex items-center gap-1"
            >
              <MapPin size={12} /> Абая 94, Астана
            </a>
          </div>

          {/* Звонок (mobile) */}
          <a
            href="tel:+77022525438"
            className="md:hidden p-2 rounded-lg hover:bg-muted"
            aria-label="Позвонить"
          >
            <Phone size={22} />
          </a>

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

        {/* Город + строка поиска на мобильных (всегда видна) */}
        <div className="md:hidden px-4 pb-2.5 flex items-center gap-2">
          <a
            href="https://2gis.kz/astana/firm/70000001018116894?m=71.46823%2C51.164252%2F16"
            target="_blank"
            rel="noopener"
            className="shrink-0 inline-flex items-center gap-1 text-xs text-muted-foreground"
          >
            <MapPin size={13} /> Астана
          </a>
          <SearchBar className="flex-1" />
        </div>
      </div>

      <MobileCatalog open={mobileCat} onClose={() => setMobileCat(false)} />
    </header>
  );
}
