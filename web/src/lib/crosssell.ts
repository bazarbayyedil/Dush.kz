import { catalogItems, type CatalogItem } from "./catalog";
import { catalogTree } from "./catalogTree";

// Комплементарные категории по разделу: что реально докупают к товару.
const COMPLEMENTS: Record<string, string[]> = {
  "Смесители": ["sifony", "shlangi-dlya-unitazov-i-smesitelej", "gigienicheskij-dush"],
  "Раковины": ["dlya-umyvalnikov", "sifony", "tumby-s-umyvalnikom"],
  "Ванны": ["dlya-vanny", "sifony", "poruchen-dlya-vanny"],
  "Унитазы и биде": ["knopki-dlya-installyacij", "gigienicheskij-dush"],
  "Душ и гигиена": ["dlya-dusha", "tochechnye-trapy", "sifony"],
  "Кабины и ограждения": ["dlya-dusha", "tochechnye-trapy"],
  "Мебель и зеркала": ["rakovina-nakladnaya", "dlya-umyvalnikov"],
  "Кухня: мойки": ["dlya-kukhni", "izmelcitel-othodov", "sifony"],
  "Полотенцесушители": ["kryuchok", "polka"],
  "Аксессуары": ["kryuchok", "polka", "mylnica"],
  "Инженерное": ["sifony"],
};

// «С этим берут»: по одному товару из каждой комплементарной категории, затем добор.
export function crossSell(category: string, excludeSlug: string, limit = 4): CatalogItem[] {
  const group = catalogTree.find((g) => g.categories.includes(category));
  const compCats = group ? COMPLEMENTS[group.title] ?? [] : [];
  if (compCats.length === 0) return [];

  const ok = (p: CatalogItem) => p.in_stock && !!p.price && !!p.image && p.slug !== excludeSlug;
  const out: CatalogItem[] = [];
  const seen = new Set<string>();

  // сначала по одному из каждой категории — для разнообразия подборки
  for (const cat of compCats) {
    const found = catalogItems.find((p) => p.category === cat && ok(p) && !seen.has(p.slug));
    if (found) {
      out.push(found);
      seen.add(found.slug);
    }
  }
  // добор до лимита из тех же категорий
  if (out.length < limit) {
    const set = new Set(compCats);
    for (const p of catalogItems) {
      if (out.length >= limit) break;
      if (set.has(p.category) && ok(p) && !seen.has(p.slug)) {
        out.push(p);
        seen.add(p.slug);
      }
    }
  }
  return out.slice(0, limit);
}
