"use client";
import Link from "next/link";
import { BadgeCheck, FileCheck2, ShieldCheck, Wrench } from "lucide-react";
import { useT } from "@/lib/i18n";
import { assetUrl } from "@/lib/assets";

// Чем подкреплён статус официального поставщика — то, что покупатель может проверить.
const GUARANTEES = [
  { icon: ShieldCheck, title: "official.warranty_t", text: "official.warranty_s" },
  { icon: BadgeCheck, title: "official.original_t", text: "official.original_s" },
  { icon: Wrench, title: "official.service_t", text: "official.service_s" },
  { icon: FileCheck2, title: "official.docs_t", text: "official.docs_s" },
] as const;

// logo — файл в манифесте (brands), brand — точное имя в данных для фильтра
// wide — длинный вордмарк (Jacob Delafon), занимает две ячейки, чтобы буквы были
// той же высоты, что у остальных.
const BRANDS: { logo: string; label: string; brand: string; wide?: boolean }[] = [
  { logo: "grohe", label: "GROHE", brand: "Grohe" },
  { logo: "hansgrohe", label: "hansgrohe", brand: "Hansgrohe" },
  { logo: "jacob-delafon", label: "Jacob Delafon", brand: "Jacob Delafon", wide: true },
  { logo: "lemark", label: "LEMARK", brand: "LE MARK" },
  { logo: "frap", label: "FRAP", brand: "Frap" },
  { logo: "bravat", label: "BRAVAT", brand: "BRAVAT" },
  { logo: "cersanit", label: "CERSANIT", brand: "CERSANIT" },
  { logo: "gappo", label: "GAPPO", brand: "Gappo" },
];

export function BrandStrip() {
  const t = useT();
  return (
    <section className="max-w-7xl mx-auto px-4 py-10">
      <div className="rounded-3xl border border-border bg-gradient-to-br from-surface to-white p-6 md:p-10">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-7">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand/10 text-accent text-xs font-medium mb-3">
              <BadgeCheck size={15} /> {t("brands.badge")}
            </div>
            <h2 className="text-xl md:text-2xl font-bold">{t("brands.title")}</h2>
            <p className="text-sm text-muted-foreground mt-1 max-w-lg">{t("brands.sub")}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {BRANDS.map((b) => (
            <Link
              key={b.brand}
              href={`/catalog?brand=${encodeURIComponent(b.brand)}`}
              className={`group h-20 rounded-2xl border border-border bg-white flex items-center justify-center px-4 transition-all hover:border-brand hover:shadow-md ${
                b.wide ? "col-span-2 sm:col-span-1 lg:col-span-2" : ""
              }`}
              aria-label={b.label}
            >
              {/* Логотипы в фирменных цветах, приведены к единой высоте —
                  object-contain держит их на одной оптической линии. */}
              <img
                src={assetUrl("brands", b.logo)}
                alt={b.label}
                className="max-h-8 w-auto max-w-full object-contain transition-transform duration-200 group-hover:scale-105"
              />
            </Link>
          ))}
        </div>

        {/* Почему «официальный» — это не просто слово: четыре проверяемых обещания. */}
        <div className="mt-7 pt-7 border-t border-border grid grid-cols-2 lg:grid-cols-4 gap-5">
          {GUARANTEES.map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex gap-3">
              <span className="w-9 h-9 shrink-0 rounded-xl bg-brand/10 text-accent grid place-items-center">
                <Icon size={17} strokeWidth={2} />
              </span>
              <div className="min-w-0">
                <div className="text-sm font-semibold leading-snug">{t(title)}</div>
                <div className="text-xs text-muted-foreground leading-snug mt-0.5">{t(text)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
