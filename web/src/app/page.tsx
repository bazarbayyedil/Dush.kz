"use client";
import { Truck, ShieldCheck, BadgeCheck, Headset } from "lucide-react";
import { heroPicks, topPicks, installations, premiumBaths, topFaucets, bestDeals } from "@/lib/showcase";
import { useT } from "@/lib/i18n";
import { HeroSlider } from "@/components/HeroSlider";
import { CategoryChips } from "@/components/CategoryChips";
import { CategoryTiles } from "@/components/CategoryTiles";
import { ProductCarousel } from "@/components/ProductCarousel";
import { BrandStrip } from "@/components/BrandStrip";

export default function HomePage() {
  const t = useT();
  const trust = [
    { icon: Truck, title: t("trust.delivery_t"), text: t("trust.delivery_s") },
    { icon: ShieldCheck, title: t("trust.warranty_t"), text: t("trust.warranty_s") },
    { icon: BadgeCheck, title: t("trust.original_t"), text: t("trust.original_s") },
    { icon: Headset, title: t("trust.support_t"), text: t("trust.support_s") },
  ];

  return (
    <div className="pb-8">
      <CategoryChips />

      <section className="max-w-7xl mx-auto px-4 pt-3 md:pt-5">
        <HeroSlider items={heroPicks} />
      </section>

      <section className="max-w-7xl mx-auto px-4 pt-5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {trust.map((b) => (
            <div key={b.title} className="flex items-center gap-3 p-4 rounded-2xl border border-border bg-card">
              <span className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center text-brand shrink-0">
                <b.icon size={20} strokeWidth={1.8} />
              </span>
              <div className="min-w-0">
                <div className="text-sm font-medium leading-tight">{b.title}</div>
                <div className="text-xs text-muted-foreground">{b.text}</div>
              </div>
            </div>
          ))}
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
