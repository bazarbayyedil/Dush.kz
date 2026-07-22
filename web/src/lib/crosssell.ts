import { catalogItems, type CatalogItem } from "./catalog";

/**
 * Что докупают к товару.
 *
 * Не «похожие товары» и не случайная выборка из соседней категории: для каждого
 * типа товара описано, чего не хватает, чтобы им пользоваться (`required`), и
 * что берут следом (`optional`). Внутри правила кандидаты ещё и ранжируются —
 * по бренду, ширине и адекватной доле от цены основного товара, иначе к
 * раковине за 30 000 ₸ приезжает сифон за 15 000 ₸.
 */
export type Suggestion = {
  item: CatalogItem;
  need: string; // ключ i18n: что это за позиция
  why: string; // ключ i18n: зачем она нужна
  required: boolean;
};

type Rule = {
  need: string;
  why: string;
  required: boolean;
  cats: string[];
  /** жёсткий отбор: кандидат вообще подходит к этому товару */
  where?: (c: CatalogItem, src: CatalogItem) => boolean;
  /** предпочтения: чем больше, тем выше в выдаче */
  prefer?: (c: CatalogItem, src: CatalogItem) => number;
  /** доля от цены основного товара, вокруг которой ищем «нормальную» позицию */
  share?: number;
  /** к этому товару правило не применяется (нужное уже в комплекте) */
  skip?: (src: CatalogItem) => boolean;
  /** правило зависит от того, что подобрали по этому ключу выше */
  after?: string;
  /** как выбор «родителя» меняет это правило (кнопка идёт к инсталляции) */
  chain?: (parent: CatalogItem) => { skip?: boolean; prefer?: (c: CatalogItem) => number };
};

const has = (p: CatalogItem, rx: RegExp) => rx.test(p.title);

const BATH_CATS = [
  "akrilovye-vanny",
  "vanny-iz-santekhnicheskogo-akrila-abs-pmma",
  "stalnye-vanny",
  "mramornye-vanny",
  "chugunnye-vanny",
];
const BASIN_CATS = [
  "rakovina-nakladnaya",
  "rakovina-podvesnaya",
  "rakovina-vstraivaemaya-pod-stoleshnicu",
  "rakovina-vstraivaemaya-v-stoleshnicu",
  "rakoviny-na-stiralnuyu-mashinu",
  "rakovina-napolnaya",
];
const MIRROR_CATS = ["shkaf-zerkalo", "zerkala-s-led-podsvetkoj", "zerkala-ekonom"];
const SINK_CATS = ["mojki-iz-kamnya", "mojki-iz-nerzhaveyushhej-stali"];
const FAUCET_CATS = [
  "dlya-umyvalnikov",
  "dlya-vanny",
  "dlya-dusha",
  "dlya-vanny-i-dusha",
  "vysokij-smesitel-dlya-rakoviny-chashi",
];
const KITCHEN_FAUCET_CATS = [
  "dlya-kukhni",
  "dlya-kukhni-s-vydvizhnym-izlivom",
  "dlya-kukhni-s-gibkim-izlivom",
  "dlya-kukhni-s-podklyucheniem-k-filtru-vody",
];

// В «Сифонах» лежат и слив-переливы для ванн, и донные клапаны, и подводка для
// унитаза — под раковину годится не всё, поэтому отбираем явно.
const RX_BATH_SIPHON = /для ванны|слив-перелив|перелив/i;
const RX_BASIN_SIPHON = /сифон/i;
const RX_NOT_BASIN = /для ванны|перелив|для биде|унитаз|поддон/i;
const RX_SHOWER_SET = /гарнитур|лейк/i;
// Инсталляция «3 в 1», «с панелью смыва», «с кнопкой» — клавиша уже внутри.
const RX_BUTTON_INCLUDED = /кнопк|клавиш|панел\w* смыва|\d\s*в\s*1|\dв1/i;
// Отдельная скрытая часть, а не смеситель, у которого она уже в коробке.
const RX_INNER_PART = /встраиваем\w+ част|внутренн\w+ част|rapido/i;
const RX_NOT_INNER = /внешняя и|^смеситель|^душевая/i;
// Смеситель, у которого встраиваемая часть уже в коробке.
const RX_SELF_CONTAINED = /внешняя и встраиваем|со встроенным механизм|встраиваем\w+ част/i;
// Готовый комплект «инсталляция + унитаз» — это не то, что докупают к унитазу.
const RX_INSTALL_KIT = /\+|компл|унитаз подвесной|подвесной унитаз/i;
// В категориях попадаются сопутствующие мелочи (сменные картриджи среди
// смесителей) — проверяем, что кандидат вообще того рода, что обещает подпись.
const titled = (rx: RegExp) => (c: CatalogItem) => rx.test(c.title);
const RX_FAUCET = /смеситель/i;
const RX_INSTALL = /инсталляц/i;
const RX_BUTTON = /кнопк|клавиш|панел\w* смыва/i;

const sameBrand = (c: CatalogItem, src: CatalogItem) => (c.brand === src.brand ? 60 : 0);

/** Ширина корпуса в см (тумбы, зеркала, пеналы) — по ней собирают гарнитур. */
const widthCm = (p: CatalogItem) => (p.dimL ? Math.round(p.dimL / 10) : null);

function widthMatch(c: CatalogItem, src: CatalogItem): number {
  const a = widthCm(src);
  const b = widthCm(c);
  if (a == null || b == null) return 0;
  const d = Math.abs(a - b);
  if (d <= 2) return 120; // тумба 60 и зеркало 60 встают в одну линию
  if (d <= 6) return 40;
  return -400; // зеркало 100 над тумбой 50 предлагать нельзя
}

const siphonFor = (bath: boolean) => (c: CatalogItem) =>
  bath ? has(c, RX_BATH_SIPHON) : has(c, RX_BASIN_SIPHON) && !has(c, RX_NOT_BASIN);
const notShowerHose = (c: CatalogItem) => !has(c, /для душа/i);

function rulesFor(src: CatalogItem): Rule[] {
  const cat = src.category;

  if (BATH_CATS.includes(cat)) {
    return [
      { need: "xs.siphon_bath", why: "xs.siphon_bath_why", required: true, cats: ["sifony"], where: siphonFor(true), share: 0.06 },
      { need: "xs.faucet_bath", why: "xs.faucet_bath_why", required: true, cats: ["dlya-vanny", "dlya-vanny-i-dusha"], where: titled(RX_FAUCET), share: 0.35, prefer: sameBrand },
      { need: "xs.bath_rail", why: "xs.bath_rail_why", required: false, cats: ["poruchen-dlya-vanny"], share: 0.1 },
      { need: "xs.screen", why: "xs.screen_why", required: false, cats: ["shtorki-steklyannye"], share: 0.5 },
    ];
  }

  if (BASIN_CATS.includes(cat)) {
    return [
      { need: "xs.siphon_basin", why: "xs.siphon_basin_why", required: true, cats: ["sifony"], where: siphonFor(false), share: 0.12 },
      { need: "xs.faucet_basin", why: "xs.faucet_basin_why", required: true, cats: ["dlya-umyvalnikov", "vysokij-smesitel-dlya-rakoviny-chashi"], where: titled(RX_FAUCET), share: 0.8, prefer: sameBrand },
      { need: "xs.mirror", why: "xs.mirror_why", required: false, cats: MIRROR_CATS, share: 1.2 },
    ];
  }

  if (cat === "tumby-s-umyvalnikom") {
    return [
      { need: "xs.mirror", why: "xs.mirror_fit_why", required: false, cats: MIRROR_CATS, prefer: (c, s) => widthMatch(c, s) + sameBrand(c, s), share: 0.5 },
      { need: "xs.faucet_basin", why: "xs.faucet_basin_why", required: true, cats: ["dlya-umyvalnikov"], where: titled(RX_FAUCET), share: 0.3, prefer: sameBrand },
      { need: "xs.siphon_basin", why: "xs.siphon_basin_why", required: true, cats: ["sifony"], where: siphonFor(false), share: 0.04 },
      { need: "xs.pencil", why: "xs.pencil_why", required: false, cats: ["penaly"], prefer: (c, s) => sameBrand(c, s) + widthMatch(c, s) / 4, share: 0.7 },
    ];
  }

  if (cat === "podvesnye-unitazy") {
    return [
      { need: "xs.install", why: "xs.install_why", required: true, cats: ["installyacii"], where: (c) => RX_INSTALL.test(c.title) && !RX_INSTALL_KIT.test(c.title), prefer: sameBrand, share: 1.2 },
      {
        // Кнопка подбирается не к унитазу, а к той инсталляции, что выбрали выше:
        // клавиша встаёт только на бачок своего производителя.
        need: "xs.button", why: "xs.button_why", required: true,
        cats: ["knopki-dlya-installyacij"], where: titled(RX_BUTTON), share: 0.35,
        after: "xs.install",
        chain: (inst) =>
          RX_BUTTON_INCLUDED.test(inst.title)
            ? { skip: true }
            : { prefer: (c) => (c.brand === inst.brand ? 150 : 0) },
      },
      { need: "xs.hygiene", why: "xs.hygiene_why", required: false, cats: ["gigienicheskij-dush"], share: 0.5 },
    ];
  }

  if (cat === "installyacii") {
    return [
      {
        need: "xs.button", why: "xs.button_why", required: true,
        cats: ["knopki-dlya-installyacij"], where: titled(RX_BUTTON), prefer: sameBrand, share: 0.25,
        skip: (s) => RX_BUTTON_INCLUDED.test(s.title),
      },
      { need: "xs.wc_wall", why: "xs.wc_wall_why", required: false, cats: ["podvesnye-unitazy"], prefer: sameBrand, share: 1 },
    ];
  }

  if (cat === "napolnye-otdelnostoyashhie-unitazy" || cat === "unitaz-pristavnoj-napolnyj-dlya-montazha-s-sistemoj-installyacii") {
    return [
      { need: "xs.hose", why: "xs.hose_why", required: true, cats: ["shlangi-dlya-unitazov-i-smesitelej"], where: notShowerHose, share: 0.02 },
      { need: "xs.hygiene", why: "xs.hygiene_why", required: false, cats: ["gigienicheskij-dush"], share: 0.5 },
      { need: "xs.brush", why: "xs.brush_why", required: false, cats: ["yorsh-dlya-unitaza"], share: 0.15 },
    ];
  }

  if (SINK_CATS.includes(cat)) {
    return [
      { need: "xs.faucet_kitchen", why: "xs.faucet_kitchen_why", required: true, cats: KITCHEN_FAUCET_CATS, where: titled(RX_FAUCET), share: 0.8, prefer: sameBrand },
      // Кухонный сифон — под выпуск 3½", сифон для умывальника сюда не встанет.
      { need: "xs.siphon_basin", why: "xs.siphon_sink_why", required: true, cats: ["sifony"], where: titled(/мойк|кухн/i), share: 0.1 },
      { need: "xs.grinder", why: "xs.grinder_why", required: false, cats: ["izmelcitel-othodov"], share: 1.5 },
    ];
  }

  if (cat === "dushevye-ograzhdeniya" || cat === "shtorki-steklyannye" || cat === "dushevye-kabiny") {
    return [
      { need: "xs.drain", why: "xs.drain_why", required: cat !== "dushevye-kabiny", cats: ["tochechnye-trapy"], share: 0.15 },
      { need: "xs.shower_system", why: "xs.shower_system_why", required: false, cats: ["dushevaya-sistema", "dlya-dusha"], where: titled(/смеситель|душев/i), share: 0.5 },
    ];
  }

  // Смесители и душевые группы: главный вопрос — скрытый монтаж.
  if (FAUCET_CATS.includes(cat) || KITCHEN_FAUCET_CATS.includes(cat) || cat === "dushevaya-sistema" || cat === "gigienicheskij-dush") {
    const rules: Rule[] = [];
    if (src.mount === "hidden" && !RX_SELF_CONTAINED.test(src.title)) {
      rules.push({
        need: "xs.inner", why: "xs.inner_why", required: true,
        // Только своего бренда: у LEMARK встраиваемый смеситель идёт целиком,
        // отдельная скрытая часть есть в основном у GROHE (Rapido).
        cats: FAUCET_CATS,
        where: (c, s) => RX_INNER_PART.test(c.title) && !RX_NOT_INNER.test(c.title) && c.brand === s.brand,
        share: 1,
      });
    }
    if (cat === "dlya-dusha" || cat === "dlya-vanny-i-dusha" || cat === "dushevaya-sistema") {
      rules.push({
        need: "xs.shower_set", why: "xs.shower_set_why", required: false,
        cats: ["dushevoj-garnitur-shtangalejka-bez-smesitelya", "lejka-dlya-dusha"],
        share: 0.4, prefer: sameBrand, skip: (s) => has(s, RX_SHOWER_SET),
      });
    }
    if (cat === "dlya-umyvalnikov" || cat === "vysokij-smesitel-dlya-rakoviny-chashi") {
      rules.push(
        { need: "xs.siphon_basin", why: "xs.siphon_basin_why", required: true, cats: ["sifony"], where: siphonFor(false), share: 0.15 },
        { need: "xs.hose", why: "xs.hose_why", required: true, cats: ["shlangi-dlya-unitazov-i-smesitelej"], where: notShowerHose, share: 0.03 },
      );
    }
    if (cat === "dlya-vanny") {
      rules.push({ need: "xs.siphon_bath", why: "xs.siphon_bath_why", required: false, cats: ["sifony"], where: siphonFor(true), share: 0.2 });
    }
    if (KITCHEN_FAUCET_CATS.includes(cat)) {
      rules.push(
        { need: "xs.sink", why: "xs.sink_why", required: false, cats: SINK_CATS, share: 1.2 },
        { need: "xs.hose", why: "xs.hose_why", required: true, cats: ["shlangi-dlya-unitazov-i-smesitelej"], where: notShowerHose, share: 0.03 },
      );
    }
    return rules;
  }

  if (cat === "elektricheskie" || cat === "vodyanye") {
    return [
      { need: "xs.hook", why: "xs.hook_why", required: false, cats: ["kryuchok"], share: 0.1, prefer: sameBrand },
      { need: "xs.shelf", why: "xs.shelf_why", required: false, cats: ["polka"], share: 0.2, prefer: sameBrand },
    ];
  }

  return [];
}

// Кандидаты разложены по категориям один раз: страниц товара больше четырёх
// тысяч, и полный проход по каталогу на каждой заметно удлинял сборку.
let _byCat: Map<string, CatalogItem[]> | null = null;
function byCategory(): Map<string, CatalogItem[]> {
  if (_byCat) return _byCat;
  const m = new Map<string, CatalogItem[]>();
  for (const p of catalogItems) {
    if (!p.in_stock || !p.price || !p.image || p.is_combo) continue;
    const list = m.get(p.category);
    if (list) list.push(p);
    else m.set(p.category, [p]);
  }
  _byCat = m;
  return m;
}

/** Штраф за неадекватную цену: аксессуар должен стоить долю от основного товара. */
function priceFit(candidate: number, base: number, share: number): number {
  if (!base || !share || !candidate) return 0;
  return -Math.abs(Math.log(candidate / (base * share))) * 25;
}

function bestFor(rule: Rule, src: CatalogItem, taken: Set<string>): CatalogItem | null {
  let best: CatalogItem | null = null;
  let bestScore = -Infinity;
  for (const cat of rule.cats) {
    for (const c of byCategory().get(cat) ?? []) {
      if (c.slug === src.slug || taken.has(c.slug)) continue;
      if (rule.where && !rule.where(c, src)) continue;
      const score =
        (rule.prefer?.(c, src) ?? 0) +
        priceFit(c.price ?? 0, src.price ?? 0, rule.share ?? 0) +
        Math.min(c.img_kb ?? 0, 120) / 20; // приличное фото — тоже аргумент
      if (score > bestScore) {
        bestScore = score;
        best = c;
      }
    }
  }
  return best;
}

export function crossSell(slug: string): { required: Suggestion[]; optional: Suggestion[] } {
  const src = catalogItems.find((p) => p.slug === slug);
  if (!src) return { required: [], optional: [] };

  const taken = new Set<string>([slug]);
  const picked = new Map<string, CatalogItem>();
  const required: Suggestion[] = [];
  const optional: Suggestion[] = [];

  for (let rule of rulesFor(src)) {
    if (rule.skip?.(src)) continue;
    if (rule.after) {
      const parent = picked.get(rule.after);
      if (!parent) continue; // без «родителя» зависимая позиция бессмысленна
      const adj = rule.chain?.(parent);
      if (adj?.skip) continue;
      if (adj?.prefer) rule = { ...rule, prefer: adj.prefer };
    }
    const item = bestFor(rule, src, taken);
    if (!item) continue;
    taken.add(item.slug);
    picked.set(rule.need, item);
    (rule.required ? required : optional).push({ item, need: rule.need, why: rule.why, required: rule.required });
  }
  return { required: required.slice(0, 3), optional: optional.slice(0, 4) };
}
