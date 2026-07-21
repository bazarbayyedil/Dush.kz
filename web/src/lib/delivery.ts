"use client";

// Возим по Астане в будни; заказ после отсечки уезжает на следующий рабочий день.
const CUTOFF_HOUR = 18;
const MONTHS = [
  "января", "февраля", "марта", "апреля", "мая", "июня",
  "июля", "августа", "сентября", "октября", "ноября", "декабря",
];

function isWeekend(d: Date): boolean {
  const day = d.getDay();
  return day === 0 || day === 6;
}

function nextWorkday(from: Date): Date {
  const d = new Date(from);
  do {
    d.setDate(d.getDate() + 1);
  } while (isWeekend(d));
  return d;
}

export type DeliveryEstimate = {
  /** «завтра, 21 июля» или «в понедельник, 23 июля» */
  when: string;
  /** Успевает ли покупатель к сегодняшней отсечке. */
  beforeCutoff: boolean;
};

/** Дата доставки по Астане. now — параметр ради предсказуемых тестов. */
export function astanaDelivery(now: Date = new Date()): DeliveryEstimate {
  const beforeCutoff = !isWeekend(now) && now.getHours() < CUTOFF_HOUR;
  const target = nextWorkday(now);

  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const isTomorrow = target.toDateString() === tomorrow.toDateString();

  const date = `${target.getDate()} ${MONTHS[target.getMonth()]}`;
  const weekday = target.toLocaleDateString("ru-RU", { weekday: "long" });
  return {
    when: isTomorrow ? `завтра, ${date}` : `в ${weekday}, ${date}`,
    beforeCutoff,
  };
}
