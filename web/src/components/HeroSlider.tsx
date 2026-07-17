"use client";
import Link from "next/link";
import { useEffect, useMemo, useState, useCallback } from "react";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import type { CatalogItem } from "@/lib/catalog";
import { formatPrice, discountPercent } from "@/lib/format";
import { productImageUrl } from "@/lib/media";
import { useT } from "@/lib/i18n";

const SHOW = 6; // сколько слайдов показываем в день

// Детерминированный ГПСЧ по одному 32-битному seed (mulberry32).
function rngFrom(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Стабильная в течение суток выборка `count` товаров из пула: seed = номер дня,
// поэтому подборка одинакова весь день и меняется на следующий.
function pickForDay(pool: CatalogItem[], count: number, day: number): CatalogItem[] {
  const idx = pool.map((_, k) => k);
  const rnd = rngFrom(day * 2654435761);
  for (let k = idx.length - 1; k > 0; k--) {
    const j = Math.floor(rnd() * (k + 1));
    [idx[k], idx[j]] = [idx[j], idx[k]];
  }
  return idx.slice(0, count).map((k) => pool[k]);
}

export function HeroSlider({ items }: { items: CatalogItem[] }) {
  const t = useT();
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);

  // day === null до маунта → показываем стабильный дефолт (первые SHOW = 6 GROHE),
  // чтобы SSR и первая клиентская отрисовка совпадали. После маунта берём выборку
  // по локальному дню (Астана, UTC+5) — так подборка сменяется без пересборки сайта.
  const [day, setDay] = useState<number | null>(null);
  useEffect(() => {
    setDay(Math.floor((Date.now() + 5 * 3600_000) / 86400_000));
  }, []);

  const shown = useMemo(
    () => (day === null ? items.slice(0, SHOW) : pickForDay(items, SHOW, day)),
    [items, day],
  );
  useEffect(() => setI(0), [day]);

  const n = shown.length;

  const go = useCallback((d: number) => setI((c) => (c + d + n) % n), [n]);

  // Предзагрузка всех фото — чтобы смена слайда была мгновенной, без
  // рассинхрона «новый текст / ещё старое фото» при авто-перелистывании.
  useEffect(() => {
    shown.forEach((it) => {
      if (it.image) {
        const im = new window.Image();
        im.src = productImageUrl(it.image);
      }
    });
  }, [shown]);

  useEffect(() => {
    if (paused || n <= 1) return;
    const t = setInterval(() => setI((c) => (c + 1) % n), 5500);
    return () => clearInterval(t);
  }, [paused, n]);

  if (n === 0) return null;
  const s = shown[Math.min(i, n - 1)];
  const discount = discountPercent(s.price, s.old_price);

  return (
    <div
      className="relative overflow-hidden rounded-2xl md:rounded-3xl border border-border bg-gradient-to-br from-surface to-white"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 min-h-[300px] md:min-h-[380px]">
        {/* Текст + цена */}
        <div className="flex flex-col justify-center order-2 md:order-1 p-6 md:p-12">
          <div className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-accent mb-3">
            {discount > 0 && (
              <span className="px-2 py-0.5 rounded-md bg-sale text-sale-foreground font-semibold tracking-normal">
                {t("hero.sale")} −{discount}%
              </span>
            )}
            <span>{s.brand}</span>
          </div>
          <h2 className="text-xl md:text-3xl font-bold leading-tight max-w-md line-clamp-3">{s.title}</h2>

          <div className="mt-4 flex items-end gap-3">
            <span className="text-3xl md:text-4xl font-bold text-accent">{formatPrice(s.price)}</span>
            {s.old_price && s.old_price > (s.price ?? 0) && (
              <span className="mb-1 text-base md:text-lg text-muted-foreground line-through">
                {formatPrice(s.old_price)}
              </span>
            )}
          </div>

          <Link
            href={`/product/${s.slug}`}
            className="mt-6 inline-flex items-center gap-2 px-6 h-11 bg-accent text-accent-foreground rounded-xl font-medium hover:bg-accent-hover transition-colors w-fit"
          >
            {t("hero.cta")} <ArrowRight size={18} />
          </Link>
        </div>

        {/* Фото товара — высота ограничена, чтобы все слайды были одного размера */}
        <Link
          href={`/product/${s.slug}`}
          className="order-1 md:order-2 flex items-center justify-center p-4 md:p-8"
        >
          {s.image && (
            <img
              src={productImageUrl(s.image)}
              alt={s.title}
              className="h-44 md:h-[300px] w-auto max-w-full object-contain"
              onError={(event) => event.currentTarget.remove()}
            />
          )}
        </Link>
      </div>

      {n > 1 && (
        <>
          <button
            onClick={() => go(-1)}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 hover:bg-white border border-border flex items-center justify-center backdrop-blur transition-colors"
            aria-label="Назад"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={() => go(1)}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 hover:bg-white border border-border flex items-center justify-center backdrop-blur transition-colors"
            aria-label="Вперёд"
          >
            <ChevronRight size={20} />
          </button>

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {shown.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setI(idx)}
                aria-label={`Слайд ${idx + 1}`}
                className={`h-2 rounded-full transition-all ${idx === i ? "w-6 bg-accent" : "w-2 bg-foreground/25"}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
