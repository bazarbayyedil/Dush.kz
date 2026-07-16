"use client";
import { ymGoal } from "@/lib/metrika";

// Телефонная ссылка с целью «звонок» для Метрики. Для использования в
// серверных компонентах (напр. Footer), где нельзя навесить onClick напрямую.
export function CallLink({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <a href="tel:+77022525438" onClick={() => ymGoal("call")} className={className}>
      {children}
    </a>
  );
}
