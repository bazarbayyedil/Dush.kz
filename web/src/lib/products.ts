import productsData from "@/data/products.json";

// ВНИМАНИЕ: этот модуль тянет полный products.json (~5 МБ) и предназначен
// ТОЛЬКО для серверных компонентов (страница товара). В клиентских
// компонентах используйте тонкий индекс из "@/lib/catalog".

export type Product = {
  slug: string;
  sku: string;
  title: string;
  brand: string;
  category: string;
  category_title: string;
  price: number | null;
  old_price: number | null;
  in_stock: boolean;
  on_sale: boolean;
  images: string[];
  attrs: Record<string, string>;
  description: string;
  is_combo?: boolean;
  combo_parts?: { slug: string; title: string; price: number; sku: string }[];
  dims?: { L: number; W: number }; // выверенные габариты в мм
};

export const products: Product[] = productsData as Product[];

export function getProduct(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug);
}

export { formatPrice } from "./format";
