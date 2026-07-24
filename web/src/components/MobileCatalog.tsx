"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, X } from "lucide-react";
import { catalogTree, groupHref } from "@/lib/catalogTree";
import { useCatTitle, useGroupTitle } from "@/lib/categories-kk";
import { useT } from "@/lib/i18n";
import { getCategoryMap } from "@/lib/catalog-meta";

export function MobileCatalog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [expanded, setExpanded] = useState<number | null>(0);
  const catMap = getCategoryMap();
  const cat = useCatTitle();
  const grp = useGroupTitle();
  const t = useT();

  // Портал в body: шапка с backdrop-blur является containing block для
  // fixed-потомков, из-за чего шторка обрезалась до высоты шапки.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return createPortal(
    <>
      {open && (
        <div className="fixed inset-0 z-[60] md:hidden">
          <div className="absolute inset-0 bg-black/40 anim-fade" onClick={onClose} />
          <div className="absolute inset-y-0 left-0 w-[88%] max-w-sm bg-white flex flex-col anim-slide-in">
            <header className="flex items-center justify-between px-4 h-14 border-b border-border shrink-0">
              <span className="font-semibold">{t("nav.catalog")}</span>
              <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted" aria-label={t("common.close")}>
                <X size={20} />
              </button>
            </header>
            <div className="flex-1 overflow-y-auto">
              {catalogTree.map((g, i) => {
                const Icon = g.icon;
                const isOpen = expanded === i;
                const subs = g.categories
                  .map((slug) => ({ slug, ...(catMap[slug] ?? { title: slug, count: 0 }) }))
                  .filter((s) => s.count > 0);
                return (
                  <div key={g.title} className="border-b border-border">
                    <button
                      onClick={() => setExpanded(isOpen ? null : i)}
                      className="w-full flex items-center gap-3 px-4 py-3.5 text-sm text-left"
                    >
                      <Icon size={20} className="text-brand" strokeWidth={1.8} />
                      <span className="flex-1 font-medium">{grp(g.title)}</span>
                      <ChevronDown size={18} className={`text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`} />
                    </button>
                    {isOpen && (
                        <div className="overflow-hidden bg-surface anim-expand">
                          <div className="px-4 pb-3 pt-1 flex flex-col">
                            {subs.length > 1 && (
                              <Link
                                href={groupHref(subs.map((s) => s.slug))}
                                onClick={onClose}
                                className="flex items-center justify-between py-2 text-sm font-medium text-accent"
                              >
                                <span>{t("menu.all_in_group")}</span>
                                <span className="text-xs">{subs.reduce((n, s) => n + s.count, 0)}</span>
                              </Link>
                            )}
                            {subs.map((s) => (
                              <Link
                                key={s.slug}
                                href={`/catalog/${s.slug}`}
                                onClick={onClose}
                                className="flex items-center justify-between py-2 text-sm text-foreground/90"
                              >
                                <span>{cat(s.slug, s.title)}</span>
                                <span className="text-xs text-muted-foreground">{s.count}</span>
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>,
    document.body,
  );
}
