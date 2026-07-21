import { InfoPage } from "@/components/InfoPage";
import { INSTAGRAM_URL, INSTAGRAM_HANDLE } from "@/lib/contacts";

export const metadata = { title: "О компании — dush.kz" };

export default function AboutPage() {
  return (
    <InfoPage title="О компании">
      <p><strong>dush.kz</strong> — магазин сантехники в Астане с опытом работы <strong>более 5 лет</strong>. За это время мы помогли обустроить тысячи ванных комнат по всему Казахстану.</p>
      <p>В каталоге — душевые кабины, смесители, унитазы, ванны, раковины, мебель и аксессуары от проверенных брендов. Только оригинальный товар с гарантией производителя.</p>
      <h2>Почему выбирают нас</h2>
      <p>
        <strong>Опыт.</strong> Более 5 лет на рынке сантехники — знаем товар и поможем с подбором.<br />
        <strong>Честные цены.</strong> Прямые поставки без лишних наценок.<br />
        <strong>Гарантия.</strong> Оригинальная продукция с официальной гарантией.<br />
        <strong>Доставка.</strong> По Астане — за 24 часа, по регионам — транспортными компаниями.
      </p>
      <h2>Шоурум</h2>
      <p>Приезжайте посмотреть товар вживую: г. Астана, ул. Абая, 94. Следите за новинками в Instagram <a href={INSTAGRAM_URL} target="_blank" rel="noopener">@{INSTAGRAM_HANDLE}</a>.</p>
    </InfoPage>
  );
}
