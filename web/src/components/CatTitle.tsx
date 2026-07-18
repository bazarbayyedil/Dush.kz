"use client";
import { useCatTitle } from "@/lib/categories-kk";

// Название категории на текущем языке — для серверных страниц, где нельзя хук.
export function CatTitle({ slug, ru }: { slug: string; ru: string }) {
  const cat = useCatTitle();
  return <>{cat(slug, ru)}</>;
}
