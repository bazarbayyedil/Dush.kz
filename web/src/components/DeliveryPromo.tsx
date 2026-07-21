"use client";
import Link from "next/link";
import { Truck, ArrowRight, CalendarDays } from "lucide-react";
import { useT } from "@/lib/i18n";

/** Промо рядом с героем: бесплатная доставка по Астане. */
export function DeliveryPromo() {
  const t = useT();
  return (
    <Link
      href="/delivery"
      className="group relative flex flex-col justify-end overflow-hidden rounded-2xl md:rounded-3xl border border-border min-h-[220px] lg:min-h-full"
    >
      {/* Фирменная сцена на весь фон. Текст держим в разметке:
          на картинке он не переводился бы на казахский и мельчал на телефоне. */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0A5E5C] to-[#0E7C74]" />
      <img
        src="/promo/delivery-bg.svg"
        alt=""
        aria-hidden
        className="absolute inset-0 w-full h-full object-cover object-[85%_75%] transition-transform duration-700 group-hover:scale-105"
      />
      {/* Затемнение слева-снизу, чтобы белый текст читался поверх сцены. */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#03323b]/92 via-[#03323b]/45 to-[#03323b]/10" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#03323b]/70 to-transparent" />

      <div className="relative p-5 md:p-6 text-white">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/15 backdrop-blur text-[11px] font-semibold uppercase tracking-wider ring-1 ring-white/25">
            <Truck size={13} strokeWidth={2.2} />
            {t("promo.delivery_badge")}
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/15 backdrop-blur text-[11px] font-semibold uppercase tracking-wider ring-1 ring-white/25">
            <CalendarDays size={13} strokeWidth={2.2} />
            {t("promo.delivery_days")}
          </span>
        </div>
        <h3 className="mt-3 text-2xl md:text-[26px] font-bold leading-[1.15]">
          {t("promo.delivery_title")}
        </h3>
        <p className="mt-1.5 text-sm text-white/80 leading-snug max-w-[26ch]">
          {t("promo.delivery_text")}
        </p>
        <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-white/90 group-hover:text-white">
          {t("promo.delivery_cta")}
          <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  );
}
