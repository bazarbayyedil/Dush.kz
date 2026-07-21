"use client";
import { useEffect, useState } from "react";
import { MessageCircle, Phone, X } from "lucide-react";
import {
  api, PAYMENT_METHOD_TITLES, PERM, SHIPPING_TITLES, STATUS_ORDER, STATUS_TITLES,
  type OrderDetail, type OrderStatus, type UserRow,
} from "@/lib/admin/api";
import { useCan } from "@/lib/admin/session";
import { ErrorNote, Field, Money, PaymentBadge, StatusBadge, formatDate, inputClass } from "./ui";

const CLOSING: OrderStatus[] = ["cancelled", "returned"];

export function OrderDrawer({
  orderId,
  staff,
  onClose,
  onChanged,
}: {
  orderId: string;
  staff: UserRow[];
  onClose: () => void;
  onChanged: () => void;
}) {
  const can = useCan();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [reasons, setReasons] = useState<string[]>([]);
  const [reason, setReason] = useState("");
  const [pendingStatus, setPendingStatus] = useState<OrderStatus | null>(null);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const canProcess = can(PERM.ordersStatus);

  useEffect(() => {
    api
      .get<OrderDetail>(`/orders/${orderId}`)
      .then((o) => {
        setOrder(o);
        setNote(o.manager_note);
      })
      .catch((e) => setError(e.message));
    api.get<string[]>("/orders/cancel-reasons").then(setReasons).catch(() => undefined);
  }, [orderId]);

  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onEsc);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onEsc);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const applyStatus = async (next: OrderStatus, withReason = "") => {
    setBusy(true);
    setError("");
    try {
      const updated = await api.patch<OrderDetail>(`/orders/${orderId}/status`, {
        status: next,
        reason: withReason,
      });
      setOrder(updated);
      setPendingStatus(null);
      setReason("");
      onChanged();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось изменить статус");
    } finally {
      setBusy(false);
    }
  };

  const chooseStatus = (next: OrderStatus) => {
    if (CLOSING.includes(next)) return setPendingStatus(next);
    void applyStatus(next);
  };

  const saveManage = async (patch: Record<string, unknown>) => {
    setBusy(true);
    try {
      const updated = await api.patch<OrderDetail>(`/orders/${orderId}`, patch);
      setOrder(updated);
      onChanged();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось сохранить");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex justify-end">
      <div className="bg-card w-full max-w-lg h-full overflow-y-auto">
        <header className="flex items-center gap-3 px-5 py-4 border-b border-border sticky top-0 bg-card">
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold">Заказ</h2>
            {order && (
              <div className="text-xs text-muted-foreground">
                {formatDate(order.created_at)} · {order.id.slice(0, 8)}
              </div>
            )}
          </div>
          {order && <StatusBadge status={order.status} />}
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted" aria-label="Закрыть">
            <X size={18} />
          </button>
        </header>

        <div className="p-5 space-y-5">
          <ErrorNote error={error} />
          {!order ? (
            <div className="py-8 text-center text-sm text-muted-foreground">Загрузка…</div>
          ) : (
            <>
              <section>
                <div className="font-medium">{order.customer_name}</div>
                <div className="text-sm text-muted-foreground">
                  {order.city ? `${order.city} · ` : ""}
                  {order.phone}
                </div>
                <div className="flex gap-2 mt-2">
                  <a
                    href={`tel:${order.phone}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-sm"
                  >
                    <Phone size={14} /> Позвонить
                  </a>
                  <a
                    href={`https://wa.me/${order.phone.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noopener"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-sm"
                  >
                    <MessageCircle size={14} /> WhatsApp
                  </a>
                </div>
                <div className="flex gap-2 mt-3 text-xs">
                  <span className="px-2 py-1 rounded-lg bg-muted">
                    {SHIPPING_TITLES[order.shipping] ?? order.shipping}
                  </span>
                  <span className="px-2 py-1 rounded-lg bg-muted">
                    {PAYMENT_METHOD_TITLES[order.payment_method] ?? order.payment_method}
                  </span>
                </div>
                {order.comment && (
                  <p className="mt-3 text-sm bg-muted rounded-lg px-3 py-2">
                    <span className="text-muted-foreground">Комментарий клиента: </span>
                    {order.comment}
                  </p>
                )}
              </section>

              <section>
                <h3 className="text-sm font-semibold mb-2">Состав</h3>
                <ul className="divide-y divide-border border-y border-border">
                  {order.items.map((item) => (
                    <li key={item.slug} className="py-2.5 flex gap-3 text-sm">
                      <span className="flex-1">{item.title}</span>
                      <span className="text-muted-foreground whitespace-nowrap">{item.quantity} шт.</span>
                      <span className="whitespace-nowrap tabular-nums w-24 text-right">
                        <Money value={item.line_total} />
                      </span>
                    </li>
                  ))}
                </ul>
                <div className="flex justify-between pt-3 font-semibold">
                  <span>Итого</span>
                  <Money value={order.total} />
                </div>
                {can(PERM.ordersEdit) && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Изменить состав можно по согласованию с клиентом — напишите менеджеру каталога.
                  </p>
                )}
              </section>

              <section>
                <h3 className="text-sm font-semibold mb-2">Оплата</h3>
                <div className="rounded-lg border border-border p-3 text-sm space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Статус</span>
                    <PaymentBadge status={order.payment_status} />
                  </div>
                  {order.payments.length === 0 ? (
                    <p className="text-xs text-muted-foreground">
                      Онлайн-платежей по заказу нет — расчёт с менеджером.
                    </p>
                  ) : (
                    order.payments.map((payment) => (
                      <div key={payment.id} className="pt-1.5 border-t border-border space-y-1">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            {payment.card_type} {payment.card_mask || "карта"}
                          </span>
                          <Money value={payment.amount} />
                        </div>
                        {Number(payment.refunded_amount) > 0 && (
                          <div className="flex justify-between text-danger">
                            <span>Возвращено</span>
                            <Money value={payment.refunded_amount} />
                          </div>
                        )}
                        {payment.failure_reason && (
                          <div className="text-xs text-danger">{payment.failure_reason}</div>
                        )}
                        {payment.paid_at && (
                          <div className="text-xs text-muted-foreground">
                            Оплачен {formatDate(payment.paid_at)}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </section>

              {order.closing_reason && (
                <p className="text-sm bg-danger/10 text-danger rounded-lg px-3 py-2">
                  Причина: {order.closing_reason}
                </p>
              )}

              {canProcess ? (
                <>
                  <section>
                    <h3 className="text-sm font-semibold mb-2">Статус</h3>
                    <div className="flex flex-wrap gap-2">
                      {STATUS_ORDER.map((value) => (
                        <button
                          key={value}
                          disabled={busy || value === order.status}
                          onClick={() => chooseStatus(value)}
                          className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                            value === order.status
                              ? "bg-accent text-accent-foreground border-accent"
                              : "border-border hover:bg-muted disabled:opacity-50"
                          }`}
                        >
                          {STATUS_TITLES[value]}
                        </button>
                      ))}
                    </div>

                    {pendingStatus && (
                      <div className="mt-3 p-3 rounded-lg border border-border space-y-2">
                        <Field label={`Причина: ${STATUS_TITLES[pendingStatus]}`}>
                          <select
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className={inputClass}
                          >
                            <option value="">Выберите причину</option>
                            {reasons.map((item) => (
                              <option key={item} value={item}>
                                {item}
                              </option>
                            ))}
                          </select>
                        </Field>
                        <div className="flex gap-2">
                          <button
                            disabled={!reason || busy}
                            onClick={() => void applyStatus(pendingStatus, reason)}
                            className="px-3 py-1.5 rounded-lg bg-danger text-white text-sm disabled:opacity-50"
                          >
                            Подтвердить
                          </button>
                          <button
                            onClick={() => setPendingStatus(null)}
                            className="px-3 py-1.5 rounded-lg border border-border text-sm"
                          >
                            Отмена
                          </button>
                        </div>
                      </div>
                    )}
                  </section>

                  <Field label="Ответственный">
                    <select
                      value={order.manager_id ?? ""}
                      disabled={busy}
                      onChange={(e) =>
                        void saveManage({ manager_id: e.target.value ? Number(e.target.value) : null })
                      }
                      className={inputClass}
                    >
                      <option value="">Не назначен</option>
                      {staff.map((person) => (
                        <option key={person.id} value={person.id}>
                          {person.name || person.login}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field label="Внутренний комментарий">
                    <textarea
                      rows={3}
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      onBlur={() => note !== order.manager_note && void saveManage({ manager_note: note })}
                      placeholder="Виден только сотрудникам"
                      className={`${inputClass} resize-y`}
                    />
                  </Field>
                </>
              ) : (
                <p className="text-sm text-muted-foreground bg-muted rounded-lg px-4 py-2.5">
                  У вашей роли заказ доступен только для просмотра.
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
