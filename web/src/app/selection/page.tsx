import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ClipboardList } from "lucide-react";
import { SITE_URL } from "@/lib/site";
import { SelectionView } from "./SelectionView";

export const metadata: Metadata = {
  title: "Подборка товаров — dush.kz",
  description:
    "Подборка сантехники, составленная в каталоге dush.kz: цены, наличие, быстрый заказ.",
  alternates: { canonical: `${SITE_URL}/selection` },
  robots: { index: false },
};

export default function SelectionPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
        <Link href="/" className="hover:text-foreground">Главная</Link>
        <span>/</span>
        <span className="text-foreground">Подборка</span>
      </div>
      <h1 className="text-3xl font-semibold mb-2 flex items-center gap-2">
        <ClipboardList className="text-accent" /> Подборка товаров
      </h1>
      <p className="text-sm text-muted-foreground mb-6">
        Составлена в каталоге dush.kz — цены и наличие актуальны на сегодня.
      </p>
      <Suspense
        fallback={
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 rounded-2xl skeleton" />
            ))}
          </div>
        }
      >
        <SelectionView />
      </Suspense>
    </div>
  );
}
