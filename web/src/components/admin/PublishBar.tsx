"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, CloudUpload, Loader2 } from "lucide-react";
import { api, PERM } from "@/lib/admin/api";
import { useCan } from "@/lib/admin/session";
import { formatDate } from "./ui";

type State = {
  state: "idle" | "queued" | "running" | "done" | "failed" | "unknown";
  message: string;
  at: string;
  edited_products: number;
  last_edit_at: string | null;
  can_publish: boolean;
};

const BUSY = new Set(["queued", "running"]);

export function PublishBar() {
  const can = useCan();
  const [info, setInfo] = useState<State | null>(null);
  const [error, setError] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async () => {
    try {
      const next = await api.get<State>("/publish");
      setInfo(next);
      // Пока идёт сборка, опрашиваем чаще: она занимает несколько минут.
      timer.current = setTimeout(load, BUSY.has(next.state) ? 5000 : 60000);
    } catch {
      timer.current = setTimeout(load, 60000);
    }
  }, []);

  useEffect(() => {
    if (!can(PERM.catalogView)) return;
    void load();
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [load, can]);

  if (!info || !can(PERM.catalogView)) return null;

  const busy = BUSY.has(info.state);
  const publish = async () => {
    setError("");
    try {
      setInfo({ ...info, state: "queued", message: "Запрос принят" });
      await api.post("/publish");
      void load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось запустить публикацию");
      void load();
    }
  };

  return (
    <div className="mb-5 rounded-xl border border-border bg-card px-4 py-3 flex flex-wrap items-center gap-3">
      <Indicator state={info.state} busy={busy} />

      <div className="flex-1 min-w-[200px] text-sm">
        <div className="font-medium">
          {busy
            ? info.message || "Публикуем…"
            : info.edited_products > 0
              ? `Правок в каталоге: ${info.edited_products}`
              : "Изменений нет"}
        </div>
        <div className="text-xs text-muted-foreground">
          {error ? (
            <span className="text-danger">{error}</span>
          ) : info.state === "failed" ? (
            <span className="text-danger">{info.message || "Публикация не прошла"}</span>
          ) : info.state === "done" && info.at ? (
            `Опубликовано ${formatDate(info.at)}`
          ) : info.last_edit_at ? (
            `Последняя правка ${formatDate(info.last_edit_at)}`
          ) : (
            "Изменения появятся на сайте после публикации"
          )}
        </div>
      </div>

      {info.can_publish && (
        <button
          onClick={publish}
          disabled={busy}
          className="px-4 py-2 rounded-lg bg-accent text-accent-foreground text-sm font-medium disabled:opacity-50 inline-flex items-center gap-2"
        >
          {busy ? <Loader2 size={15} className="animate-spin" /> : <CloudUpload size={15} />}
          {busy ? "Публикуем…" : "Опубликовать на сайт"}
        </button>
      )}
    </div>
  );
}

function Indicator({ state, busy }: { state: string; busy: boolean }) {
  if (busy) {
    return (
      <span className="w-9 h-9 rounded-lg bg-accent/10 text-accent grid place-items-center shrink-0">
        <Loader2 size={17} className="animate-spin" />
      </span>
    );
  }
  if (state === "failed") {
    return (
      <span className="w-9 h-9 rounded-lg bg-danger/10 text-danger grid place-items-center shrink-0">
        <AlertCircle size={17} />
      </span>
    );
  }
  return (
    <span className="w-9 h-9 rounded-lg bg-success/10 text-success grid place-items-center shrink-0">
      <CheckCircle2 size={17} />
    </span>
  );
}
