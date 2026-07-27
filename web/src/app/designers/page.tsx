import type { Metadata } from "next";
import Link from "next/link";
import {
  BadgePercent,
  Boxes,
  Clock4,
  MessageCircle,
  Phone,
  Ruler,
  Truck,
  UserRound,
} from "lucide-react";
import { SITE_URL } from "@/lib/site";
import { PHONE_DISPLAY, WHATSAPP_NUMBER } from "@/lib/contacts";

const WA_DESIGNER = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
  "Здравствуйте! Я дизайнер, хочу сотрудничать с dush.kz",
)}`;

export const metadata: Metadata = {
  title: "Дизайнерам и архитекторам — сотрудничество | dush.kz",
  description:
    "Партнёрская программа dush.kz для дизайнеров интерьера и архитекторов: вознаграждение с заказов, персональный менеджер, резерв товара под проект, доставка на объект по Астане за 24 часа.",
  alternates: { canonical: `${SITE_URL}/designers` },
};

const PERKS = [
  {
    icon: BadgePercent,
    title: "Вознаграждение до 10%",
    text: "С каждого заказа вашего клиента. Процент растёт вместе с объёмом — фиксируем условия при знакомстве и не меняем на середине проекта.",
  },
  {
    icon: UserRound,
    title: "Персональный менеджер",
    text: "Один контакт по всем проектам: подбор по дизайн-проекту, счета, документы. Расчёт спецификации — в течение рабочего дня.",
  },
  {
    icon: Boxes,
    title: "Резерв под проект",
    text: "Держим позиции проекта на складе до монтажа, чтобы к моменту чистовой отделки всё было в одном месте и в нужном цвете.",
  },
  {
    icon: Truck,
    title: "Доставка на объект",
    text: "По Астане — бесплатно за 24 часа, по Казахстану — до двери. Привезём к приезду бригады, не заставим клиента ждать.",
  },
  {
    icon: Ruler,
    title: "Размеры и характеристики",
    text: "У каждого товара — габариты, цвет, материал и тип монтажа. Легко проверить посадку в санузел прямо из карточки.",
  },
  {
    icon: Clock4,
    title: "Обмен без нервов",
    text: "Не подошло по месту — заменим или вернём деньги. Официальная гарантия производителя на весь каталог.",
  },
];

const STEPS = [
  ["Напишите нам", "В WhatsApp или по телефону — расскажите, с какими проектами работаете."],
  ["Получите условия", "Закрепим процент вознаграждения и персонального менеджера."],
  ["Присылайте спецификацию", "Подберём позиции по дизайн-проекту, посчитаем смету, зарезервируем товар."],
  ["Получайте вознаграждение", "После оплаты заказа клиентом — переводом на карту или счёт."],
];

export default function DesignersPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link href="/" className="hover:text-foreground">Главная</Link>
        <span>/</span>
        <span className="text-foreground">Дизайнерам</span>
      </nav>

      <section className="rounded-3xl bg-card border border-border px-6 py-10 md:px-12 md:py-14 mb-10">
        <div className="max-w-2xl">
          <h1 className="text-3xl md:text-4xl font-bold leading-tight">
            Дизайнерам и архитекторам
          </h1>
          <p className="mt-4 text-[15px] md:text-base text-muted-foreground leading-relaxed">
            Комплектуем санузлы и кухни под дизайн-проект: 5&nbsp;000+ позиций в наличии,
            Grohe, Frap, Gappo, 1&nbsp;Марка и ещё 40 брендов. Вы занимаетесь проектом —
            мы берём на себя подбор, резерв, доставку и документы. И платим вознаграждение
            с каждого заказа.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href={WA_DESIGNER}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-brand text-white px-5 py-3 text-sm font-medium hover:opacity-90 transition-opacity"
            >
              <MessageCircle size={18} />
              Обсудить сотрудничество
            </a>
            <a
              href={`tel:+${WHATSAPP_NUMBER}`}
              className="inline-flex items-center gap-2 rounded-xl border border-border px-5 py-3 text-sm font-medium hover:border-brand transition-colors"
            >
              <Phone size={18} />
              {PHONE_DISPLAY}
            </a>
          </div>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Что получают партнёры</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {PERKS.map(({ icon: Icon, title, text }) => (
            <div key={title} className="rounded-2xl border border-border bg-card p-5">
              <Icon size={22} className="text-accent" />
              <div className="mt-3 font-semibold">{title}</div>
              <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Как это работает</h2>
        <ol className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {STEPS.map(([title, text], i) => (
            <li key={title} className="rounded-2xl border border-border bg-card p-5">
              <div className="w-8 h-8 rounded-full bg-brand text-white flex items-center justify-center text-sm font-semibold">
                {i + 1}
              </div>
              <div className="mt-3 font-semibold">{title}</div>
              <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="rounded-3xl bg-brand text-white px-6 py-10 md:px-12 text-center">
        <h2 className="text-2xl md:text-3xl font-bold">
          Ведёте проект прямо сейчас?
        </h2>
        <p className="mt-3 text-white/85 max-w-xl mx-auto text-[15px] leading-relaxed">
          Пришлите спецификацию или просто список позиций — до конца рабочего дня вернёмся
          со сметой, наличием и сроками.
        </p>
        <a
          href={WA_DESIGNER}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white text-brand px-6 py-3 text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          <MessageCircle size={18} />
          Написать в WhatsApp
        </a>
      </section>
    </div>
  );
}
