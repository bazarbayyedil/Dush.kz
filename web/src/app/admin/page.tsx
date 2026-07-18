"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import {
  Boxes,
  Check,
  ClipboardList,
  LogOut,
  PackageCheck,
  RefreshCw,
  Search,
  ShoppingBag,
  WalletCards,
} from "lucide-react";
import { productImageUrl } from "@/lib/media";

type Summary = {
  products_total: number;
  products_active: number;
  products_in_stock: number;
  orders_total: number;
  orders_new: number;
  orders_revenue: string;
};

type OrderStatus = "new" | "confirmed" | "cancelled" | "completed";

type Order = {
  id: string;
  status: OrderStatus;
  total: string;
  customer_name: string;
  phone: string;
  city: string;
  comment: string;
  created_at: string;
  items: Array<{ slug: string; sku: string; title: string; quantity: number; line_total: string }>;
};

type Product = {
  slug: string;
  sku: string;
  title: string;
  brand: string;
  category_title: string;
  price: string;
  old_price: string | null;
  in_stock: boolean;
  on_sale: boolean;
  active: boolean;
  image: string;
};

type ProductPage = { items: Product[]; total: number; page: number; page_size: number };
type Tab = "orders" | "products";

const statusLabels: Record<OrderStatus, string> = {
  new: "Новый",
  confirmed: "Подтверждён",
  cancelled: "Отменён",
  completed: "Выполнен",
};

const money = new Intl.NumberFormat("ru-KZ", { style: "currency", currency: "KZT", maximumFractionDigits: 0 });

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api/v1${path}`, {
    ...init,
    credentials: "same-origin",
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(response.status === 401 ? "unauthorized" : body?.detail || "Ошибка запроса");
  }
  return response.json();
}

export default function AdminPage() {
  const [auth, setAuth] = useState<"loading" | "guest" | "ready">("loading");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState<Tab>("orders");
  const [summary, setSummary] = useState<Summary | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<ProductPage | null>(null);
  const [query, setQuery] = useState("");
  const [saved, setSaved] = useState("");

  const loadDashboard = useCallback(async (search = "") => {
    setBusy(true);
    setError("");
    try {
      const [summaryData, orderData, productData] = await Promise.all([
        api<Summary>("/admin/summary"),
        api<Order[]>("/admin/orders"),
        api<ProductPage>(`/admin/products?page_size=25${search ? `&q=${encodeURIComponent(search)}` : ""}`),
      ]);
      setSummary(summaryData);
      setOrders(orderData);
      setProducts(productData);
      setAuth("ready");
    } catch (requestError) {
      if (requestError instanceof Error && requestError.message === "unauthorized") setAuth("guest");
      else setError(requestError instanceof Error ? requestError.message : "Не удалось загрузить данные");
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    api<{ authenticated: boolean }>("/admin/session")
      .then(() => loadDashboard())
      .catch(() => setAuth("guest"));
  }, [loadDashboard]);

  async function login(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api("/admin/login", { method: "POST", body: JSON.stringify({ password }) });
      setPassword("");
      await loadDashboard();
    } catch {
      setError("Неверный пароль администратора");
      setBusy(false);
    }
  }

  async function logout() {
    await api("/admin/logout", { method: "POST" });
    setSummary(null);
    setOrders([]);
    setProducts(null);
    setAuth("guest");
  }

  async function updateOrder(id: string, status: OrderStatus) {
    setSaved("");
    try {
      const updated = await api<Order>(`/admin/orders/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      setOrders((current) => current.map((order) => (order.id === id ? updated : order)));
      setSaved(id);
      window.setTimeout(() => setSaved(""), 1500);
      const nextSummary = await api<Summary>("/admin/summary");
      setSummary(nextSummary);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Не удалось обновить заказ");
    }
  }

  function changeProduct(slug: string, patch: Partial<Product>) {
    setProducts((current) =>
      current ? { ...current, items: current.items.map((item) => (item.slug === slug ? { ...item, ...patch } : item)) } : current,
    );
  }

  async function saveProduct(product: Product) {
    setSaved("");
    try {
      const updated = await api<Product>(`/admin/products/${encodeURIComponent(product.slug)}`, {
        method: "PATCH",
        body: JSON.stringify({
          price: product.price,
          old_price: product.old_price || null,
          in_stock: product.in_stock,
          on_sale: product.on_sale,
          active: product.active,
        }),
      });
      changeProduct(product.slug, updated);
      setSaved(product.slug);
      window.setTimeout(() => setSaved(""), 1500);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Не удалось сохранить товар");
    }
  }

  if (auth === "loading") {
    return <div className="min-h-[60vh] grid place-items-center"><RefreshCw className="animate-spin text-accent" /></div>;
  }

  if (auth === "guest") {
    return (
      <section className="min-h-[70vh] grid place-items-center px-4 py-12 bg-slate-50">
        <form onSubmit={login} className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/60">
          <div className="mb-7">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white"><Boxes /></div>
            <h1 className="text-2xl font-semibold">Админка dush.kz</h1>
            <p className="mt-2 text-sm text-slate-500">Заказы, товары, цены и остатки в одном месте.</p>
          </div>
          <label className="text-sm font-medium text-slate-700" htmlFor="admin-password">Пароль администратора</label>
          <input
            id="admin-password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-950"
            required
          />
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
          <button disabled={busy} className="mt-5 w-full rounded-xl bg-slate-950 px-4 py-3 font-medium text-white hover:bg-slate-800 disabled:opacity-50">
            {busy ? "Входим…" : "Войти"}
          </button>
        </form>
      </section>
    );
  }

  const cards = [
    ["Товаров", summary?.products_total ?? 0, Boxes],
    ["В наличии", summary?.products_in_stock ?? 0, PackageCheck],
    ["Новых заказов", summary?.orders_new ?? 0, ShoppingBag],
    ["Сумма заказов", money.format(Number(summary?.orders_revenue ?? 0)), WalletCards],
  ] as const;

  return (
    <section className="min-h-screen bg-slate-50 px-4 py-8 text-slate-950">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div><p className="text-sm font-medium text-slate-500">Панель управления</p><h1 className="text-3xl font-semibold">dush.kz Admin</h1></div>
          <div className="flex gap-2">
            <button onClick={() => loadDashboard(query)} className="inline-flex items-center gap-2 rounded-xl border bg-white px-4 py-2.5 text-sm font-medium hover:bg-slate-100"><RefreshCw size={16} className={busy ? "animate-spin" : ""} /> Обновить</button>
            <button onClick={logout} className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800"><LogOut size={16} /> Выйти</button>
          </div>
        </header>

        {error && <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

        <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {cards.map(([label, value, Icon]) => (
            <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <Icon className="mb-4 text-slate-400" size={22} /><div className="text-2xl font-semibold">{value}</div><div className="mt-1 text-sm text-slate-500">{label}</div>
            </div>
          ))}
        </div>

        <div className="mb-5 inline-flex rounded-xl border border-slate-200 bg-white p-1">
          <button onClick={() => setTab("orders")} className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium ${tab === "orders" ? "bg-slate-950 text-white" : "text-slate-600"}`}><ClipboardList size={16} /> Заказы</button>
          <button onClick={() => setTab("products")} className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium ${tab === "products" ? "bg-slate-950 text-white" : "text-slate-600"}`}><Boxes size={16} /> Товары</button>
        </div>

        {tab === "orders" ? (
          <div className="space-y-3">
            {orders.length === 0 && <div className="rounded-2xl border bg-white p-10 text-center text-slate-500">Заказов пока нет</div>}
            {orders.map((order) => (
              <article key={order.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2"><span className="font-semibold">#{order.id.slice(0, 8)}</span><span className="text-sm text-slate-400">{new Date(order.created_at).toLocaleString("ru-KZ")}</span></div>
                    <div className="mt-2 text-sm"><b>{order.customer_name}</b> · <a href={`tel:${order.phone}`} className="text-blue-700">{order.phone}</a>{order.city && ` · ${order.city}`}</div>
                    <div className="mt-3 space-y-1 text-sm text-slate-600">{order.items.map((item) => <div key={`${order.id}-${item.slug}`}>{item.title} × {item.quantity} — {money.format(Number(item.line_total))}</div>)}</div>
                    {order.comment && <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">{order.comment}</p>}
                  </div>
                  <div className="min-w-52 text-right">
                    <div className="mb-3 text-xl font-semibold">{money.format(Number(order.total))}</div>
                    <div className="flex items-center justify-end gap-2">
                      <select value={order.status} onChange={(event) => updateOrder(order.id, event.target.value as OrderStatus)} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm">
                        {Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                      </select>
                      {saved === order.id && <Check size={18} className="text-emerald-600" />}
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div>
            <form onSubmit={(event) => { event.preventDefault(); loadDashboard(query); }} className="mb-4 flex max-w-xl gap-2">
              <div className="relative flex-1"><Search className="absolute left-3 top-3 text-slate-400" size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Название, SKU или бренд" className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-4 outline-none focus:border-slate-950" /></div>
              <button className="rounded-xl bg-slate-950 px-5 text-sm font-medium text-white">Найти</button>
            </form>
            <div className="mb-3 text-sm text-slate-500">Найдено: {products?.total ?? 0}</div>
            <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
              <table className="w-full min-w-[960px] text-left text-sm">
                <thead className="border-b bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="p-4">Товар</th><th className="p-4">Цена</th><th className="p-4">Старая цена</th><th className="p-4">Наличие</th><th className="p-4">Активен</th><th className="p-4"></th></tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {products?.items.map((product) => (
                    <tr key={product.slug} className={!product.active ? "opacity-60" : ""}>
                      <td className="p-4"><div className="flex items-center gap-3">{product.image ? <img src={productImageUrl(product.image)} alt="" className="h-12 w-12 rounded-lg border object-contain" /> : <div className="h-12 w-12 rounded-lg bg-slate-100" />}<div><div className="max-w-sm font-medium">{product.title}</div><div className="mt-1 text-xs text-slate-400">{product.sku} · {product.brand}</div></div></div></td>
                      <td className="p-4"><input type="number" min="0" step="0.01" value={product.price} onChange={(event) => changeProduct(product.slug, { price: event.target.value })} className="w-32 rounded-lg border px-3 py-2" /></td>
                      <td className="p-4"><input type="number" min="0" step="0.01" value={product.old_price ?? ""} onChange={(event) => changeProduct(product.slug, { old_price: event.target.value || null })} className="w-32 rounded-lg border px-3 py-2" /></td>
                      <td className="p-4"><input type="checkbox" checked={product.in_stock} onChange={(event) => changeProduct(product.slug, { in_stock: event.target.checked })} className="h-5 w-5 accent-slate-950" /></td>
                      <td className="p-4"><input type="checkbox" checked={product.active} onChange={(event) => changeProduct(product.slug, { active: event.target.checked })} className="h-5 w-5 accent-slate-950" /></td>
                      <td className="p-4"><button onClick={() => saveProduct(product)} className="inline-flex items-center gap-2 rounded-lg bg-slate-950 px-3 py-2 font-medium text-white">{saved === product.slug ? <Check size={16} /> : null} Сохранить</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
