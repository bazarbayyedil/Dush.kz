import {
  Droplets,
  ShowerHead,
  SquareStack,
  Bath,
  Toilet,
  Disc,
  Frame,
  Blocks,
  CookingPot,
  Flame,
  Sparkles,
  Wrench,
  type LucideIcon,
} from "lucide-react";

export type CatalogGroup = {
  title: string;
  icon: LucideIcon;
  img: string; // обложка в /public/categories
  categories: string[]; // slugs (порядок = порядок показа)
};

// 82 листовые категории сгруппированы в осмысленные разделы с иконками.
export const catalogTree: CatalogGroup[] = [
  {
    title: "Смесители",
    img: "smesiteli",
    icon: Droplets,
    categories: [
      "dlya-umyvalnikov",
      "dlya-vanny",
      "dlya-kukhni",
      "dlya-kukhni-s-podklyucheniem-k-filtru-vody",
      "vysokij-smesitel-dlya-rakoviny-chashi",
      "dlya-dusha",
      "dlya-bide",
      "dlya-kukhni-s-vydvizhnym-izlivom",
      "dlya-kukhni-s-gibkim-izlivom",
      "dlya-vanny-i-dusha",
    ],
  },
  {
    title: "Душ и гигиена",
    img: "dush",
    icon: ShowerHead,
    categories: [
      "dushevaya-sistema",
      "gigienicheskij-dush",
      "dushevaya-stojka-shtanga-dlya-dusha",
      "lejka-dlya-dusha",
      "dushevoj-garnitur-shtangalejka-bez-smesitelya",
      "lejka-dlya-bide",
    ],
  },
  {
    title: "Кабины и ограждения",
    img: "kabiny",
    icon: SquareStack,
    categories: ["dushevye-kabiny", "dushevye-ograzhdeniya", "shtorki-steklyannye"],
  },
  {
    title: "Ванны",
    img: "vanny",
    icon: Bath,
    categories: [
      "akrilovye-vanny",
      "vanny-iz-santekhnicheskogo-akrila-abs-pmma",
      "stalnye-vanny",
      "mramornye-vanny",
      "chugunnye-vanny",
      "poruchen-dlya-vanny",
    ],
  },
  {
    // Инсталляции ищут отдельно от чаш — держим их самостоятельным разделом.
    title: "Инсталляции",
    img: "installyacii",
    icon: Blocks,
    categories: ["installyacii", "knopki-dlya-installyacij"],
  },
  {
    title: "Унитазы и биде",
    img: "unitazy",
    icon: Toilet,
    categories: [
      "podvesnye-unitazy",
      "napolnye-otdelnostoyashhie-unitazy",
      "napolnye-pristavnye-unitazy",
      "unitaz-pristavnoj-napolnyj-dlya-montazha-s-sistemoj-installyacii",
      "dlya-napolnogo-unitaza",
      "yorsh-dlya-unitaza",
      "podvesnye-bide",
      "napolnye-bide",
      "dlya-podvesnogo-bide",
      "pissuary",
      "dlya-pissuara",
      "dlya-pissuara-2",
      "shlangi-dlya-unitazov-i-smesitelej",
    ],
  },
  {
    title: "Раковины",
    img: "rakoviny",
    icon: Disc,
    categories: [
      "rakovina-nakladnaya",
      "rakovina-podvesnaya",
      "rakovina-vstraivaemaya-pod-stoleshnicu",
      "rakovina-vstraivaemaya-v-stoleshnicu",
      "rakoviny-na-stiralnuyu-mashinu",
      "rakovina-napolnaya",
      "dlya-podvesnoj-rakoviny",
    ],
  },
  {
    title: "Мебель и зеркала",
    img: "mebel",
    icon: Frame,
    categories: ["tumby-s-umyvalnikom", "penaly", "zerkala-s-led-podsvetkoj", "shkaf-zerkalo", "zerkala-ekonom"],
  },
  {
    title: "Кухня: мойки",
    img: "mojki",
    icon: CookingPot,
    categories: ["mojki-iz-kamnya", "mojki-iz-nerzhaveyushhej-stali", "izmelcitel-othodov"],
  },
  {
    title: "Полотенцесушители",
    img: "polotencesushiteli",
    icon: Flame,
    categories: ["elektricheskie", "vodyanye"],
  },
  {
    title: "Аксессуары",
    img: "aksessuary",
    icon: Sparkles,
    categories: [
      "kryuchok",
      "polotencederzateli",
      "derzhatel-dlya-tualetnoj-bumagi",
      "polka",
      "mylnica",
      "stakan-dlya-vannoj-komnaty",
      "stakan",
      "dozator",
      "musornye-vedra",
      "derzhatel-dlya-stakana",
      "derzhatel-dlya-fena",
      "dispenser-dlya-bumagi",
      "derzhatel-vatnykh-diskov",
      "podstavka-pod-osvezhitel-vozdukha",
      "karniz",
      "shnur-dlya-belya",
    ],
  },
  {
    title: "Инженерное",
    img: "inzhenernoe",
    icon: Wrench,
    categories: [
      "sifony",
      "vodootvodyashhie-zheloba",
      "tochechnye-trapy",
      "ventilyatory-vytyazhnye",
      "lyuki-nazhimnye-skrytoj-ustanovki-pod-plitku",
      "lyuki-pod-pokrasku",
      "lyuki-plastikovye",
      "vodonagrevateli",
    ],
  },
];

// Ссылка на весь раздел: все переданные слаги как отдельные category-параметры.
// filterCatalog объединяет их (товар проходит, если его категория в списке).
export function groupHref(slugs: string[]): string {
  const qs = slugs.map((s) => `category=${encodeURIComponent(s)}`).join("&");
  return `/catalog?${qs}`;
}

// Если выбранные категории целиком лежат в одном разделе — вернуть его название
// (для заголовка каталога при выборе всей группы «Смесители» и т.п.).
export function matchGroupTitle(slugs: string[]): string | null {
  if (slugs.length < 2) return null;
  const group = catalogTree.find((g) => slugs.every((s) => g.categories.includes(s)));
  return group ? group.title : null;
}
