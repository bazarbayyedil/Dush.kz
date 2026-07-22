"use client";
import { useLangHydrated } from "./i18n";

// Казахские названия категорий. Ключ — slug категории из products-index.json.
// Русские названия остаются в данных, здесь только перевод для kk-режима.
const CAT_KK: Record<string, string> = {
  "dlya-umyvalnikov": "Қолжуғышқа арналған",
  "dushevaya-sistema": "Душ жүйесі",
  "dlya-vanny": "Ваннаға арналған",
  "tumby-s-umyvalnikom": "Қолжуғышы бар тумбалар",
  "dlya-kukhni": "Асханаға арналған",
  "gigienicheskij-dush": "Гигиеналық душ",
  "akrilovye-vanny": "Акрил ванналар",
  "podvesnye-unitazy": "Аспалы унитаздар",
  "dlya-kukhni-s-podklyucheniem-k-filtru-vody": "Су сүзгісіне қосылатын асханаға арналған",
  elektricheskie: "Электрлі",
  "dlya-dusha": "Душқа арналған",
  "shkaf-zerkalo": "Айналы шкаф",
  "vysokij-smesitel-dlya-rakoviny-chashi": "Тегене раковинаға арналған биік араластырғыш",
  "dushevaya-stojka-shtanga-dlya-dusha": "Душ бағанасы/штангасы",
  "rakovina-nakladnaya": "Үстіңгі раковина",
  "zerkala-s-led-podsvetkoj": "LED жарықтандыруы бар айналар",
  "lejka-dlya-dusha": "Душ лейкасы",
  "vodootvodyashhie-zheloba": "Су ағызатын науалар",
  "dlya-podvesnogo-unitaza": "Аспалы унитазға арналған",
  "napolnye-otdelnostoyashhie-unitazy": "Еденге қойылатын унитаздар",
  kryuchok: "Ілгек",
  polotencederzateli: "Сүлгі ұстағыштар",
  sifony: "Сифондар",
  "dushevye-ograzhdeniya": "Душ қоршаулары",
  "dlya-bide": "Бидеге арналған",
  penaly: "Пеналдар",
  "rakovina-podvesnaya": "Аспалы раковина",
  "derzhatel-dlya-tualetnoj-bumagi": "Дәретхана қағазының ұстағышы",
  "dushevoj-garnitur-shtangalejka-bez-smesitelya": "Душ гарнитуры (штанга + лейка, араластырғышсыз)",
  polka: "Сөре",
  "yorsh-dlya-unitaza": "Унитаз щёткасы",
  mylnica: "Сабындық",
  "tochechnye-trapy": "Нүктелік траптар",
  "dlya-kukhni-s-vydvizhnym-izlivom": "Суырмалы шүмегі бар асханаға арналған",
  "vanny-iz-santekhnicheskogo-akrila-abs-pmma": "Сантехникалық акрил ванналар (АБС/ПММА)",
  "knopki-dlya-installyacij": "Инсталляция түймелері",
  "dushevye-kabiny": "Душ кабиналары",
  "rakovina-vstraivaemaya-pod-stoleshnicu": "Үстелүсті астына орнатылатын раковина",
  "skidki-i-akcii": "Жеңілдіктер мен акциялар",
  "dlya-kukhni-s-gibkim-izlivom": "Иілгіш шүмегі бар асханаға арналған",
  dozator: "Дозатор",
  vodyanye: "Сулы",
  "stakan-dlya-vannoj-komnaty": "Жуынатын бөлмеге арналған стақан",
  "podvesnye-bide": "Аспалы биде",
  "shtorki-steklyannye": "Шыны шымылдықтар",
  "stalnye-vanny": "Болат ванналар",
  "lyuki-nazhimnye-skrytoj-ustanovki-pod-plitku": "Плитка астына жасырын орнатылатын люктер",
  "musornye-vedra": "Қоқыс шелектері",
  "mojki-iz-kamnya": "Тас мойкалар",
  "rakoviny-na-stiralnuyu-mashinu": "Кір жуғыш машинаға арналған раковиналар",
  "chugunnye-vanny": "Шойын ванналар",
  stakan: "Стақан",
  "mramornye-vanny": "Мәрмәр ванналар",
  "rakovina-vstraivaemaya-v-stoleshnicu": "Үстелүстіге орнатылатын раковина",
  "lejka-dlya-bide": "Биде лейкасы",
  "derzhatel-dlya-stakana": "Стақан ұстағышы",
  "napolnye-bide": "Еденге қойылатын биде",
  "derzhatel-dlya-fena": "Фен ұстағышы",
  "dlya-vanny-i-dusha": "Ванна мен душқа арналған",
  "poruchen-dlya-vanny": "Ваннаға арналған тұтқа",
  "dlya-podvesnogo-bide": "Аспалы бидеге арналған",
  "shlangi-dlya-unitazov-i-smesitelej": "Унитаз бен араластырғышқа арналған шлангілер",
  "unitaz-pristavnoj-napolnyj-dlya-montazha-s-sistemoj-installyacii":
    "Инсталляция жүйесімен орнатылатын тіркеме унитаз",
  "ventilyatory-vytyazhnye": "Сорғыш желдеткіштер",
  "zerkala-ekonom": "Эконом айналар",
  "dlya-pissuara-2": "Писсуарға арналған",
  "lyuki-pod-pokrasku": "Бояуға арналған люктер",
  "mojki-iz-nerzhaveyushhej-stali": "Тот баспайтын болаттан жасалған мойкалар",
  pissuary: "Писсуарлар",
  "dispenser-dlya-bumagi": "Қағаз диспенсері",
  "dlya-napolnogo-unitaza": "Еденге қойылатын унитазға арналған",
  "rakovina-napolnaya": "Еденге қойылатын раковина",
  "derzhatel-vatnykh-diskov": "Мақта дискілерінің ұстағышы",
  "dlya-pissuara": "Писсуарға арналған",
  "dlya-podvesnoj-rakoviny": "Аспалы раковинаға арналған",
  karniz: "Карниз",
  "lyuki-plastikovye": "Пластик люктер",
  "podstavka-pod-osvezhitel-vozdukha": "Ауа тазартқышқа арналған тұғыр",
  "shnur-dlya-belya": "Кір жаятын бау",
};

// Разделы мега-меню (catalogTree). Ключ — русское название раздела.
const GROUP_KK: Record<string, string> = {
  Смесители: "Араластырғыштар",
  "Душ и гигиена": "Душ және гигиена",
  "Кабины и ограждения": "Кабиналар мен қоршаулар",
  Ванны: "Ванналар",
  "Унитазы и биде": "Унитаздар мен биде",
  Раковины: "Раковиналар",
  "Мебель и зеркала": "Жиһаз және айналар",
  "Кухня: мойки": "Асхана: мойкалар",
  Полотенцесушители: "Сүлгі кептіргіштер",
  Аксессуары: "Аксессуарлар",
  Инженерное: "Инженерлік",
};

export function catTitleKk(slug: string): string | undefined {
  return CAT_KK[slug];
}

// Хук для клиентских списков: возвращает название категории на текущем языке.
export function useCatTitle() {
  const lang = useLangHydrated();
  return (slug: string, ru: string) => (lang === "kk" ? (CAT_KK[slug] ?? ru) : ru);
}

// То же для названий разделов мега-меню.
export function useGroupTitle() {
  const lang = useLangHydrated();
  return (ru: string) => (lang === "kk" ? (GROUP_KK[ru] ?? ru) : ru);
}
