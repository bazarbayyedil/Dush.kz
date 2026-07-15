"use client";
import { useState, useEffect, useCallback } from "react";

export function ProductGallery({ images, alt }: { images: string[]; alt: string }) {
  const [current, setCurrent] = useState(0);
  const [zoom, setZoom] = useState(false);
  const total = images.length;
  const main = images[current] || images[0];

  const go = useCallback(
    (dir: number) => {
      if (total === 0) return;
      setCurrent((c) => (c + dir + total) % total);
    },
    [total],
  );

  // Клавиатура в полноэкранном режиме
  useEffect(() => {
    if (!zoom) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
      else if (e.key === "Escape") setZoom(false);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [zoom, go]);

  if (total === 0) {
    return (
      <div className="aspect-square bg-muted rounded-2xl flex items-center justify-center text-muted-foreground">
        Нет фото
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Главное фото */}
      <div className="relative group aspect-square bg-muted rounded-2xl overflow-hidden border border-border">
        <img
          src={main}
          alt={alt}
          className="w-full h-full object-contain p-4 cursor-zoom-in"
          onClick={() => setZoom(true)}
        />

        {total > 1 && (
          <>
            <button
              onClick={() => go(-1)}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 border border-border shadow flex items-center justify-center hover:bg-white opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Предыдущее фото"
            >
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <button
              onClick={() => go(1)}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 border border-border shadow flex items-center justify-center hover:bg-white opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Следующее фото"
            >
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6" />
              </svg>
            </button>
            <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/50 text-white text-xs">
              {current + 1} / {total}
            </div>
          </>
        )}
      </div>

      {/* Превью */}
      {total > 1 && (
        <div className="grid grid-cols-6 gap-2">
          {images.slice(0, 12).map((src, i) => (
            <button
              key={src + i}
              onClick={() => setCurrent(i)}
              className={`aspect-square rounded-lg overflow-hidden border p-1 bg-white ${
                i === current ? "border-accent ring-2 ring-accent/30" : "border-border hover:border-accent/50"
              }`}
              aria-label={`Фото ${i + 1}`}
            >
              <img src={src} alt="" className="w-full h-full object-contain" />
            </button>
          ))}
        </div>
      )}

      {/* Полноэкранный просмотр */}
      {zoom && (
        <div
          className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center"
          onClick={() => setZoom(false)}
        >
          <button
            onClick={() => setZoom(false)}
            className="absolute top-4 right-4 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
            aria-label="Закрыть"
          >
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>

          <img
            src={main}
            alt={alt}
            className="max-w-[92vw] max-h-[88vh] object-contain"
            onClick={(e) => e.stopPropagation()}
          />

          {total > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); go(-1); }}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
                aria-label="Предыдущее фото"
              >
                <svg width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 18l-6-6 6-6" />
                </svg>
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); go(1); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
                aria-label="Следующее фото"
              >
                <svg width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6" />
                </svg>
              </button>
              <div className="absolute bottom-5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-white/10 text-white text-sm">
                {current + 1} / {total}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
