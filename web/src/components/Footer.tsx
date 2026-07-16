import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-16 bg-neutral-900 text-neutral-300">
      <div className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-2 md:grid-cols-4 gap-8 text-sm">
        <div className="col-span-2 md:col-span-1">
          <img src="/logo-white.svg" alt="dush.kz — сантехника" className="h-11 w-auto mb-4" />
          <p className="text-neutral-400 text-xs leading-relaxed">
            Магазин сантехники в Астане, более 5 лет на рынке. Душевые кабины, смесители, унитазы, ванны и аксессуары с доставкой по Казахстану.
          </p>
        </div>

        <div>
          <h4 className="text-white font-medium mb-3">Покупателям</h4>
          <ul className="space-y-2 text-neutral-400">
            <li><Link href="/catalog" className="hover:text-white">Каталог</Link></li>
            <li><Link href="/delivery" className="hover:text-white">Доставка и оплата</Link></li>
            <li><Link href="/returns" className="hover:text-white">Возврат</Link></li>
            <li><Link href="/warranty" className="hover:text-white">Гарантия</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-medium mb-3">Компания</h4>
          <ul className="space-y-2 text-neutral-400">
            <li><Link href="/about" className="hover:text-white">О нас</Link></li>
            <li><Link href="/contacts" className="hover:text-white">Контакты</Link></li>
            <li><Link href="/wholesale" className="hover:text-white">Оптом</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-medium mb-3">Контакты</h4>
          <ul className="space-y-2 text-neutral-400">
            <li><a href="tel:+77022525438" className="hover:text-white">+7 702 252 54 38</a></li>
            <li><a href="https://instagram.com/dush_market" target="_blank" rel="noopener" className="hover:text-white">Instagram: @dush_market</a></li>
            <li>
              <a
                href="https://2gis.kz/astana/firm/70000001018116894?m=71.46823%2C51.164252%2F16"
                target="_blank"
                rel="noopener"
                className="hover:text-white"
              >
                г. Астана, ул. Абая, 94 — на карте
              </a>
            </li>
            <li>Ежедневно: 10:00 — 19:00</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 py-4 text-xs text-neutral-500 flex flex-wrap justify-between gap-2">
          <span>© {new Date().getFullYear()} dush.kz. Все права защищены.</span>
          <span>Цены и наличие уточняйте у менеджера.</span>
        </div>
      </div>
    </footer>
  );
}
