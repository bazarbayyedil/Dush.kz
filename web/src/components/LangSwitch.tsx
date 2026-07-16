"use client";
import { useLang } from "@/lib/i18n";

const LANGS: { code: "ru" | "kk"; label: string }[] = [
  { code: "kk", label: "ҚАЗ" },
  { code: "ru", label: "РУС" },
];

export function LangSwitch({ className = "" }: { className?: string }) {
  const lang = useLang((s) => s.lang);
  const setLang = useLang((s) => s.setLang);
  return (
    <div className={`flex items-center rounded-lg border border-border overflow-hidden text-[11px] font-medium ${className}`}>
      {LANGS.map((l) => (
        <button
          key={l.code}
          onClick={() => setLang(l.code)}
          className={`px-2 h-7 transition-colors ${
            lang === l.code ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-muted"
          }`}
          aria-label={l.label}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}
