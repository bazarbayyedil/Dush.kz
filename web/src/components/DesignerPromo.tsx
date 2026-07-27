"use client";
import Link from "next/link";
import { ArrowRight, BadgePercent, Boxes, Headset, Truck, UserRound } from "lucide-react";
import { useT } from "@/lib/i18n";
import { productImageUrl } from "@/lib/media";

const PHOTOS = [
  "/products/dusevaa-sistema-grohe-euphoria-260-so-smesitelem-hrom-27473001/5.jpg",
  "/products/vanna-otdel-nostoasaa-akrilovaa-rein-9211-1700-750-580-mm/1.jpg",
  "/products/dusevaa-sistema-grohe-euphoria-smartcontrol-310-duo-s-termostatom-hrom-26507000/6.jpg",
  "/products/vanna-otdel-nostoasaa-icon-170-75-1marka/1.jpg",
];

/** Промо партнёрки для дизайнеров на главной. */
export function DesignerPromo() {
  const t = useT();
  const perks = [
    { icon: UserRound, text: t("promo.designers_p1") },
    { icon: Boxes, text: t("promo.designers_p2") },
    { icon: Truck, text: t("promo.designers_p3") },
    { icon: Headset, text: t("promo.designers_p4") },
  ];

  return (
    <section className="max-w-7xl mx-auto px-4 pt-8">
      <div className="rounded-3xl bg-[#0a2a33] text-white overflow-hidden">
        <div className="grid lg:grid-cols-2 items-center">
          <div className="px-6 py-8 md:px-10 md:py-10">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 text-[13px] text-white/85">
              <BadgePercent size={15} />
              {t("promo.designers_badge")}
            </div>
            <h2 className="mt-4 text-2xl md:text-3xl font-bold leading-tight">
              {t("promo.designers_title")}
            </h2>
            <p className="mt-3 text-[15px] text-white/75 leading-relaxed max-w-md">
              {t("promo.designers_sub")}
            </p>
            <ul className="mt-5 space-y-2.5">
              {perks.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-2.5 text-sm text-white/85">
                  <Icon size={17} className="text-[#7fd1e0] shrink-0" />
                  {text}
                </li>
              ))}
            </ul>
            <Link
              href="/designers"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white text-[#0a2a33] px-5 py-3 text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              {t("promo.designers_cta")}
              <ArrowRight size={16} />
            </Link>
          </div>
          <div className="hidden lg:grid grid-cols-2 gap-2 p-2 h-full">
            {PHOTOS.map((p) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={p}
                src={productImageUrl(p)}
                alt=""
                loading="lazy"
                className="w-full h-44 xl:h-52 object-cover rounded-2xl bg-white"
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
