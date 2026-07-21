"use client";
import { useEffect, useRef } from "react";

/** Анимированная кабинка для эмблемы логотипа: душевой бокс, внутри человечек
 *  лежит в ванне, рука свисает, сверху капли тропического душа.
 *  Капли — на JS (Web Animations API), рука и дыхание — на CSS (globals.css). */
export function AnimatedShower({ className = "" }: { className?: string }) {
  const ref = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const svg = ref.current;
    if (!svg) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const anims = Array.from(svg.querySelectorAll<SVGLineElement>(".bath-drop")).map((drop, i) =>
      drop.animate(
        [
          { transform: "translateY(0)", opacity: 0 },
          { opacity: 0.95, offset: 0.15 },
          { transform: "translateY(9px)", opacity: 0 },
        ],
        { duration: 1100, iterations: Infinity, delay: i * 240, easing: "linear" },
      ),
    );
    return () => anims.forEach((a) => a.cancel());
  }, []);

  const drops = [18, 24, 30];
  return (
    <svg
      ref={ref}
      viewBox="0 0 46 50"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className={className}
      style={{ color: "var(--brand)" }}
    >
      {/* душевой бокс — рамка кабинки */}
      <rect x={3} y={3} width={40} height={44} rx={6} stroke="currentColor" strokeWidth={2.6} fill="none" />
      {/* стойка и лейка тропического душа внутри */}
      <path d="M12 10 H16" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
      <rect x={16} y={9} width={16} height={3.4} rx={1.6} fill="currentColor" />
      {/* капли */}
      <g>
        {drops.map((x) => (
          <line
            key={x}
            className="bath-drop"
            x1={x} y1={14} x2={x} y2={17}
            stroke="currentColor" strokeWidth={1.6} strokeLinecap="round"
          />
        ))}
      </g>
      {/* ванна на дне бокса */}
      <path
        d="M8 34 Q8 30 11 30 Q12.5 30 13 32 L13 37 Q13 40 16 40 L34 40 Q39 40 39 36 L39 34 Q39 32 37 32"
        stroke="currentColor" strokeWidth={2} fill="none" strokeLinecap="round"
      />
      {/* человечек лёжа: голова слева, колени, рука свисает */}
      <g>
        <circle cx={12} cy={28} r={2.3} fill="currentColor" />
        <path d="M14.5 31 Q20 33.5 25 34" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" />
        <path d="M25 34 L28 29.5 L31 34" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
        <path d="M26.5 34 L30 30 L33.5 34" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
        <rect className="bath-chest" x={16} y={30.5} width={5} height={1.8} rx={0.9} fill="currentColor" style={{ transformOrigin: "center" }} />
        {/* рука свисает через передний край ванны */}
        <g className="bath-arm" style={{ transformOrigin: "16px 36px" }}>
          <path d="M15 31 Q16.5 35 16.5 38 L16.5 43" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
          <circle cx={16.5} cy={44} r={1.2} fill="currentColor" />
        </g>
      </g>
    </svg>
  );
}
