import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// Сайт собирается статикой — маршрут должен отдать файл на сборке, а не по запросу.
export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Панель управления и личные списки в поиске не нужны.
      disallow: ["/admin", "/favorites"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
