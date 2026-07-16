"use client";
import { ymGoal } from "@/lib/metrika";
import { WHATSAPP_URL } from "@/lib/contacts";

// Клик по номеру → переход в WhatsApp. Для серверных компонентов (напр. Footer),
// где нельзя навесить onClick напрямую. Цель Метрики — 'call' (клик по контакту).
export function CallLink({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <a
      href={WHATSAPP_URL}
      target="_blank"
      rel="noopener"
      onClick={() => ymGoal("call")}
      className={className}
    >
      {children}
    </a>
  );
}
