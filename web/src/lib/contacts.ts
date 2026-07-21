// Контакты магазина в одном месте.
export const WHATSAPP_NUMBER = "77022525438";

// Реквизиты юрлица. Юридический адрес намеренно не публикуем.
export const COMPANY = {
  name: 'ТОО "DASAF GROUP"',
  bin: "180840020721",
  bank: 'АО "Kaspi Bank"',
  kbe: "17",
  bik: "CASPKZKA",
  account: "KZ50722S000048937964",
} as const;

export const PHONE_DISPLAY = "+7 702 252 54 38";
export const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
  "Здравствуйте! Пишу с сайта dush.kz",
)}`;

export const INSTAGRAM_HANDLE = "dush.kz";
export const INSTAGRAM_URL = `https://instagram.com/${INSTAGRAM_HANDLE}`;
