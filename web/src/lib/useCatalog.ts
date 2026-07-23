"use client";
import { useEffect, useState } from "react";
import type { CatalogItem } from "./catalog-core";

// Ленивая загрузка индекса каталога (2.8 МБ): статический JSON качается
// отдельно от JS-бандла, жмётся nginx-ом и кэшируется браузером.
// Модульный кэш — один запрос на сессию, сколько бы компонентов ни просило.

let cache: CatalogItem[] | null = null;
let inflight: Promise<CatalogItem[]> | null = null;
const listeners = new Set<(items: CatalogItem[]) => void>();

export function loadCatalog(): Promise<CatalogItem[]> {
  if (cache) return Promise.resolve(cache);
  if (!inflight) {
    inflight = fetch("/catalog-index.json")
      .then((r) => {
        if (!r.ok) throw new Error(String(r.status));
        return r.json();
      })
      .then((data: CatalogItem[]) => {
        cache = data;
        listeners.forEach((fn) => fn(data));
        return data;
      })
      .catch((e) => {
        inflight = null; // не залипать на неудачном запросе
        throw e;
      });
  }
  return inflight;
}

/**
 * Индекс каталога или null, пока не загружен.
 * eager=false — только подписка: загрузку должен запустить кто-то другой
 * (например, фокус в строке поиска). Так шапка не тянет 2.8 МБ на каждой
 * странице просто потому, что в ней есть поиск.
 */
export function useCatalog(eager = true): CatalogItem[] | null {
  const [items, setItems] = useState<CatalogItem[] | null>(cache);
  useEffect(() => {
    if (cache) {
      setItems(cache);
      return;
    }
    const fn = (data: CatalogItem[]) => setItems(data);
    listeners.add(fn);
    if (eager) loadCatalog().catch(() => {});
    return () => {
      listeners.delete(fn);
    };
  }, [eager]);
  return items;
}
