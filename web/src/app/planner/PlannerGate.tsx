"use client";
import { useEffect, useState } from "react";
import { Lock } from "lucide-react";
import { Planner } from "./Planner";

// Хэш пароля, а не сам пароль: страница статическая, её исходник виден каждому.
// Хэш не мешает подобрать пароль перебором, но хотя бы не выкладывает строку,
// которую можно попробовать где-то ещё.
const HASH = "38a422fb14b6a2a094f7313cbb5a6d28f662e528ab016029b8185657dcc583f6";
const KEY = "dush-planner-ok";

async function sha256(s: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function PlannerGate() {
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const [pass, setPass] = useState("");
  const [err, setErr] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setOpen(sessionStorage.getItem(KEY) === "1");
    setReady(true);
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const ok = (await sha256(pass)) === HASH;
    setBusy(false);
    if (ok) {
      sessionStorage.setItem(KEY, "1");
      setOpen(true);
    } else {
      setErr(true);
      setPass("");
    }
  }

  if (!ready) return <div className="h-64" />;
  if (open) return <Planner />;

  return (
    <div className="max-w-sm mx-auto py-10">
      <div className="w-12 h-12 rounded-full bg-accent/10 text-accent flex items-center justify-center mb-5">
        <Lock size={22} />
      </div>
      <h2 className="text-xl font-semibold mb-2">Доступ по паролю</h2>
      <p className="text-sm text-muted-foreground mb-6">
        Планировщик открыт для дизайнеров и наших клиентов. Пароль спрашивайте у менеджера.
      </p>
      <form onSubmit={submit} className="grid gap-3">
        <input
          type="password"
          value={pass}
          onChange={(e) => {
            setPass(e.target.value);
            setErr(false);
          }}
          autoFocus
          placeholder="Пароль"
          aria-invalid={err}
          className={`w-full h-11 px-3 rounded-lg border bg-card outline-none focus-visible:ring-2 focus-visible:ring-accent/40 ${
            err ? "border-danger" : "border-border"
          }`}
        />
        {err && <p className="text-sm text-danger">Пароль не подошёл. Проверьте раскладку и регистр.</p>}
        <button
          type="submit"
          disabled={!pass || busy}
          className="h-11 rounded-lg bg-accent text-accent-foreground font-medium hover:bg-accent-hover transition-colors disabled:opacity-50"
        >
          {busy ? "Проверяем…" : "Войти"}
        </button>
      </form>
    </div>
  );
}
