"use client";
import { useCallback, useEffect, useState } from "react";
import { Search } from "lucide-react";
import {
  api, PERM, STATUS_ORDER, STATUS_TITLES, type OrderRow, type OrderStatus, type UserRow,
} from "@/lib/admin/api";
import { useCan } from "@/lib/admin/session";
import {
  Card, Empty, ErrorNote, Money, PageTitle, PaymentBadge, StatusBadge, formatDate, inputClass,
} from "@/components/admin/ui";
import { OrderDrawer } from "@/components/admin/OrderDrawer";

type Page = { items: OrderRow[]; total: number; page: number; page_size: number };

export default function OrdersPage() {
  const can = useCan();
  const [status, setStatus] = useState<OrderStatus | "">("");
  const [query, setQuery] = useState("");
  const [term, setTerm] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<Page | null>(null);
  const [staff, setStaff] = useState<UserRow[]>([]);
  const [open, setOpen] = useState<string | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    const params = new URLSearchParams({ page: String(page), page_size: "50" });
    if (status) params.set("status", status);
    if (term) params.set("q", term);
    api
      .get<Page>(`/orders?${params}`)
      .then(setData)
      .catch((e) => setError(e.message));
  }, [page, status, term]);

  useEffect(() => {
    if (!can(PERM.ordersView)) return;
    load();
    api.get<UserRow[]>("/users/assignable").then(setStaff).catch(() => undefined);
  }, [load, can]);

  useEffect(() => {
    const id = setTimeout(() => {
      setTerm(query.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(id);
  }, [query]);

  if (!can(PERM.ordersView)) {
    return (
      <>
        <PageTitle title="Заказы" />
        <Empty>У вашей роли нет доступа к заказам.</Empty>
      </>
    );
  }

  const pages = data ? Math.ceil(data.total / data.page_size) : 0;

  return (
    <>
      <PageTitle title="Заказы" note={data ? `${data.total} за выбранным фильтром` : undefined} />
      <ErrorNote error={error} />

      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Имя или телефон клиента"
            className={`${inputClass} pl-9`}
          />
        </div>
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as OrderStatus | "");
            setPage(1);
          }}
          className={`${inputClass} w-auto`}
        >
          <option value="">Все статусы</option>
          {STATUS_ORDER.map((value) => (
            <option key={value} value={value}>
              {STATUS_TITLES[value]}
            </option>
          ))}
        </select>
      </div>

      <Card className="overflow-hidden">
        {!data ? (
          <Empty>Загрузка…</Empty>
        ) : data.items.length === 0 ? (
          <Empty>Заказов нет</Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-muted-foreground text-left bg-muted/50">
                <tr>
                  <th className="p-3 font-medium">Дата</th>
                  <th className="p-3 font-medium">Клиент</th>
                  <th className="p-3 font-medium">Город</th>
                  <th className="p-3 font-medium text-right">Сумма</th>
                  <th className="p-3 font-medium">Статус</th>
                  <th className="p-3 font-medium">Ответственный</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.items.map((order) => (
                  <tr
                    key={order.id}
                    onClick={() => setOpen(order.id)}
                    className="cursor-pointer hover:bg-muted/40"
                  >
                    <td className="p-3 whitespace-nowrap text-muted-foreground">
                      {formatDate(order.created_at)}
                    </td>
                    <td className="p-3">
                      <div>{order.customer_name}</div>
                      <div className="text-xs text-muted-foreground">{order.phone}</div>
                    </td>
                    <td className="p-3 text-muted-foreground">{order.city || "—"}</td>
                    <td className="p-3 text-right whitespace-nowrap">
                      <Money value={order.total} />
                      <div><PaymentBadge status={order.payment_status} /></div>
                    </td>
                    <td className="p-3">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="p-3 text-muted-foreground whitespace-nowrap">
                      {order.manager_name || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {pages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-4 text-sm">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-3 py-1.5 rounded-lg border border-border disabled:opacity-40"
          >
            Назад
          </button>
          <span className="text-muted-foreground">
            {page} из {pages}
          </span>
          <button
            disabled={page >= pages}
            onClick={() => setPage((p) => p + 1)}
            className="px-3 py-1.5 rounded-lg border border-border disabled:opacity-40"
          >
            Дальше
          </button>
        </div>
      )}

      {open && (
        <OrderDrawer
          orderId={open}
          staff={staff}
          onClose={() => setOpen(null)}
          onChanged={load}
        />
      )}
    </>
  );
}
