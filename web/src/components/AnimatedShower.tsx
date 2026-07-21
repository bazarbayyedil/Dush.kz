/** Живая часть логотипа: человечек заходит под душ и моется.
 *  Рамки кабинки нет намеренно — она уже есть в основном логотипе рядом.
 *  Анимация на чистом CSS (см. globals.css), уважает prefers-reduced-motion. */
export function AnimatedShower({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 46"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className={className}
      style={{ color: "var(--brand)" }}
    >
      {/* лейка на кронштейне */}
      <path d="M6 4 H15 M15 4 V7" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" />
      <ellipse cx={15} cy={8.5} rx={5} ry={2.2} fill="currentColor" />

      {/* струи воды */}
      <g className="shw-spray">
        <line className="shw-drop" x1={12} y1={11} x2={12} y2={14.5} stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
        <line className="shw-drop b" x1={15} y1={11} x2={15} y2={14.5} stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
        <line className="shw-drop c" x1={18} y1={11} x2={18} y2={14.5} stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
      </g>

      {/* человечек под душем */}
      <g className="shw-man">
        <g className="shw-body">
          <circle cx={20} cy={20} r={3.2} fill="currentColor" />
          <path d="M20 23.5 V33" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" />
          <path d="M20 33 L16 41" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" />
          <path d="M20 33 L24 41" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" />
          <path d="M20 26.5 L15 30" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" />
          <path className="shw-arm" d="M20 26.5 L23.5 21" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" />
        </g>
      </g>
    </svg>
  );
}
