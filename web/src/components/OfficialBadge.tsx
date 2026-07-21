"use client";
import { BadgeCheck } from "lucide-react";
import { useT } from "@/lib/i18n";

// Бренды, по которым мы работаем как официальный поставщик.
// Список держим здесь: приписывать статус всему каталогу нельзя.
const OFFICIAL_BRANDS = new Set([
  "Grohe",
  "Hansgrohe",
  "Jacob Delafon",
  "LE MARK",
  "Frap",
  "Gappo",
  "BRAVAT",
  "CERSANIT",
]);

export function isOfficial(brand: string): boolean {
  return OFFICIAL_BRANDS.has(brand);
}

export function OfficialBadge({ brand }: { brand: string }) {
  const t = useT();
  if (!isOfficial(brand)) return null;
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-brand/10 text-accent text-xs font-medium">
      <BadgeCheck size={14} strokeWidth={2.2} />
      {brand} · {t("prod.official")}
    </span>
  );
}
