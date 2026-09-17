import { HeavenlyStem, EarthlyBranch } from "../types/tianji";

export const HEAVENLY_STEMS: HeavenlyStem[] = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];
export const EARTHLY_BRANCHES: EarthlyBranch[] = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];

// Compressed lunar calendar data (1930 to 2050)
// Each integer encodes: [4 bits leap month (0=none)][12/13 bits for month days (1=30days, 0=29days)]
const LUNAR_INFO = [
  0x04bd8, 0x04ae0, 0x0a570, 0x054d5, 0x0d260, 0x0d950, 0x16554, 0x056a0, 0x09ad0, 0x055d2, // 1930-1939
  0x04ae0, 0x0a5b6, 0x0a4d0, 0x0d250, 0x1d255, 0x0b540, 0x0d6a0, 0x0ada2, 0x095b0, 0x14977, // 1940-1949
  0x04970, 0x0a4b0, 0x0b4b5, 0x06a50, 0x06d40, 0x1ab54, 0x02b60, 0x09570, 0x052f2, 0x04970, // 1950-1959
  0x06566, 0x0d4a0, 0x0ea50, 0x06e95, 0x05ad0, 0x02b60, 0x186e3, 0x092e0, 0x1c8d7, 0x0c950, // 1960-1969
  0x0d4a0, 0x1d8a6, 0x0b550, 0x056a0, 0x1a5b4, 0x025d0, 0x092d0, 0x0d2b2, 0x0a950, 0x0b557, // 1970-1979
  0x06ca0, 0x0b550, 0x15355, 0x04da0, 0x0a5d0, 0x14573, 0x052d0, 0x0a9a8, 0x0e950, 0x06aa0, // 1980-1989
  0x0aea6, 0x0ab50, 0x04b60, 0x0aae4, 0x0a570, 0x05260, 0x0f263, 0x0d950, 0x05b57, 0x056a0, // 1990-1999
  0x096d0, 0x04dd5, 0x04ad0, 0x0a4d0, 0x0d4d4, 0x0d250, 0x0d558, 0x0b540, 0x0b5a0, 0x195a6, // 2000-2009
  0x095b0, 0x049b0, 0x0a974, 0x0a4b0, 0x0b27a, 0x06a50, 0x06d40, 0x0af46, 0x0ab60, 0x09570, // 2010-2019
  0x04af5, 0x04970, 0x064b0, 0x074a3, 0x0ea50, 0x06b58, 0x055c0, 0x0ab60, 0x096d5, 0x092e0, // 2020-2029
  0x0c960, 0x0d954, 0x0d4a0, 0x0da50, 0x07552, 0x056a0, 0x0abb7, 0x025d0, 0x092d0, 0x0cab5, // 2030-2039
  0x0a950, 0x0b4a0, 0x0baa4, 0x0ad50, 0x055d9, 0x04ba0, 0x0a5b0, 0x15176, 0x052b0, 0x0a930, // 2040-2049
  0x07954, 0x06aa0, 0x0ad50, 0x05b52, 0x04b60, 0x0a6e6, 0x0a4e0, 0x0d260, 0x0ea65, 0x0d530, // 2050-2059
];

export interface LunarDateResult {
  lunarYear: number;
  lunarMonth: number;
  lunarDay: number;
  isLeap: boolean;
  yearStem: HeavenlyStem;
  yearBranch: EarthlyBranch;
  monthStem: HeavenlyStem;
  monthBranch: EarthlyBranch;
  dayStem: HeavenlyStem;
  dayBranch: EarthlyBranch;
  hourStem: HeavenlyStem;
  hourBranch: EarthlyBranch;
  stemBranchYear: string;
  stemBranchMonth: string;
  stemBranchDay: string;
  stemBranchHour: string;
}

// Days in lunar year
function getLunarYearDays(year: number): number {
  let sum = 348;
  const info = LUNAR_INFO[year - 1930];
  if (!info) return 354;
  for (let i = 0x8000; i > 0x8; i >>= 1) {
    sum += (info & i) ? 1 : 0;
  }
  return sum + getLeapMonthDays(year);
}

// Days in leap month (0 if none)
function getLeapMonthDays(year: number): number {
  if (getLeapMonth(year)) {
    return (LUNAR_INFO[year - 1930] & 0x10000) ? 30 : 29;
  }
  return 0;
}

// Which month is leap (0 = none)
function getLeapMonth(year: number): number {
  const info = LUNAR_INFO[year - 1930];
  return info ? (info & 0xf) : 0;
}

// Days in specific lunar month
function getLunarMonthDays(year: number, month: number): number {
  const info = LUNAR_INFO[year - 1930];
  if (!info) return 30;
  return (info & (0x10000 >> month)) ? 30 : 29;
}

// Convert Solar Date (YYYY, MM, DD) to Lunar Date
export function solarToLunar(solarYear: number, solarMonth: number, solarDay: number, hour24: number = 12): LunarDateResult {
  // Reference date: 1930-01-30 is Lunar 1930-01-01
  const baseDate = new Date(1930, 0, 30);
  const targetDate = new Date(solarYear, solarMonth - 1, solarDay);
  let offset = Math.floor((targetDate.getTime() - baseDate.getTime()) / 86400000);

  let lunarYear = 1930;
  while (lunarYear <= 2055 && offset > 0) {
    const daysInYear = getLunarYearDays(lunarYear);
    if (offset < daysInYear) break;
    offset -= daysInYear;
    lunarYear++;
  }

  const leapMonth = getLeapMonth(lunarYear);
  let isLeap = false;
  let lunarMonth = 1;

  for (let m = 1; m <= 12; m++) {
    // Normal month
    const daysInMonth = getLunarMonthDays(lunarYear, m);
    if (offset < daysInMonth) {
      lunarMonth = m;
      break;
    }
    offset -= daysInMonth;

    // Leap month check
    if (leapMonth === m) {
      const leapDays = getLeapMonthDays(lunarYear);
      if (offset < leapDays) {
        lunarMonth = m;
        isLeap = true;
        break;
      }
      offset -= leapDays;
    }
  }

  const lunarDay = offset + 1;

  // Year Stem & Branch (1930 is 庚午)
  const yearOffset = lunarYear - 1924; // 1924 is 甲子
  const yearStemIdx = (yearOffset % 10 + 10) % 10;
  const yearBranchIdx = (yearOffset % 12 + 12) % 12;
  const yearStem = HEAVENLY_STEMS[yearStemIdx];
  const yearBranch = EARTHLY_BRANCHES[yearBranchIdx];

  // Month Stem & Branch calculation (Five Tigers Five Rats rule / 五虎遁元)
  // 甲己之年丙作首，乙庚之岁戊为头，丙辛之岁寻庚上，丁壬壬寅顺水流，若问戊癸何处起，甲寅之上好追求。
  const tigerStarts: Record<HeavenlyStem, number> = {
    "甲": 2, "己": 2, // 丙
    "乙": 4, "庚": 4, // 戊
    "丙": 6, "辛": 6, // 庚
    "丁": 8, "壬": 8, // 壬
    "戊": 0, "癸": 0, // 甲
  };
  const startStemIdx = tigerStarts[yearStem] || 0;
  const monthStemIdx = (startStemIdx + (lunarMonth - 1)) % 10;
  const monthBranchIdx = (2 + (lunarMonth - 1)) % 12; // Month 1 is 寅(2)
  const monthStem = HEAVENLY_STEMS[monthStemIdx];
  const monthBranch = EARTHLY_BRANCHES[monthBranchIdx];

  // Day Stem & Branch (Base date 1900-01-31 is 甲辰, offset from reference)
  // Accurate day Ganzhi based on solar date
  const baseDayDate = new Date(1900, 0, 31);
  const dayOffset = Math.floor((targetDate.getTime() - baseDayDate.getTime()) / 86400000);
  const dayStemIdx = ((dayOffset % 10) + 10) % 10;
  const dayBranchIdx = (((dayOffset + 4) % 12) + 12) % 12; // 1900-01-31 is 辰(4)
  const dayStem = HEAVENLY_STEMS[dayStemIdx];
  const dayBranch = EARTHLY_BRANCHES[dayBranchIdx];

  // Hour Branch (23:00-01:00 子, 01:00-03:00 丑, ...)
  const hourBranchIdx = Math.floor(((hour24 + 1) % 24) / 2);
  const hourBranch = EARTHLY_BRANCHES[hourBranchIdx];

  // Hour Stem (Five Rats rule / 五鼠遁元)
  // 甲己还加甲，乙庚丙作初，丙辛从戊起，丁壬庚子居，戊癸何方发，壬子是真途。
  const ratStarts: Record<HeavenlyStem, number> = {
    "甲": 0, "己": 0, // 甲子
    "乙": 2, "庚": 2, // 丙子
    "丙": 4, "辛": 4, // 戊子
    "丁": 6, "壬": 6, // 庚子
    "戊": 8, "癸": 8, // 壬子
  };
  const startHourStemIdx = ratStarts[dayStem] || 0;
  const hourStemIdx = (startHourStemIdx + hourBranchIdx) % 10;
  const hourStem = HEAVENLY_STEMS[hourStemIdx];

  return {
    lunarYear,
    lunarMonth,
    lunarDay,
    isLeap,
    yearStem,
    yearBranch,
    monthStem,
    monthBranch,
    dayStem,
    dayBranch,
    hourStem,
    hourBranch,
    stemBranchYear: `${yearStem}${yearBranch}`,
    stemBranchMonth: `${monthStem}${monthBranch}`,
    stemBranchDay: `${dayStem}${dayBranch}`,
    stemBranchHour: `${hourStem}${hourBranch}`,
  };
}

export function lunarToSolar(lunarYear: number, lunarMonth: number, lunarDay: number, isLeap: boolean = false): { solarYear: number; solarMonth: number; solarDay: number; dateString: string } {
  const baseDate = new Date(1930, 0, 30);
  let offset = 0;

  for (let y = 1930; y < lunarYear; y++) {
    offset += getLunarYearDays(y);
  }

  const leapMonth = getLeapMonth(lunarYear);
  for (let m = 1; m < lunarMonth; m++) {
    offset += getLunarMonthDays(lunarYear, m);
    if (leapMonth === m) {
      offset += getLeapMonthDays(lunarYear);
    }
  }

  if (isLeap) {
    offset += getLunarMonthDays(lunarYear, lunarMonth);
  }

  offset += (lunarDay - 1);

  const solarDate = new Date(baseDate.getTime() + offset * 86400000);
  const solarYear = solarDate.getFullYear();
  const solarMonth = solarDate.getMonth() + 1;
  const solarDay = solarDate.getDate();

  const formattedMonth = solarMonth < 10 ? `0${solarMonth}` : `${solarMonth}`;
  const formattedDay = solarDay < 10 ? `0${solarDay}` : `${solarDay}`;

  return {
    solarYear,
    solarMonth,
    solarDay,
    dateString: `${solarYear}-${formattedMonth}-${formattedDay}`,
  };
}

export function getZodiacFromBranch(branch: EarthlyBranch): string {
  const map: Record<EarthlyBranch, string> = {
    "子": "鼠", "丑": "牛", "寅": "虎", "卯": "兔",
    "辰": "龙", "巳": "蛇", "午": "马", "未": "羊",
    "申": "猴", "酉": "鸡", "戌": "狗", "亥": "猪"
  };
  return map[branch] || "龙";
}

export function getBranchFromHour(hour: number): EarthlyBranch {
  const index = Math.floor(((hour + 1) % 24) / 2);
  return EARTHLY_BRANCHES[index];
}

export const SHICHEN_HOURS: Record<EarthlyBranch, string> = {
  "子": "23:00 - 01:00",
  "丑": "01:00 - 03:00",
  "寅": "03:00 - 05:00",
  "卯": "05:00 - 07:00",
  "辰": "07:00 - 09:00",
  "巳": "09:00 - 11:00",
  "午": "11:00 - 13:00",
  "未": "13:00 - 15:00",
  "申": "15:00 - 17:00",
  "酉": "17:00 - 19:00",
  "戌": "19:00 - 21:00",
  "亥": "21:00 - 23:00",
};
