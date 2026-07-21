"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3, ClipboardList, LogOut, Package, ScrollText, Users,
} from "lucide-react";
import { PERM } from "@/lib/admin/api";
import { useCan, useLoadSession, useSession } from "@/lib/admin/session";

const NAV = [
  { href: "/admin", title: "Сводка", icon: BarChart3, perm: PERM.analyticsView },
  { href: "/admin/orders", title: "Заказы", icon: ClipboardList, perm: PERM.ordersView },
  { href: "/admin/products", title: "Каталог", icon: Package, perm: PERM.catalogView },
  { href: "/admin/users", title: "Сотрудники", icon: Users, perm: PERM.usersManage },
  { href: "/admin/audit", title: "Журнал", icon: ScrollText, perm: PERM.auditView },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  useLoadSession();
  const { me, loading } = useSession();

  if (loading) {
    return <div className="min-h-screen grid place-items-center text-muted-foreground">Загрузка…</div>;
  }
  if (!me) return <SignIn />;
  return <Frame>{children}</Frame>;
}

function Frame({ children }: { children: React.ReactNode }) {
  const { me, signOut } = useSession();
  const can = useCan();
  const pathname = usePathname();
  const items = NAV.filter((item) => can(item.perm));

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-surface">
      <aside className="lg:w-60 shrink-0 bg-neutral-900 text-neutral-300 lg:min-h-screen">
        <div className="px-5 py-4 flex items-center justify-between lg:block">
          <div>
            <div className="text-white font-semibold">dush.kz</div>
            <div className="text-xs text-neutral-500">панель управления</div>
          </div>
          <Link href="/" className="text-xs text-neutral-400 hover:text-white lg:hidden">
            На сайт
          </Link>
        </div>
        <nav className="px-2 flex lg:flex-col gap-1 overflow-x-auto pb-2 lg:pb-0">
          {items.map(({ href, title, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm whitespace-nowrap transition-colors ${
                  active ? "bg-neutral-800 text-white" : "hover:bg-neutral-800/60 hover:text-white"
                }`}
              >
                <Icon size={16} />
                {title}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto hidden lg:block px-5 py-4 border-t border-neutral-800 text-xs">
          <div className="text-neutral-300">{me?.name || me?.login}</div>
          <div className="text-neutral-500 mb-3">{me?.role_title}</div>
          <div className="flex items-center gap-3">
            <Link href="/" className="hover:text-white">На сайт</Link>
            <button onClick={() => void signOut()} className="flex items-center gap-1 hover:text-white">
              <LogOut size={13} /> Выйти
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 min-w-0 p-4 lg:p-8">
        <div className="lg:hidden flex justify-end mb-3">
          <button
            onClick={() => void signOut()}
            className="text-xs text-muted-foreground flex items-center gap-1"
          >
            <LogOut size={13} /> Выйти
          </button>
        </div>
        {children}
      </main>
    </div>
  );
}

function SignIn() {
  const { signIn, error } = useSession();
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    try {
      await signIn(login.trim(), password);
    } catch {
      setPassword("");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center bg-surface px-4">
      <form onSubmit={submit} className="w-full max-w-sm bg-card border border-border rounded-2xl p-6 space-y-4">
        <div>
          <div className="text-lg font-semibold">Панель dush.kz</div>
          <div className="text-sm text-muted-foreground">Вход для сотрудников</div>
        </div>
        <label className="block">
          <span className="block text-sm mb-1">Логин</span>
          <input
            value={login}
            onChange={(e) => setLogin(e.target.value)}
            autoComplete="username"
            autoFocus
            className="w-full px-3 py-2 rounded-lg border border-border bg-background"
          />
        </label>
        <label className="block">
          <span className="block text-sm mb-1">Пароль</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            className="w-full px-3 py-2 rounded-lg border border-border bg-background"
          />
        </label>
        {error && <p role="alert" className="text-sm text-danger">{error}</p>}
        <button
          type="submit"
          disabled={busy || !login || !password}
          className="w-full py-2.5 rounded-lg bg-accent text-accent-foreground font-medium disabled:opacity-50"
        >
          {busy ? "Проверяем…" : "Войти"}
        </button>
      </form>
    </div>
  );
}
