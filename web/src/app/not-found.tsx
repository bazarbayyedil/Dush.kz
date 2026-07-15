import Link from "next/link";

export default function NotFound() {
  return (
    <div className="max-w-md mx-auto px-4 py-24 text-center">
      <div className="text-7xl font-bold text-accent">404</div>
      <h1 className="mt-4 text-2xl font-semibold">Страница не найдена</h1>
      <p className="mt-3 text-muted-foreground">
        Возможно, ссылка устарела или товар больше не доступен. Загляните в каталог — наверняка найдётся нужное.
      </p>
      <div className="mt-8 flex flex-wrap gap-3 justify-center">
        <Link
          href="/catalog"
          className="px-6 py-3 bg-accent text-accent-foreground rounded-lg font-medium hover:bg-accent-hover transition-colors"
        >
          В каталог
        </Link>
        <Link
          href="/"
          className="px-6 py-3 bg-white border border-border rounded-lg font-medium hover:bg-muted transition-colors"
        >
          На главную
        </Link>
      </div>
    </div>
  );
}
