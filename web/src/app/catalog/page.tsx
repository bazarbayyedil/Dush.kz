import { Suspense } from "react";
import { CatalogView } from "./CatalogView";
import { ProductCardSkeleton } from "@/components/ProductCardSkeleton";

export const metadata = {
  title: "Каталог — dush.kz",
  description: "Каталог сантехники: душевые кабины, смесители, унитазы, раковины.",
};

function CatalogSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="h-8 w-40 rounded skeleton mb-6" />
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

export default function CatalogPage() {
  return (
    <Suspense fallback={<CatalogSkeleton />}>
      <CatalogView />
    </Suspense>
  );
}
