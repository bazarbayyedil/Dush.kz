import Link from "next/link";

/** Простой каркас для контентных страниц (доставка, о нас и т.д.). */
export function InfoPage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
        <Link href="/" className="hover:text-foreground">Главная</Link>
        <span>/</span>
        <span className="text-foreground">{title}</span>
      </div>
      <h1 className="text-3xl font-semibold mb-6">{title}</h1>
      <div className="space-y-4 text-[15px] leading-relaxed text-muted-foreground [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-foreground [&_h2]:mt-6 [&_strong]:text-foreground [&_a]:text-accent [&_a]:hover:underline">
        {children}
      </div>
    </div>
  );
}
