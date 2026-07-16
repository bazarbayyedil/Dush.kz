"use client";
import Link from "next/link";
import { BadgeCheck } from "lucide-react";

// display — как показываем, brand — точное имя в данных для фильтра
const BRANDS: { display: string; brand: string; style?: string }[] = [
  { display: "GROHE", brand: "Grohe", style: "font-bold tracking-[0.25em]" },
  { display: "hansgrohe", brand: "Hansgrohe", style: "font-semibold tracking-tight" },
  { display: "JACOB DELAFON", brand: "Jacob Delafon", style: "font-medium tracking-[0.15em] text-[15px]" },
  { display: "LEMARK", brand: "LE MARK", style: "font-bold tracking-[0.2em]" },
  { display: "BRAVAT", brand: "BRAVAT", style: "font-semibold tracking-[0.3em]" },
  { display: "BLANCO", brand: "BLANCO", style: "font-bold tracking-[0.2em]" },
  { display: "CERSANIT", brand: "CERSANIT", style: "font-semibold tracking-[0.2em]" },
  { display: "PAFFONI", brand: "Paffoni", style: "font-medium tracking-[0.25em]" },
  { display: "ABBER", brand: "ABBER", style: "font-bold tracking-[0.35em]" },
  { display: "GAPPO", brand: "Gappo", style: "font-semibold tracking-[0.25em]" },
];

export function BrandStrip() {
  return (
    <section className="max-w-7xl mx-auto px-4 py-10">
      <div className="rounded-3xl border border-border bg-gradient-to-br from-surface to-white p-6 md:p-10">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-7">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand/10 text-accent text-xs font-medium mb-3">
              <BadgeCheck size={15} /> Официальный дистрибьютор
            </div>
            <h2 className="text-xl md:text-2xl font-bold">Работаем напрямую с ведущими брендами</h2>
            <p className="text-sm text-muted-foreground mt-1 max-w-lg">
              Оригинальная продукция с гарантией производителя — без подделок и серого импорта.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {BRANDS.map((b) => (
            <Link
              key={b.brand}
              href={`/catalog?brand=${encodeURIComponent(b.brand)}`}
              className="group h-20 rounded-2xl border border-border bg-white flex items-center justify-center px-3 text-center transition-all hover:border-brand hover:shadow-md"
              aria-label={b.display}
            >
              <span
                className={`text-neutral-500 group-hover:text-accent transition-colors uppercase ${b.style ?? "font-semibold tracking-wide"}`}
                style={{ fontSize: b.style?.includes("text-[") ? undefined : "17px" }}
              >
                {b.display}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
