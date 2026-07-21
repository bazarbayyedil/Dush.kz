"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { api, PERM, STATUS_TITLES, type OrderStatus, type Stats } from "@/lib/admin/api";
import { useCan } from "@/lib/admin/session";
import { Card, Empty, ErrorNote, Money, PageTitle } from "@/components/admin/ui";

const PERIODS = [
  { days: 7, title: "7 дней" },
  { days: 30, title: "30 дней" },
  { days: 90, title: "90 дней" },
];

export default function DashboardPage() {
  const can = useCan();
  const [days, setDays] = useState(30);
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!can(PERM.analyticsView)) return;
    api
      .get<Stats>(`/stats?days=${days}`)
      .then(setStats)
      .catch((e) => setError(e.message));
  }, [days, can]);

  if (!can(PERM.analyticsView)) {
    return (
      <>
        <PageTitle title="Сводка" />
        <Empty>
          У вашей роли нет доступа к аналитике. Перейдите в{" "}
          <Link href="/admin/orders" className="text-accent hover:underline">заказы</Link>.
        </Empty>
      </>
    );
  }

  return (
    <>
      <PageTitle title="Сводка" note="Показатели магазина за выбранный период" />
      <ErrorNote error={error} />

      <div className="flex gap-2 mb-5">
        {PERIODS.map((period) => (
          <button
            key={period.days}
            onClick={() => setDays(period.days)}
            className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
              days === period.days
                ? "bg-accent text-accent-foreground border-accent"
                : "border-border hover:bg-muted"
            }`}
          >
            {period.title}
          </button>
        ))}
      </div>

      {!stats ? (
        <Empty>Загрузка…</Empty>
      ) : (
        <div className="space-y-5">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Metric title="Выручка" value={<Money value={stats.revenue} />} note="подтверждённые заказы" />
            <Metric title="Заказов" value={stats.orders} note="всего за период" />
            <Metric title="Средний чек" value={<Money value={stats.average_check} />} />
            <Metric
              title="Отмены и возвраты"
              value={stats.cancelled}
              note={stats.orders ? `${Math.round((stats.cancelled / stats.orders) * 100)}% от заказов` : ""}
              alarming={stats.cancelled > 0}
            />
          </div>

          <div className="grid lg:grid-cols-2 gap-5">
            <Card className="p-5">
              <h2 className="font-semibold mb-3">Заказы по статусам</h2>
              {Object.keys(stats.by_status).length === 0 ? (
                <Empty>За период заказов не было</Empty>
              ) : (
                <ul className="space-y-2">
                  {Object.entries(stats.by_status)
                    .sort((a, b) => b[1] - a[1])
                    .map(([status, count]) => (
                      <li key={status} className="flex justify-between text-sm">
                        <span>{STATUS_TITLES[status as OrderStatus] ?? status}</span>
                        <span className="tabular-nums font-medium">{count}</span>
                      </li>
                    ))}
                </ul>
              )}
            </Card>

            <Card className="p-5">
              <h2 className="font-semibold mb-3">Причины отмен</h2>
              {stats.cancel_reasons.length === 0 ? (
                <Empty>Отмен за период нет</Empty>
              ) : (
                <ul className="space-y-2">
                  {stats.cancel_reasons.map((row) => (
                    <li key={row.reason} className="flex justify-between text-sm">
                      <span>{row.reason}</span>
                      <span className="tabular-nums font-medium">{row.count}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>

          <Card className="p-5">
            <h2 className="font-semibold mb-3">Топ товаров по выручке</h2>
            {stats.top_products.length === 0 ? (
              <Empty>Продаж за период нет</Empty>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-xs text-muted-foreground text-left">
                    <tr>
                      <th className="pb-2 font-medium">Товар</th>
                      <th className="pb-2 font-medium text-right">Шт.</th>
                      <th className="pb-2 font-medium text-right">Выручка</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {stats.top_products.map((row) => (
                      <tr key={row.title}>
                        <td className="py-2 pr-4">{row.title}</td>
                        <td className="py-2 text-right tabular-nums">{row.qty}</td>
                        <td className="py-2 text-right"><Money value={row.revenue} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          {stats.out_of_stock > 0 && can(PERM.catalogView) && (
            <Card className="p-4 flex items-center justify-between">
              <span className="text-sm">
                Опубликовано без наличия: <strong>{stats.out_of_stock}</strong> товаров
              </span>
              <Link
                href="/admin/products?out_of_stock=1"
                className="text-sm text-accent hover:underline shrink-0 ml-4"
              >
                Показать
              </Link>
            </Card>
          )}
        </div>
      )}
    </>
  );
}

function Metric({
  title,
  value,
  note,
  alarming,
}: {
  title: string;
  value: React.ReactNode;
  note?: string;
  alarming?: boolean;
}) {
  return (
    <Card className="p-4">
      <div className="text-xs text-muted-foreground mb-1">{title}</div>
      <div className={`text-xl font-semibold ${alarming ? "text-danger" : ""}`}>{value}</div>
      {note && <div className="text-xs text-muted-foreground mt-0.5">{note}</div>}
    </Card>
  );
}
