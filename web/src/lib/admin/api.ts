"use client";

const BASE = "/api/v1/admin";

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE}${path}`, {
    ...init,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  if (response.status === 204) return undefined as T;
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new ApiError(response.status, readDetail(body) ?? `Ошибка ${response.status}`);
  }
  return body as T;
}

// FastAPI кладёт причину в detail — иногда строкой, иногда списком ошибок валидации.
function readDetail(body: unknown): string | null {
  if (!body || typeof body !== "object") return null;
  const detail = (body as { detail?: unknown }).detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    const first = detail[0] as { msg?: string } | undefined;
    return first?.msg ?? null;
  }
  if (detail && typeof detail === "object") return JSON.stringify(detail);
  return null;
}

export const api = {
  get: <T,>(path: string) => request<T>(path),
  post: <T,>(path: string, body?: unknown) =>
    request<T>(path, { method: "POST", body: body === undefined ? undefined : JSON.stringify(body) }),
  patch: <T,>(path: string, body: unknown) =>
    request<T>(path, { method: "PATCH", body: JSON.stringify(body) }),
  put: <T,>(path: string, body: unknown) => request<T>(path, { method: "PUT", body: JSON.stringify(body) }),
  del: (path: string) => request<void>(path, { method: "DELETE" }),
};

export type Me = {
  id: number;
  login: string;
  name: string;
  role: string;
  role_title: string;
  permissions: string[];
};

export type ProductRow = {
  id: number;
  slug: string;
  sku: string;
  title: string;
  brand: string;
  category: string;
  category_title: string;
  price: string;
  old_price: string | null;
  in_stock: boolean;
  on_sale: boolean;
  active: boolean;
  images: string[];
  updated_at: string;
};

export type ProductDetail = ProductRow & { attrs: Record<string, string>; description: string };

export type PaymentStatus =
  | "pending"
  | "authorized"
  | "paid"
  | "failed"
  | "refunded"
  | "partially_refunded";

export type OrderPaymentStatus = "unpaid" | "pending" | "paid" | "refunded" | "partially_refunded";

export const PAYMENT_TITLES: Record<OrderPaymentStatus, string> = {
  unpaid: "Не оплачен",
  pending: "Ждёт оплату",
  paid: "Оплачен",
  refunded: "Возвращён",
  partially_refunded: "Частичный возврат",
};

export type Payment = {
  id: string;
  status: PaymentStatus;
  amount: string;
  refunded_amount: string;
  card_mask: string;
  card_type: string;
  failure_reason: string;
  paid_at: string | null;
  created_at: string;
};

export type OrderRow = {
  id: string;
  status: OrderStatus;
  payment_status: OrderPaymentStatus;
  customer_name: string;
  phone: string;
  city: string;
  total: string;
  manager_id: number | null;
  manager_name: string;
  created_at: string;
};

export const SHIPPING_TITLES: Record<string, string> = {
  delivery: "Доставка",
  pickup: "Самовывоз",
};

export const PAYMENT_METHOD_TITLES: Record<string, string> = {
  prepaid: "Предоплата",
  // Старые заказы до перехода на предоплату:
  cash: "При получении",
  transfer: "Переводом",
};

export type OrderDetail = OrderRow & {
  shipping: string;
  payment_method: string;
  comment: string;
  manager_note: string;
  closing_reason: string;
  source: string;
  updated_at: string;
  items: { slug: string; sku: string; title: string; unit_price: string; quantity: number; line_total: string }[];
  payments: Payment[];
};

export type OrderStatus =
  | "new"
  | "processing"
  | "confirmed"
  | "assembled"
  | "shipped"
  | "delivered"
  | "completed"
  | "cancelled"
  | "returned";

export const STATUS_TITLES: Record<OrderStatus, string> = {
  new: "Новый",
  processing: "В обработке",
  confirmed: "Подтверждён",
  assembled: "Собран",
  shipped: "В доставке",
  delivered: "Доставлен",
  completed: "Выполнен",
  cancelled: "Отменён",
  returned: "Возврат",
};

export const STATUS_ORDER: OrderStatus[] = [
  "new", "processing", "confirmed", "assembled", "shipped", "delivered", "completed", "cancelled", "returned",
];

export type UserRow = {
  id: number;
  login: string;
  name: string;
  active: boolean;
  role_id: number;
  last_login_at: string | null;
};

export type RoleRow = { id: number; slug: string; title: string; permissions: string[]; system: boolean };

export type AuditRow = {
  id: number;
  user_login: string;
  action: string;
  entity: string;
  entity_id: string;
  changes: Record<string, { from: unknown; to: unknown }>;
  created_at: string;
};

export type Stats = {
  revenue: string;
  orders: number;
  average_check: string;
  cancelled: number;
  by_status: Record<string, number>;
  top_products: { title: string; qty: number; revenue: string }[];
  cancel_reasons: { reason: string; count: number }[];
  out_of_stock: number;
};

export const PERM = {
  catalogView: "catalog.view",
  catalogContent: "catalog.content",
  catalogPrice: "catalog.price",
  catalogStock: "catalog.stock",
  catalogCreate: "catalog.create",
  ordersView: "orders.view",
  ordersStatus: "orders.status",
  ordersEdit: "orders.edit",
  customersView: "customers.view",
  analyticsView: "analytics.view",
  auditView: "audit.view",
  usersManage: "users.manage",
  settingsManage: "settings.manage",
} as const;
