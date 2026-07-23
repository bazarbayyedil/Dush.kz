"use client";
import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { CatalogItem } from "@/lib/catalog-core";
import { ProductCard } from "./ProductCard";

export function ProductCarousel({
  title,
  items,
  href,
  accent,
}: {
  title: string;
  items: CatalogItem[];
  href?: string;
  accent?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(true);

  const update = () => {
    const el = ref.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 8);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 8);
  };

  useEffect(() => {
    update();
  }, [items]);

  const scroll = (dir: number) => {
    const el = ref.current;
    if (!el) return;
    el.scrollBy({ left: dir * (el.clientWidth * 0.85), behavior: "smooth" });
  };

  if (items.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl md:text-2xl font-bold flex items-center gap-2">
          {accent && <span className="w-1.5 h-6 rounded-full bg-sale" />}
          {title}
        </h2>
        <div className="flex items-center gap-2">
          {href && (
            <Link href={href} className="text-sm text-accent hover:underline mr-1">
              Все →
            </Link>
          )}
          <button
            onClick={() => scroll(-1)}
            disabled={!canLeft}
            className="w-9 h-9 rounded-full border border-border flex items-center justify-center hover:bg-muted disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
            aria-label="Назад"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={() => scroll(1)}
            disabled={!canRight}
            className="w-9 h-9 rounded-full border border-border flex items-center justify-center hover:bg-muted disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
            aria-label="Вперёд"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div
        ref={ref}
        onScroll={update}
        className="flex gap-4 overflow-x-auto no-scrollbar snap-x snap-mandatory scroll-pl-4 -mx-4 px-4"
      >
        {items.map((p) => (
          <div key={p.slug} className="snap-start shrink-0 w-[46%] sm:w-[240px]">
            <ProductCard product={p} />
          </div>
        ))}
      </div>
    </section>
  );
}
