"use client";
import { useEffect } from "react";
import { create } from "zustand";
import { api, ApiError, type Me } from "./api";

type State = {
  me: Me | null;
  loading: boolean;
  error: string;
  load: () => Promise<void>;
  signIn: (login: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

export const useSession = create<State>((set) => ({
  me: null,
  loading: true,
  error: "",
  load: async () => {
    try {
      set({ me: await api.get<Me>("/me"), loading: false, error: "" });
    } catch {
      set({ me: null, loading: false });
    }
  },
  signIn: async (login, password) => {
    set({ error: "" });
    try {
      set({ me: await api.post<Me>("/login", { login, password }) });
    } catch (e) {
      set({ error: e instanceof ApiError ? e.message : "Не удалось войти" });
      throw e;
    }
  },
  signOut: async () => {
    await api.post("/logout").catch(() => undefined);
    set({ me: null });
  },
}));

/** Права проверяются и здесь, и на сервере: интерфейс лишь прячет лишнее. */
export function useCan() {
  const me = useSession((s) => s.me);
  return (permission: string) => !!me?.permissions.includes(permission);
}

export function useLoadSession() {
  const load = useSession((s) => s.load);
  useEffect(() => {
    void load();
  }, [load]);
}
