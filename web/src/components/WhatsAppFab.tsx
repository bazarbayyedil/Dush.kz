"use client";
import { WHATSAPP_URL } from "@/lib/contacts";
import { useT } from "@/lib/i18n";
import { ymGoal } from "@/lib/metrika";

/**
 * Плавающая кнопка WhatsApp. Держится в правом нижнем углу при прокрутке.
 * На мобильном поднята над панелью покупки, которая живёт на дне карточки товара.
 */
export function WhatsAppFab() {
  const t = useT();
  return (
    <a
      href={WHATSAPP_URL}
      target="_blank"
      rel="noopener"
      onClick={() => ymGoal("whatsapp_fab")}
      aria-label={t("fab.whatsapp")}
      className="group fixed right-4 bottom-[78px] lg:bottom-6 z-40 flex items-center gap-2.5 h-14 lg:h-14 pl-4 pr-4 lg:pr-5 rounded-full bg-[#25D366] text-white shadow-[0_8px_24px_-6px_rgba(37,211,102,0.65)] hover:bg-[#1ebe5b] hover:shadow-[0_10px_28px_-6px_rgba(37,211,102,0.8)] active:scale-95 transition-all"
    >
      <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor" aria-hidden className="shrink-0">
        <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.14-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.61-.92-2.21-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.06 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.69.63.71.22 1.36.19 1.87.12.57-.09 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.42-.07-.13-.27-.2-.57-.35z" />
        <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.46 1.32 4.96L2 22l5.25-1.38a9.87 9.87 0 004.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0012.04 2zm0 18.13h-.01a8.2 8.2 0 01-4.18-1.15l-.3-.18-3.11.82.83-3.04-.2-.31a8.19 8.19 0 01-1.26-4.37c0-4.54 3.7-8.24 8.24-8.24 2.2 0 4.27.86 5.83 2.42a8.19 8.19 0 012.41 5.83c0 4.54-3.7 8.23-8.25 8.23z" />
      </svg>
      {/* На узких экранах подпись прячем — кнопка не должна закрывать товар */}
      <span className="hidden sm:inline text-sm font-semibold whitespace-nowrap">
        {t("fab.whatsapp")}
      </span>
    </a>
  );
}
