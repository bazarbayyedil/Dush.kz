"use client";
import Link from "next/link";
import { useEffect, useMemo, useState, useCallback } from "react";
import { ChevronLeft, ChevronRight, ArrowRight, PackageCheck } from "lucide-react";
import type { CatalogItem } from "@/lib/catalog";
import { formatPrice, discountPercent, effectiveOldPrice } from "@/lib/format";
import { productImageUrl } from "@/lib/media";
import { useT } from "@/lib/i18n";

const SHOW = 10; // комплектов ровно столько — крутим все

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

  // Комплекты закреплены в начале и не участвуют в ротации — промо всегда
  // первый слайд. Крутим только обычные товары.
  const shown = useMemo(() => {
    const pinned = items.filter((p) => p.is_combo);
    const rest = items.filter((p) => !p.is_combo);
    const rotate = Math.max(SHOW - pinned.length, 0);
    return [...pinned, ...(day === null ? rest.slice(0, rotate) : pickForDay(rest, rotate, day))];
  }, [items, day]);
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
  const sOld = effectiveOldPrice(s.slug, s.price, s.old_price);
  const discount = discountPercent(s.price, sOld);
  const saved = sOld && s.price ? sOld - s.price : 0;

  return (
    <div
      className="relative overflow-hidden rounded-2xl md:rounded-3xl border border-border bg-gradient-to-br from-surface to-white"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 min-h-[260px] md:min-h-[330px]">
        {/* Текст + цена. pb — место под ряд управления внизу. */}
        <div className="flex flex-col justify-center order-2 md:order-1 p-5 md:p-8 pb-14 md:pb-16">
          <div className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-accent mb-3">
            {s.is_combo ? (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-sale text-sale-foreground font-semibold tracking-normal">
                <PackageCheck size={13} strokeWidth={2.4} />
                {t("hero.combo")} −{discount}%
              </span>
            ) : (
              discount > 0 && (
                <span className="px-2 py-0.5 rounded-md bg-sale text-sale-foreground font-semibold tracking-normal">
                  {t("hero.sale")} −{discount}%
                </span>
              )
            )}
            <span>{s.brand}</span>
          </div>
          {/* Ровно 2 строки под заголовок при любой длине — иначе высота слайда
              скачет и страница дёргается при перелистывании. */}
          <h2 className="text-lg md:text-2xl font-bold leading-tight max-w-md line-clamp-2 h-[2.9rem] md:h-[3.9rem] overflow-hidden">
            {s.title}
          </h2>

          <div className="mt-3 flex items-end gap-3">
            <span className="text-2xl md:text-[32px] font-bold text-accent leading-none">{formatPrice(s.price)}</span>
            {sOld && sOld > (s.price ?? 0) && (
              <span className="text-sm md:text-base text-muted-foreground line-through">
                {formatPrice(sOld)}
              </span>
            )}
          </div>

          {/* Слот выгоды резервируем всегда — со скидкой пилюля, без неё пусто,
              высота слайда остаётся одинаковой. */}
          <div className="mt-2 min-h-[28px]">
            {saved > 0 && (
              <div className="inline-flex items-center gap-1.5 w-fit px-2.5 py-1 rounded-lg bg-sale/10 text-sale text-[13px] font-semibold">
                <PackageCheck size={14} strokeWidth={2.4} />
                {t("hero.saving")} {formatPrice(saved)}
              </div>
            )}
          </div>

          <Link
            href={`/product/${s.slug}`}
            className="mt-5 inline-flex items-center gap-2 px-5 h-10 bg-accent text-accent-foreground rounded-xl font-medium hover:bg-accent-hover transition-colors w-fit"
          >
            {t("hero.cta")} <ArrowRight size={18} />
          </Link>
        </div>

        {/* Фото товара — высота ограничена, чтобы все слайды были одного размера */}
        <Link
          href={`/product/${s.slug}`}
          className="order-1 md:order-2 flex items-center justify-center p-4 md:p-6"
        >
          {s.image && (
            <img
              src={productImageUrl(s.image)}
              alt={s.title}
              className="h-40 md:h-[250px] w-auto max-w-full object-contain mix-blend-multiply"
              onError={(event) => event.currentTarget.remove()}
            />
          )}
        </Link>
      </div>

      {/* Управление в нижнем углу: по бокам стрелки перекрывали заголовок,
          слайдер стал у́же после появления промо-блока рядом. */}
      {n > 1 && (
        <div className="absolute bottom-3 md:bottom-4 inset-x-4 flex items-center gap-3">
          <div className="flex gap-2">
            {shown.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setI(idx)}
                aria-label={`Слайд ${idx + 1}`}
                className={`h-2 rounded-full transition-all ${idx === i ? "w-6 bg-accent" : "w-2 bg-foreground/25 hover:bg-foreground/40"}`}
              />
            ))}
          </div>
          <div className="ml-auto flex gap-2">
            <button
              onClick={() => go(-1)}
              className="w-9 h-9 rounded-full bg-white/85 hover:bg-white border border-border flex items-center justify-center backdrop-blur transition-colors"
              aria-label="Назад"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={() => go(1)}
              className="w-9 h-9 rounded-full bg-white/85 hover:bg-white border border-border flex items-center justify-center backdrop-blur transition-colors"
              aria-label="Вперёд"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
