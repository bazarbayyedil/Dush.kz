import { InfoPage } from "@/components/InfoPage";
import { WHATSAPP_URL, COMPANY, INSTAGRAM_URL, INSTAGRAM_HANDLE } from "@/lib/contacts";

export const metadata = { title: "Контакты — dush.kz" };

export default function ContactsPage() {
  return (
    <InfoPage title="Контакты">
      <p>Свяжитесь с нами удобным способом — ответим на вопросы, поможем с подбором и оформлением заказа.</p>
      <h2>Связь</h2>
      <p>
        Телефон / WhatsApp: <a href={WHATSAPP_URL} target="_blank" rel="noopener">+7 702 252 54 38</a><br />
        Instagram: <a href={INSTAGRAM_URL} target="_blank" rel="noopener">@{INSTAGRAM_HANDLE}</a>
      </p>
      <h2>Адрес</h2>
      <p>
        г. Астана, ул. Абая, 94<br />
        <a href="https://2gis.kz/astana/search/Абая%2094" target="_blank" rel="noopener">Посмотреть на карте</a>
      </p>
      <h2>Режим работы</h2>
      <p>Ежедневно: 10:00 — 19:00</p>
      <h2>Реквизиты</h2>
      <table>
        <tbody>
          <tr><td>Компания</td><td>{COMPANY.name}</td></tr>
          <tr><td>БИН</td><td>{COMPANY.bin}</td></tr>
          <tr><td>Банк</td><td>{COMPANY.bank}</td></tr>
          <tr><td>КБе</td><td>{COMPANY.kbe}</td></tr>
          <tr><td>БИК</td><td>{COMPANY.bik}</td></tr>
          <tr><td>Номер счёта</td><td>{COMPANY.account}</td></tr>
        </tbody>
      </table>
    </InfoPage>
  );
}
