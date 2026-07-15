"use client";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { catalogItems } from "@/lib/catalog";
import { searchProducts } from "@/lib/search";
import { formatPrice } from "@/lib/format";
import Link from "next/link";
import { productImageUrl } from "@/lib/media";

export function SearchBar({ className = "" }: { className?: string }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const boxRef = useRef<HTMLDivElement>(null);

  // Debounce запроса, чтобы не гонять поиск по каталогу на каждое нажатие
  const [debouncedQ, setDebouncedQ] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 150);
    return () => clearTimeout(t);
  }, [q]);

  const suggestions = debouncedQ.trim().length >= 2 ? searchProducts(catalogItems, debouncedQ).slice(0, 6) : [];

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const submit = (value: string) => {
    const term = value.trim();
    if (!term) return;
    setOpen(false);
    router.push(`/catalog?q=${encodeURIComponent(term)}`);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter") {
      if (active >= 0 && suggestions[active]) {
        setOpen(false);
        router.push(`/product/${suggestions[active].slug}`);
      } else {
        submit(q);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div ref={boxRef} className={`relative ${className}`}>
      <div className="flex items-center h-10 rounded-lg border border-border bg-white focus-within:border-accent overflow-hidden">
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="ml-3 text-muted-foreground shrink-0"
        >
          <circle cx="11" cy="11" r="7" />
          <path strokeLinecap="round" d="M21 21l-4.3-4.3" />
        </svg>
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
            setActive(-1);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Поиск: унитаз, смеситель, душевая кабина…"
          className="flex-1 px-3 h-full text-sm bg-transparent focus:outline-none"
          aria-label="Поиск по каталогу"
        />
        <button
          onClick={() => submit(q)}
          className="h-full px-4 bg-accent text-accent-foreground text-sm font-medium hover:bg-accent-hover shrink-0"
        >
          Найти
        </button>
      </div>

      {open && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-border rounded-lg shadow-xl z-50 overflow-hidden">
          {suggestions.map((p, i) => (
            <Link
              key={p.slug}
              href={`/product/${p.slug}`}
              onClick={() => setOpen(false)}
              onMouseEnter={() => setActive(i)}
              className={`flex items-center gap-3 px-3 py-2 ${
                i === active ? "bg-muted" : "hover:bg-muted"
              }`}
            >
              <div className="w-10 h-10 shrink-0 bg-muted rounded overflow-hidden">
                {p.image && (
                  <img
                    src={productImageUrl(p.image)}
                    alt=""
                    className="w-full h-full object-contain"
                    onError={(event) => event.currentTarget.remove()}
                  />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm line-clamp-1">{p.title}</div>
                <div className="text-xs text-muted-foreground">{p.category_title}</div>
              </div>
              <div className="text-sm font-medium shrink-0">{formatPrice(p.price)}</div>
            </Link>
          ))}
          <button
            onMouseDown={() => submit(q)}
            className="w-full text-center py-2 text-sm text-accent hover:bg-muted border-t border-border"
          >
            Показать все результаты по «{q.trim()}»
          </button>
        </div>
      )}
    </div>
  );
}
