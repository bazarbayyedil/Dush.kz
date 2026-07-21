"use client";
import { useEffect, useState } from "react";
import { api, PERM, type AuditRow } from "@/lib/admin/api";
import { useCan } from "@/lib/admin/session";
import { Card, Empty, ErrorNote, PageTitle, formatDate, inputClass } from "@/components/admin/ui";

const ENTITIES = [
  { value: "", title: "Всё" },
  { value: "product", title: "Товары" },
  { value: "order", title: "Заказы" },
  { value: "user", title: "Сотрудники" },
  { value: "role", title: "Роли" },
];

const ACTIONS: Record<string, string> = {
  update: "изменил",
  create: "создал",
  delete: "удалил",
  status: "сменил статус",
  items: "изменил состав",
};

const ENTITY_NAMES: Record<string, string> = {
  product: "товар",
  order: "заказ",
  user: "сотрудника",
  role: "роль",
};

export default function AuditPage() {
  const can = useCan();
  const [entity, setEntity] = useState("");
  const [rows, setRows] = useState<AuditRow[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!can(PERM.auditView)) return;
    api
      .get<AuditRow[]>(`/audit?limit=200${entity ? `&entity=${entity}` : ""}`)
      .then(setRows)
      .catch((e) => setError(e.message));
  }, [entity, can]);

  if (!can(PERM.auditView)) {
    return (
      <>
        <PageTitle title="Журнал действий" />
        <Empty>У вашей роли нет доступа к журналу.</Empty>
      </>
    );
  }

  return (
    <>
      <PageTitle title="Журнал действий" note="Кто и что менял в панели" />
      <ErrorNote error={error} />

      <select value={entity} onChange={(e) => setEntity(e.target.value)} className={`${inputClass} w-auto mb-4`}>
        {ENTITIES.map((item) => (
          <option key={item.value} value={item.value}>
            {item.title}
          </option>
        ))}
      </select>

      <Card className="overflow-hidden">
        {!rows ? (
          <Empty>Загрузка…</Empty>
        ) : rows.length === 0 ? (
          <Empty>Записей нет</Empty>
        ) : (
          <ul className="divide-y divide-border">
            {rows.map((row) => (
              <li key={row.id} className="p-4">
                <div className="flex flex-wrap items-baseline gap-x-2 text-sm">
                  <span className="font-medium">{row.user_login}</span>
                  <span className="text-muted-foreground">
                    {ACTIONS[row.action] ?? row.action} {ENTITY_NAMES[row.entity] ?? row.entity}
                  </span>
                  <span className="text-muted-foreground">#{row.entity_id}</span>
                  <span className="ml-auto text-xs text-muted-foreground">{formatDate(row.created_at)}</span>
                </div>
                {Object.keys(row.changes).length > 0 && (
                  <ul className="mt-1.5 space-y-0.5">
                    {Object.entries(row.changes).map(([field, change]) => (
                      <li key={field} className="text-xs text-muted-foreground">
                        <span className="text-foreground">{field}</span>: {display(change.from)} →{" "}
                        {display(change.to)}
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}

function display(value: unknown): string {
  if (value === null || value === undefined || value === "") return "пусто";
  if (typeof value === "boolean") return value ? "да" : "нет";
  if (Array.isArray(value)) return `${value.length} эл.`;
  const text = String(value);
  return text.length > 80 ? `${text.slice(0, 80)}…` : text;
}
