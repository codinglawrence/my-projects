import { HeavenlyStem, EarthlyBranch, Gender, TrigramName } from "../types/tianji";

// 洛书天干配数歌诀 (《天机道》第44页)
// 壬甲从乾数(6)，乙癸向坤求(2)。庚来震上住(3)，辛在巽方面(4)。
// 丙以艮门立(8)，己于离家头(9)。戊须坎处出(1)，丁向兑中收(7)。
export const STEM_LUOSHU_NUMBERS: Record<HeavenlyStem, number> = {
  "甲": 6, // 乾
  "乙": 2, // 坤
  "丙": 8, // 艮
  "丁": 7, // 兑
  "戊": 1, // 坎
  "己": 9, // 离
  "庚": 3, // 震
  "辛": 4, // 巽
  "壬": 6, // 乾
  "癸": 2, // 坤
};

// 河图地支配数 (《天机道》第44页)
// 亥子一六水，寅卯三八真，巳午二七火，申酉四九金，辰戌丑未五十总生成。
export const BRANCH_HETU_NUMBERS: Record<EarthlyBranch, { odd: number; even: number }> = {
  "子": { odd: 1, even: 6 },
  "丑": { odd: 5, even: 10 },
  "寅": { odd: 3, even: 8 },
  "卯": { odd: 3, even: 8 },
  "辰": { odd: 5, even: 10 },
  "巳": { odd: 7, even: 2 },
  "午": { odd: 7, even: 2 },
  "未": { odd: 5, even: 10 },
  "申": { odd: 9, even: 4 },
  "酉": { odd: 9, even: 4 },
  "戌": { odd: 5, even: 10 },
  "亥": { odd: 1, even: 6 },
};

// 洛书数对应八卦 (1坎、2坤、3震、4巽、6乾、7兑、8艮、9离)
export const LUOSHU_TO_TRIGRAM: Record<number, TrigramName> = {
  1: "坎",
  2: "坤",
  3: "震",
  4: "巽",
  6: "乾",
  7: "兑",
  8: "艮",
  9: "离",
};

// 64卦名称与上卦下卦对照表
export const HEXAGRAM_NAMES_BY_TRIGRAMS: Record<string, string> = {
  "乾_乾": "乾为天",
  "坤_坤": "坤为地",
  "坎_震": "水雷屯",
  "艮_坎": "山水蒙",
  "坎_乾": "水天需",
  "乾_坎": "天水讼",
  "坤_坎": "地水师",
  "坎_坤": "水地比",
  "巽_乾": "风天小畜",
  "乾_兑": "天泽履",
  "坤_乾": "地天泰",
  "乾_坤": "天地否",
  "乾_离": "天火同人",
  "离_乾": "火天大有",
  "坤_艮": "地山谦",
  "震_坤": "雷地豫",
  "兑_震": "泽雷随",
  "艮_巽": "山风蛊",
  "坤_兑": "地泽临",
  "巽_坤": "风地观",
  "离_震": "火雷噬嗑",
  "艮_离": "山火贲",
  "艮_坤": "山地剥",
  "坤_震": "地雷复",
  "乾_震": "天雷无妄",
  "艮_乾": "山天大畜",
  "艮_震": "山雷颐",
  "兑_巽": "泽风大过",
  "坎_坎": "坎为水",
  "离_离": "离为火",
  "兑_艮": "泽山咸",
  "震_巽": "雷风恒",
  "乾_艮": "天山遯",
  "震_乾": "雷天大壮",
  "离_坤": "火地晋",
  "坤_离": "地火明夷",
  "巽_离": "风火家人",
  "离_兑": "火泽睽",
  "坎_艮": "水山蹇",
  "震_坎": "雷水解",
  "艮_兑": "山泽损",
  "巽_震": "风雷益",
  "兑_乾": "泽天夬",
  "乾_巽": "天风姤",
  "兑_坤": "泽地萃",
  "坤_巽": "地风升",
  "兑_坎": "泽水困",
  "坎_巽": "水风井",
  "兑_离": "泽火革",
  "离_巽": "火风鼎",
  "震_震": "震为雷",
  "艮_艮": "艮为山",
  "巽_艮": "风山渐",
  "震_兑": "雷泽归妹",
  "震_离": "雷火丰",
  "离_艮": "火山旅",
  "巽_巽": "巽为风",
  "兑_兑": "兑为泽",
  "巽_坎": "风水涣",
  "坎_兑": "水泽节",
  "巽_兑": "风泽中孚",
  "震_艮": "雷山小过",
  "坎_离": "水火既济",
  "离_坎": "火水未济",
};

// 8卦二进制爻（从初爻到上爻，0为阴--，1为阳一）
export const TRIGRAM_LINES: Record<TrigramName, [number, number, number]> = {
  "乾": [1, 1, 1],
  "坤": [0, 0, 0],
  "震": [1, 0, 0],
  "巽": [0, 1, 1],
  "坎": [0, 1, 0],
  "离": [1, 0, 1],
  "艮": [0, 0, 1],
  "兑": [1, 1, 0],
  "中": [1, 1, 1],
};

export function getLinesTrigram(lines: [number, number, number]): TrigramName {
  const key = lines.join("");
  for (const [name, arr] of Object.entries(TRIGRAM_LINES)) {
    if (arr.join("") === key) return name as TrigramName;
  }
  return "乾";
}

export interface FourPillarsNumerology {
  yearStemNum: number;
  yearBranchNum: { odd: number; even: number };
  monthStemNum: number;
  monthBranchNum: { odd: number; even: number };
  dayStemNum: number;
  dayBranchNum: { odd: number; even: number };
  hourStemNum: number;
  hourBranchNum: { odd: number; even: number };
  oddSum: number; // 天数（单数相加）
  evenSum: number; // 地数（双数相加）
  tianshuRemainder: number;
  dishuRemainder: number;
  upperTrigramPre: TrigramName;
  lowerTrigramPre: TrigramName;
  preNatalHexagram: string; // 先天卦
  preNatalSymbol: string;
  yuanTangYao: number; // 元堂动爻位 (1~6)
  postNatalHexagram: string; // 后天卦
  postNatalSymbol: string;
  preNatalYears: number; // 先天卦总管年限
  postNatalYears: number; // 后天卦总管年限
  decadeTimeline: {
    ageRange: string;
    hexagram: string;
    yaoIndex: number;
    yaoNature: "阳" | "阴";
    years: number;
    stage: "先天卦大运" | "后天卦大运";
  }[];
}

// 依据《天纪道》第四十五页：八字取数与洛书起卦计算
export function calculateTianjiNumerology(
  yearStem: HeavenlyStem,
  yearBranch: EarthlyBranch,
  monthStem: HeavenlyStem,
  monthBranch: EarthlyBranch,
  dayStem: HeavenlyStem,
  dayBranch: EarthlyBranch,
  hourStem: HeavenlyStem,
  hourBranch: EarthlyBranch,
  gender: Gender,
  lunarMonth: number
): FourPillarsNumerology {
  const ysNum = STEM_LUOSHU_NUMBERS[yearStem];
  const ybNum = BRANCH_HETU_NUMBERS[yearBranch];
  const msNum = STEM_LUOSHU_NUMBERS[monthStem];
  const mbNum = BRANCH_HETU_NUMBERS[monthBranch];
  const dsNum = STEM_LUOSHU_NUMBERS[dayStem];
  const dbNum = BRANCH_HETU_NUMBERS[dayBranch];
  const hsNum = STEM_LUOSHU_NUMBERS[hourStem];
  const hbNum = BRANCH_HETU_NUMBERS[hourBranch];

  // 提取所有单数与双数
  const allStems = [ysNum, msNum, dsNum, hsNum];
  const branchOdds = [ybNum.odd, mbNum.odd, dbNum.odd, hbNum.odd];
  const branchEvens = [ybNum.even, mbNum.even, dbNum.even, hbNum.even];

  let oddSum = 0;
  let evenSum = 0;

  allStems.forEach((n) => {
    if (n % 2 !== 0) oddSum += n;
    else evenSum += n;
  });

  branchOdds.forEach((n) => {
    if (n % 2 !== 0) oddSum += n;
    else evenSum += n;
  });

  branchEvens.forEach((n) => {
    if (n % 2 !== 0) oddSum += n;
    else evenSum += n;
  });

  // 天数求法：除去天数25，得余数为卦。不足25除10取零数，止于25除20用5数，超过25除25不用只用零位
  let tRem = oddSum;
  if (tRem > 25) {
    tRem = (tRem - 25) % 10;
    if (tRem === 0) tRem = 5;
  } else if (tRem === 25) {
    tRem = 5;
  } else {
    tRem = tRem % 10;
    if (tRem === 0) tRem = 5;
  }

  // 地数求法：基数30。止30只用3数，不足30遇10不用只用零位数，超过30除30不用只用零数
  let dRem = evenSum;
  if (dRem > 30) {
    dRem = (dRem - 30) % 10;
    if (dRem === 0) dRem = 5;
  } else if (dRem === 30) {
    dRem = 3;
  } else {
    dRem = dRem % 10;
    if (dRem === 0) dRem = 5;
  }

  // 寄宫处理：如果余数为5 (按中元阳男寄艮8，阴女寄坤2，阴男寄坤2，阳女寄艮8)
  const isYangYear = ["甲", "丙", "戊", "庚", "壬"].includes(yearStem);
  const isYangPerson = (gender === "male" && isYangYear) || (gender === "female" && !isYangYear);

  const resolveFive = (num: number, isMale: boolean) => {
    if (num !== 5) return num;
    return isMale ? 8 : 2; // 寄艮8或寄坤2
  };

  const finalTianNum = resolveFive(tRem, gender === "male");
  const finalDiNum = resolveFive(dRem, gender === "male");

  const tTrigram = LUOSHU_TO_TRIGRAM[finalTianNum] || "乾";
  const dTrigram = LUOSHU_TO_TRIGRAM[finalDiNum] || "坤";

  // 7. 八卦相荡成先天卦 (《天机道》第46页)
  // 阳男、阴女：天数在上（外卦），地数在下（内卦）
  // 阴男、阳女：地数在上（外卦），天数在下（内卦）
  let upperPre: TrigramName;
  let lowerPre: TrigramName;

  if (isYangPerson) {
    upperPre = tTrigram;
    lowerPre = dTrigram;
  } else {
    upperPre = dTrigram;
    lowerPre = tTrigram;
  }

  const preHexName = HEXAGRAM_NAMES_BY_TRIGRAMS[`${upperPre}_${lowerPre}`] || "乾为天";

  // 8. 取元堂爻位 (《天机道》第46~48页)
  // 上六时属阳：子、丑、寅、卯、辰、巳。从子时数起本卦阳爻。
  // 下六时属阴：午、未、申、酉、戌、亥。从午时数起本卦阴爻。
  const isYangHour = ["子", "丑", "寅", "卯", "辰", "巳"].includes(hourBranch);
  const hourIdx = isYangHour
    ? ["子", "丑", "寅", "卯", "辰", "巳"].indexOf(hourBranch)
    : ["午", "未", "申", "酉", "戌", "亥"].indexOf(hourBranch);

  // 获取先天卦的六爻（0:初爻 ~ 5:上爻）
  const lowerLines = TRIGRAM_LINES[lowerPre];
  const upperLines = TRIGRAM_LINES[upperPre];
  const hexLines: number[] = [...lowerLines, ...upperLines]; // 0~5

  // 查找阳爻或阴爻位置
  const targetMatches: number[] = [];
  hexLines.forEach((line, idx) => {
    if (isYangHour && line === 1) targetMatches.push(idx + 1); // 1-indexed
    if (!isYangHour && line === 0) targetMatches.push(idx + 1);
  });

  let yuanTangYao = 1;
  if (targetMatches.length > 0) {
    yuanTangYao = targetMatches[hourIdx % targetMatches.length];
  } else {
    yuanTangYao = (hourIdx % 6) + 1;
  }

  // 9. 先天卦换后天卦 (《天机道》第49~51页)
  // 先天卦求出，元堂又定位，则以元堂之爻：阳爻变阴爻，阴爻变阳爻；再移外卦入内，内卦出外（天旋地转更革之象）
  // 特例：三大至尊卦（坎为水、水雷屯、水山蹇）九五或上六特殊换卦
  let upperPost: TrigramName = lowerPre;
  let lowerPost: TrigramName = upperPre;

  const postLines = [...hexLines];
  // 变换元堂爻
  postLines[yuanTangYao - 1] = postLines[yuanTangYao - 1] === 1 ? 0 : 1;

  // 内外对调
  const newLowerLines: [number, number, number] = [postLines[3], postLines[4], postLines[5]];
  const newUpperLines: [number, number, number] = [postLines[0], postLines[1], postLines[2]];
  upperPost = getLinesTrigram(newUpperLines);
  lowerPost = getLinesTrigram(newLowerLines);

  // 特殊三大至尊卦核验（坎为水、水雷屯、水山蹇）
  const isYangOrder = lunarMonth >= 11 || lunarMonth <= 4; // 冬至后至夏至前为阳令
  if (preHexName === "坎为水" && yuanTangYao === 5) {
    if (!isYangOrder) {
      upperPost = "坤"; lowerPost = "坎"; // 地水师
    } else {
      upperPost = "震"; lowerPost = "坤"; // 雷地豫
    }
  } else if (preHexName === "水雷屯" && yuanTangYao === 5) {
    if (!isYangOrder) {
      upperPost = "坤"; lowerPost = "震"; // 地雷复
    } else {
      upperPost = "艮"; lowerPost = "坤"; // 山地剥
    }
  } else if (preHexName === "水山蹇" && yuanTangYao === 5) {
    if (!isYangOrder) {
      upperPost = "坤"; lowerPost = "艮"; // 地山谦
    } else {
      upperPost = "坎"; lowerPost = "坤"; // 水地比
    }
  }

  const postHexName = HEXAGRAM_NAMES_BY_TRIGRAMS[`${upperPost}_${lowerPost}`] || "地天泰";

  // 大运年限计算：阳爻管9年，阴爻管6年
  let preYears = 0;
  hexLines.forEach((line) => {
    preYears += line === 1 ? 9 : 6;
  });

  const postFullLines = [...TRIGRAM_LINES[lowerPost], ...TRIGRAM_LINES[upperPost]];
  let postYears = 0;
  postFullLines.forEach((line) => {
    postYears += line === 1 ? 9 : 6;
  });

  // 生成大运时间轴
  const decadeTimeline: FourPillarsNumerology["decadeTimeline"] = [];
  let currentAgeStart = 1;

  // 先天卦从元堂爻起大运
  for (let i = 0; i < 6; i++) {
    const yaoIdx = ((yuanTangYao - 1 + i) % 6);
    const lineVal = hexLines[yaoIdx];
    const dur = lineVal === 1 ? 9 : 6;
    const ageEnd = currentAgeStart + dur - 1;
    decadeTimeline.push({
      ageRange: `${currentAgeStart} ~ ${ageEnd} 岁`,
      hexagram: preHexName,
      yaoIndex: yaoIdx + 1,
      yaoNature: lineVal === 1 ? "阳" : "阴",
      years: dur,
      stage: "先天卦大运",
    });
    currentAgeStart = ageEnd + 1;
  }

  // 后天卦大运接续
  for (let i = 0; i < 6; i++) {
    const yaoIdx = i;
    const lineVal = postFullLines[yaoIdx];
    const dur = lineVal === 1 ? 9 : 6;
    const ageEnd = currentAgeStart + dur - 1;
    decadeTimeline.push({
      ageRange: `${currentAgeStart} ~ ${ageEnd} 岁`,
      hexagram: postHexName,
      yaoIndex: yaoIdx + 1,
      yaoNature: lineVal === 1 ? "阳" : "阴",
      years: dur,
      stage: "后天卦大运",
    });
    currentAgeStart = ageEnd + 1;
  }

  return {
    yearStemNum: ysNum,
    yearBranchNum: ybNum,
    monthStemNum: msNum,
    monthBranchNum: mbNum,
    dayStemNum: dsNum,
    dayBranchNum: dbNum,
    hourStemNum: hsNum,
    hourBranchNum: hbNum,
    oddSum,
    evenSum,
    tianshuRemainder: tRem,
    dishuRemainder: dRem,
    upperTrigramPre: upperPre,
    lowerTrigramPre: lowerPre,
    preNatalHexagram: preHexName,
    preNatalSymbol: getHexagramSymbol(preHexName),
    yuanTangYao,
    postNatalHexagram: postHexName,
    postNatalSymbol: getHexagramSymbol(postHexName),
    preNatalYears: preYears,
    postNatalYears: postYears,
    decadeTimeline,
  };
}

export function getHexagramSymbol(name: string): string {
  const map: Record<string, string> = {
    "乾为天": "䷀", "坤为地": "䷁", "水雷屯": "䷂", "山水蒙": "䷃",
    "水天需": "䷄", "天水讼": "䷅", "地水师": "䷆", "水地比": "䷇",
    "风天小畜": "䷈", "天泽履": "䷉", "地天泰": "䷊", "天地否": "䷋",
    "天火同人": "䷌", "火天大有": "䷍", "地山谦": "䷎", "雷地豫": "䷏",
    "泽雷随": "䷐", "山风蛊": "䷑", "地泽临": "䷒", "风地观": "䷓",
    "火雷噬嗑": "䷔", "山火贲": "䷕", "山地剥": "䷖", "地雷复": "䷗",
    "天雷无妄": "䷘", "山天大畜": "䷙", "山雷颐": "䷚", "泽风大过": "䷛",
    "坎为水": "䷜", "离为火": "䷝", "泽山咸": "䷞", "雷风恒": "䷟",
    "天山遯": "䷠", "雷天大壮": "䷡", "火地晋": "䷢", "地火明夷": "䷣",
    "风火家人": "䷤", "火泽睽": "䷥", "水山蹇": "䷦", "雷水解": "䷧",
    "山泽损": "䷨", "风雷益": "䷩", "泽天夬": "䷪", "天风姤": "䷫",
    "泽地萃": "䷬", "地风升": "䷭", "泽水困": "䷮", "水风井": "䷯",
    "泽火革": "䷰", "火风鼎": "䷱", "震为雷": "䷲", "艮为山": "䷳",
    "风山渐": "䷴", "雷泽归妹": "䷵", "雷火丰": "䷶", "火山旅": "䷷",
    "巽为风": "䷸", "兑为泽": "䷹", "风水涣": "䷺", "水泽节": "䷻",
    "风泽中孚": "䷼", "雷山小过": "䷽", "水火既济": "䷾", "火水未济": "䷿",
  };
  return map[name] || "䷀";
}
