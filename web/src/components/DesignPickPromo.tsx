"use client";
import { ArrowRight } from "lucide-react";
import { useT } from "@/lib/i18n";
import { productImageUrl } from "@/lib/media";
import { WHATSAPP_NUMBER } from "@/lib/contacts";

const PHOTO = "/products/vanna-akrilovaa-otdel-nostoasaa-harmony-t-1700-black/1.jpg";

const WA = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
  "Здравствуйте! Хочу подбор сантехники под мой дизайн-проект",
)}`;

/** Клиентский промо-баннер «подберём сантехнику под ваш дизайн». */
export function DesignPickPromo() {
  const t = useT();
  return (
    <section className="max-w-7xl mx-auto px-4 pt-8">
      <div className="rounded-3xl bg-gradient-to-r from-neutral-100 to-neutral-200 overflow-hidden">
        <div className="grid lg:grid-cols-2 items-center">
          <div className="px-6 py-8 md:px-10 md:py-12">
            <div className="flex flex-wrap gap-2">
              <span className="rounded-lg bg-brand text-white px-3.5 py-1.5 text-[13px] font-medium">
                {t("promo.pick_free")}
              </span>
              <span className="rounded-lg bg-brand text-white px-3.5 py-1.5 text-[13px] font-medium">
                {t("promo.pick_budget")}
              </span>
            </div>
            <h2 className="mt-4 text-2xl md:text-3xl font-bold leading-tight text-neutral-900">
              {t("promo.pick_title")}
            </h2>
            <p className="mt-3 text-[15px] text-neutral-600 leading-relaxed max-w-md">
              {t("promo.pick_sub")}
            </p>
            <a
              href={WA}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-accent text-accent-foreground px-6 py-3.5 text-sm font-semibold hover:bg-accent-hover transition-colors"
            >
              {t("promo.pick_cta")}
              <ArrowRight size={16} />
            </a>
          </div>
          <div className="hidden lg:block h-full min-h-[300px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={productImageUrl(PHOTO)}
              alt="Чёрная отдельностоящая ванна из каталога dush.kz"
              loading="lazy"
              className="w-full h-full object-contain p-6"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
