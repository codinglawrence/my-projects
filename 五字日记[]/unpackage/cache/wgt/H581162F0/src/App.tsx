/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * 五字日记 — 前端主组件 v3.1
 * 心情质感升级 + 同日覆盖 + 自定义日历 + ErrorBoundary
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  History, ChevronRight, Trash2, ChevronLeft,
  Loader2, Feather, Sparkles, Smile, XCircle,
} from "lucide-react";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import {
  useDiaryStore, initStorage, addEntry, deleteEntry,
} from "./stores/diary";

// ===================== Toast =====================

type ToastType = "success" | "error" | "info";
interface Toast { id: number; message: string; type: ToastType; }
let toastId = 0;

// ===================== 心情配置 =====================

const MOOD_EMOJI_LABEL: Record<number, string> = {
  0: "\uD83D\uDE1E", 1: "\uD83D\uDE1E", 2: "\uD83D\uDE15",
  3: "\uD83D\uDE10", 4: "\uD83D\uDE10", 5: "\uD83D\uDE42",
  6: "\uD83D\uDE42", 7: "\uD83D\uDE0A", 8: "\uD83D\uDE0A",
  9: "\uD83D\uDE04", 10: "\uD83E\uDD70",
};

const MOOD_WORD: Record<number, string> = {
  0: "低落", 1: "低落", 2: "低落",
  3: "一般", 4: "一般", 5: "平静",
  6: "平静", 7: "不错", 8: "不错",
  9: "开心", 10: "极好",
};

function moodColor(mood: number): { bg: string; border: string; accent: string; text: string; thumb: string } {
  const hue = 215 - mood * 20.5; // 215(蓝灰) -> 10(暖珊瑚)，完全避开绿色
  const sat = 30 + mood * 5;
  const light = 78 - mood * 2;
  return {
    bg: `hsl(${hue}, ${sat}%, ${light + 12}%)`,
    border: `hsl(${hue}, ${sat + 5}%, ${light - 8}%)`,
    accent: `hsl(${hue}, ${sat + 25}%, 48%)`,
    text: `hsl(${hue}, ${sat + 15}%, 28%)`,
    thumb: `hsl(${hue}, ${sat + 35}%, 55%)`,
  };
}

// ===================== 错误边界 =====================

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  state: { error: Error | null } = { error: null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen bg-paper flex items-center justify-center p-8">
          <div className="text-center max-w-sm">
            <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-red-50/80 flex items-center justify-center">
              <XCircle size={28} className="text-red-400" />
            </div>
            <p className="text-lg font-serif text-[#4a4a40] mb-2">页面出错</p>
            <p className="text-xs font-sans text-[#4a4a40]/30 mb-6 break-all font-mono">{this.state.error.message}</p>
            <button onClick={() => { this.setState({ error: null }); window.location.reload(); }}
              className="px-6 py-2.5 rounded-xl bg-[#c8a87c] text-white text-sm font-sans active:scale-95 transition-transform">
              重新加载
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// ===================== 心情滑块（质感升级版）=====================

function MoodSlider({ value, onChange }: { value: number | undefined; onChange: (v: number) => void }) {
  const current = value ?? 5;
  const mc = moodColor(current);

  return (
    <div className="bg-white/70 backdrop-blur-xl rounded-[24px] card-shadow-lg border border-[#e8dcc8]/25 px-5 py-5">
      {/* 大表情 + 文字 */}
      <div className="text-center mb-5">
        <motion.div
          key={current}
          initial={{ scale: 0.7, opacity: 0, y: 8 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 20 }}
          className="text-[52px] leading-none select-none"
        >
          {MOOD_EMOJI_LABEL[current]}
        </motion.div>
        <p className="text-[11px] font-sans text-[#4a4a40]/20 mt-2 tracking-wide">
          {MOOD_WORD[current]}
        </p>
      </div>

      {/* 滑块轨道 */}
      <div className="relative px-1">
        {/* 轨道底色凹槽 */}
        <div className="absolute inset-x-1 top-1/2 -translate-y-1/2 h-2.5 rounded-full"
          style={{ background: `linear-gradient(to right, hsl(215,25%,82%), hsl(200,30%,78%), hsl(40,35%,80%), hsl(25,40%,75%), hsl(10,55%,70%))` }}
        />
        {/* 滑块控件 */}
        <input
          type="range" min={0} max={10} step={1} value={current}
          onChange={(e) => onChange(Number(e.target.value))}
          className="mood-range w-full relative z-10"
          style={{ "--thumb": mc.thumb } as React.CSSProperties}
        />
        {/* 刻度 */}
        <div className="flex justify-between mt-1.5 px-1">
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
            <div key={n} className="flex flex-col items-center">
              <div className={`w-0.5 rounded-full ${n === current ? "h-2" : "h-1"} transition-all duration-300`}
                style={{ backgroundColor: n === current ? mc.accent : "rgba(74,74,64,0.1)" }} />
            </div>
          ))}
        </div>
      </div>

      {/* 分值 */}
      <div className="text-center mt-3">
        <span className="text-[34px] font-serif font-semibold tracking-tight" style={{ color: mc.thumb }}>
          {current}
        </span>
        <span className="text-xs font-sans text-[#4a4a40]/15 ml-1.5 align-super">/ 10</span>
      </div>
    </div>
  );
}

// ===================== 日历组件 =====================


// ===================== MomentsImageGrid =====================

function MomentsImageGrid({ images }: { images: string[] }) {
  const count = images.length;
  if (count === 0) return null;
  const gridCols = count === 1 ? 1 : count === 2 || count === 4 ? 2 : 3;
  const maxW = count === 1 ? "60%" : "100%";
  return (
    <div className="grid gap-1 rounded-xl overflow-hidden mt-3" 
      style={{ gridTemplateColumns: `repeat(${gridCols}, 1fr)`, maxWidth: maxW }}>

      {images.map((src, idx) => (
        <div key={idx} className="relative bg-[#f5f5f7] aspect-square overflow-hidden">
          <img src={src} alt="" className="w-full h-full object-cover" loading="lazy" />
        </div>
      ))}
    </div>
  );
}
// ===================== 日历组件 =====================

interface CalPickerProps { selected: string; onChange: (date: string) => void; onClose: () => void; }
const WEEKDAYS = ["日", "一", "二", "三", "四", "五", "六"];

function CalPicker({ selected, onChange, onClose }: CalPickerProps) {
  const [viewYear, setViewYear] = useState(() => new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(() => new Date().getMonth());
  const today = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }, []);
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const days: (number | null)[] = [];
  for (let i = 0; i < firstDayOfWeek; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);
  const goPrev = () => {
    if (viewMonth === 0) { setViewYear(viewYear - 1); setViewMonth(11); }
    else setViewMonth(viewMonth - 1);
  };
  const goNext = () => {
    if (viewMonth === 11) { setViewYear(viewYear + 1); setViewMonth(0); }
    else setViewMonth(viewMonth + 1);
  };
  const dateStr = (day: number) =>
    `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  const isFuture = (day: number) => {
    const d = new Date(viewYear, viewMonth, day);
    const now = new Date(); now.setHours(23, 59, 59, 999);
    return d > now;
  };
  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.2 }}
      className="bg-white/90 backdrop-blur-xl rounded-2xl p-5 card-shadow-lg border border-[#e8dcc8]/40"
    >
      <div className="flex items-center justify-between mb-5">
        <button onClick={goPrev} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[#c8a87c]/10 transition-colors">
          <ChevronLeft size={16} className="text-[#8b7355]" />
        </button>
        <span className="text-base font-serif text-[#4a4a40] tracking-wide">{viewYear}年{viewMonth + 1}月</span>
        <button onClick={goNext} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[#c8a87c]/10 transition-colors">
          <ChevronRight size={16} className="text-[#8b7355]" />
        </button>
      </div>
      <div className="grid grid-cols-7 mb-2">
        {WEEKDAYS.map((w) => (<div key={w} className="text-center text-[10px] font-sans tracking-widest uppercase text-[#4a4a40]/25 py-1">{w}</div>))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, i) => {
          if (day === null) return <div key={`e-${i}`} className="aspect-square" />;
          const ds = dateStr(day);
          const isToday = ds === today;
          const isSel = ds === selected;
          const future = isFuture(day);
          return (
            <button key={ds} disabled={future} onClick={() => onChange(ds)}
              className={`aspect-square rounded-xl text-sm font-sans flex items-center justify-center transition-all duration-150 ${
                future ? "text-[#4a4a40]/10 cursor-not-allowed"
                : isSel ? "bg-[#c8a87c] text-white shadow-sm font-semibold"
                : isToday ? "bg-[#c8a87c]/10 text-[#8b7355] font-semibold"
                : "text-[#4a4a40]/60 hover:bg-[#c8a87c]/8 hover:text-[#4a4a40]"
              }`}>{day}</button>
          );
        })}
      </div>
      <div className="mt-4 pt-3 border-t border-[#e8dcc8]/30 flex justify-between items-center">
        <span className="text-[11px] font-sans text-[#4a4a40]/25">
          {selected ? `已选: ${selected.replace(/-/g, "/")}` : "请选择日期"}
        </span>
        <button onClick={onClose} className="text-[11px] font-sans text-[#4a4a40]/35 hover:text-[#4a4a40]/60 transition-colors px-2">取消</button>
      </div>
    </motion.div>
  );
}

// ===================== 空状态 =====================

function EmptyState() {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-16">
      <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-[#c8a87c]/8 flex items-center justify-center">
        <Feather size={26} className="text-[#3a3028]/50" />
      </div>
      <p className="text-base font-serif text-[#4a4a40]/30">还没有任何记录</p>
      <p className="text-xs font-sans text-[#4a4a40]/15 mt-2">写下今天的五个字吧</p>
    </motion.div>
  );
}

// ===================== 主应用 =====================

function App() {
  const [inputText, setInputText] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [showCalPicker, setShowCalPicker] = useState(false);
  const [showMood, setShowMood] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [mood, setMood] = useState<number | undefined>(undefined);
  const [ready, setReady] = useState(false);
  const [nickname, setNickname] = useState(() => localStorage.getItem("diary_nickname") || "");
  const [showNickSetup, setShowNickSetup] = useState(false);
  const [editingNick, setEditingNick] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [saving, setSaving] = useState(false);
  const [seenCount, setSeenCount] = useState<number>(() => {
    const v = Number(localStorage.getItem("diary_seen_count"));
    return Number.isFinite(v) && v > 0 ? v : 0;
  });
  const inputRef = useRef<HTMLInputElement>(null);
  const isComposing = useRef(false);

  const { entries } = useDiaryStore();

  // ---- Toast ----
  const showToast = useCallback((message: string, type: ToastType = "info") => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 2200);
  }, []);

  // ---- Init ----
  useEffect(() => {
    (async () => {
      await initStorage();
      setReady(true);
    })();
  }, []);

  // First-time nickname setup
  useEffect(() => {
    if (ready && !nickname) setShowNickSetup(true);
  }, [ready, nickname]);

  // ---- Unified save ----
  const handleSave = async () => {
    if (inputText.length !== 5 || saving) return;
    setSaving(true);
    try {
      const dateStr = selectedDate
        ? format(new Date(selectedDate), "yyyy年MM月dd日")
        : format(new Date(), "yyyy年MM月dd日");
      const result = await addEntry(inputText, dateStr, mood);
      if (result.ok) {
        setInputText(""); setMood(undefined); setShowMood(false);
        showToast(result.overwritten ? "已更新" : "已记录", "success");
        // 自己刚写的记录视为已读，角标计数 +1 并持久化
        if (!result.overwritten) {
          const next = seenCount + 1;
          setSeenCount(next);
          localStorage.setItem("diary_seen_count", String(next));
        }
      } else {
        showToast("保存失败，请重试", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("保存异常", "error");
    }
    setSaving(false);
    inputRef.current?.focus();
  };

  const handleNickSave = () => {
    const n = nickname.trim() || "日记本";
    setNickname(n);
    localStorage.setItem("diary_nickname", n);
    setShowNickSetup(false);
    setEditingNick(false);
  };

  // ---- Delete ----
  const handleDelete = async (id: string) => {
    const ok = await deleteEntry(id);
    showToast(ok ? "已删除" : "删除失败", ok ? "info" : "error");
  };

  const today = format(new Date(), "MM月dd日 EEEE", { locale: zhCN });
  const charArray = useMemo(
    () => inputText.split("").concat(Array(Math.max(0, 5 - inputText.length)).fill("")),
    [inputText]
  );

  // ---- Loading ----
  if (!ready) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-[#c8a87c]/10 flex items-center justify-center">
            <Loader2 size={24} className="text-[#3a3028] animate-spin" />
          </div>
          <p className="font-serif text-[#4a4a40]/25 text-sm">加载中…</p>
        </div>
      </div>
    );
  }

  // ---- Main ----
  return (
    <div className="min-h-screen bg-paper text-[#4a4a40] font-serif selection:bg-[#c8a87c]/15">
            {/* 昵称设置浮层 */}
      <AnimatePresence>
        {showNickSetup && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6"
            onClick={(e) => { if (e.target === e.currentTarget && !editingNick) setShowNickSetup(false); }}>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="relative w-full max-w-sm bg-white rounded-3xl p-8 shadow-[0_8px_40px_rgba(0,0,0,0.12)]">
              <div className="text-center mb-6">
                <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-[#c8a87c]/15 flex items-center justify-center">
                  <Feather size={24} className="text-[#c8a87c]" />
                </div>
                <h3 className="text-lg font-serif text-[#3a3028]">{editingNick ? "修改昵称" : "欢迎来到五字日记"}</h3>
                <p className="text-[12px] font-sans text-[#4a4a40]/30 mt-1.5">
                  {editingNick ? "起一个你喜欢的名字" : "为你的日记本取个名字吧"}
                </p>
              </div>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value.slice(0, 12))}
                onKeyDown={(e) => { if (e.key === "Enter") handleNickSave(); }}
                placeholder="输入昵称…"
                className="w-full bg-[#f5f5f7] rounded-2xl px-5 py-3.5 text-center text-[15px] font-serif text-[#3a3028] placeholder-[#4a4a40]/20 outline-none focus:bg-[#f0ece4] transition-colors"
                autoFocus
              />
              <p className="text-center text-[10px] font-sans text-[#4a4a40]/20 mt-2">{nickname.length}/12</p>
              <button
                onClick={handleNickSave}
                className="w-full mt-5 py-3 rounded-2xl bg-[#c8a87c] text-white font-sans text-[14px] font-medium tracking-wide active:scale-[0.98] transition-transform">
                确定
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 日历浮层 */}
      <AnimatePresence>
        {showCalPicker && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-50 flex items-end justify-center"
            onClick={(e) => { if (e.target === e.currentTarget) setShowCalPicker(false); }}>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="relative w-full max-w-lg bg-white rounded-t-[28px] p-6 pb-10 shadow-[0_-8px_40px_rgba(0,0,0,0.12)]">
              <div className="flex justify-center mb-5">
                <div className="w-9 h-1 rounded-full bg-[#e0e0e0]" />
              </div>
              <CalPicker
                selected={selectedDate}
                onChange={(date) => { setSelectedDate(date); setShowCalPicker(false); }}
                onClose={() => setShowCalPicker(false)}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toasts */}
      <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div key={t.id}
              initial={{ opacity: 0, y: -12, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              className={`pointer-events-auto px-5 py-2.5 rounded-full text-sm font-sans backdrop-blur-xl shadow-lg ${
                t.type === "success" ? "bg-[#c8a87c]/95 text-white"
                : t.type === "error" ? "bg-red-400/90 text-white"
                : "bg-white/90 text-[#4a4a40]"
              }`}
            >
              {t.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <main className="max-w-lg mx-auto px-5 pt-10 pb-20">
        <AnimatePresence mode="wait">
          {!showHistory ? (
            <motion.div key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>

              {/* 顶栏 */}
              <div className="flex items-center justify-between mb-10">
                <div>
                  <h1 className="text-[28px] font-serif tracking-[0.05em] text-[#3a3028] leading-tight">五字日记</h1>
                  <p className="text-[11px] font-sans text-[#4a4a40]/25 mt-1">{today}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => { setShowMood(!showMood); setShowCalPicker(false); }}
                    className={`relative w-11 h-11 rounded-2xl flex items-center justify-center backdrop-blur-sm card-shadow active:scale-95 transition-all duration-200 ${
                      showMood ? "bg-[#c8a87c]/15" : "bg-white/60 hover:bg-white hover:card-shadow-hover"
                    }`} aria-label="心情评分">
                    <Smile size={20} className={showMood ? "text-[#3a3028]" : "text-[#8b7355]"} />
                  </button>
                  <button onClick={() => { setShowHistory(true); setShowMood(false); const next = entries.length; setSeenCount(next); localStorage.setItem("diary_seen_count", String(next)); }}
                    className="relative w-11 h-11 rounded-2xl flex items-center justify-center bg-white/60 backdrop-blur-sm card-shadow hover:bg-white hover:card-shadow-hover active:scale-95 transition-all duration-200" aria-label="历史记录">
                    <History size={20} className="text-[#8b7355]" />
                    {entries.length > seenCount && (
                      <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 rounded-full bg-[#c8a87c] text-white text-[10px] font-sans flex items-center justify-center shadow-sm">
                        {entries.length - seenCount > 99 ? "99" : entries.length - seenCount}
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {/* 日期卡片 — 可点击切换 */}
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <div className="w-full bg-white rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.04),0_1px_3px_rgba(0,0,0,0.03)] px-6 py-5 mb-3 text-left border border-black/[0.03]">
                  <div className="flex items-center justify-between mb-1">
                    {/* 左：返回今天（仅补记态显示，替代原「补记」标签） */}
                    {selectedDate ? (
                      <motion.button
                        initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
                        onClick={() => setSelectedDate("")}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/70 backdrop-blur-sm card-shadow text-[12px] font-sans font-medium text-[#8b7355] active:scale-95 transition-all duration-200">
                        <ChevronLeft size={13} className="text-[#8b7355]" />返回今天
                      </motion.button>
                    ) : (
                      <p className="text-[10px] font-sans tracking-[0.3em] uppercase text-[#4a4a40]">今天</p>
                    )}
                    {/* 右：补记历史（打开日历） */}
                    <button onClick={() => { setShowCalPicker(true); setShowMood(false); }}
                      className="flex items-center gap-1.5 text-[#aeaeb2] hover:text-[#8b7355] transition-colors">
                      <span className="text-[10px] font-sans tracking-wide">补记历史</span><ChevronRight size={13} className="text-[#aeaeb2]" />
                    </button>
                  </div>
                  {/* 日期 + 星期，点击打开日历 */}
                  <button
                    onClick={() => { setShowCalPicker(true); setShowMood(false); }}
                    className="block w-full text-left active:scale-[0.98] transition-transform duration-150">
                    <p className="text-[32px] font-serif tracking-[0.03em] text-[#3a3028] leading-tight">
                      {selectedDate
                        ? format(new Date(selectedDate), "M月d日")
                        : format(new Date(), "M月d日")}
                    </p>
                    <p className="text-sm font-sans text-[#aeaeb2] mt-0.5">
                      {selectedDate
                        ? format(new Date(selectedDate), "EEEE", { locale: zhCN })
                        : format(new Date(), "EEEE", { locale: zhCN })}
                    </p>
                  </button>
                </div>
              </motion.div>

              {/* 心情面板 */}
              <AnimatePresence>
                {showMood && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="overflow-hidden mb-6">
                    <MoodSlider value={mood} onChange={setMood} />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* 五字输入 */}
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="mb-8">
                <div className="flex gap-2 justify-center mb-5">
                  {charArray.map((ch, i) => (
                    <motion.div key={i} layout
                      className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center
                        text-2xl sm:text-3xl font-serif transition-all duration-200 ${
                          ch
                            ? "bg-white text-[#3a3028] char-enter shadow-[0_1px_3px_rgba(0,0,0,0.06)] border border-black/[0.06]"
                            : "bg-[#f5f5f7] border-2 border-dashed border-[#e0e0e0] text-transparent"
                        }`}
                    >{ch || ""}</motion.div>
                  ))}
                </div>

                <input ref={inputRef} type="text" value={inputText}
                  onChange={(e) => {
                    if (isComposing.current) { setInputText(e.target.value); }
                    else { setInputText(e.target.value.slice(0, 5)); }
                  }}
                  onCompositionStart={() => { isComposing.current = true; }}
                  onCompositionEnd={() => {
                    isComposing.current = false;
                    setInputText((prev) => prev.slice(0, 5));
                  }}
                  onKeyDown={(e) => { if (e.key === "Enter" && !isComposing.current) handleSave(); }}
                  placeholder="输入五个字…"
                  className="w-full bg-transparent text-center text-lg font-serif placeholder-[#4a4a40]/15 outline-none py-2"
                  autoFocus
                />

                <div className="flex justify-center mt-2">
                  <span className={`text-[11px] font-sans transition-colors ${inputText.length === 5 ? "text-[#3a3028] font-medium" : "text-[#aeaeb2]"}`}>
                    {inputText.length}/5
                  </span>
                </div>
              </motion.div>

              {/* 操作按钮 */}
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                className="flex flex-col gap-3 mb-10">
                <button onClick={handleSave} disabled={inputText.length !== 5 || saving}
                  className={`w-full py-3.5 rounded-2xl font-serif text-base tracking-wider flex items-center justify-center gap-2 transition-all duration-200 ${
                    inputText.length === 5 && !saving
                      ? "bg-[#c8a87c] text-white btn-shadow active:scale-[0.98]"
                      : "bg-[#c8a87c]/20 text-[#3a3028]/40 cursor-not-allowed"
                  }`}>
                  {saving ? (<><Loader2 size={16} className="animate-spin" />保存中…</>) : (<><Sparkles size={16} />完成记录</>)}
                </button>

              </motion.div>


            </motion.div>
          ) : (
            /* ===== 历史页 ===== */
            <motion.div key="history" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.2 }}>
              <div className="flex items-center gap-4 mb-8">
                <button onClick={() => setShowHistory(false)}
                  className="w-10 h-10 rounded-2xl flex items-center justify-center bg-white/60 backdrop-blur-sm card-shadow hover:bg-white active:scale-95 transition-all duration-200" aria-label="返回">
                  <ChevronLeft size={20} className="text-[#8b7355]" />
                </button>
                <div>
                  <h2 className="text-[22px] font-serif text-[#3a3028]">以往日记</h2>
                  <p className="text-[11px] font-sans text-[#4a4a40]/25 mt-0.5">{entries.length} 条记录</p>
                </div>
              </div>

              {entries.length === 0 ? (<EmptyState />) : (
                <div className="space-y-3 pb-24">
                  {entries.map((e, idx) => {
                    const mc = e.mood != null ? moodColor(e.mood) : null;
                    return (
                      <motion.div layout key={e.id}
                        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.03 }}
                        className="moments-card bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04),0_2px_12px_rgba(0,0,0,0.03)] border border-black/[0.04] overflow-hidden">
                        {/* 昵称 + 评分 */}
                        <div className="flex items-center gap-2 px-5 pt-5 pb-0">
                          <span className="text-[14px] font-sans font-semibold text-[#576b95]">{nickname || "日记本"}</span>
                          {e.mood != null && (
                            <span className="text-[12px] font-sans font-medium tracking-tight px-2 py-0.5 rounded-full"
                              style={{ color: mc?.accent || "#c8a87c", backgroundColor: `${mc?.accent || "#c8a87c"}10` }}>
                              {e.mood}/10
                            </span>
                          )}
                          <button onClick={() => handleDelete(e.id)}
                            className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center opacity-0 hover:opacity-100 hover:bg-red-50 text-red-300 hover:text-red-400 active:scale-90 transition-all duration-200 ml-auto"
                            aria-label="删除"><Trash2 size={14} /></button>
                        </div>
                        {/* 正文 */}
                        <div className="px-5 pt-3 pb-1">
                          <p className="text-[19px] tracking-[0.12em] leading-relaxed select-text font-serif text-[#3a3028]">{e.text}</p>
                        </div>
                        {/* 图片网格 */}
                        {e.images && e.images.length > 0 && (
                          <div className="px-5 pt-2 pb-1"><MomentsImageGrid images={e.images} /></div>
                        )}
                        {/* 底部：时间 */}
                        <div className="px-5 pt-1.5 pb-4">
                          <span className="text-[11px] font-sans text-[#8e8e93] tracking-tight">{e.date}</span>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

function AppWithBoundary() {
  return <ErrorBoundary><App /></ErrorBoundary>;
}

export default AppWithBoundary;
