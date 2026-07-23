"use client";
import { Truck, ShieldCheck, BadgeCheck } from "lucide-react";
import type { CatalogItem } from "@/lib/catalog-core";
import { useT } from "@/lib/i18n";
import { HeroSlider } from "@/components/HeroSlider";
import { DeliveryPromo } from "@/components/DeliveryPromo";
import { CategoryChips } from "@/components/CategoryChips";
import { CategoryTiles } from "@/components/CategoryTiles";
import { ProductCarousel } from "@/components/ProductCarousel";
import { BrandStrip } from "@/components/BrandStrip";

export type HomeData = {
  heroPool: CatalogItem[];
  topPicks: CatalogItem[];
  installations: CatalogItem[];
  premiumBaths: CatalogItem[];
  topFaucets: CatalogItem[];
  bestDeals: CatalogItem[];
};

export function HomeClient({ data }: { data: HomeData }) {
  const { heroPool, topPicks, installations, premiumBaths, topFaucets, bestDeals } = data;
  const t = useT();
  // «Поддержка» уехала в плавающую кнопку WhatsApp — в полосе она дублировалась.
  const trust = [
    { icon: Truck, title: t("trust.delivery_t"), text: t("trust.delivery_s") },
    { icon: ShieldCheck, title: t("trust.warranty_t"), text: t("trust.warranty_s") },
    { icon: BadgeCheck, title: t("trust.original_t"), text: t("trust.original_s") },
  ];

  return (
    <div className="pb-8">
      <CategoryChips />

      <section className="max-w-7xl mx-auto px-4 pt-3 md:pt-5">
        <div className="grid gap-3 lg:grid-cols-3">
          <DeliveryPromo />
          <div className="lg:col-span-2">
            <HeroSlider items={heroPool} />
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 pt-5">
        <div className="rounded-2xl md:rounded-3xl bg-gradient-to-r from-brand/[0.09] via-brand/[0.05] to-transparent ring-1 ring-brand/15 px-2 py-1.5 md:px-4 md:py-2">
          <div className="grid grid-cols-1 sm:grid-cols-3 md:divide-x divide-brand/15">
            {trust.map((b) => (
              <div key={b.title} className="flex items-center gap-3.5 px-3 py-3 md:px-5 md:py-4">
                <span className="w-11 h-11 rounded-2xl bg-brand text-white flex items-center justify-center shrink-0 shadow-[0_6px_16px_-6px_rgba(0,151,177,0.9)]">
                  <b.icon size={21} strokeWidth={2} />
                </span>
                <div className="min-w-0">
                  <div className="text-[15px] font-semibold leading-tight">{b.title}</div>
                  <div className="text-[13px] text-muted-foreground leading-snug">{b.text}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <CategoryTiles />

      <BrandStrip />

      <ProductCarousel title={t("home.popular")} items={topPicks} href="/catalog?brand=Frap&brand=Gappo&brand=Grohe&brand=LE%20MARK" />
      {bestDeals.length > 0 && (
        <ProductCarousel title={t("home.best_deals")} items={bestDeals} href="/catalog?onSale=1" accent />
      )}
      <ProductCarousel title={t("home.installations")} items={installations} href="/catalog?category=knopki-dlya-installyacij" />
      <ProductCarousel title={t("home.top_faucets")} items={topFaucets} href="/catalog?category=dlya-umyvalnikov" />
      <ProductCarousel title={t("home.premium_baths")} items={premiumBaths} href="/catalog?category=akrilovye-vanny" />
    </div>
  );
}
