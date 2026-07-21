"use client";
import type { OrderPaymentStatus, OrderStatus } from "@/lib/admin/api";
import { PAYMENT_TITLES, STATUS_TITLES } from "@/lib/admin/api";

export function PageTitle({ title, note }: { title: string; note?: string }) {
  return (
    <div className="mb-5">
      <h1 className="text-2xl font-semibold">{title}</h1>
      {note && <p className="text-sm text-muted-foreground mt-0.5">{note}</p>}
    </div>
  );
}

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`bg-card border border-border rounded-xl ${className}`}>{children}</div>;
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs text-muted-foreground mb-1">{label}</span>
      {children}
    </label>
  );
}

export const inputClass =
  "w-full px-3 py-2 rounded-lg border border-border bg-background text-sm disabled:opacity-60 disabled:cursor-not-allowed";

export function Money({ value }: { value: string | number }) {
  const number = typeof value === "string" ? Number(value) : value;
  return <span className="tabular-nums">{number.toLocaleString("ru-KZ")} ₸</span>;
}

const STATUS_STYLE: Record<OrderStatus, string> = {
  new: "bg-accent/10 text-accent",
  processing: "bg-amber-100 text-amber-800",
  confirmed: "bg-sky-100 text-sky-800",
  assembled: "bg-indigo-100 text-indigo-800",
  shipped: "bg-violet-100 text-violet-800",
  delivered: "bg-emerald-100 text-emerald-800",
  completed: "bg-success/10 text-success",
  cancelled: "bg-danger/10 text-danger",
  returned: "bg-neutral-200 text-neutral-700",
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${STATUS_STYLE[status]}`}>
      {STATUS_TITLES[status]}
    </span>
  );
}

const PAYMENT_STYLE: Record<OrderPaymentStatus, string> = {
  unpaid: "text-muted-foreground",
  pending: "text-amber-700",
  paid: "text-success",
  refunded: "text-danger",
  partially_refunded: "text-danger",
};

export function PaymentBadge({ status }: { status: OrderPaymentStatus }) {
  return <span className={`text-xs ${PAYMENT_STYLE[status]}`}>{PAYMENT_TITLES[status]}</span>;
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <div className="py-12 text-center text-sm text-muted-foreground">{children}</div>;
}

export function ErrorNote({ error }: { error: string }) {
  if (!error) return null;
  return (
    <div role="alert" className="mb-4 px-4 py-2.5 rounded-lg bg-danger/10 text-danger text-sm">
      {error}
    </div>
  );
}

export function formatDate(value: string): string {
  return new Date(value).toLocaleString("ru-KZ", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}
