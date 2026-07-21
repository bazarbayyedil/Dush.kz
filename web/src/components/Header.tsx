"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Menu, Heart, ShoppingCart, X, MapPin, MessageCircle, Phone } from "lucide-react";
import { useCart, useFavorites, useHydrated } from "@/lib/cart";
import { ymGoal } from "@/lib/metrika";
import { WHATSAPP_URL, PHONE_DISPLAY } from "@/lib/contacts";
import { useT } from "@/lib/i18n";
import { LangSwitch } from "./LangSwitch";
import { SearchBar } from "./SearchBar";
import { MegaMenu } from "./MegaMenu";
import { MobileCatalog } from "./MobileCatalog";

export function Header() {
  const cartCount = useCart((s) => s.count());
  const openCart = useCart((s) => s.open);
  const favCount = useFavorites((s) => s.count());
  const hydrated = useHydrated();
  const t = useT();

  const [catOpen, setCatOpen] = useState(false);
  const [mobileCat, setMobileCat] = useState(false);

  // Каталог открывается по клику, а не по наведению: иначе меню перехватывает
  // курсор при обычном движении по шапке. Закрываем кликом вне и по Escape.
  const catRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!catOpen) return;
    const onDown = (e: MouseEvent) => {
      if (!catRef.current?.contains(e.target as Node)) setCatOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setCatOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [catOpen]);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-border [--header-h:64px]">
      <div className="relative">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center gap-3 md:gap-5">
          {/* Бургер (mobile) */}
          <button
            onClick={() => setMobileCat(true)}
            className="md:hidden p-2 -ml-2 rounded-lg hover:bg-muted"
            aria-label={t("nav.catalog")}
          >
            <Menu size={22} />
          </button>

          <Link href="/" className="shrink-0" aria-label="dush.kz — на главную">
            <img src="/logo-teal.svg" alt="dush.kz — сантехника" className="h-9 md:h-10 w-auto" />
          </Link>

          {/* Кнопка Каталог (desktop) */}
          <div ref={catRef} className="hidden md:block">
            <button
              onClick={() => setCatOpen((v) => !v)}
              className={`flex items-center gap-2 px-4 h-10 rounded-xl font-medium text-sm transition-colors ${
                catOpen ? "bg-accent text-accent-foreground" : "bg-surface hover:bg-muted text-foreground"
              }`}
            >
              {catOpen ? <X size={18} /> : <Menu size={18} />}
              {t("nav.catalog")}
            </button>
            <MegaMenu open={catOpen} onClose={() => setCatOpen(false)} />
          </div>

          <SearchBar className="hidden md:block flex-1 max-w-2xl" />

          <div className="flex-1 md:flex-none" />

          {/* Кружок с иконкой прячем до xl: на 1024 он выдавливал корзину за край */}
          <div className="hidden lg:flex items-center gap-2 xl:gap-2.5 shrink-0">
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener"
              onClick={() => ymGoal("call")}
              aria-label={PHONE_DISPLAY}
              className="hidden xl:flex w-9 h-9 rounded-full bg-brand/10 text-brand items-center justify-center shrink-0 transition-colors hover:bg-brand hover:text-white"
            >
              <Phone size={16} strokeWidth={2.2} />
            </a>
            <div className="flex flex-col leading-tight">
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener"
                onClick={() => ymGoal("call")}
                className="text-[15px] font-semibold tracking-tight tabular-nums hover:text-accent transition-colors"
              >
                {PHONE_DISPLAY}
              </a>
              <a
                href="https://2gis.kz/astana/firm/70000001018116894?m=71.46823%2C51.164252%2F16"
                target="_blank"
                rel="noopener"
                className="text-[11px] text-muted-foreground hover:text-accent transition-colors inline-flex items-center gap-1 mt-0.5"
              >
                <MapPin size={11} className="shrink-0" />
                Абая 94 · до 19:00
              </a>
            </div>
          </div>

          {/* WhatsApp (mobile) */}
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener"
            onClick={() => ymGoal("call")}
            className="md:hidden p-2 rounded-lg hover:bg-muted"
            aria-label={t("nav.whatsapp")}
          >
            <MessageCircle size={22} />
          </a>

          <LangSwitch className="shrink-0" />

          {/* Избранное */}
          <Link
            href="/favorites"
            className="relative p-2 rounded-lg hover:bg-muted shrink-0"
            aria-label={t("nav.favorites")}
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
            aria-label={t("nav.cart")}
          >
            <ShoppingCart size={20} />
            <span className="hidden sm:inline text-sm font-medium">{t("nav.cart")}</span>
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
            <MapPin size={13} /> {t("nav.city")}
          </a>
          <SearchBar className="flex-1" />
        </div>
      </div>

      <MobileCatalog open={mobileCat} onClose={() => setMobileCat(false)} />
    </header>
  );
}
