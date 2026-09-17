import React, { useState, useEffect } from "react";
import { Gender, EarthlyBranch, NatalChart } from "../types/tianji";
import {
  SHICHEN_HOURS,
  solarToLunar,
  lunarToSolar,
  getZodiacFromBranch,
  HEAVENLY_STEMS,
  EARTHLY_BRANCHES,
} from "../utils/lunarCalendar";
import {
  Calendar,
  User,
  Sparkles,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Check,
  BookOpen,
  Layers,
  Zap,
  Clock,
  Sun,
  Moon,
} from "lucide-react";

interface BirthInputPanelProps {
  currentName: string;
  currentGender: Gender;
  currentSolarDate: string;
  currentHourBranch: EarthlyBranch;
  chart: NatalChart;
  onApplyProfile: (name: string, gender: Gender, solarDate: string, hourBranch: EarthlyBranch) => void;
  onOpenReport?: () => void;
  onEnterAnalysis?: () => void;
}

const PRESET_CASES = [
  {
    title: "青年创业·三奇嘉会",
    name: "倪师经典：青年创业破局",
    gender: "male" as Gender,
    solarDate: "1992-06-15",
    hourBranch: "午" as EarthlyBranch,
    tag: "阳男 · 1992壬申年",
    desc: "化禄、化权、化科会合，三方四正吉星云集，利开创基业",
  },
  {
    title: "实业领袖·紫府同宫",
    name: "实业领袖：紫府坐命",
    gender: "male" as Gender,
    solarDate: "1984-11-20",
    hourBranch: "辰" as EarthlyBranch,
    tag: "阳男 · 1984甲子年",
    desc: "紫微天府同守命宫，帝星坐镇，主掌权柄与实业大财",
  },
  {
    title: "开疆拓土·杀破狼局",
    name: "开创实干：杀破狼格",
    gender: "male" as Gender,
    solarDate: "1988-08-18",
    hourBranch: "寅" as EarthlyBranch,
    tag: "阳男 · 1988戊辰年",
    desc: "七杀破军贪狼交辉，主一生波澜壮阔、敢为人先、破旧立新",
  },
  {
    title: "财官双美·日月同临",
    name: "名门贤达：日月同宫",
    gender: "female" as Gender,
    solarDate: "1995-10-08",
    hourBranch: "卯" as EarthlyBranch,
    tag: "阴女 · 1995乙亥年",
    desc: "太阳太阴同在丑未宫，日月生辉，财官双美，贵人扶持",
  },
];

const DECADES = [
  { label: "60后", year: 1965 },
  { label: "70后", year: 1975 },
  { label: "80后", year: 1985 },
  { label: "85后", year: 1988 },
  { label: "90后", year: 1992 },
  { label: "95后", year: 1996 },
  { label: "00后", year: 2002 },
  { label: "10后", year: 2012 },
  { label: "今年", year: new Date().getFullYear() },
];

// Helper to get days in solar month
function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

// Helper to get Year GanZhi + Zodiac label
function getYearLabel(year: number): string {
  const stemIdx = (year - 4) % 10 >= 0 ? (year - 4) % 10 : ((year - 4) % 10) + 10;
  const branchIdx = (year - 4) % 12 >= 0 ? (year - 4) % 12 : ((year - 4) % 12) + 12;
  const stem = HEAVENLY_STEMS[stemIdx];
  const branch = EARTHLY_BRANCHES[branchIdx];
  const zodiac = getZodiacFromBranch(branch);
  return `${year}年 (${stem}${branch}·属${zodiac})`;
}

export const BirthInputPanel: React.FC<BirthInputPanelProps> = ({
  currentName,
  currentGender,
  currentSolarDate,
  currentHourBranch,
  chart,
  onApplyProfile,
  onOpenReport,
  onEnterAnalysis,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [calendarType, setCalendarType] = useState<"solar" | "lunar">("solar");

  // Form input state
  const [name, setName] = useState<string>(currentName);
  const [gender, setGender] = useState<Gender>(currentGender);
  const [solarDate, setSolarDate] = useState<string>(currentSolarDate);
  const [hourBranch, setHourBranch] = useState<EarthlyBranch>(currentHourBranch);

  // Decomposed Solar Date
  const parsedSolar = new Date(currentSolarDate);
  const validSolarYear = isNaN(parsedSolar.getFullYear()) ? 1992 : parsedSolar.getFullYear();
  const validSolarMonth = isNaN(parsedSolar.getMonth()) ? 6 : parsedSolar.getMonth() + 1;
  const validSolarDay = isNaN(parsedSolar.getDate()) ? 15 : parsedSolar.getDate();

  const [solarYear, setSolarYear] = useState<number>(validSolarYear);
  const [solarMonth, setSolarMonth] = useState<number>(validSolarMonth);
  const [solarDay, setSolarDay] = useState<number>(validSolarDay);

  // Lunar specific inputs
  const initialLunar = solarToLunar(validSolarYear, validSolarMonth, validSolarDay);
  const [lunarYear, setLunarYear] = useState<number>(initialLunar.lunarYear || 1992);
  const [lunarMonth, setLunarMonth] = useState<number>(initialLunar.lunarMonth || 5);
  const [lunarDay, setLunarDay] = useState<number>(initialLunar.lunarDay || 16);
  const [isLeapMonth, setIsLeapMonth] = useState<boolean>(initialLunar.isLeap || false);

  const [lastDeduceTime, setLastDeduceTime] = useState<string>("");
  const [justDeduceAnimation, setJustDeduceAnimation] = useState<boolean>(false);

  // Sync with prop changes if modified outside
  useEffect(() => {
    setName(currentName);
    setGender(currentGender);
    setSolarDate(currentSolarDate);
    setHourBranch(currentHourBranch);

    const p = new Date(currentSolarDate);
    if (!isNaN(p.getTime())) {
      const y = p.getFullYear();
      const m = p.getMonth() + 1;
      const d = p.getDate();
      setSolarYear(y);
      setSolarMonth(m);
      setSolarDay(d);
      const l = solarToLunar(y, m, d);
      setLunarYear(l.lunarYear);
      setLunarMonth(l.lunarMonth);
      setLunarDay(l.lunarDay);
      setIsLeapMonth(l.isLeap);
    }
  }, [currentName, currentGender, currentSolarDate, currentHourBranch]);

  // Handle Solar Y/M/D Change
  const handleSolarYMDChange = (y: number, m: number, d: number) => {
    const maxDays = getDaysInMonth(y, m);
    const safeDay = Math.min(d, maxDays);
    const dateStr = `${y}-${String(m).padStart(2, "0")}-${String(safeDay).padStart(2, "0")}`;
    setSolarYear(y);
    setSolarMonth(m);
    setSolarDay(safeDay);
    setSolarDate(dateStr);

    try {
      const l = solarToLunar(y, m, safeDay);
      setLunarYear(l.lunarYear);
      setLunarMonth(l.lunarMonth);
      setLunarDay(l.lunarDay);
      setIsLeapMonth(l.isLeap);
    } catch {
      // fallback
    }

    onApplyProfile(name.trim() || "命主", gender, dateStr, hourBranch);
  };

  // Handle Solar date text / native picker change
  const handleNativeSolarDateChange = (newDate: string) => {
    if (!newDate) return;
    setSolarDate(newDate);
    const p = new Date(newDate);
    if (!isNaN(p.getTime())) {
      const y = p.getFullYear();
      const m = p.getMonth() + 1;
      const d = p.getDate();
      setSolarYear(y);
      setSolarMonth(m);
      setSolarDay(d);
      try {
        const l = solarToLunar(y, m, d);
        setLunarYear(l.lunarYear);
        setLunarMonth(l.lunarMonth);
        setLunarDay(l.lunarDay);
        setIsLeapMonth(l.isLeap);
      } catch {
        // fallback
      }
    }
    onApplyProfile(name.trim() || "命主", gender, newDate, hourBranch);
  };

  // Handle Gender change
  const handleGenderChange = (newGender: Gender) => {
    setGender(newGender);
    let targetSolarDate = solarDate;
    if (calendarType === "lunar") {
      try {
        const conv = lunarToSolar(lunarYear, lunarMonth, lunarDay, isLeapMonth);
        targetSolarDate = conv.dateString;
      } catch {
        // fallback
      }
    }
    onApplyProfile(name.trim() || "命主", newGender, targetSolarDate, hourBranch);
  };

  // Handle Hour change
  const handleHourChange = (newHour: EarthlyBranch) => {
    setHourBranch(newHour);
    let targetSolarDate = solarDate;
    if (calendarType === "lunar") {
      try {
        const conv = lunarToSolar(lunarYear, lunarMonth, lunarDay, isLeapMonth);
        targetSolarDate = conv.dateString;
      } catch {
        // fallback
      }
    }
    onApplyProfile(name.trim() || "命主", gender, targetSolarDate, newHour);
  };

  // Handle Lunar change -> convert to solar date
  const handleLunarChange = (year: number, month: number, day: number, leap: boolean) => {
    setLunarYear(year);
    setLunarMonth(month);
    setLunarDay(day);
    setIsLeapMonth(leap);
    try {
      const conv = lunarToSolar(year, month, day, leap);
      setSolarDate(conv.dateString);
      setSolarYear(conv.solarYear);
      setSolarMonth(conv.solarMonth);
      setSolarDay(conv.solarDay);
      onApplyProfile(name.trim() || "命主", gender, conv.dateString, hourBranch);
    } catch {
      // fallback
    }
  };

  // Trigger manual deduction animation
  const handleExecuteDeduce = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    let targetSolarDate = solarDate;

    if (calendarType === "lunar") {
      const conv = lunarToSolar(lunarYear, lunarMonth, lunarDay, isLeapMonth);
      targetSolarDate = conv.dateString;
    }

    onApplyProfile(name.trim() || "命主", gender, targetSolarDate, hourBranch);
    setJustDeduceAnimation(true);
    const now = new Date();
    setLastDeduceTime(
      `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:${now
        .getSeconds()
        .toString()
        .padStart(2, "0")}`
    );
    setTimeout(() => {
      setJustDeduceAnimation(false);
      if (onEnterAnalysis) {
        onEnterAnalysis();
      }
    }, 500);
  };

  // Preset loader
  const handleLoadPreset = (preset: (typeof PRESET_CASES)[0]) => {
    setName(preset.name);
    setGender(preset.gender);
    setSolarDate(preset.solarDate);
    setHourBranch(preset.hourBranch);
    setCalendarType("solar");
    const p = new Date(preset.solarDate);
    if (!isNaN(p.getTime())) {
      setSolarYear(p.getFullYear());
      setSolarMonth(p.getMonth() + 1);
      setSolarDay(p.getDate());
    }
    onApplyProfile(preset.name, preset.gender, preset.solarDate, preset.hourBranch);
    setJustDeduceAnimation(true);
    setTimeout(() => setJustDeduceAnimation(false), 1200);
  };

  // Four Pillars summary from chart
  const yearStem = chart.heavenlyStems?.year || (chart.lunarDate?.stemBranchYear?.[0] as any) || "壬";
  const yearBranch = chart.earthlyBranches?.year || (chart.lunarDate?.stemBranchYear?.[1] as any) || "申";
  const monthStem = chart.heavenlyStems?.month || (chart.lunarDate?.stemBranchMonth?.[0] as any) || "丙";
  const monthBranch = chart.earthlyBranches?.month || (chart.lunarDate?.stemBranchMonth?.[1] as any) || "午";
  const dayStem = chart.heavenlyStems?.day || (chart.lunarDate?.stemBranchDay?.[0] as any) || "甲";
  const dayBranch = chart.earthlyBranches?.day || (chart.lunarDate?.stemBranchDay?.[1] as any) || "子";
  const hourStem = chart.heavenlyStems?.hour || (chart.lunarDate?.stemBranchHour?.[0] as any) || "庚";
  const hourBranchVal = chart.earthlyBranches?.hour || chart.hourBranch || (chart.lunarDate?.stemBranchHour?.[1] as any) || "午";

  const yearZodiac = getZodiacFromBranch(yearBranch);
  const isYangYear = ["甲", "丙", "戊", "庚", "壬"].includes(yearStem);
  const genderDirectionText =
    (gender === "male" && isYangYear) || (gender === "female" && !isYangYear)
      ? "大限阳顺行（顺时针）"
      : "大限阴逆行（逆时针）";

  // Days in current solar month
  const currentMaxSolarDays = getDaysInMonth(solarYear, solarMonth);

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden transition-all duration-200">
      {/* Header Bar with quick stats and toggle */}
      <div className="px-5 sm:px-6 py-4 bg-slate-50/90 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-800 font-serif font-bold text-sm shadow-xs">
            推
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-sm sm:text-base font-serif font-bold text-slate-900 tracking-tight">
                生辰八字排盘录入台
              </h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-medium">
                年代速选 · 实时推演
              </span>
            </div>
            <p className="text-xs text-slate-500">
              自主选择公历/农历生辰与时辰，即刻生成天纪全盘推演
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {lastDeduceTime && (
            <span className="hidden sm:inline-flex items-center text-[11px] text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full font-medium">
              <Check className="w-3 h-3 mr-1 text-emerald-600" /> 已推演 ({lastDeduceTime})
            </span>
          )}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border border-slate-200 text-xs font-medium flex items-center space-x-1 transition duration-150 shadow-xs"
          >
            <span>{isExpanded ? "收起录入台" : "展开生辰设置"}</span>
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Main Collapsible Form Area */}
      {isExpanded && (
        <div className="p-5 sm:p-6 space-y-5">
          <form onSubmit={handleExecuteDeduce} className="space-y-4">
            {/* Top row: Name, Gender, Calendar Mode Toggle */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
              {/* Name */}
              <div className="sm:col-span-4 space-y-1.5">
                <label className="block text-xs font-medium text-slate-700 flex items-center space-x-1.5">
                  <User className="w-3.5 h-3.5 text-amber-700" />
                  <span>命主姓名 / 称谓</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="例如：张先生 / 个人自测"
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-500/30 transition duration-150"
                />
              </div>

              {/* Gender Switch (Apple-style Segmented) */}
              <div className="sm:col-span-4 space-y-1.5">
                <label className="block text-xs font-medium text-slate-700">
                  性别造化（乾造 / 坤造）
                </label>
                <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-slate-100 border border-slate-200">
                  <button
                    type="button"
                    onClick={() => handleGenderChange("male")}
                    className={`py-1.5 px-3 rounded-lg text-xs font-medium flex items-center justify-center space-x-1.5 transition duration-150 ${
                      gender === "male"
                        ? "bg-white text-amber-900 font-semibold shadow-xs border border-slate-200"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <span>乾造（男命）</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleGenderChange("female")}
                    className={`py-1.5 px-3 rounded-lg text-xs font-medium flex items-center justify-center space-x-1.5 transition duration-150 ${
                      gender === "female"
                        ? "bg-white text-amber-900 font-semibold shadow-xs border border-slate-200"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <span>坤造（女命）</span>
                  </button>
                </div>
              </div>

              {/* Calendar Toggle (Apple-style Segmented) */}
              <div className="sm:col-span-4 space-y-1.5">
                <label className="block text-xs font-medium text-slate-700 flex items-center space-x-1.5">
                  <Calendar className="w-3.5 h-3.5 text-amber-700" />
                  <span>出生历法选择</span>
                </label>
                <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-slate-100 border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setCalendarType("solar")}
                    className={`py-1.5 px-3 rounded-lg text-xs font-medium flex items-center justify-center space-x-1.5 transition duration-150 ${
                      calendarType === "solar"
                        ? "bg-white text-amber-900 font-semibold shadow-xs border border-slate-200"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <Sun className="w-3.5 h-3.5 text-amber-600" />
                    <span>公历 (阳历)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCalendarType("lunar")}
                    className={`py-1.5 px-3 rounded-lg text-xs font-medium flex items-center justify-center space-x-1.5 transition duration-150 ${
                      calendarType === "lunar"
                        ? "bg-white text-amber-900 font-semibold shadow-xs border border-slate-200"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <Moon className="w-3.5 h-3.5 text-amber-600" />
                    <span>农历 (阴历)</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Decade Jump Bar */}
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-medium text-slate-600 mr-1 flex items-center">
                <Zap className="w-3 h-3 text-amber-600 mr-1" />
                年代速选：
              </span>
              {DECADES.map((d) => (
                <button
                  key={d.label}
                  type="button"
                  onClick={() => {
                    if (calendarType === "solar") {
                      handleSolarYMDChange(d.year, solarMonth, solarDay);
                    } else {
                      handleLunarChange(d.year, lunarMonth, lunarDay, isLeapMonth);
                    }
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition duration-150 ${
                    (calendarType === "solar" ? solarYear : lunarYear) === d.year
                      ? "bg-amber-100 text-amber-900 font-semibold border border-amber-300 shadow-xs"
                      : "bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200"
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>

            {/* Middle row: High-usability Year/Month/Day & Shichen pickers */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80">
              {/* Date Column */}
              <div className="lg:col-span-7 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-medium text-slate-700 flex items-center space-x-1.5">
                    <Calendar className="w-3.5 h-3.5 text-amber-700" />
                    <span>
                      {calendarType === "solar"
                        ? "公历 (阳历) 出生年月日"
                        : "农历 (阴历) 出生年月日"}
                    </span>
                  </label>
                  <span className="text-[11px] text-amber-800 font-mono font-medium">
                    {calendarType === "solar"
                      ? `对应农历：${chart.lunarDate?.year}年 ${chart.lunarDate?.month}月${chart.lunarDate?.day}日`
                      : `对应公历：${solarDate}`}
                  </span>
                </div>

                {calendarType === "solar" ? (
                  /* Solar Mode 3-Dropdown Selector */
                  <div className="grid grid-cols-12 gap-2">
                    {/* Solar Year Dropdown */}
                    <div className="col-span-6 sm:col-span-5">
                      <select
                        value={solarYear}
                        onChange={(e) =>
                          handleSolarYMDChange(parseInt(e.target.value), solarMonth, solarDay)
                        }
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-amber-600 font-sans"
                      >
                        {Array.from({ length: 111 }, (_, i) => 1930 + i).map((y) => (
                          <option key={y} value={y}>
                            {getYearLabel(y)}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Solar Month Dropdown */}
                    <div className="col-span-3 sm:col-span-3">
                      <select
                        value={solarMonth}
                        onChange={(e) =>
                          handleSolarYMDChange(solarYear, parseInt(e.target.value), solarDay)
                        }
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-amber-600 font-sans"
                      >
                        {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                          <option key={m} value={m}>
                            {m}月
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Solar Day Dropdown */}
                    <div className="col-span-3 sm:col-span-4">
                      <select
                        value={solarDay}
                        onChange={(e) =>
                          handleSolarYMDChange(solarYear, solarMonth, parseInt(e.target.value))
                        }
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-amber-600 font-sans"
                      >
                        {Array.from({ length: currentMaxSolarDays }, (_, i) => i + 1).map((d) => (
                          <option key={d} value={d}>
                            {d}日
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ) : (
                  /* Lunar Mode 3-Dropdown Selector */
                  <div className="grid grid-cols-12 gap-2">
                    {/* Lunar Year Dropdown */}
                    <div className="col-span-5 sm:col-span-5">
                      <select
                        value={lunarYear}
                        onChange={(e) =>
                          handleLunarChange(
                            parseInt(e.target.value),
                            lunarMonth,
                            lunarDay,
                            isLeapMonth
                          )
                        }
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-amber-600 font-sans"
                      >
                        {Array.from({ length: 111 }, (_, i) => 1930 + i).map((y) => (
                          <option key={y} value={y}>
                            {getYearLabel(y)}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Lunar Month Dropdown */}
                    <div className="col-span-3 sm:col-span-3">
                      <select
                        value={lunarMonth}
                        onChange={(e) =>
                          handleLunarChange(
                            lunarYear,
                            parseInt(e.target.value),
                            lunarDay,
                            isLeapMonth
                          )
                        }
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-amber-600"
                      >
                        {[
                          "正月",
                          "二月",
                          "三月",
                          "四月",
                          "五月",
                          "六月",
                          "七月",
                          "八月",
                          "九月",
                          "十月",
                          "十一月",
                          "十二月",
                        ].map((m, idx) => (
                          <option key={idx + 1} value={idx + 1}>
                            {m}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Lunar Day Dropdown */}
                    <div className="col-span-2 sm:col-span-2">
                      <select
                        value={lunarDay}
                        onChange={(e) =>
                          handleLunarChange(
                            lunarYear,
                            lunarMonth,
                            parseInt(e.target.value),
                            isLeapMonth
                          )
                        }
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-amber-600"
                      >
                        {Array.from({ length: 30 }, (_, i) => i + 1).map((d) => {
                          const dayNames = [
                            "初一", "初二", "初三", "初四", "初五", "初六", "初七", "初八", "初九", "初十",
                            "十一", "十二", "十三", "十四", "十五", "十六", "十七", "十八", "十九", "二十",
                            "廿一", "廿二", "廿三", "廿四", "廿五", "廿六", "廿七", "廿八", "廿九", "三十",
                          ];
                          return (
                            <option key={d} value={d}>
                              {dayNames[d - 1] || `${d}日`}
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    {/* Leap month toggle */}
                    <div className="col-span-2 sm:col-span-2 flex items-center">
                      <label className="flex items-center space-x-1.5 text-xs text-slate-700 cursor-pointer bg-white px-2.5 py-2 rounded-xl border border-slate-300 w-full justify-center">
                        <input
                          type="checkbox"
                          checked={isLeapMonth}
                          onChange={(e) =>
                            handleLunarChange(lunarYear, lunarMonth, lunarDay, e.target.checked)
                          }
                          className="rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                        />
                        <span>闰月</span>
                      </label>
                    </div>
                  </div>
                )}

                {/* Optional native date input as fallback */}
                <div className="flex items-center space-x-2 pt-1 text-[11px] text-slate-500">
                  <span>或直接选择日历：</span>
                  <input
                    type="date"
                    value={solarDate}
                    min="1930-01-01"
                    max="2040-12-31"
                    onChange={(e) => handleNativeSolarDateChange(e.target.value)}
                    className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-slate-800 text-xs focus:outline-none focus:border-amber-600"
                  />
                </div>
              </div>

              {/* Shichen Hour Selector */}
              <div className="lg:col-span-5 space-y-2.5">
                <label className="block text-xs font-medium text-slate-700 flex items-center space-x-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-700" />
                  <span>出生时辰（十二地支）：</span>
                </label>
                <select
                  value={hourBranch}
                  onChange={(e) => handleHourChange(e.target.value as EarthlyBranch)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-amber-600"
                >
                  {Object.entries(SHICHEN_HOURS).map(([branch, hours]) => (
                    <option key={branch} value={branch}>
                      {branch}时 · {hours}
                    </option>
                  ))}
                </select>

                {/* Quick Shichen Pills Grid */}
                <div className="grid grid-cols-6 gap-1 pt-1">
                  {Object.keys(SHICHEN_HOURS).map((branch) => (
                    <button
                      key={branch}
                      type="button"
                      onClick={() => handleHourChange(branch as EarthlyBranch)}
                      className={`py-1 text-[11px] rounded-lg font-medium transition duration-150 ${
                        hourBranch === branch
                          ? "bg-amber-100 text-amber-900 font-semibold border border-amber-300 shadow-xs"
                          : "bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200"
                      }`}
                    >
                      {branch}时
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <div className="text-xs text-slate-500 flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>生辰参数已就绪 · 点击即刻进入分析</span>
              </div>

              <div className="flex items-center space-x-2.5 w-full sm:w-auto">
                <button
                  type="submit"
                  id="btn-trigger-deduce"
                  className={`w-full sm:w-auto px-6 py-2.5 rounded-xl font-medium text-xs sm:text-sm shadow-sm flex items-center justify-center space-x-2 transition-all duration-150 active:scale-[0.98] ${
                    justDeduceAnimation
                      ? "bg-emerald-600 text-white"
                      : "bg-gradient-to-r from-amber-700 to-amber-800 hover:from-amber-600 hover:to-amber-700 text-white border border-amber-600/30"
                  }`}
                >
                  <Sparkles className="w-4 h-4 text-amber-200" />
                  <span>{justDeduceAnimation ? "排盘推演完成，正在跳转..." : "确认生辰 · 进入多维分析 ➔"}</span>
                </button>
              </div>
            </div>
          </form>

          {/* Quick Presets Gallery */}
          <div className="border-t border-slate-200/80 pt-4 space-y-2.5">
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span className="flex items-center space-x-1.5">
                <BookOpen className="w-3.5 h-3.5 text-amber-700" />
                <span className="font-semibold text-slate-800">经典名造一键对照：</span>
              </span>
              <span className="text-[11px] text-slate-400">点击即刻载入</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {PRESET_CASES.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleLoadPreset(preset)}
                  className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 hover:border-amber-300 text-left transition duration-150 group shadow-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-slate-800 group-hover:text-amber-800 transition">
                      {preset.title}
                    </span>
                    <span className="text-[10px] text-slate-400 group-hover:text-slate-600">
                      载入 &gt;
                    </span>
                  </div>
                  <div className="text-[11px] text-amber-800 font-medium mt-1">{preset.tag}</div>
                  <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                    {preset.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Dynamic BaZi and Bureau Pills Footer */}
      <div className="px-5 sm:px-6 py-3.5 bg-slate-50 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          <span className="text-slate-600 font-serif font-bold">推演八字：</span>

          {/* Year Pillar */}
          <div className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-800 flex items-center space-x-1 font-mono shadow-xs">
            <span className="text-amber-800 font-bold">
              {yearStem}
              {yearBranch}
            </span>
            <span className="text-[10px] text-slate-500">({yearZodiac}年)</span>
          </div>

          {/* Month Pillar */}
          <div className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-800 flex items-center space-x-1 font-mono shadow-xs">
            <span className="text-amber-800 font-bold">
              {monthStem}
              {monthBranch}
            </span>
            <span className="text-[10px] text-slate-500">(月柱)</span>
          </div>

          {/* Day Pillar */}
          <div className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-800 flex items-center space-x-1 font-mono shadow-xs">
            <span className="text-amber-800 font-bold">
              {dayStem}
              {dayBranch}
            </span>
            <span className="text-[10px] text-slate-500">(日柱)</span>
          </div>

          {/* Hour Pillar */}
          <div className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-800 flex items-center space-x-1 font-mono shadow-xs">
            <span className="text-amber-800 font-bold">
              {hourStem}
              {hourBranchVal}
            </span>
            <span className="text-[10px] text-slate-500">({hourBranchVal}时)</span>
          </div>

          {/* Bureau & Life Palace */}
          <div className="px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 font-medium">
            【{chart.bureau}】· 命宫在【{chart.lifePalaceBranch}】· 身宫在【{chart.bodyPalaceBranch}】
          </div>
        </div>

        <div className="text-[11px] text-slate-600 flex items-center space-x-2">
          <span>{genderDirectionText}</span>
          <span className="text-slate-300">|</span>
          <span className="text-amber-800 font-medium">
            主格：{chart.patterns[0]?.name || "成格吉造"}
          </span>
        </div>
      </div>
    </div>
  );
};

