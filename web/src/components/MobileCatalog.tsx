"use client";
import Link from "next/link";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, X } from "lucide-react";
import { catalogTree } from "@/lib/catalogTree";
import { getCategoryMap } from "@/lib/catalog";

export function MobileCatalog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [expanded, setExpanded] = useState<number | null>(0);
  const catMap = getCategoryMap();

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[60] md:hidden">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "tween", duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-y-0 left-0 w-[88%] max-w-sm bg-white flex flex-col"
          >
            <header className="flex items-center justify-between px-4 h-14 border-b border-border shrink-0">
              <span className="font-semibold">Каталог</span>
              <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted" aria-label="Закрыть">
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
                      <span className="flex-1 font-medium">{g.title}</span>
                      <ChevronDown size={18} className={`text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`} />
                    </button>
                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden bg-surface"
                        >
                          <div className="px-4 pb-3 pt-1 flex flex-col">
                            {subs.map((s) => (
                              <Link
                                key={s.slug}
                                href={`/catalog?category=${s.slug}`}
                                onClick={onClose}
                                className="flex items-center justify-between py-2 text-sm text-foreground/90"
                              >
                                <span>{s.title}</span>
                                <span className="text-xs text-muted-foreground">{s.count}</span>
                              </Link>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
