"use client";
import { useCallback, useEffect, useState } from "react";
import { api, PERM, type RoleRow, type UserRow } from "@/lib/admin/api";
import { useCan, useSession } from "@/lib/admin/session";
import { Card, Empty, ErrorNote, Field, PageTitle, formatDate, inputClass } from "@/components/admin/ui";

export default function UsersPage() {
  const can = useCan();
  const me = useSession((s) => s.me);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [perms, setPerms] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleRow | null>(null);

  const load = useCallback(() => {
    Promise.all([
      api.get<UserRow[]>("/users"),
      api.get<RoleRow[]>("/roles"),
      api.get<Record<string, string>>("/permissions"),
    ])
      .then(([u, r, p]) => {
        setUsers(u);
        setRoles(r);
        setPerms(p);
      })
      .catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    if (can(PERM.usersManage)) load();
  }, [load, can]);

  if (!can(PERM.usersManage)) {
    return (
      <>
        <PageTitle title="Сотрудники" />
        <Empty>Управление сотрудниками доступно только владельцу.</Empty>
      </>
    );
  }

  const roleTitle = (id: number) => roles.find((r) => r.id === id)?.title ?? "—";

  const patchUser = async (id: number, patch: Record<string, unknown>) => {
    try {
      await api.patch(`/users/${id}`, patch);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось сохранить");
    }
  };

  return (
    <>
      <PageTitle title="Сотрудники" note="Доступ в панель и права ролей" />
      <ErrorNote error={error} />

      <div className="flex justify-end mb-4">
        <button
          onClick={() => setCreating(true)}
          className="px-4 py-2 rounded-lg bg-accent text-accent-foreground text-sm font-medium"
        >
          Добавить сотрудника
        </button>
      </div>

      <Card className="overflow-hidden mb-8">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs text-muted-foreground text-left bg-muted/50">
              <tr>
                <th className="p-3 font-medium">Сотрудник</th>
                <th className="p-3 font-medium">Роль</th>
                <th className="p-3 font-medium">Последний вход</th>
                <th className="p-3 font-medium">Доступ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map((user) => (
                <tr key={user.id} className={user.active ? "" : "opacity-55"}>
                  <td className="p-3">
                    <div>{user.name || user.login}</div>
                    <div className="text-xs text-muted-foreground">{user.login}</div>
                  </td>
                  <td className="p-3">
                    <select
                      value={user.role_id}
                      onChange={(e) => void patchUser(user.id, { role_id: Number(e.target.value) })}
                      className={`${inputClass} w-auto py-1`}
                    >
                      {roles.map((role) => (
                        <option key={role.id} value={role.id}>
                          {role.title}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="p-3 text-muted-foreground whitespace-nowrap">
                    {user.last_login_at ? formatDate(user.last_login_at) : "не входил"}
                  </td>
                  <td className="p-3">
                    {user.id === me?.id ? (
                      <span className="text-xs text-muted-foreground">это вы</span>
                    ) : (
                      <button
                        onClick={() => void patchUser(user.id, { active: !user.active })}
                        className={`text-sm hover:underline ${user.active ? "text-danger" : "text-success"}`}
                      >
                        {user.active ? "Заблокировать" : "Разблокировать"}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <h2 className="text-lg font-semibold mb-3">Роли и права</h2>
      <div className="grid md:grid-cols-2 gap-4">
        {roles.map((role) => (
          <Card key={role.id} className="p-4">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div>
                <div className="font-medium">{role.title}</div>
                <div className="text-xs text-muted-foreground">
                  {role.system ? "системная роль, полный доступ" : `${role.permissions.length} прав`}
                </div>
              </div>
              {!role.system && (
                <button onClick={() => setEditingRole(role)} className="text-sm text-accent hover:underline">
                  Настроить
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {role.permissions.slice(0, 6).map((key) => (
                <span key={key} className="px-2 py-0.5 rounded bg-muted text-xs text-muted-foreground">
                  {perms[key] ?? key}
                </span>
              ))}
              {role.permissions.length > 6 && (
                <span className="px-2 py-0.5 text-xs text-muted-foreground">
                  и ещё {role.permissions.length - 6}
                </span>
              )}
            </div>
          </Card>
        ))}
      </div>

      {creating && (
        <NewUserDialog
          roles={roles}
          onClose={() => setCreating(false)}
          onCreated={() => {
            setCreating(false);
            load();
          }}
        />
      )}
      {editingRole && (
        <RoleDialog
          role={editingRole}
          permissions={perms}
          onClose={() => setEditingRole(null)}
          onSaved={() => {
            setEditingRole(null);
            load();
          }}
        />
      )}
    </>
  );
}

function NewUserDialog({
  roles,
  onClose,
  onCreated,
}: {
  roles: RoleRow[];
  onClose: () => void;
  onCreated: () => void;
}) {
  const [login, setLogin] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [roleId, setRoleId] = useState(roles.find((r) => !r.system)?.id ?? roles[0]?.id ?? 0);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api.post("/users", { login: login.trim(), name: name.trim(), password, role_id: roleId });
      onCreated();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось создать");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog title="Новый сотрудник" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <ErrorNote error={error} />
        <Field label="Логин (латиница, без пробелов)">
          <input value={login} onChange={(e) => setLogin(e.target.value)} className={inputClass} autoFocus />
        </Field>
        <Field label="Имя">
          <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
        </Field>
        <Field label="Пароль (минимум 10 символов)">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
            autoComplete="new-password"
          />
        </Field>
        <Field label="Роль">
          <select value={roleId} onChange={(e) => setRoleId(Number(e.target.value))} className={inputClass}>
            {roles.map((role) => (
              <option key={role.id} value={role.id}>
                {role.title}
              </option>
            ))}
          </select>
        </Field>
        <p className="text-xs text-muted-foreground">
          Пароль передайте сотруднику лично — здесь он больше не отобразится.
        </p>
        <div className="flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border border-border text-sm">
            Отмена
          </button>
          <button
            type="submit"
            disabled={busy || login.length < 3 || password.length < 10}
            className="px-4 py-2 rounded-lg bg-accent text-accent-foreground text-sm font-medium disabled:opacity-50"
          >
            Создать
          </button>
        </div>
      </form>
    </Dialog>
  );
}

function RoleDialog({
  role,
  permissions,
  onClose,
  onSaved,
}: {
  role: RoleRow;
  permissions: Record<string, string>;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [selected, setSelected] = useState<string[]>(role.permissions);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const toggle = (key: string) =>
    setSelected((list) => (list.includes(key) ? list.filter((k) => k !== key) : [...list, key]));

  const save = async () => {
    setBusy(true);
    try {
      await api.put(`/roles/${role.id}`, { title: role.title, permissions: selected });
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось сохранить");
      setBusy(false);
    }
  };

  return (
    <Dialog title={`Права роли «${role.title}»`} onClose={onClose}>
      <ErrorNote error={error} />
      <div className="space-y-2 mb-5">
        {Object.entries(permissions).map(([key, title]) => (
          <label key={key} className="flex items-center gap-2.5 text-sm">
            <input type="checkbox" checked={selected.includes(key)} onChange={() => toggle(key)} />
            {title}
          </label>
        ))}
      </div>
      <div className="flex justify-end gap-3">
        <button onClick={onClose} className="px-4 py-2 rounded-lg border border-border text-sm">
          Отмена
        </button>
        <button
          onClick={() => void save()}
          disabled={busy}
          className="px-4 py-2 rounded-lg bg-accent text-accent-foreground text-sm font-medium disabled:opacity-50"
        >
          Сохранить
        </button>
      </div>
    </Dialog>
  );
}

function Dialog({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-card w-full max-w-md rounded-2xl p-5 my-4">
        <h2 className="font-semibold mb-4">{title}</h2>
        {children}
      </div>
    </div>
  );
}
