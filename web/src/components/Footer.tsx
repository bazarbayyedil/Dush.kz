"use client";
import Link from "next/link";
import { LockKeyhole } from "lucide-react";
import { CallLink } from "./CallLink";
import { useT } from "@/lib/i18n";
import { COMPANY, INSTAGRAM_URL, INSTAGRAM_HANDLE } from "@/lib/contacts";

export function Footer() {
  const t = useT();
  return (
    <footer className="mt-16 bg-neutral-900 text-neutral-300">
      <div className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-2 md:grid-cols-4 gap-8 text-sm">
        <div className="col-span-2 md:col-span-1">
          <img src="/logo-white.svg" alt="dush.kz — сантехника" className="h-11 w-auto mb-4" />
          <p className="text-neutral-400 text-xs leading-relaxed">{t("footer.about_store")}</p>
        </div>

        <div>
          <h4 className="text-white font-medium mb-3">{t("footer.buyers")}</h4>
          <ul className="space-y-2 text-neutral-400">
            <li><Link href="/catalog" className="hover:text-white">{t("footer.catalog")}</Link></li>
            <li><Link href="/delivery" className="hover:text-white">{t("footer.delivery_pay")}</Link></li>
            <li><Link href="/returns" className="hover:text-white">{t("footer.returns")}</Link></li>
            <li><Link href="/warranty" className="hover:text-white">{t("footer.warranty")}</Link></li>
            <li><Link href="/offer" className="hover:text-white">{t("footer.offer")}</Link></li>
            <li><Link href="/privacy" className="hover:text-white">{t("footer.privacy")}</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-medium mb-3">{t("footer.company")}</h4>
          <ul className="space-y-2 text-neutral-400">
            <li><Link href="/about" className="hover:text-white">{t("footer.about")}</Link></li>
            <li><Link href="/contacts" className="hover:text-white">{t("footer.contacts_link")}</Link></li>
            <li><Link href="/wholesale" className="hover:text-white">{t("footer.wholesale")}</Link></li>
            <li><Link href="/planner" className="hover:text-white">{t("footer.planner")}</Link></li>
            <li>
              <Link
                href="/admin"
                className="inline-flex items-center gap-1.5 mt-1 px-2.5 py-1 rounded-md border border-neutral-700 text-xs text-neutral-400 hover:text-white hover:border-neutral-500 transition-colors"
              >
                <LockKeyhole size={12} />
                {t("footer.admin")}
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-medium mb-3">{t("footer.contacts")}</h4>
          <ul className="space-y-2 text-neutral-400">
            <li><CallLink className="hover:text-white">+7 702 252 54 38</CallLink></li>
            <li><a href={INSTAGRAM_URL} target="_blank" rel="noopener" className="hover:text-white">Instagram: @{INSTAGRAM_HANDLE}</a></li>
            <li>
              <a
                href="https://2gis.kz/astana/firm/70000001018116894?m=71.46823%2C51.164252%2F16"
                target="_blank"
                rel="noopener"
                className="hover:text-white"
              >
                {t("footer.address")}
              </a>
            </li>
            <li>{t("footer.hours")}</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 py-4 text-xs text-neutral-500 flex flex-wrap justify-between gap-2">
          <span>
            © {new Date().getFullYear()} dush.kz · {COMPANY.name}, {t("footer.bin")} {COMPANY.bin}.{" "}
            {t("footer.rights")}
          </span>
          <span>{t("footer.prices_note")}</span>
        </div>
      </div>
    </footer>
  );
}
