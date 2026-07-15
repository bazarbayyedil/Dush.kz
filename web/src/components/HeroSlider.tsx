"use client";
import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { PRODUCT_IMAGES_AVAILABLE } from "@/lib/media";

type Slide = {
  eyebrow: string;
  title: string;
  subtitle: string;
  href: string;
  cta: string;
  image?: string;
  from: string;
  to: string;
};

export function HeroSlider({ slides }: { slides: Slide[] }) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const n = slides.length;

  const go = useCallback((d: number) => setI((c) => (c + d + n) % n), [n]);

  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => setI((c) => (c + 1) % n), 5500);
    return () => clearInterval(t);
  }, [paused, n]);

  const s = slides[i];

  return (
    <div
      className="relative overflow-hidden rounded-2xl md:rounded-3xl border border-border"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={i}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="grid md:grid-cols-2 min-h-[280px] md:min-h-[360px]"
          style={{ background: `linear-gradient(120deg, ${s.from}, ${s.to})` }}
        >
          <div className="flex flex-col justify-center p-7 md:p-12">
            <motion.div
              initial={{ y: 16, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.4 }}
            >
              <div className="text-xs font-medium uppercase tracking-wider text-accent mb-3">{s.eyebrow}</div>
              <h2 className="text-2xl md:text-4xl font-bold leading-tight max-w-md">{s.title}</h2>
              <p className="mt-3 text-sm md:text-base text-muted-foreground max-w-sm">{s.subtitle}</p>
              <Link
                href={s.href}
                className="mt-6 inline-flex items-center gap-2 px-6 h-11 bg-accent text-accent-foreground rounded-xl font-medium hover:bg-accent-hover transition-colors w-fit"
              >
                {s.cta} <ArrowRight size={18} />
              </Link>
            </motion.div>
          </div>
          <div className="relative hidden md:block">
            <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
              Фото скоро
            </div>
            {PRODUCT_IMAGES_AVAILABLE && s.image && (
              <motion.img
                initial={{ scale: 1.05, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.6 }}
                src={s.image}
                alt=""
                className="absolute inset-0 w-full h-full object-contain p-8 bg-transparent"
                onError={(event) => event.currentTarget.remove()}
              />
            )}
          </div>
        </motion.div>
      </AnimatePresence>

      <button
        onClick={() => go(-1)}
        className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 hover:bg-white border border-border flex items-center justify-center backdrop-blur transition-colors"
        aria-label="Назад"
      >
        <ChevronLeft size={20} />
      </button>
      <button
        onClick={() => go(1)}
        className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 hover:bg-white border border-border flex items-center justify-center backdrop-blur transition-colors"
        aria-label="Вперёд"
      >
        <ChevronRight size={20} />
      </button>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
        {slides.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setI(idx)}
            aria-label={`Слайд ${idx + 1}`}
            className={`h-2 rounded-full transition-all ${idx === i ? "w-6 bg-accent" : "w-2 bg-foreground/25"}`}
          />
        ))}
      </div>
    </div>
  );
}
