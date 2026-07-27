"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { useT } from "@/lib/i18n";

/** Тонкая полоска-анонс партнёрки над шапкой. На самой /designers не нужна. */
export function DesignerBanner() {
  const t = useT();
  const pathname = usePathname();
  if (pathname?.startsWith("/designers")) return null;

  return (
    <Link
      href="/designers"
      className="block bg-[#0a2a33] text-white/90 hover:text-white text-[13px] md:text-sm text-center px-4 py-2 transition-colors"
    >
      <span className="inline-flex items-center gap-1.5">
        {t("promo.designers_bar")}
        <ArrowRight size={14} className="shrink-0" />
      </span>
    </Link>
  );
}
