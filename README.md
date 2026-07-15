# dush.kz — интернет-магазин сантехники

Премиум-магазин сантехники (душевые кабины, смесители, унитазы, ванны, раковины, аксессуары).
5433 товара, доставка по Казахстану, заявки в WhatsApp.

## Структура

```
dush_kz/
├── web/          Next.js 16 + Tailwind + framer-motion + lucide (сам сайт)
├── parser/       Python-скрапер и подготовка данных
└── assets/       Логотип (исходники)
```

## Стек

- **Frontend**: Next.js 16 (App Router), Tailwind v4, framer-motion, lucide-react
- **State**: Zustand (корзина, избранное) с persist в localStorage
- **Данные**: статический JSON (`web/src/data/`), поиск и каталог на клиенте по тонкому индексу
- **Парсер**: Python 3.11+, requests, BeautifulSoup, Pillow

## Запуск сайта

```bash
cd web
npm install
npm run dev        # http://localhost:3000
```

## Фото товаров

Фото (~813 МБ) не в репозитории (`.gitignore`). Чтобы наполнить локально:

```bash
cd parser
python3 scrape.py --all           # спарсить каталог (долго)
python3 remove_watermarks.py      # убрать промо-фото с логотипом источника
python3 build_web_data.py         # собрать web/src/data/*.json + скопировать фото в web/public/products
```

Для продакшна фото лучше вынести на объектное хранилище / CDN.

## Данные

- `web/src/data/products.json` — полные данные (только сервер, страница товара)
- `web/src/data/products-index.json` — тонкий индекс (клиент: каталог, поиск, карточки)
- Пересборка: `parser/build_web_data.py`

## Заказы

Онлайн-оплаты нет: заявка (имя, телефон, город, состав корзины) уходит в WhatsApp
на корп-номер через `wa.me` (см. `web/src/components/OrderModal.tsx`).
