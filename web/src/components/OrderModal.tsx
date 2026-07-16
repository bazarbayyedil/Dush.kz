"use client";
import { useEffect, useState } from "react";
import { useOrder, useCart } from "@/lib/cart";
import { formatPrice } from "@/lib/format";
import { ymGoal } from "@/lib/metrika";
import { useT } from "@/lib/i18n";

// Корпоративный номер для приёма заявок (WhatsApp), междунар. формат без +
const WHATSAPP_NUMBER = "77022525438";

// Мобильные коды операторов Казахстана (после +7). Национальный номер — 7XX XXX XX XX.
const KZ_MOBILE = new Set([
  "700", "701", "702", "703", "704", "705", "706", "707", "708", "709",
  "747", "750", "751", "760", "761", "762", "763", "764",
  "771", "775", "776", "777", "778",
]);

// Из произвольного ввода оставляем только 10 цифр национального номера.
// Ведущая «7» (от префикса +7) или «8» отбрасывается.
function toNational(raw: string): string {
  let d = raw.replace(/\D/g, "");
  if (d.startsWith("7") || d.startsWith("8")) d = d.slice(1);
  return d.slice(0, 10);
}

// Маска отображения: +7 7XX XXX XX XX
function formatKzPhone(nat: string): string {
  let s = "+7";
  if (nat.length > 0) s += " " + nat.slice(0, 3);
  if (nat.length > 3) s += " " + nat.slice(3, 6);
  if (nat.length > 6) s += " " + nat.slice(6, 8);
  if (nat.length > 8) s += " " + nat.slice(8, 10);
  return s;
}

export function OrderModal() {
  const { isOpen, items, fromCart, close } = useOrder();
  const clearCart = useCart((s) => s.clear);
  const t = useT();

  const [name, setName] = useState("");
  const [phoneNat, setPhoneNat] = useState("");
  const [city, setCity] = useState("");
  const [comment, setComment] = useState("");
  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({});
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [orderId, setOrderId] = useState("");

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      setSent(false);
      setSending(false);
      setSubmitError("");
      setOrderId("");
      setErrors({});
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  if (!isOpen) return null;

  const total = items.reduce((s, i) => s + i.price * i.qty, 0);
  const phoneDisplay = formatKzPhone(phoneNat);
  const phoneValid = phoneNat.length === 10 && KZ_MOBILE.has(phoneNat.slice(0, 3));

  const validate = () => {
    const e: { name?: string; phone?: string } = {};
    if (!name.trim()) e.name = t("order.err_name");
    if (phoneNat.length === 0) e.phone = t("order.err_phone");
    else if (phoneNat.length < 10) e.phone = t("order.err_phone_short");
    else if (!KZ_MOBILE.has(phoneNat.slice(0, 3))) e.phone = t("order.err_phone_op");
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async () => {
    if (!validate()) return;
    setSending(true);
    setSubmitError("");
    try {
      const response = await fetch("/api/v1/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_name: name,
          phone: phoneDisplay,
          city,
          comment,
          items: items.map((item) => ({ slug: item.slug, quantity: item.qty })),
        }),
      });
      if (!response.ok) throw new Error("order request failed");
      const order: { id: string } = await response.json();
      setOrderId(order.id);

    const lines = items.map((i) => `• ${i.title} — ${i.qty} шт × ${formatPrice(i.price)} = ${formatPrice(i.price * i.qty)}`);
    const text =
      `Новый заказ ${order.id} — dush.kz\n\n` +
      `Имя: ${name.trim()}\n` +
      `Телефон: ${phoneDisplay}\n` +
      (city.trim() ? `Город: ${city.trim()}\n` : "") +
      (comment.trim() ? `Комментарий: ${comment.trim()}\n` : "") +
      `\nТовары:\n${lines.join("\n")}\n\nИтого: ${formatPrice(total)}`;
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank", "noopener");
    ymGoal("order_whatsapp", { order_id: order.id, total });
    if (fromCart) clearCart();
    setSent(true);
    } catch {
      setSubmitError(t("order.err_save"));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={close} aria-hidden />
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <header className="flex items-center justify-between px-5 py-4 border-b border-border sticky top-0 bg-white">
          <h2 className="text-lg font-semibold">{sent ? t("order.accepted") : t("order.title")}</h2>
          <button onClick={close} className="p-2 rounded-lg hover:bg-muted" aria-label="Закрыть">
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </header>

        {sent ? (
          <div className="p-6 text-center space-y-3">
            <div className="w-14 h-14 mx-auto rounded-full bg-success/10 flex items-center justify-center">
              <svg width="30" height="30" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="text-success">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="font-medium">{t("order.formed")}</p>
            {orderId && <p className="text-xs text-muted-foreground">{t("order.number")}: {orderId}</p>}
            <p className="text-sm text-muted-foreground">{t("order.wa_hint")}</p>
            <button onClick={close} className="mt-2 px-5 py-2.5 bg-accent text-accent-foreground rounded-lg font-medium hover:bg-accent-hover">
              {t("order.done")}
            </button>
          </div>
        ) : (
          <div className="p-5 space-y-4">
            <div className="rounded-lg bg-muted p-3 text-sm space-y-1 max-h-32 overflow-y-auto">
              {items.map((i, idx) => (
                <div key={idx} className="flex justify-between gap-2">
                  <span className="line-clamp-1 text-muted-foreground">{i.title} × {i.qty}</span>
                  <span className="shrink-0">{formatPrice(i.price * i.qty)}</span>
                </div>
              ))}
              <div className="flex justify-between pt-1 border-t border-border font-semibold">
                <span>Итого</span>
                <span>{formatPrice(total)}</span>
              </div>
            </div>

            <div>
              <label className="block text-sm mb-1">{t("order.name")} <span className="text-danger">*</span></label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={80}
                className={`w-full px-3 py-2 rounded-lg border bg-white focus:outline-none focus:border-accent ${errors.name ? "border-danger" : "border-border"}`}
                placeholder={t("order.your_name")}
              />
              {errors.name && <p className="text-xs text-danger mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm mb-1">{t("order.phone")} <span className="text-danger">*</span></label>
              <input
                value={phoneDisplay}
                onChange={(e) => setPhoneNat(toNational(e.target.value))}
                onFocus={(e) => e.currentTarget.setSelectionRange(e.currentTarget.value.length, e.currentTarget.value.length)}
                inputMode="numeric"
                maxLength={18}
                className={`w-full px-3 py-2 rounded-lg border bg-white focus:outline-none focus:border-accent ${errors.phone ? "border-danger" : "border-border"}`}
                placeholder="+7 700 000 00 00"
              />
              {errors.phone
                ? <p className="text-xs text-danger mt-1">{errors.phone}</p>
                : phoneNat.length > 0 && !phoneValid && <p className="text-xs text-muted-foreground mt-1">{t("order.phone_hint")}</p>}
            </div>

            <div>
              <label className="block text-sm mb-1">{t("order.city")}</label>
              <input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                maxLength={60}
                className="w-full px-3 py-2 rounded-lg border border-border bg-white focus:outline-none focus:border-accent"
                placeholder={t("order.city_ph")}
              />
            </div>

            <div>
              <label className="block text-sm mb-1">{t("order.comment")}</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                maxLength={500}
                rows={2}
                className="w-full px-3 py-2 rounded-lg border border-border bg-white focus:outline-none focus:border-accent resize-none"
                placeholder={t("order.comment_ph")}
              />
            </div>

            <button
              onClick={submit}
              disabled={sending}
              className="w-full py-3 bg-accent text-accent-foreground rounded-lg font-medium hover:bg-accent-hover transition-colors"
            >
              {sending ? t("order.sending") : t("order.send")}
            </button>
            {submitError && <p role="alert" className="text-sm text-danger text-center">{submitError}</p>}
            <p className="text-xs text-muted-foreground text-center">{t("order.agree")}</p>
          </div>
        )}
      </div>
    </div>
  );
}
