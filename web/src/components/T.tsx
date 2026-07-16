"use client";
import { useT } from "@/lib/i18n";

// Инлайн-перевод строки. Работает и внутри серверных компонентов
// (серверный компонент может рендерить клиентский <T/>).
export function T({ k }: { k: string }) {
  const t = useT();
  return <>{t(k)}</>;
}
