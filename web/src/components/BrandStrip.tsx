"use client";
import Link from "next/link";

export function BrandStrip({ brands }: { brands: string[] }) {
  return (
    <section className="max-w-7xl mx-auto px-4 py-8">
      <h2 className="text-xl md:text-2xl font-bold mb-5">Популярные бренды</h2>
      <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-4 px-4">
        {brands.map((b) => (
          <Link
            key={b}
            href={`/catalog?brand=${encodeURIComponent(b)}`}
            className="shrink-0 min-w-[130px] h-20 rounded-2xl border border-border bg-card flex items-center justify-center px-5 text-center font-semibold text-foreground/80 hover:border-brand hover:text-accent hover:shadow-md transition-all"
          >
            {b}
          </Link>
        ))}
      </div>
    </section>
  );
}
