import Link from "next/link";
import { PlannerGate } from "./PlannerGate";

export const metadata = {
  title: "Планировщик санузла — dush.kz",
  description:
    "Расставьте сантехнику по плану своего санузла и подберите комплект под бюджет. Товары, габариты и цены — из каталога dush.kz.",
};

export default function PlannerPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 pt-6 pb-16">
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-5">
        <Link href="/" className="hover:text-foreground">Главная</Link>
        <span>/</span>
        <span className="text-foreground">Планировщик</span>
      </div>

      <h1 className="text-2xl md:text-3xl font-semibold leading-tight">Планировщик санузла</h1>
      <p className="text-muted-foreground mt-2 mb-8 max-w-2xl text-[15px]">
        Задайте размеры помещения, расставьте сантехнику и подберите комплект под бюджет.
        Габариты и цены берутся из нашего каталога, поэтому смету можно сразу обсуждать с менеджером.
      </p>

      <PlannerGate />
    </div>
  );
}
