import { InfoPage } from "@/components/InfoPage";

export const metadata = { title: "Оптом — dush.kz" };

export default function WholesalePage() {
  return (
    <InfoPage title="Оптовым покупателям">
      <p>Работаем с монтажными бригадами, дизайнерами, застройщиками и магазинами. Предлагаем специальные цены на оптовые партии.</p>
      <h2>Условия</h2>
      <p>Индивидуальные цены в зависимости от объёма, отсрочка для постоянных партнёров, помощь в подборе и комплектации объектов.</p>
      <h2>Как начать</h2>
      <p>Напишите менеджеру в WhatsApp или на <a href="mailto:info@dush.kz">info@dush.kz</a> с примерным перечнем — подготовим коммерческое предложение.</p>
    </InfoPage>
  );
}
