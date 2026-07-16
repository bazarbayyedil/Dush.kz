"use client";
import Link from "next/link";
import { catalogTree, groupHref } from "@/lib/catalogTree";
import { getCategoryMap } from "@/lib/catalog";

// Горизонтальный ряд разделов — быстрый вход в каталог в первом экране мобайла.
export function CategoryChips() {
  const catMap = getCategoryMap();
  const groups = catalogTree.map((g) => {
    const slugs = g.categories.filter((c) => (catMap[c]?.count ?? 0) > 0);
    return { title: g.title, Icon: g.icon, href: groupHref(slugs.length ? slugs : g.categories.slice(0, 1)) };
  });

  return (
    <div className="md:hidden flex gap-2 overflow-x-auto no-scrollbar px-4 pt-3">
      {groups.map((g) => {
        const Icon = g.Icon;
        return (
          <Link
            key={g.title}
            href={g.href}
            className="shrink-0 inline-flex items-center gap-1.5 px-3 h-9 rounded-full border border-border bg-card text-sm whitespace-nowrap hover:border-brand transition-colors"
          >
            <Icon size={15} className="text-brand" strokeWidth={1.8} />
            {g.title}
          </Link>
        );
      })}
    </div>
  );
}
