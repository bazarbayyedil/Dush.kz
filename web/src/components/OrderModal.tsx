"use client";
import { useEffect, useState } from "react";
import { useOrder, useCart } from "@/lib/cart";
import { formatPrice } from "@/lib/format";

// Корпоративный номер для приёма заявок (WhatsApp), междунар. формат без +
const WHATSAPP_NUMBER = "77022525438";

export function OrderModal() {
  const { isOpen, items, fromCart, close } = useOrder();
  const clearCart = useCart((s) => s.clear);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [comment, setComment] = useState("");
  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({});
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      setSent(false);
      setErrors({});
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  if (!isOpen) return null;

  const total = items.reduce((s, i) => s + i.price * i.qty, 0);

  const validate = () => {
    const e: { name?: string; phone?: string } = {};
    if (!name.trim()) e.name = "Укажите имя";
    const digits = phone.replace(/\D/g, "");
    if (!digits) e.phone = "Укажите телефон";
    else if (digits.length < 10) e.phone = "Телефон слишком короткий";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = () => {
    if (!validate()) return;
    const lines = items.map((i) => `• ${i.title} — ${i.qty} шт × ${formatPrice(i.price)} = ${formatPrice(i.price * i.qty)}`);
    const text =
      `Новый заказ — dush.kz\n\n` +
      `Имя: ${name.trim()}\n` +
      `Телефон: ${phone.trim()}\n` +
      (city.trim() ? `Город: ${city.trim()}\n` : "") +
      (comment.trim() ? `Комментарий: ${comment.trim()}\n` : "") +
      `\nТовары:\n${lines.join("\n")}\n\nИтого: ${formatPrice(total)}`;
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank", "noopener");
    if (fromCart) clearCart();
    setSent(true);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={close} aria-hidden />
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <header className="flex items-center justify-between px-5 py-4 border-b border-border sticky top-0 bg-white">
          <h2 className="text-lg font-semibold">{sent ? "Заявка принята" : "Оформление заказа"}</h2>
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
            <p className="font-medium">Заявка сформирована</p>
            <p className="text-sm text-muted-foreground">
              Открылся WhatsApp с деталями заказа — отправьте сообщение, менеджер свяжется с вами.
              Если чат не открылся, позвоните нам.
            </p>
            <button onClick={close} className="mt-2 px-5 py-2.5 bg-accent text-accent-foreground rounded-lg font-medium hover:bg-accent-hover">
              Готово
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
              <label className="block text-sm mb-1">Имя <span className="text-danger">*</span></label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={80}
                className={`w-full px-3 py-2 rounded-lg border bg-white focus:outline-none focus:border-accent ${errors.name ? "border-danger" : "border-border"}`}
                placeholder="Ваше имя"
              />
              {errors.name && <p className="text-xs text-danger mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm mb-1">Телефон <span className="text-danger">*</span></label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                inputMode="tel"
                maxLength={20}
                className={`w-full px-3 py-2 rounded-lg border bg-white focus:outline-none focus:border-accent ${errors.phone ? "border-danger" : "border-border"}`}
                placeholder="+7 700 000 00 00"
              />
              {errors.phone && <p className="text-xs text-danger mt-1">{errors.phone}</p>}
            </div>

            <div>
              <label className="block text-sm mb-1">Город</label>
              <input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                maxLength={60}
                className="w-full px-3 py-2 rounded-lg border border-border bg-white focus:outline-none focus:border-accent"
                placeholder="Город доставки"
              />
            </div>

            <div>
              <label className="block text-sm mb-1">Комментарий</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                maxLength={500}
                rows={2}
                className="w-full px-3 py-2 rounded-lg border border-border bg-white focus:outline-none focus:border-accent resize-none"
                placeholder="Адрес, удобное время и т.д."
              />
            </div>

            <button
              onClick={submit}
              className="w-full py-3 bg-accent text-accent-foreground rounded-lg font-medium hover:bg-accent-hover transition-colors"
            >
              Отправить заказ
            </button>
            <p className="text-xs text-muted-foreground text-center">
              Нажимая «Отправить», вы соглашаетесь, что менеджер свяжется с вами для подтверждения.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
