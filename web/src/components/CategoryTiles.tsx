"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { catalogTree, groupHref } from "@/lib/catalogTree";
import { getCategoryMap } from "@/lib/catalog";
import { useT } from "@/lib/i18n";

export function CategoryTiles() {
  const catMap = getCategoryMap();
  const t = useT();

  const groups = catalogTree.map((g) => {
    const slugs = g.categories.filter((c) => (catMap[c]?.count ?? 0) > 0);
    const count = slugs.reduce((s, c) => s + (catMap[c]?.count ?? 0), 0);
    return { ...g, count, href: groupHref(slugs.length ? slugs : g.categories.slice(0, 1)) };
  });

  return (
    <section className="max-w-7xl mx-auto px-4 py-8">
      <h2 className="text-xl md:text-2xl font-bold mb-5">{t("home.categories")}</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
        {groups.map((g, idx) => {
          const Icon = g.icon;
          return (
            <motion.div
              key={g.title}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.03, duration: 0.3 }}
            >
              <Link
                href={g.href}
                className="group flex flex-col gap-2 p-4 rounded-2xl border border-border bg-card hover:border-brand hover:shadow-md transition-all h-full"
              >
                <span className="w-11 h-11 rounded-xl bg-brand/10 flex items-center justify-center text-brand group-hover:bg-brand group-hover:text-white transition-colors">
                  <Icon size={22} strokeWidth={1.8} />
                </span>
                <span className="text-sm font-medium leading-tight mt-1">{g.title}</span>
                <span className="text-xs text-muted-foreground">{g.count} {t("home.goods_count")}</span>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
