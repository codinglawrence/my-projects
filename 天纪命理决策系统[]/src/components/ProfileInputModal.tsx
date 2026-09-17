import React, { useState, useEffect } from "react";
import { Gender, EarthlyBranch } from "../types/tianji";
import { SHICHEN_HOURS, solarToLunar, lunarToSolar, getZodiacFromBranch } from "../utils/lunarCalendar";
import { X, Calendar, User, Sparkles, Check, BookOpen } from "lucide-react";

interface ProfileInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, gender: Gender, solarDate: string, hourBranch: EarthlyBranch) => void;
  initialName: string;
  initialGender: Gender;
  initialDate: string;
  initialHourBranch: EarthlyBranch;
}

const PRESET_CASES = [
  {
    title: "青年创业·三奇嘉会",
    name: "倪师经典：青年创业破局",
    gender: "male" as Gender,
    date: "1992-06-15",
    hour: "午" as EarthlyBranch,
    tag: "阳男 · 1992壬申年 午时",
  },
  {
    title: "实业领袖·紫府大格",
    name: "实业领袖：紫府坐命",
    gender: "male" as Gender,
    date: "1984-11-20",
    hour: "辰" as EarthlyBranch,
    tag: "阳男 · 1984甲子年 辰时",
  },
  {
    title: "开疆拓土·杀破狼局",
    name: "开创实干：杀破狼格",
    gender: "male" as Gender,
    date: "1988-08-18",
    hour: "寅" as EarthlyBranch,
    tag: "阳男 · 1988戊辰年 寅时",
  },
  {
    title: "财官双美·日月同临",
    name: "名门贤达：日月同宫",
    gender: "female" as Gender,
    date: "1995-10-08",
    hour: "卯" as EarthlyBranch,
    tag: "阴女 · 1995乙亥年 卯时",
  },
];

export const ProfileInputModal: React.FC<ProfileInputModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialName,
  initialGender,
  initialDate,
  initialHourBranch,
}) => {
  const [name, setName] = useState(initialName);
  const [gender, setGender] = useState<Gender>(initialGender);
  const [date, setDate] = useState(initialDate);
  const [hourBranch, setHourBranch] = useState<EarthlyBranch>(initialHourBranch);
  const [calendarType, setCalendarType] = useState<"solar" | "lunar">("solar");

  // Lunar specific
  const parsed = new Date(initialDate);
  const initLunar = solarToLunar(
    isNaN(parsed.getFullYear()) ? 1992 : parsed.getFullYear(),
    isNaN(parsed.getMonth()) ? 6 : parsed.getMonth() + 1,
    isNaN(parsed.getDate()) ? 15 : parsed.getDate()
  );
  const [lunarYear, setLunarYear] = useState<number>(initLunar.lunarYear || 1992);
  const [lunarMonth, setLunarMonth] = useState<number>(initLunar.lunarMonth || 5);
  const [lunarDay, setLunarDay] = useState<number>(initLunar.lunarDay || 16);
  const [isLeap, setIsLeap] = useState<boolean>(initLunar.isLeap || false);

  useEffect(() => {
    setName(initialName);
    setGender(initialGender);
    setDate(initialDate);
    setHourBranch(initialHourBranch);
  }, [initialName, initialGender, initialDate, initialHourBranch, isOpen]);

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    let finalDate = date;
    if (calendarType === "lunar") {
      const conv = lunarToSolar(lunarYear, lunarMonth, lunarDay, isLeap);
      finalDate = conv.dateString;
    }
    onSave(name.trim() || "命主", gender, finalDate, hourBranch);
    onClose();
  };

  const applyPreset = (preset: typeof PRESET_CASES[0]) => {
    setName(preset.name);
    setGender(preset.gender);
    setDate(preset.date);
    setHourBranch(preset.hour);
    setCalendarType("solar");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
      <div className="bg-[#0E1117] border border-white/[0.1] rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/[0.06] flex items-center justify-between bg-[#131720]/80">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-300 font-bold font-serif text-sm">
              命
            </div>
            <div>
              <h2 className="text-base font-serif font-bold text-white tracking-tight">
                命主出生信息与排盘设定
              </h2>
              <p className="text-xs text-slate-400">
                支持公历/农历转换、十二时辰与天纪排盘推演
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-400 hover:text-white transition duration-150"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleApply} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Quick Demo Presets */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-slate-300 flex items-center space-x-1.5 font-serif">
                <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                <span>经典案例快捷载入：</span>
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {PRESET_CASES.map((p, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => applyPreset(p)}
                  className="p-2.5 rounded-xl bg-[#191D26]/70 hover:bg-[#222733] border border-white/[0.06] hover:border-white/[0.12] text-left text-slate-300 hover:text-amber-300 transition duration-150"
                >
                  <span className="font-semibold block text-white text-xs">{p.title}</span>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">{p.tag}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-white/[0.06] pt-4 space-y-3.5">
            {/* Name Input */}
            <div className="space-y-1">
              <label className="block text-xs font-medium text-slate-300">
                命主姓名 / 称谓：
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="请输入姓名"
                className="w-full bg-[#141822] border border-white/[0.08] rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50 transition duration-150"
              />
            </div>

            {/* Gender Switcher */}
            <div className="space-y-1">
              <label className="block text-xs font-medium text-slate-300">
                性别选择（决定阳男阴女大限顺逆行）：
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setGender("male")}
                  className={`py-2 rounded-xl text-xs font-medium border transition duration-150 ${
                    gender === "male"
                      ? "bg-gradient-to-r from-amber-600 to-amber-700 border-amber-500/50 text-white shadow-sm font-semibold"
                      : "bg-[#191D26] border-white/[0.06] text-slate-400 hover:text-slate-200"
                  }`}
                >
                  乾造（男命）
                </button>
                <button
                  type="button"
                  onClick={() => setGender("female")}
                  className={`py-2 rounded-xl text-xs font-medium border transition duration-150 ${
                    gender === "female"
                      ? "bg-gradient-to-r from-amber-600 to-amber-700 border-amber-500/50 text-white shadow-sm font-semibold"
                      : "bg-[#191D26] border-white/[0.06] text-slate-400 hover:text-slate-200"
                  }`}
                >
                  坤造（女命）
                </button>
              </div>
            </div>

            {/* Calendar Type */}
            <div className="space-y-1">
              <label className="block text-xs font-medium text-slate-300">
                历法类型：
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setCalendarType("solar")}
                  className={`py-1.5 rounded-xl text-xs font-medium border transition duration-150 ${
                    calendarType === "solar"
                      ? "bg-white/[0.1] border-amber-400/40 text-amber-300 font-semibold"
                      : "bg-[#191D26] border-white/[0.06] text-slate-400 hover:text-slate-200"
                  }`}
                >
                  🌞 公历 (阳历)
                </button>
                <button
                  type="button"
                  onClick={() => setCalendarType("lunar")}
                  className={`py-1.5 rounded-xl text-xs font-medium border transition duration-150 ${
                    calendarType === "lunar"
                      ? "bg-white/[0.1] border-amber-400/40 text-amber-300 font-semibold"
                      : "bg-[#191D26] border-white/[0.06] text-slate-400 hover:text-slate-200"
                  }`}
                >
                  🌙 农历 (阴历)
                </button>
              </div>
            </div>

            {/* Date Picker */}
            {calendarType === "solar" ? (
              <div className="space-y-1">
                <label className="block text-xs font-medium text-slate-300">
                  公历出生日期：
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-[#141822] border border-white/[0.08] rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500/50 transition duration-150"
                />
              </div>
            ) : (
              <div className="space-y-1">
                <label className="block text-xs font-medium text-slate-300">
                  农历出生年月日：
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <select
                    value={lunarYear}
                    onChange={(e) => setLunarYear(parseInt(e.target.value))}
                    className="w-full bg-[#141822] border border-white/[0.08] rounded-xl px-2 py-2 text-xs text-white focus:outline-none focus:border-amber-500/50 transition"
                  >
                    {Array.from({ length: 110 }, (_, i) => 1930 + i).map((y) => (
                      <option key={y} value={y}>
                        {y}年
                      </option>
                    ))}
                  </select>
                  <select
                    value={lunarMonth}
                    onChange={(e) => setLunarMonth(parseInt(e.target.value))}
                    className="w-full bg-[#141822] border border-white/[0.08] rounded-xl px-2 py-2 text-xs text-white focus:outline-none focus:border-amber-500/50 transition"
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                      <option key={m} value={m}>
                        {m}月
                      </option>
                    ))}
                  </select>
                  <select
                    value={lunarDay}
                    onChange={(e) => setLunarDay(parseInt(e.target.value))}
                    className="w-full bg-[#141822] border border-white/[0.08] rounded-xl px-2 py-2 text-xs text-white focus:outline-none focus:border-amber-500/50 transition"
                  >
                    {Array.from({ length: 30 }, (_, i) => i + 1).map((d) => (
                      <option key={d} value={d}>
                        {d}日
                      </option>
                    ))}
                  </select>
                </div>
                <div className="pt-1">
                  <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isLeap}
                      onChange={(e) => setIsLeap(e.target.checked)}
                      className="rounded border-slate-700 text-amber-600 focus:ring-amber-500 bg-[#141822]"
                    />
                    <span>是否为农历闰月</span>
                  </label>
                </div>
              </div>
            )}

            {/* Shichen Picker */}
            <div className="space-y-1">
              <label className="block text-xs font-medium text-slate-300">
                出生时辰（中国传统十二时辰）：
              </label>
              <select
                value={hourBranch}
                onChange={(e) => setHourBranch(e.target.value as EarthlyBranch)}
                className="w-full bg-[#141822] border border-white/[0.08] rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500/50 transition"
              >
                {Object.entries(SHICHEN_HOURS).map(([branch, hours]) => (
                  <option key={branch} value={branch}>
                    {branch}时 ({hours})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-white/[0.06] flex items-center justify-end space-x-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-xs text-slate-300 transition duration-150"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white text-xs font-medium shadow-sm flex items-center space-x-1.5 transition duration-150 active:scale-[0.98]"
            >
              <Check className="w-3.5 h-3.5" />
              <span>确认并重新排盘推演</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
