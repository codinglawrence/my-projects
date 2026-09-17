import {
  Gender,
  HeavenlyStem,
  EarthlyBranch,
  FiveElementBureau,
  PalaceName,
  StarBrightness,
  SiHuaType,
  StarInfo,
  PalaceData,
  FormationPattern,
  NatalChart,
} from "../types/tianji";
import { HEAVENLY_STEMS, EARTHLY_BRANCHES, solarToLunar, SHICHEN_HOURS } from "./lunarCalendar";

export { SHICHEN_HOURS };

// Map Branch to 0-11 index (0: 子, 1: 丑, 2: 寅, 3: 卯, 4: 辰, 5: 巳, 6: 午, 7: 未, 8: 申, 9: 酉, 10: 戌, 11: 亥)
export const BRANCH_INDEX: Record<EarthlyBranch, number> = {
  "子": 0, "丑": 1, "寅": 2, "卯": 3, "辰": 4, "巳": 5,
  "午": 6, "未": 7, "申": 8, "酉": 9, "戌": 10, "亥": 11,
};

export const INDEX_TO_BRANCH: EarthlyBranch[] = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];

const PALACE_NAMES_ORDER: PalaceName[] = [
  "命宫", "兄弟宫", "夫妻宫", "子女宫", "财帛宫", "疾厄宫",
  "迁移宫", "仆役宫", "官禄宫", "田宅宫", "福德宫", "父母宫"
];

// Ni Haixia Si Hua Table
export const SIHUA_TABLE: Record<HeavenlyStem, { lu: string; quan: string; ke: string; ji: string }> = {
  "甲": { lu: "廉贞", quan: "破军", ke: "武曲", ji: "太阳" },
  "乙": { lu: "天机", quan: "天梁", ke: "紫微", ji: "太阴" },
  "丙": { lu: "天同", quan: "天机", ke: "文昌", ji: "廉贞" },
  "丁": { lu: "太阴", quan: "天同", ke: "天机", ji: "巨门" },
  "戊": { lu: "贪狼", quan: "太阴", ke: "右弼", ji: "天机" },
  "己": { lu: "武曲", quan: "贪狼", ke: "天梁", ji: "文曲" },
  "庚": { lu: "太阳", quan: "武曲", ke: "太阴", ji: "天同" },
  "辛": { lu: "巨门", quan: "太阳", ke: "文曲", ji: "文昌" },
  "壬": { lu: "天梁", quan: "紫微", ke: "左辅", ji: "武曲" },
  "癸": { lu: "破军", quan: "巨门", ke: "太阴", ji: "贪狼" },
};

// Five Element Bureau calculation from Year Stem & Life Palace Branch
export function calculateBureau(yearStem: HeavenlyStem, lifeBranch: EarthlyBranch): { bureau: FiveElementBureau; bureauNumber: number } {
  // Stem index pair: 甲己=1, 乙庚=2, 丙辛=3, 丁壬=4, 戊癸=5
  const stemVal: Record<HeavenlyStem, number> = {
    "甲": 1, "己": 1,
    "乙": 2, "庚": 2,
    "丙": 3, "辛": 3,
    "丁": 4, "壬": 4,
    "戊": 5, "癸": 5,
  };

  // Branch index pair: 子丑/午未=1, 寅卯/申酉=2, 辰巳/戌亥=3
  const branchIdx = BRANCH_INDEX[lifeBranch];
  let branchVal = 1;
  if (branchIdx === 0 || branchIdx === 1 || branchIdx === 6 || branchIdx === 7) branchVal = 1;
  else if (branchIdx === 2 || branchIdx === 3 || branchIdx === 8 || branchIdx === 9) branchVal = 2;
  else branchVal = 3;

  let sum = stemVal[yearStem] + branchVal;
  if (sum > 5) sum -= 5;

  // 1: 金四局, 2: 水二局, 3: 火六局, 4: 土五局, 5: 木三局
  switch (sum) {
    case 1: return { bureau: "金四局", bureauNumber: 4 };
    case 2: return { bureau: "水二局", bureauNumber: 2 };
    case 3: return { bureau: "火六局", bureauNumber: 6 };
    case 4: return { bureau: "土五局", bureauNumber: 5 };
    case 5: return { bureau: "木三局", bureauNumber: 3 };
    default: return { bureau: "水二局", bureauNumber: 2 };
  }
}

// Calculate Ziwei Star position (Index 0-11)
export function getZiweiPosition(lunarDay: number, bureauNum: number): number {
  let quotient = Math.floor(lunarDay / bureauNum);
  let remainder = lunarDay % bureauNum;

  let pos = 0;
  if (remainder === 0) {
    pos = (2 + (quotient - 1)) % 12; // Start from 寅(2)
  } else {
    let diff = bureauNum - remainder;
    let newQuotient = Math.floor((lunarDay + diff) / bureauNum);
    if (diff % 2 === 1) {
      // If diff is odd, step backward
      pos = (2 + (newQuotient - 1) - diff + 24) % 12;
    } else {
      // If diff is even, step forward
      pos = (2 + (newQuotient - 1) + diff) % 12;
    }
  }
  return (pos % 12 + 12) % 12;
}

// Brightness table (approximate classic standard for key palaces)
export function getStarBrightness(star: string, branchIdx: number): StarBrightness {
  const branch = INDEX_TO_BRANCH[branchIdx];
  // 庙 旺 利 陷
  if (star === "紫微") {
    if (["午", "未", "巳", "申"].includes(branch)) return "庙";
    if (["寅", "卯", "辰", "酉", "戌"].includes(branch)) return "旺";
    if (["子", "丑"].includes(branch)) return "利";
    return "平";
  }
  if (star === "太阳") {
    if (["巳", "午", "辰", "卯"].includes(branch)) return "庙";
    if (["寅", "未"].includes(branch)) return "旺";
    if (["申", "酉"].includes(branch)) return "平";
    return "陷"; // 戌亥子丑
  }
  if (star === "太阴") {
    if (["酉", "戌", "亥", "子"].includes(branch)) return "庙";
    if (["丑", "未", "申"].includes(branch)) return "旺";
    if (["寅", "辰"].includes(branch)) return "利";
    return "陷"; // 卯巳午
  }
  if (star === "七杀" || star === "破军") {
    if (["子", "午", "寅", "申"].includes(branch)) return "庙";
    if (["辰", "戌", "丑", "未"].includes(branch)) return "旺";
    return "平";
  }
  if (star === "贪狼") {
    if (["辰", "戌", "丑", "未"].includes(branch)) return "庙";
    if (["午", "申"].includes(branch)) return "旺";
    return "利";
  }
  if (star === "武曲") {
    if (["辰", "戌", "丑", "未", "巳", "亥"].includes(branch)) return "庙";
    return "旺";
  }
  if (star === "巨门") {
    if (["卯", "酉", "子", "午"].includes(branch)) return "庙";
    if (["寅", "申"].includes(branch)) return "旺";
    return "平";
  }
  return "得";
}

// Generate Natal Chart according to Ni Haixia's Tian Ji
export function generateNatalChart(
  name: string,
  solarDateStr: string, // YYYY-MM-DD
  hour: number, // 0-23
  gender: Gender
): NatalChart {
  const [y, m, d] = solarDateStr.split("-").map(Number);
  const lunar = solarToLunar(y, m, d, hour);

  // 1. Life Palace & Body Palace Calculation
  // 命宫: 起寅(2)，顺数生月至(2 + lunarMonth - 1)，再从此起子时逆数生时
  const hourIdx = BRANCH_INDEX[lunar.hourBranch];
  const monthStartIdx = (2 + (lunar.lunarMonth - 1)) % 12;
  const lifePalaceIdx = (monthStartIdx - hourIdx + 24) % 12;
  const bodyPalaceIdx = (monthStartIdx + hourIdx) % 12;

  const lifeBranch = INDEX_TO_BRANCH[lifePalaceIdx];
  const bodyBranch = INDEX_TO_BRANCH[bodyPalaceIdx];

  // 2. Five Element Bureau
  const { bureau, bureauNumber } = calculateBureau(lunar.yearStem, lifeBranch);

  // Yin / Yang gender
  const isYangYear = ["甲", "丙", "戊", "庚", "壬"].includes(lunar.yearStem);
  const isMale = gender === "male";
  // 阳男阴女顺行，阴男阳女逆行
  const isForward = (isYangYear && isMale) || (!isYangYear && !isMale);
  const yinYangGender = isYangYear ? (isMale ? "阳男" : "阳女") : (isMale ? "阴男" : "阴女");

  // 3. Setup 12 Palaces
  const palaces: PalaceData[] = [];
  const sihua = SIHUA_TABLE[lunar.yearStem];

  // Map each of 12 Earthly Branches to its Palace Name
  for (let i = 0; i < 12; i++) {
    const branch = INDEX_TO_BRANCH[i];
    // Distance from Life Palace counter-clockwise
    const diff = (lifePalaceIdx - i + 12) % 12;
    const name = PALACE_NAMES_ORDER[diff];
    const isLife = i === lifePalaceIdx;
    const isBody = i === bodyPalaceIdx;

    // Stem for this palace (Tiger starting rule)
    const tigerStarts: Record<HeavenlyStem, number> = {
      "甲": 2, "己": 2, "乙": 4, "庚": 4, "丙": 6, "辛": 6, "丁": 8, "壬": 8, "戊": 0, "癸": 0,
    };
    const startStemIdx = tigerStarts[lunar.yearStem];
    const stemIdx = (startStemIdx + (i - 2 + 12) % 12) % 10;
    const stem = HEAVENLY_STEMS[stemIdx];

    // Decadal limits (大限)
    let decStep = 0;
    if (isForward) {
      decStep = (i - lifePalaceIdx + 12) % 12;
    } else {
      decStep = (lifePalaceIdx - i + 12) % 12;
    }
    const decadeStartAge = bureauNumber + decStep * 10;
    const decadeEndAge = decadeStartAge + 9;

    palaces.push({
      index: i,
      branch,
      stem,
      name,
      isLifePalace: isLife,
      isBodyPalace: isBody,
      majorStars: [],
      minorStars: [],
      decadeStartAge,
      decadeEndAge,
      smallLimitAges: [decadeStartAge, decadeStartAge + 12, decadeStartAge + 24],
      niHaixiaAnalysis: {
        overview: "",
        actionAdvice: "",
        warningNote: "",
      },
    });
  }

  // 4. Place Ziwei Star Group
  const ziweiPos = getZiweiPosition(lunar.lunarDay, bureauNumber);
  const ziweiGroup = [
    { name: "紫微", offset: 0 },
    { name: "天机", offset: -1 },
    { name: "太阳", offset: -3 },
    { name: "武曲", offset: -4 },
    { name: "天同", offset: -5 },
    { name: "廉贞", offset: -8 },
  ];

  ziweiGroup.forEach(({ name, offset }) => {
    const pIdx = (ziweiPos + offset + 24) % 12;
    const starSihua = (sihua.lu === name ? "禄" : sihua.quan === name ? "权" : sihua.ke === name ? "科" : sihua.ji === name ? "忌" : undefined) as SiHuaType | undefined;
    palaces[pIdx].majorStars.push({
      name,
      type: "major",
      brightness: getStarBrightness(name, pIdx),
      sihua: starSihua,
    });
  });

  // 5. Place Tianfu Star Group
  // Tianfu is symmetric to Ziwei across the 寅-申 axis (pos = (4 - ziweiPos + 24) % 12)
  const tianfuPos = (4 - ziweiPos + 24) % 12;
  const tianfuGroup = [
    { name: "天府", offset: 0 },
    { name: "太阴", offset: 1 },
    { name: "贪狼", offset: 2 },
    { name: "巨门", offset: 3 },
    { name: "天相", offset: 4 },
    { name: "天梁", offset: 5 },
    { name: "七杀", offset: 6 },
    { name: "破军", offset: 10 },
  ];

  tianfuGroup.forEach(({ name, offset }) => {
    const pIdx = (tianfuPos + offset) % 12;
    const starSihua = (sihua.lu === name ? "禄" : sihua.quan === name ? "权" : sihua.ke === name ? "科" : sihua.ji === name ? "忌" : undefined) as SiHuaType | undefined;
    palaces[pIdx].majorStars.push({
      name,
      type: "major",
      brightness: getStarBrightness(name, pIdx),
      sihua: starSihua,
    });
  });

  // 6. Auxiliary Stars
  // Left Assistant & Right Assistant (左辅 辰顺生月, 右弼 戌逆生月)
  const zuofuPos = (4 + (lunar.lunarMonth - 1)) % 12;
  const youbiPos = (10 - (lunar.lunarMonth - 1) + 24) % 12;
  palaces[zuofuPos].minorStars.push({ name: "左辅", type: "auspicious", brightness: "庙", sihua: sihua.ke === "左辅" ? "科" : undefined });
  palaces[youbiPos].minorStars.push({ name: "右弼", type: "auspicious", brightness: "庙", sihua: sihua.ke === "右弼" ? "科" : undefined });

  // Wen Chang (戌逆生时), Wen Qu (辰顺生时)
  const wenchangPos = (10 - hourIdx + 24) % 12;
  const wenquPos = (4 + hourIdx) % 12;
  palaces[wenchangPos].minorStars.push({ name: "文昌", type: "auspicious", brightness: "庙", sihua: sihua.ke === "文昌" ? "科" : sihua.ji === "文昌" ? "忌" : undefined });
  palaces[wenquPos].minorStars.push({ name: "文曲", type: "auspicious", brightness: "庙", sihua: sihua.ke === "文曲" ? "科" : sihua.ji === "文曲" ? "忌" : undefined });

  // Tian Kui, Tian Yue
  const kuiYueMap: Record<HeavenlyStem, [number, number]> = {
    "甲": [1, 7], "戊": [1, 7], "庚": [1, 7], // 丑 未
    "乙": [0, 8], "己": [0, 8], // 子 申
    "丙": [11, 9], "丁": [11, 9], // 亥 酉
    "壬": [3, 5], "癸": [3, 5], // 卯 巳
    "辛": [6, 2], // 午 寅
  };
  const [kuiPos, yuePos] = kuiYueMap[lunar.yearStem];
  palaces[kuiPos].minorStars.push({ name: "天魁", type: "auspicious", brightness: "旺" });
  palaces[yuePos].minorStars.push({ name: "天钺", type: "auspicious", brightness: "旺" });

  // Lu Cun, Qing Yang, Tuo Luo
  const lucunMap: Record<HeavenlyStem, number> = {
    "甲": 2, "乙": 3, "丙": 5, "丁": 6, "戊": 5, "己": 6, "庚": 8, "辛": 9, "壬": 11, "癸": 0,
  };
  const lucunPos = lucunMap[lunar.yearStem];
  const qingyangPos = (lucunPos + 1) % 12;
  const tuoluoPos = (lucunPos - 1 + 12) % 12;

  palaces[lucunPos].minorStars.push({ name: "禄存", type: "auspicious", brightness: "庙" });
  palaces[qingyangPos].minorStars.push({ name: "擎羊", type: "inauspicious", brightness: "陷" });
  palaces[tuoluoPos].minorStars.push({ name: "陀罗", type: "inauspicious", brightness: "陷" });

  // Di Kong, Di Jie (亥上起子时，顺数劫，逆数空)
  const dijiePos = (11 + hourIdx) % 12;
  const dikongPos = (11 - hourIdx + 24) % 12;
  palaces[dijiePos].minorStars.push({ name: "地劫", type: "inauspicious", brightness: "平" });
  palaces[dikongPos].minorStars.push({ name: "地空", type: "inauspicious", brightness: "平" });

  // Tian Ma (天马)
  const yearBranchIdx = BRANCH_INDEX[lunar.yearBranch];
  let tianmaPos = 2;
  if ([8, 0, 4].includes(yearBranchIdx)) tianmaPos = 2; // 申子辰在寅
  else if ([2, 6, 10].includes(yearBranchIdx)) tianmaPos = 8; // 寅午戌在申
  else if ([5, 9, 1].includes(yearBranchIdx)) tianmaPos = 11; // 巳酉丑在亥
  else tianmaPos = 5; // 亥卯未在巳
  palaces[tianmaPos].minorStars.push({ name: "天马", type: "auspicious", brightness: "旺" });

  // Hong Luan & Tian Xi
  const hongluanPos = (3 - yearBranchIdx + 24) % 12;
  const tianxiPos = (hongluanPos + 6) % 12;
  palaces[hongluanPos].minorStars.push({ name: "红鸾", type: "minor" });
  palaces[tianxiPos].minorStars.push({ name: "天喜", type: "minor" });

  // 7. Formations (格局判定)
  const patterns: FormationPattern[] = [];
  const lifePalace = palaces[lifePalaceIdx];
  const lifeMajorNames = lifePalace.majorStars.map((s) => s.name);
  const careerPalace = palaces[(lifePalaceIdx + 8) % 12];
  const wealthPalace = palaces[(lifePalaceIdx + 4) % 12];
  const movePalace = palaces[(lifePalaceIdx + 6) % 12];

  const sanFangMajorStars = [
    ...lifePalace.majorStars,
    ...careerPalace.majorStars,
    ...wealthPalace.majorStars,
    ...movePalace.majorStars,
  ];

  // 杀破狼格局
  if (lifeMajorNames.some((n) => ["七杀", "破军", "贪狼"].includes(n))) {
    patterns.push({
      name: "杀破狼格（开疆拓土·大破大立）",
      type: "special",
      description: "命宫坐七杀、破军或贪狼，三方四正必有另外二星拱照。天纪核心论断：一生多变动，敢作敢为，不甘平庸。",
      tianjiSignificance: "《天纪》云：杀破狼者，乱世之英雄、治世之能臣。行事雷厉风行，主变革与创业，最喜逢权禄吉星相助。",
      actionStrategy: "以果决行：宜主动拥抱变化与新赛道，忌贪图安逸；在顺境中严防投机，逆境中果敢突围。",
    });
  }

  // 三奇嘉会格 (化科、化权、化禄 会于三方四正)
  const hasLu = sanFangMajorStars.some((s) => s.sihua === "禄");
  const hasQuan = sanFangMajorStars.some((s) => s.sihua === "权");
  const hasKe = sanFangMajorStars.some((s) => s.sihua === "科");
  if (hasLu && hasQuan && hasKe) {
    patterns.push({
      name: "科权禄三奇嘉会格（大贵之局）",
      type: "auspicious",
      description: "化禄、化权、化科齐聚命宫与三方四正，为紫微斗数中至高规格之格局。",
      tianjiSignificance: "倪师指出：三奇嘉会者，名利双收，既有权柄执行力，又有科名学术声誉与财源丰厚，成大事者也。",
      actionStrategy: "以果决行：大展宏图之机，宜志存高远，注重整合优质团队与社会资源，以德配位。",
    });
  }

  // 紫府朝垣 / 紫府同宫
  if (lifeMajorNames.includes("紫微") && lifeMajorNames.includes("天府")) {
    patterns.push({
      name: "紫府同宫格（帝星坐命·统御四方）",
      type: "auspicious",
      description: "紫微北斗帝王星与天府南斗令星同坐寅申之位，格局高朗尊贵。",
      tianjiSignificance: "天纪精解：为人器宇轩昂，有统帅全局之风范，稳重持重，处事极具大局观。",
      actionStrategy: "以果决行：宜从事战略管理、领袖决策或核心支柱产业，避免琐碎内耗。",
    });
  }

  // 羊陀夹忌（大凶之险）
  const hasJi = lifePalace.majorStars.some((s) => s.sihua === "忌") || lifePalace.minorStars.some((s) => s.sihua === "忌");
  const prevPalace = palaces[(lifePalaceIdx - 1 + 12) % 12];
  const nextPalace = palaces[(lifePalaceIdx + 1) % 12];
  const hasYangTuoClamp =
    (prevPalace.minorStars.some((s) => s.name === "擎羊") && nextPalace.minorStars.some((s) => s.name === "陀罗")) ||
    (prevPalace.minorStars.some((s) => s.name === "陀罗") && nextPalace.minorStars.some((s) => s.name === "擎羊"));

  if (hasJi && hasYangTuoClamp) {
    patterns.push({
      name: "羊陀夹忌格（险隘关口·宜守不宜攻）",
      type: "inauspicious",
      description: "命宫逢化忌，且左右两宫被擎羊、陀罗紧夹，形成重重险阻困顿之局。",
      tianjiSignificance: "倪师极其警示：君子问祸不问福！此格易生官非、破败、重压或健康隐患，切忌孤注一掷与投机冒险。",
      actionStrategy: "以果决行：收敛锋芒，深居静修，依易经'坤卦'厚德载物，以退为进，避开锋芒。",
    });
  }

  // 日月同临 / 巨日同宫
  if (lifeMajorNames.includes("太阳") && lifeMajorNames.includes("巨门")) {
    patterns.push({
      name: "巨日同宫格（阳光普照·威名远播）",
      type: "auspicious",
      description: "太阳与巨门同坐寅申二宫，太阳之火驱散巨门之暗，口才卓越，利于扬名海外。",
      tianjiSignificance: "天纪论曰：此格之人直率坦荡，思虑深远，适合外务、公关、法务及国际化事业。",
      actionStrategy: "以果决行：强化公开表达与专业形象，坦荡行事，名利自然随之而来。",
    });
  }

  if (patterns.length === 0) {
    patterns.push({
      name: "机月同梁或清贵顺畅格",
      type: "auspicious",
      description: "星曜分布均衡，天机、太阴、天同、天梁等吉星互为配合，主处世智慧与稳健致远。",
      tianjiSignificance: "倪师天纪法则：稳中求胜，不显山不露水，适合专业精深、顾问企划、公职文教发展。",
      actionStrategy: "以果决行：深耕专业技术与系统化管理，积累长期复利价值。",
    });
  }

  // 8. Add Dynamic & Realistic Palace Interpretations from Ni Haixia
  palaces.forEach((p) => {
    const starNames = [...p.majorStars, ...p.minorStars].map((s) => s.name);
    const starDisplay = starNames.join("、") || "无主星（借对宫照入推断）";
    const majorNames = p.majorStars.map((s) => s.name);
    const hasHuaJi = p.majorStars.some((s) => s.sihua === "忌") || p.minorStars.some((s) => s.sihua === "忌");
    const hasHuaLu = p.majorStars.some((s) => s.sihua === "禄") || p.minorStars.some((s) => s.sihua === "禄");
    const hasHuaQuan = p.majorStars.some((s) => s.sihua === "权") || p.minorStars.some((s) => s.sihua === "权");
    const hasHuaKe = p.majorStars.some((s) => s.sihua === "科") || p.minorStars.some((s) => s.sihua === "科");
    const hasSha = p.minorStars.some((s) => ["擎羊", "陀罗", "火星", "铃星", "地空", "地劫"].includes(s.name));

    // Dynamic Overview
    let overview = `【${p.name}坐${p.branch}宫】星曜配置：${starDisplay}。`;
    if (majorNames.length === 0) {
      overview += `本宫无正曜坐守，气场较为浮动，容易受外部大环境及对宫星曜牵引。为人处世宜灵活借势，顺应形势变化，不宜刻舟求剑。`;
    } else if (majorNames.includes("紫微") || majorNames.includes("天府")) {
      overview += `帝星/令星坐镇，自带威重与统御之气，行事讲求大局观与信誉，具备核心凝聚力。`;
    } else if (majorNames.includes("七杀") || majorNames.includes("破军") || majorNames.includes("贪狼")) {
      overview += `杀破狼主动变与开拓，充满冲劲与应变力，在竞争或变局中能迎难而上，打破旧格局。`;
    } else if (majorNames.includes("武曲")) {
      overview += `武曲金星入宫，务实干练，讲究效率与实质成果，对数字与资产流动较为敏锐。`;
    } else if (majorNames.includes("太阳") || majorNames.includes("巨门")) {
      overview += `太阳光明巨门深邃，善于沟通、表达与外务拓展，在专业发声或跨界交流中极具穿透力。`;
    } else if (majorNames.includes("天机") || majorNames.includes("太阴")) {
      overview += `机阴主智慧与细腻，擅长策划、分析与幕后筹谋，思虑缜密，多才多艺。`;
    } else if (majorNames.includes("天同") || majorNames.includes("天梁") || majorNames.includes("天相")) {
      overview += `吉星温厚持重，注重人际和睦与制度规矩，适合稳扎稳打、守正出奇。`;
    }

    // Dynamic Action Advice
    let actionAdvice = "";
    if (p.name === "命宫") {
      actionAdvice = hasHuaJi
        ? "以果决行心法：命宫逢忌，遇事容易多虑纠结或自我施压。宜放下执念，遇事以'成事'为第一标准，多与开朗稳重之人同行，戒骄戒躁。"
        : hasHuaLu || hasHuaQuan
        ? "以果决行心法：先天禀赋强盛，当仁不让。宜志存高远，主动挑重担，将才华转化为实实在在的组织成果。"
        : "以果决行心法：命宫持平稳重。脚踏实地走稳每一步，在专业领域深耕复利，切忌盲目跟风冒进。";
    } else if (p.name === "财帛宫") {
      actionAdvice = hasHuaJi
        ? "求财运筹：财帛宫逢忌，求财路上多起伏，容易因冲动投资或借贷破财。切记'守得住才是自己的'，以正财本业为主，远离高杠杆理财。"
        : hasHuaLu
        ? "求财运筹：财源顺畅，商机灵敏。宜将流动资金及时转化为稳固资产或实体生产力，避免铺张浪费。"
        : "求财运筹：正财细水长流。适合踏实获取薪资报酬，量入为出，稳健配置现金与低风险储蓄。";
    } else if (p.name === "官禄宫") {
      actionAdvice = hasHuaQuan || majorNames.some((m) => ["紫微", "七杀", "太阳"].includes(m))
        ? "职场攻略：具备核心管理与掌舵潜质，宜争取团队主导权与关键业务线，用战绩确立行业威望。"
        : hasHuaJi
        ? "职场攻略：官禄逢忌，职场容易遇瓶颈阻滞或多番调整。宜守好本分，戒急躁跳槽，精炼核心不可替代之一技之长。"
        : "职场攻略：适合在规范体制、成熟企业或专业岗位稳步发展，以专业技能和稳定口碑立足。";
    } else if (p.name === "夫妻宫") {
      actionAdvice = hasHuaJi || hasSha
        ? "婚恋相处：感情宫位受煞忌扰动，双方性格容易有棱角或沟通不同频。宜晚婚晚育，多理解包容，避免因鸡毛蒜皮之事内耗。"
        : "婚恋相处：情感因缘相对平顺。重视彼此精神共鸣与日常扶持，以家庭和睦为坚实后盾。";
    } else if (p.name === "疾厄宫") {
      actionAdvice = hasHuaJi || hasSha
        ? "身心调养：疾厄宫见煞忌，提醒关注先天脏腑薄弱点（如脾胃消化、气血经络或睡眠质量）。规律作息，定期体检，治未病。"
        : "身心调养：体质平和。保持适度运动与情志舒畅，顺应四时节气调养身心。";
    } else if (p.name === "田宅宫") {
      actionAdvice = hasHuaLu || majorNames.includes("天府") || majorNames.includes("太阴")
        ? "置产风水：田宅根基稳固，利于购置不动产与安居乐业，注意保持居家环境通风向阳，聚气生财。"
        : "置产风水：买房置产宜量力而行，避免过度按揭负债，居家宜简朴整洁、注重采光藏风。"
    } else {
      actionAdvice = hasHuaLu || hasHuaQuan
        ? `人际运筹：此宫位机缘良好，善于调动外部资源，与相关人际多建利他共赢之纽带。`
        : `人际运筹：以礼相待，君子之交淡如水。凡事界定清晰边界，避免无谓的人情纠葛。`;
    }

    // Dynamic Warning Note
    let warningNote = "";
    if (hasHuaJi) {
      warningNote = `【警示防线】：本宫逢【化忌】星临，为重点考题所在。切防因一时疏忽或情绪执拗而在此领域（${p.name}）栽跟头，凡事三思后行，留有退路。`;
    } else if (hasSha) {
      warningNote = `【警示防线】：宫内逢煞星（羊陀火铃空劫），行事容易急躁或遇波折。倪师告诫：君子见几而作，防微杜渐，勿争一时口舌意气。`;
    } else {
      warningNote = `【警示防线】：当前宫位虽无重煞，但仍需留意流年飞星流煞的短期引动。居安思危，在顺境中积蓄实力。`;
    }

    p.niHaixiaAnalysis = {
      overview,
      actionAdvice,
      warningNote,
    };
  });

  const coreSummary = `命主属${yinYangGender}，${bureau}，命坐【${lifeBranch}】宫，身坐【${bodyBranch}】宫。年干【${lunar.yearStem}】引动：${sihua.lu}化禄、${sihua.quan}化权、${sihua.ke}化科、${sihua.ji}化忌。核心格局呈【${patterns[0]?.name || "稳健格局"}】，具备${patterns[0]?.tianjiSignificance || "扎实之天命底蕴"}。`;

  return {
    name,
    gender,
    solarDate: solarDateStr,
    lunarDate: {
      year: lunar.lunarYear,
      month: lunar.lunarMonth,
      day: lunar.lunarDay,
      isLeap: lunar.isLeap,
      stemBranchYear: lunar.stemBranchYear,
      stemBranchMonth: lunar.stemBranchMonth,
      stemBranchDay: lunar.stemBranchDay,
      stemBranchHour: lunar.stemBranchHour,
    },
    heavenlyStems: {
      year: lunar.yearStem,
      month: lunar.monthStem,
      day: lunar.dayStem,
      hour: lunar.hourStem,
    },
    earthlyBranches: {
      year: lunar.yearBranch,
      month: lunar.monthBranch,
      day: lunar.dayBranch,
      hour: lunar.hourBranch,
    },
    hourBranch: lunar.hourBranch,
    bureau,
    yinYangGender,
    lifePalaceBranch: lifeBranch,
    bodyPalaceBranch: bodyBranch,
    palaces,
    patterns,
    annualSiHua: {
      stem: lunar.yearStem,
      ...sihua,
    },
    coreSummary,
  };
}

export function calculateNatalChart(
  name: string,
  gender: Gender,
  solarDateStr: string,
  hour: EarthlyBranch | number
): NatalChart {
  let hourNum = 12;
  if (typeof hour === "number") {
    hourNum = hour;
  } else {
    const branchToHour: Record<EarthlyBranch, number> = {
      "子": 0, "丑": 2, "寅": 4, "卯": 6, "辰": 8, "巳": 10,
      "午": 12, "未": 14, "申": 16, "酉": 18, "戌": 20, "亥": 22,
    };
    hourNum = branchToHour[hour] ?? 12;
  }
  return generateNatalChart(name, solarDateStr, hourNum, gender);
}
