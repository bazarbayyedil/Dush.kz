import { InfoPage } from "@/components/InfoPage";
import { WHATSAPP_URL } from "@/lib/contacts";

export const metadata = { title: "Контакты — dush.kz" };

export default function ContactsPage() {
  return (
    <InfoPage title="Контакты">
      <p>Свяжитесь с нами удобным способом — ответим на вопросы, поможем с подбором и оформлением заказа.</p>
      <h2>Связь</h2>
      <p>
        Телефон / WhatsApp: <a href={WHATSAPP_URL} target="_blank" rel="noopener">+7 702 252 54 38</a><br />
        Instagram: <a href="https://instagram.com/dush_market" target="_blank" rel="noopener">@dush_market</a>
      </p>
      <h2>Адрес</h2>
      <p>
        г. Астана, ул. Абая, 94<br />
        <a href="https://2gis.kz/astana/search/Абая%2094" target="_blank" rel="noopener">Посмотреть на карте</a>
      </p>
      <h2>Режим работы</h2>
      <p>Пн–Сб: 10:00 — 20:00<br />Воскресенье — выходной</p>
    </InfoPage>
  );
}
