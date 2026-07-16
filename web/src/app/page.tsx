import { Truck, ShieldCheck, BadgeCheck, Headset } from "lucide-react";
import { catalogItems } from "@/lib/catalog";
import { topPicks, installations, premiumBaths, topFaucets, bestDeals } from "@/lib/showcase";
import { HeroSlider } from "@/components/HeroSlider";
import { CategoryChips } from "@/components/CategoryChips";
import { CategoryTiles } from "@/components/CategoryTiles";
import { ProductCarousel } from "@/components/ProductCarousel";
import { BrandStrip } from "@/components/BrandStrip";

function pick(cat: string) {
  return catalogItems.find((p) => p.category === cat && p.image)?.image;
}

export default function HomePage() {
  const slides = [
    {
      eyebrow: "Душевые кабины",
      title: "Душевые кабины с доставкой по Казахстану",
      subtitle: "Готовые решения под ключ — от компактных до кабин с гидромассажем.",
      href: "/catalog?category=dushevye-kabiny",
      cta: "Смотреть кабины",
      image: pick("dushevye-kabiny"),
      from: "#E4F5F7",
      to: "#ffffff",
    },
    {
      eyebrow: "Скидки и акции",
      title: "Смесители топовых брендов",
      subtitle: "Grohe, Lemark, Hansgrohe и другие — оригинал с гарантией и честной ценой.",
      href: "/catalog?category=dlya-umyvalnikov",
      cta: "Выбрать смеситель",
      image: pick("dlya-umyvalnikov"),
      from: "#FFF0EC",
      to: "#ffffff",
    },
    {
      eyebrow: "Мебель для ванной",
      title: "Тумбы, зеркала и пеналы",
      subtitle: "Соберите ванную комнату целиком — мебель, зеркала с подсветкой и раковины.",
      href: "/catalog?category=tumby-s-umyvalnikom",
      cta: "Смотреть мебель",
      image: pick("tumby-s-umyvalnikom"),
      from: "#EEF2F5",
      to: "#ffffff",
    },
  ];

  const trust = [
    { icon: Truck, title: "Доставка 24ч", text: "по Астане" },
    { icon: ShieldCheck, title: "Гарантия", text: "официальная" },
    { icon: BadgeCheck, title: "Оригинал", text: "прямые поставки" },
    { icon: Headset, title: "Поддержка", text: "поможем с выбором" },
  ];

  return (
    <div className="pb-8">
      <CategoryChips />

      <section className="max-w-7xl mx-auto px-4 pt-3 md:pt-5">
        <HeroSlider slides={slides} />
      </section>

      <section className="max-w-7xl mx-auto px-4 pt-5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {trust.map((t) => (
            <div key={t.title} className="flex items-center gap-3 p-4 rounded-2xl border border-border bg-card">
              <span className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center text-brand shrink-0">
                <t.icon size={20} strokeWidth={1.8} />
              </span>
              <div className="min-w-0">
                <div className="text-sm font-medium leading-tight">{t.title}</div>
                <div className="text-xs text-muted-foreground">{t.text}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <CategoryTiles />

      <ProductCarousel title="Популярное" items={topPicks} href="/catalog?brand=Frap&brand=Gappo&brand=Grohe&brand=LE%20MARK" />
      {bestDeals.length > 0 && (
        <ProductCarousel title="Лучшие скидки" items={bestDeals} href="/catalog?onSale=1" accent />
      )}
      <ProductCarousel title="Инсталляции и комплекты" items={installations} href="/catalog?category=knopki-dlya-installyacij" />
      <ProductCarousel title="Смесители топ-брендов" items={topFaucets} href="/catalog?category=dlya-umyvalnikov" />
      <ProductCarousel title="Премиум-ванны" items={premiumBaths} href="/catalog?category=akrilovye-vanny" />

      <BrandStrip />
    </div>
  );
}
