"use client";
import Link from "next/link";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { SlidersHorizontal, X, Check } from "lucide-react";
import {
  catalogItems,
  filterCatalog,
  getAllBrands,
  getAllCategories,
  getPriceRange,
  type FilterState,
} from "@/lib/catalog";
import { formatPrice } from "@/lib/format";
import { ProductCard } from "@/components/ProductCard";

export function CatalogView() {
  const sp = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileFilters, setMobileFilters] = useState(false);

  const brands = useMemo(() => getAllBrands(), []);
  const cats = useMemo(() => getAllCategories(), []);
  const priceRange = useMemo(() => getPriceRange(), []);

  const filters: FilterState = useMemo(() => {
    return {
      q: sp.get("q") || undefined,
      brand: sp.getAll("brand"),
      category: sp.getAll("category"),
      priceMin: sp.get("priceMin") ? Number(sp.get("priceMin")) : undefined,
      priceMax: sp.get("priceMax") ? Number(sp.get("priceMax")) : undefined,
      inStock: sp.get("inStock") === "1",
      onSale: sp.get("onSale") === "1",
      sort: (sp.get("sort") as FilterState["sort"]) || "popular",
    };
  }, [sp]);

  const filtered = useMemo(() => filterCatalog(catalogItems, filters), [filters]);

  const update = (patch: Record<string, string | string[] | null | boolean | number | undefined>) => {
    const params = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(patch)) {
      params.delete(k);
      if (v == null || v === "" || v === false) continue;
      if (Array.isArray(v)) v.forEach((val) => params.append(k, String(val)));
      else if (v === true) params.set(k, "1");
      else params.set(k, String(v));
    }
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const toggleArray = (key: "brand" | "category", value: string) => {
    const cur = filters[key] || [];
    const next = cur.includes(value) ? cur.filter((v) => v !== value) : [...cur, value];
    update({ [key]: next });
  };

  const clearAll = () => router.replace(pathname, { scroll: false });

  const anyActive =
    (filters.brand?.length ?? 0) > 0 ||
    (filters.category?.length ?? 0) > 0 ||
    filters.priceMin != null ||
    filters.priceMax != null ||
    !!filters.inStock ||
    !!filters.onSale ||
    !!filters.q;

  const Row = ({ label, count, checked, onChange }: { label: string; count: number; checked: boolean; onChange: () => void }) => (
    <label className="flex items-center gap-2.5 cursor-pointer group py-0.5">
      <span
        className={`w-[18px] h-[18px] rounded-[5px] border flex items-center justify-center shrink-0 transition-colors ${
          checked ? "bg-accent border-accent text-white" : "border-border group-hover:border-accent/50"
        }`}
      >
        {checked && <Check size={13} strokeWidth={3} />}
      </span>
      <input type="checkbox" checked={checked} onChange={onChange} className="sr-only" />
      <span className={`flex-1 ${checked ? "text-foreground" : "text-foreground/85"} group-hover:text-accent`}>{label}</span>
      {count > 0 && <span className="text-xs text-muted-foreground">{count}</span>}
    </label>
  );

  const FilterPanel = (
    <div className="space-y-5 text-sm">
      <div>
        <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">Поиск</div>
        <input
          type="search"
          value={filters.q || ""}
          onChange={(e) => update({ q: e.target.value || null })}
          placeholder="Название, артикул…"
          className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-white focus:outline-none focus:border-accent"
        />
      </div>

      <div className="border-t border-border pt-4">
        <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2.5">Категория</div>
        <div className="space-y-0.5 max-h-56 overflow-y-auto no-scrollbar pr-1">
          {cats.map((c) => (
            <Row key={c.slug} label={c.title} count={c.count} checked={filters.category?.includes(c.slug) ?? false} onChange={() => toggleArray("category", c.slug)} />
          ))}
        </div>
      </div>

      <div className="border-t border-border pt-4">
        <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2.5">Бренд</div>
        <div className="space-y-0.5 max-h-44 overflow-y-auto no-scrollbar pr-1">
          {brands.map((b) => (
            <Row key={b.name} label={b.name} count={b.count} checked={filters.brand?.includes(b.name) ?? false} onChange={() => toggleArray("brand", b.name)} />
          ))}
        </div>
      </div>

      <div className="border-t border-border pt-4">
        <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2.5">Цена, ₸</div>
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder={priceRange.min.toLocaleString("ru-RU")}
            value={filters.priceMin ?? ""}
            onChange={(e) => update({ priceMin: e.target.value ? Number(e.target.value) : null })}
            className="w-full px-3 py-2 rounded-xl border border-border bg-white text-sm focus:outline-none focus:border-accent"
          />
          <span className="text-muted-foreground">—</span>
          <input
            type="number"
            placeholder={priceRange.max.toLocaleString("ru-RU")}
            value={filters.priceMax ?? ""}
            onChange={(e) => update({ priceMax: e.target.value ? Number(e.target.value) : null })}
            className="w-full px-3 py-2 rounded-xl border border-border bg-white text-sm focus:outline-none focus:border-accent"
          />
        </div>
      </div>

      <div className="border-t border-border pt-4 flex flex-col gap-2.5">
        <Row label="Только в наличии" count={0} checked={filters.inStock ?? false} onChange={() => update({ inStock: !filters.inStock })} />
        <Row label="Только со скидкой" count={0} checked={filters.onSale ?? false} onChange={() => update({ onSale: !filters.onSale })} />
      </div>

      {anyActive && (
        <button
          onClick={clearAll}
          className="w-full py-2.5 border border-border rounded-xl text-sm hover:bg-muted flex items-center justify-center gap-2"
        >
          <X size={15} /> Сбросить фильтры
        </button>
      )}
    </div>
  );

  const pageTitle =
    filters.category?.length === 1
      ? cats.find((c) => c.slug === filters.category![0])?.title ?? "Каталог"
      : filters.q
        ? `Поиск: «${filters.q}»`
        : "Каталог";

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
        <Link href="/" className="hover:text-foreground">Главная</Link>
        <span>/</span>
        <span className="text-foreground">{pageTitle}</span>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">{pageTitle}</h1>
          <div className="text-sm text-muted-foreground mt-1">
            {filtered.length} {plural(filtered.length, "товар", "товара", "товаров")}
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setMobileFilters(true)}
            className="lg:hidden px-3.5 h-10 border border-border rounded-xl text-sm flex items-center gap-2 hover:bg-muted"
          >
            <SlidersHorizontal size={16} />
            Фильтры
            {anyActive && <span className="w-2 h-2 rounded-full bg-accent" />}
          </button>
          <select
            value={filters.sort}
            onChange={(e) => update({ sort: e.target.value === "popular" ? null : e.target.value })}
            className="px-3.5 h-10 border border-border rounded-xl bg-white text-sm focus:outline-none focus:border-accent cursor-pointer"
          >
            <option value="popular">По популярности</option>
            <option value="price_asc">Сначала дешевле</option>
            <option value="price_desc">Сначала дороже</option>
            <option value="name">По названию</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[270px_1fr] gap-6">
        <aside className="hidden lg:block sticky top-24 self-start">
          <div className="rounded-2xl border border-border bg-card p-5">{FilterPanel}</div>
        </aside>

        <div>
          {filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-16 text-center">
              <div className="text-muted-foreground">Ничего не нашли по этим фильтрам</div>
              <button onClick={clearAll} className="mt-3 px-4 py-2 text-sm text-accent hover:underline">
                Сбросить фильтры
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {filtered.map((p) => (
                <ProductCard key={p.slug} product={p} />
              ))}
            </div>
          )}
        </div>
      </div>

      {mobileFilters && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileFilters(false)} />
          <div className="absolute inset-y-0 left-0 w-[88%] max-w-sm bg-white flex flex-col">
            <div className="flex items-center justify-between px-5 h-14 border-b border-border shrink-0">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <SlidersHorizontal size={18} /> Фильтры
              </h3>
              <button onClick={() => setMobileFilters(false)} className="p-2 hover:bg-muted rounded-lg" aria-label="Закрыть">
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">{FilterPanel}</div>
            <div className="p-4 border-t border-border shrink-0">
              <button
                onClick={() => setMobileFilters(false)}
                className="w-full h-12 bg-accent text-accent-foreground rounded-xl font-medium"
              >
                Показать {filtered.length}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function plural(n: number, one: string, few: string, many: string): string {
  const n10 = n % 10;
  const n100 = n % 100;
  if (n10 === 1 && n100 !== 11) return one;
  if (n10 >= 2 && n10 <= 4 && (n100 < 10 || n100 >= 20)) return few;
  return many;
}
