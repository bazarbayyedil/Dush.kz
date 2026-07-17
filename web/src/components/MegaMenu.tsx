"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { catalogTree, groupHref } from "@/lib/catalogTree";
import { getCategoryMap, sampleByCategories } from "@/lib/catalog";
import { formatPrice } from "@/lib/format";
import { productImageUrl } from "@/lib/media";

export function MegaMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [active, setActive] = useState(0);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const catMap = getCategoryMap();
  const group = catalogTree[active];
  const subs = group.categories
    .map((slug) => ({ slug, ...(catMap[slug] ?? { title: slug, count: 0 }) }))
    .filter((s) => s.count > 0);
  const preview = sampleByCategories(group.categories, 3);

  return (
    <AnimatePresence>
      {open && (
        <>
          {mounted &&
            createPortal(
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 top-[var(--header-h,64px)] bg-black/40 z-30"
                onClick={onClose}
              />,
              document.body,
            )}
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="absolute left-0 right-0 top-full z-50"
            onMouseLeave={onClose}
          >
            <div className="max-w-7xl mx-auto px-4">
              <div className="bg-white rounded-b-2xl shadow-2xl border border-border border-t-0 overflow-hidden grid grid-cols-1 md:grid-cols-[280px_1fr]">
                {/* Разделы */}
                <div className="py-3 border-r border-border bg-surface/60">
                  {catalogTree.map((g, i) => {
                    const Icon = g.icon;
                    const isActive = i === active;
                    return (
                      <button
                        key={g.title}
                        onMouseEnter={() => setActive(i)}
                        className={`w-full flex items-center gap-3 px-5 py-2.5 text-sm text-left transition-colors ${
                          isActive
                            ? "bg-white text-accent font-medium"
                            : "text-foreground hover:bg-white/70"
                        }`}
                      >
                        <Icon size={19} className={isActive ? "text-brand" : "text-muted-foreground"} strokeWidth={1.8} />
                        <span className="flex-1">{g.title}</span>
                        <ChevronRight size={15} className={isActive ? "text-accent" : "text-transparent"} />
                      </button>
                    );
                  })}
                </div>

                {/* Подкатегории активного раздела */}
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <group.icon size={20} className="text-brand" strokeWidth={1.8} />
                      {group.title}
                    </h3>
                    <Link
                      href={groupHref(subs.length ? subs.map((s) => s.slug) : group.categories.slice(0, 1))}
                      onClick={onClose}
                      className="text-sm text-accent hover:underline shrink-0"
                    >
                      Все товары →
                    </Link>
                  </div>

                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-1.5">
                    {subs.map((s) => (
                      <Link
                        key={s.slug}
                        href={`/catalog?category=${s.slug}`}
                        onClick={onClose}
                        className="group flex items-baseline gap-2 py-1 text-sm hover:text-accent"
                      >
                        <span className="group-hover:underline">{s.title}</span>
                        <span className="text-xs text-muted-foreground">{s.count}</span>
                      </Link>
                    ))}
                  </div>

                  {preview.length > 0 && (
                    <div className="mt-6 pt-5 border-t border-border grid grid-cols-3 gap-4">
                      {preview.map((p) => (
                        <Link
                          key={p.slug}
                          href={`/product/${p.slug}`}
                          onClick={onClose}
                          className="group flex items-center gap-3 rounded-xl p-2 hover:bg-surface transition-colors"
                        >
                          <div className="relative w-14 h-14 shrink-0 rounded-lg bg-surface overflow-hidden">
                            {p.image ? (
                              <img
                                src={productImageUrl(p.image)}
                                alt=""
                                className="relative w-full h-full object-contain mix-blend-multiply"
                                onError={(event) => {
                                  event.currentTarget.style.display = "none";
                                }}
                              />
                            ) : (
                              <span className="absolute inset-0 flex items-center justify-center text-[9px] text-muted-foreground">
                                Нет фото
                              </span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs line-clamp-2 group-hover:text-accent">{p.title}</div>
                            <div className="text-xs font-semibold mt-0.5">{formatPrice(p.price)}</div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
