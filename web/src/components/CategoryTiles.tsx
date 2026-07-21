"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { useState } from "react";
import { catalogTree, groupHref } from "@/lib/catalogTree";
import { getCategoryMap } from "@/lib/catalog";
import { useT } from "@/lib/i18n";
import { assetUrl } from "@/lib/assets";
import type { LucideIcon } from "lucide-react";

function Tile({
  href,
  title,
  count,
  img,
  Icon,
  label,
}: {
  href: string;
  title: string;
  count: number;
  img: string;
  Icon: LucideIcon;
  label: string;
}) {
  const [broken, setBroken] = useState(false);
  return (
    <Link
      href={href}
      className="group flex flex-col rounded-2xl border border-border bg-card overflow-hidden hover:border-brand hover:shadow-md transition-all h-full"
    >
      <div className="relative aspect-[4/3] bg-surface flex items-center justify-center overflow-hidden">
        {broken ? (
          <Icon size={30} strokeWidth={1.6} className="text-brand/70" />
        ) : (
          <img
            src={assetUrl("categories", img)}
            alt=""
            aria-hidden
            loading="lazy"
            onError={() => setBroken(true)}
            className="w-full h-full object-contain p-3 mix-blend-multiply transition-transform duration-500 group-hover:scale-[1.07]"
          />
        )}
      </div>
      <div className="px-3.5 py-3">
        <div className="text-sm font-medium leading-tight group-hover:text-accent transition-colors">
          {title}
        </div>
        <div className="text-xs text-muted-foreground mt-0.5">
          {count} {label}
        </div>
      </div>
    </Link>
  );
}

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
        {groups.map((g, idx) => (
          <motion.div
            key={g.title}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: idx * 0.03, duration: 0.3 }}
          >
            <Tile
              href={g.href}
              title={g.title}
              count={g.count}
              img={g.img}
              Icon={g.icon}
              label={t("home.goods_count")}
            />
          </motion.div>
        ))}
      </div>
    </section>
  );
}
