// Из полного индекса (2.8 МБ) готовит лёгкие артефакты для клиента:
//  - src/data/catalog-meta.json — карта категорий + превью для мегаменю (~25 КБ,
//    единственное, что попадает в JS-бандл);
//  - public/catalog-index.json — копия индекса, которую клиент качает лениво.
// Запускается prebuild-хуком перед next build.
import { readFileSync, writeFileSync, copyFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const index = JSON.parse(readFileSync(join(root, "src/data/products-index.json"), "utf8"));

const categories = {};
const previews = {};
for (const p of index) {
  const cur = (categories[p.category] ??= { title: p.category_title, count: 0 });
  cur.count += 1;
  // до двух товаров с нормальным фото на категорию — мегаменю собирает из них тройку
  if (p.image && p.price && (p.img_kb ?? 0) >= 15) {
    const list = (previews[p.category] ??= []);
    if (list.length < 2) {
      list.push({ slug: p.slug, title: p.title, image: p.image, price: p.price });
    }
  }
}

const meta = { categories, previews };
writeFileSync(join(root, "src/data/catalog-meta.json"), JSON.stringify(meta));
copyFileSync(join(root, "src/data/products-index.json"), join(root, "public/catalog-index.json"));
console.log(
  `meta: ${Object.keys(categories).length} категорий, ` +
  `${JSON.stringify(meta).length / 1024 | 0} КБ; индекс скопирован в public/`,
);
