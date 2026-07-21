import type { MetadataRoute } from "next";
import { products } from "@/lib/products";
import { catalogTree } from "@/lib/catalogTree";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-static";

// Информационные страницы: меняются редко, вес в поиске небольшой.
const INFO_PAGES = ["/about", "/contacts", "/delivery", "/returns", "/warranty", "/wholesale", "/planner"];
const LEGAL_PAGES = ["/offer", "/privacy"];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  // Только одиночные категории: ссылки на целые разделы содержат несколько
  // параметров, а амперсанд в <loc> ломает разбор XML у поисковиков.
  const categories = [...new Set(catalogTree.flatMap((group) => group.categories))];

  return [
    { url: SITE_URL, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/catalog`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    ...categories.map((slug) => ({
      url: `${SITE_URL}/catalog?category=${encodeURIComponent(slug)}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...products.map((product) => ({
      url: `${SITE_URL}/product/${product.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: product.in_stock ? 0.7 : 0.4,
    })),
    ...INFO_PAGES.map((path) => ({
      url: `${SITE_URL}${path}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    })),
    ...LEGAL_PAGES.map((path) => ({
      url: `${SITE_URL}${path}`,
      lastModified: now,
      changeFrequency: "yearly" as const,
      priority: 0.3,
    })),
  ];
}
