// Яндекс.Метрика: id счётчика и хелпер для целей (reachGoal).
export const YM_ID = 110791852;

type YmFn = (...args: unknown[]) => void;

// Отправка цели в Метрику. Безопасно, если счётчик ещё не загрузился.
export function ymGoal(goal: string, params?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  const ym = (window as unknown as { ym?: YmFn }).ym;
  if (typeof ym === "function") ym(YM_ID, "reachGoal", goal, params);
}
