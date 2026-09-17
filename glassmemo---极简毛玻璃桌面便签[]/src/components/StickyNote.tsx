import React, { useState, useRef, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Calendar as CalendarIcon,
  RotateCcw,
  Sliders,
  Check,
  Pin,
  PinOff,
  Minus,
  Minimize2, // v1.1.0: 「缩小」按钮（与既有的 Minus「隐藏到托盘」图标区分）
  MoreHorizontal, // v1.1.1: ⋮ 收纳菜单图标（紧凑/极简档）
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { DailyNote, MemoItem, StickySettings, ViewToggleSource } from '../types';
import { formatDateLabel, getTodayString, shiftDate } from '../utils/date';
import { playMicroSound } from '../utils/audio';
import { MinimalDatePicker } from './MinimalDatePicker';
import { Orb } from './Orb'; // v1.1.0: 悬浮球组件
import { useViewMode } from '../hooks/useViewMode'; // v1.1.0: 订阅 view:change
import { ANIMATION_DURATION_MS } from '../constants/orb'; // v1.1.0: 动画时长常量

// Electron 桌面能力（非 Electron 环境下为 undefined，按钮自动隐藏）
import type { PinState } from '../types';

declare global {
  interface Window {
    glassmemo?: {
      togglePin: () => Promise<PinState>;
      getPin: () => Promise<PinState>;
      onPinChange: (cb: (state: PinState) => void) => () => void;
      hideApp: () => void;
      quitApp: () => void;
      // v1.1.0 view 维度（与 electron/preload.cjs contextBridge 暴露对齐）
      view: {
        toggle: (source?: ViewToggleSource) => Promise<import('../types').ViewState>;
        get: () => Promise<import('../types').ViewState>;
        onChange: (cb: (payload: import('../types').ViewChangePayload) => void) => () => void;
        drag: (delta: import('../types').OrbDragDelta) => Promise<void>;
        notifyAnimDone: () => void;
      };
    };
  }
}

const hasDesktop = typeof window !== 'undefined' && !!window.glassmemo;

interface StickyNoteProps {
  currentDate: string;
  onSelectDate: (date: string) => void;
  note: DailyNote;
  allNotes: Record<string, DailyNote>;
  onUpdateNote: (updated: DailyNote) => void;
  settings: StickySettings;
  onUpdateSettings: (newSettings: Partial<StickySettings>) => void;
}

// 深色霓虹毛玻璃背景：深空蓝渐变 + 三处流光光晕（蓝 / 紫 / 青）
const GLASS_BACKGROUND = `
  radial-gradient(120% 80% at 85% 8%, rgba(91,139,239,0.22) 0%, rgba(91,139,239,0) 55%),
  radial-gradient(110% 75% at 12% 88%, rgba(162,107,250,0.16) 0%, rgba(162,107,250,0) 52%),
  radial-gradient(90% 55% at 50% 0%, rgba(61,221,252,0.09) 0%, rgba(61,221,252,0) 50%),
  linear-gradient(165deg, #151A3E 0%, #0A0E27 52%, #0A0E2B 100%)
`;

export const StickyNote: React.FC<StickyNoteProps> = ({
  currentDate,
  onSelectDate,
  note,
  allNotes,
  onUpdateNote,
  settings,
  onUpdateSettings,
}) => {
  const [inputText, setInputText] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showOpacitySlider, setShowOpacitySlider] = useState(false);
  const [pinned, setPinned] = useState(false); // 默认桌面挂件模式（与 main.cjs pinned=false 一致）
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [showMoreMenu, setShowMoreMenu] = useState(false); // v1.1.1: ⋮ 收纳菜单（紧凑/极简档收纳次要按钮）
  const moreMenuRef = useRef<HTMLDivElement>(null);
  const opacityControlRef = useRef<HTMLDivElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  // v1.1.1: 容器尺寸响应式（ResizeObserver 监听根容器宽度 → 决定 header 档位）
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(380);
  // 档位：>= 360 完整 / 280-360 紧凑 / < 280 极简
  const headerTier = containerWidth >= 360 ? 'full' : containerWidth >= 280 ? 'compact' : 'tiny';
  const showDateNav = headerTier !== 'tiny';        // 极简档隐藏前一天/后一天按钮（收纳进 ⋮ 菜单）
  const showAdvancedTools = headerTier === 'full';  // 紧凑档隐藏透明度按钮 + 置顶按钮（收纳进 ⋮ 菜单）

  // v1.1.0: view 维度 hook（订阅 view:change + 暴露 toggle/notifyAnimationDone）
  const { state: viewState, toggle: toggleView, notifyAnimationDone } = useViewMode();
  const isOrb = viewState.view === 'orb';

  const items = note?.items || [];
  const todayStr = getTodayString();
  const isToday = currentDate === todayStr;

  // 点击外部关闭透明度滑杆 / ⋮ 菜单
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (opacityControlRef.current && !opacityControlRef.current.contains(e.target as Node)) {
        setShowOpacitySlider(false);
      }
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) {
        setShowMoreMenu(false);
      }
    };
    if (showOpacitySlider || showMoreMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showOpacitySlider, showMoreMenu]);

  // 编辑模式自动聚焦
  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingId]);

  // v1.1.1: ResizeObserver 监听容器宽度 → 驱动 header 档位（full / compact / tiny）
  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        setContainerWidth(w);
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // 与主进程单一状态源对齐（SK-5）：初始化拉一次 + 订阅 onPinChange 推送
  useEffect(() => {
    if (!window.glassmemo) return;
    let cancelled = false;
    window.glassmemo.getPin().then((s) => {
      if (!cancelled && s) setPinned(!!s.pinned);
    }).catch(() => {});
    const off = window.glassmemo.onPinChange((s) => {
      if (s) setPinned(!!s.pinned);
    });
    return () => { cancelled = true; off && off(); };
  }, []);

  // 添加条目
  const handleAddItem = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed) return;

    const newItem: MemoItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      text: trimmed,
      completed: false,
      createdAt: Date.now(),
    };

    onUpdateNote({
      ...note,
      items: [newItem, ...items],
    });
    setInputText('');
    playMicroSound('add');
  };

  // 切换完成状态
  const handleToggleItem = (id: string) => {
    const target = items.find((item) => item.id === id);
    const updated = items.map((item) =>
      item.id === id ? { ...item, completed: !item.completed } : item
    );
    onUpdateNote({
      ...note,
      items: updated,
    });
    playMicroSound(target?.completed ? 'uncheck' : 'check');
  };

  // 删除条目
  const handleDeleteItem = (id: string) => {
    const updated = items.filter((item) => item.id !== id);
    onUpdateNote({
      ...note,
      items: updated,
    });
    playMicroSound('delete');
  };

  // 进入编辑模式
  const startEdit = (item: MemoItem) => {
    setEditingId(item.id);
    setEditText(item.text);
  };

  // 保存编辑
  const commitEdit = () => {
    if (editingId === null) return;
    const trimmed = editText.trim();
    if (!trimmed) {
      setEditingId(null);
      return;
    }
    const updated = items.map((item) => (item.id === editingId ? { ...item, text: trimmed } : item));
    onUpdateNote({
      ...note,
      items: updated,
    });
    setEditingId(null);
  };

  // 切换日期时收起编辑态
  useEffect(() => {
    setEditingId(null);
  }, [currentDate]);

  const handleTogglePin = async () => {
    if (!window.glassmemo) return;
    const next = await window.glassmemo.togglePin();
    setPinned(!!next?.pinned);
  };

  // v1.1.0: 「缩小」按钮 → view:toggle('button') → OrbController.shrink()
  const handleShrinkClick = async () => {
    if (!window.glassmemo || !window.glassmemo.view) return;
    await toggleView('button');
  };

  const opacityPercent = Math.round(settings.opacity * 100);

  // v1.1.0: view 形态分支渲染
  // orb 模式：根 div 保留（透明 + 圆角 + 阴影），内部整体替换为 <Orb />
  // note 模式：保留既有完整便签 UI（最小增量，不动 GLASS_BACKGROUND / Header / Items / Footer）
  return (
    <div
      ref={containerRef}
      className="relative w-full h-full rounded-[18px] flex flex-col overflow-hidden select-none text-[#E8ECFF]"
      style={{
        // v1.1.1: boxShadow 保留在 root（外发光不被 opacity 吃掉）；opacity 分散到各层显式控制，
        // 避免根 opacity 在 transparent 窗口下被合成器吞掉、footer/items 文字淡不下去。
        boxShadow: '0 18px 50px rgba(0,0,0,0.55), 0 2px 12px rgba(0,0,0,0.35), 0 0 0 1px rgba(91,139,239,0.06)',
      }}
    >
      {/* 底层：深空蓝渐变 + 流光光晕（跟随 settings.opacity 让背景也淡） */}
      <div
        className="absolute inset-0 z-0"
        style={{ background: GLASS_BACKGROUND, opacity: settings.opacity }}
      />

      {/* v1.1.1: 外层 div 显式挂 opacity（不再依赖根级联，绕过 transparent 窗口合成问题）
          motion 内部改用 scale / y 做切换动画，exit 时 opacity 临时置 0 完成淡出 */}
      <div className="absolute inset-0 z-10" style={{ opacity: settings.opacity }}>
      <AnimatePresence mode="wait" initial={false}>
        {isOrb ? (
          <motion.div
            key="orb"
            className="w-full h-full flex items-center justify-center"
            initial={{ scale: 0.4 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.4, opacity: 0 }}
            transition={{ duration: ANIMATION_DURATION_MS / 1000, ease: [0.4, 0, 0.2, 1] }}
          >
            <Orb onExpand={(src) => toggleView(src)} />
          </motion.div>
        ) : (
          <motion.div
            key="note"
            className="w-full h-full flex flex-col min-h-0"
            initial={{ y: 4 }}
            animate={{ y: 0 }}
            exit={{ y: 0, opacity: 0 }}
            transition={{ duration: ANIMATION_DURATION_MS / 1000, ease: [0.4, 0, 0.2, 1] }}
            onAnimationComplete={notifyAnimationDone}
          >
            {/* 1. Header：日期导航 + 窗口拖拽区 + 工具（整个 header 为系统拖拽区，按钮为 no-drag） */}
            {/* v1.1.1 响应式档位：
                - full (≥360):  日期 + 后退/前进 + 透明度 + 置顶 + 缩小 + 关闭
                - compact (280-360): 日期 + 后退/前进 + 缩小 + 关闭 + ⋮（收纳透明度/置顶/今天）
                - tiny  (<280):  日期 + 后退 + 前进 + 缩小 + 关闭 + ⋮（收纳上述全部） */}
        <div className="relative flex items-center justify-between gap-1 px-3.5 pt-3 pb-2 border-b border-white/10 app-region-drag">
          {/* 日期选择（霓虹渐变标题） */}
          <div className="flex items-center gap-1 min-w-0 flex-shrink app-region-no-drag">
            <button
              type="button"
              onClick={() => setShowDatePicker(!showDatePicker)}
              className="flex items-center gap-1.5 px-2 py-1 -ml-1 rounded-lg text-xs font-bold hover:bg-white/5 transition-colors min-w-0"
              title="选择日期"
            >
              <CalendarIcon className="w-3.5 h-3.5 text-[#A8B0D0] flex-shrink-0" />
              <span className="gm-neon-text whitespace-nowrap truncate">{formatDateLabel(currentDate)}</span>
            </button>

            {!isToday && showDateNav && (
              <button
                type="button"
                onClick={() => onSelectDate(todayStr)}
                className="p-1 rounded text-[#6B7299] hover:text-[#3DDDFC] hover:bg-white/5 transition-colors text-[10px] flex-shrink-0"
                title="返回今天"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* 右侧工具按钮区（紧凑档/极简档省略次要按钮） */}
          <div className="flex items-center gap-0.5 app-region-no-drag flex-shrink-0">
            {/* 后退 / 前进（紧凑档也保留，因为日期切换是核心） */}
            {showDateNav && (
              <>
                <button
                  type="button"
                  onClick={() => onSelectDate(shiftDate(currentDate, -1))}
                  className="p-1 rounded-md text-[#A8B0D0] hover:text-[#E8ECFF] hover:bg-white/5 transition-colors"
                  title="前一天"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => onSelectDate(shiftDate(currentDate, 1))}
                  className="p-1 rounded-md text-[#A8B0D0] hover:text-[#E8ECFF] hover:bg-white/5 transition-colors"
                  title="后一天"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </>
            )}

            {/* 透明度调节 + 置顶切换（仅完整档直接展示） */}
            {showAdvancedTools && (
              <>
                <div className="relative ml-1" ref={opacityControlRef}>
                  <button
                    type="button"
                    onClick={() => setShowOpacitySlider(!showOpacitySlider)}
                    className={`p-1 rounded-md transition-colors ${
                      showOpacitySlider
                        ? 'bg-[#5B8DEF]/25 text-[#E8ECFF]'
                        : 'text-[#A8B0D0] hover:text-[#E8ECFF] hover:bg-white/5'
                    }`}
                    title="调节透明度"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                  </button>

                  {showOpacitySlider && (
                    <div className="app-region-no-drag absolute right-0 top-7 z-50 w-44 p-3 bg-[#141A3A]/95 backdrop-blur-2xl border border-white/10 rounded-xl shadow-[0_12px_36px_rgba(0,0,0,0.5)] text-[#E8ECFF]">
                      <div className="flex items-center justify-between text-[11px] mb-1.5 font-medium text-[#A8B0D0]">
                        <span>便签透明度</span>
                        <span className="font-mono text-[#E8ECFF]">{opacityPercent}%</span>
                      </div>
                      <input
                        type="range"
                        min="0.55"
                        max="1.0"
                        step="0.05"
                        value={settings.opacity}
                        onChange={(e) => onUpdateSettings({ opacity: parseFloat(e.target.value) })}
                        className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#5B8DEF]"
                      />
                    </div>
                  )}
                </div>

                {hasDesktop && (
                  <button
                    type="button"
                    onClick={handleTogglePin}
                    className={`p-1 rounded-md transition-colors ${
                      pinned
                        ? 'text-[#3DDDFC] bg-[#3DDDFC]/15 shadow-[0_0_10px_rgba(61,221,252,0.35)]'
                        : 'text-[#A8B0D0] hover:text-[#E8ECFF] hover:bg-white/5'
                    }`}
                    title={pinned ? '取消置顶' : '窗口置顶'}
                  >
                    {pinned ? <Pin className="w-3.5 h-3.5" /> : <PinOff className="w-3.5 h-3.5" />}
                  </button>
                )}
              </>
            )}

            {/* v1.1.0: 「缩小」按钮（位于「窗口置顶」与「关闭到托盘」之间，对应 PRD §3.2 图标顺序约束） */}
            {hasDesktop && (
              <button
                type="button"
                onClick={handleShrinkClick}
                className="p-1 rounded-md text-[#A8B0D0] hover:text-[#E8ECFF] hover:bg-white/5 transition-colors"
                title="缩小为悬浮球"
              >
                <Minimize2 className="w-3.5 h-3.5" />
              </button>
            )}

            {/* 隐藏到托盘（仅 Electron，所有档位都保留因为是核心操作） */}
            {hasDesktop && (
              <button
                type="button"
                onClick={() => window.glassmemo?.hideApp()}
                className="p-1 rounded-md text-[#A8B0D0] hover:text-[#FB7185] hover:bg-[#FB7185]/10 transition-colors"
                title="隐藏到托盘"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
            )}

            {/* v1.1.1: ⋮ 收纳菜单（紧凑/极简档显示，收纳被隐藏的次要按钮） */}
            {headerTier !== 'full' && (
              <div className="relative" ref={moreMenuRef}>
                <button
                  type="button"
                  onClick={() => setShowMoreMenu(!showMoreMenu)}
                  className={`p-1 rounded-md transition-colors ${
                    showMoreMenu
                      ? 'bg-[#5B8DEF]/25 text-[#E8ECFF]'
                      : 'text-[#A8B0D0] hover:text-[#E8ECFF] hover:bg-white/5'
                  }`}
                  title="更多"
                >
                  <MoreHorizontal className="w-3.5 h-3.5" />
                </button>
                {showMoreMenu && (
                  <div className="app-region-no-drag absolute right-0 top-7 z-50 min-w-[180px] p-1.5 bg-[#141A3A]/95 backdrop-blur-2xl border border-white/10 rounded-xl shadow-[0_12px_36px_rgba(0,0,0,0.5)] text-[#E8ECFF]">
                    {!showAdvancedTools && (
                      <>
                        {/* 透明度（紧凑/极简档） */}
                        <div className="px-2.5 py-2 rounded-lg hover:bg-white/5">
                          <div className="flex items-center justify-between text-[11px] mb-1.5 font-medium text-[#A8B0D0]">
                            <span>透明度</span>
                            <span className="font-mono text-[#E8ECFF]">{opacityPercent}%</span>
                          </div>
                          <input
                            type="range"
                            min="0.55"
                            max="1.0"
                            step="0.05"
                            value={settings.opacity}
                            onChange={(e) => onUpdateSettings({ opacity: parseFloat(e.target.value) })}
                            className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#5B8DEF]"
                          />
                        </div>
                        {/* 置顶（紧凑/极简档） */}
                        {hasDesktop && (
                          <button
                            type="button"
                            onClick={async () => { await handleTogglePin(); setShowMoreMenu(false); }}
                            className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-[12px] transition-colors ${
                              pinned ? 'bg-[#3DDDFC]/15 text-[#3DDDFC]' : 'text-[#E8ECFF] hover:bg-white/5'
                            }`}
                          >
                            {pinned ? <Pin className="w-3.5 h-3.5" /> : <PinOff className="w-3.5 h-3.5" />}
                            <span>{pinned ? '取消置顶' : '窗口置顶'}</span>
                          </button>
                        )}
                      </>
                    )}
                    {!isToday && !showDateNav && (
                      <button
                        type="button"
                        onClick={() => { onSelectDate(todayStr); setShowMoreMenu(false); }}
                        className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-[12px] text-[#E8ECFF] hover:bg-white/5 transition-colors"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>返回今天</span>
                      </button>
                    )}
                    {!showDateNav && (
                      <div className="border-t border-white/5 my-1" />
                    )}
                    {!showDateNav && (
                      <div className="flex items-center gap-1 px-2 py-1.5">
                        <button
                          type="button"
                          onClick={() => { onSelectDate(shiftDate(currentDate, -1)); setShowMoreMenu(false); }}
                          className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-md text-[11px] text-[#A8B0D0] hover:text-[#E8ECFF] hover:bg-white/5 transition-colors"
                          title="前一天"
                        >
                          <ChevronLeft className="w-3 h-3" />
                          <span>前一天</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => { onSelectDate(shiftDate(currentDate, 1)); setShowMoreMenu(false); }}
                          className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-md text-[11px] text-[#A8B0D0] hover:text-[#E8ECFF] hover:bg-white/5 transition-colors"
                          title="后一天"
                        >
                          <span>后一天</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 日期选择弹层 */}
          <MinimalDatePicker
            isOpen={showDatePicker}
            onClose={() => setShowDatePicker(false)}
            currentDate={currentDate}
            onSelectDate={onSelectDate}
            notes={allNotes}
          />
        </div>

        {/* 2. 快速输入 */}
        <div className="relative px-3.5 pt-2.5 pb-1.5">
          <form
            onSubmit={handleAddItem}
            className="flex items-center gap-2 bg-white/[0.03] hover:bg-white/[0.06] focus-within:bg-[#1A2150]/60 rounded-xl px-3 py-2 transition-all border border-white/10 focus-within:border-[#5B8DEF]/50 focus-within:ring-1 focus-within:ring-[#5B8DEF]/40"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="记下要做的事... (按 Enter 保存)"
              className="flex-1 bg-transparent text-[13px] text-[#E8ECFF] placeholder-[#6B7299] focus:outline-none"
            />
            {inputText.trim() && (
              <button
                type="submit"
                className="p-1 rounded-md bg-gradient-to-br from-[#5B8DEF] to-[#A26BFA] text-white hover:brightness-110 active:scale-95 transition-all shadow-[0_0_10px_rgba(91,139,239,0.4)]"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            )}
          </form>
        </div>

        {/* 3. 条目列表 */}
        <div className="relative px-3.5 py-1.5 flex-1 overflow-y-auto space-y-1 custom-scrollbar">
          <AnimatePresence initial={false}>
            {items.length > 0 ? (
              items.map((item) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 3 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.12 }}
                  className={`group flex items-center justify-between gap-2.5 px-2.5 py-2 rounded-xl transition-all ${
                    item.completed
                      ? 'text-[#6B7299] bg-white/[0.02]'
                      : 'text-[#E8ECFF] hover:bg-white/[0.05]'
                  }`}
                >
                  {/* 完成勾选 */}
                  <button
                    type="button"
                    onClick={() => handleToggleItem(item.id)}
                    className={`flex-shrink-0 w-4 h-4 rounded-full border transition-all flex items-center justify-center ${
                      item.completed
                        ? 'bg-gradient-to-br from-[#5B8DEF] to-[#A26BFA] border-transparent text-white shadow-[0_0_8px_rgba(91,139,239,0.55)]'
                        : 'border-[#A8B0D0]/40 hover:border-[#5B8DEF] bg-white/[0.03] text-transparent'
                    }`}
                  >
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </button>

                  {/* 文本：双击进入内联编辑 */}
                  {editingId === item.id ? (
                    <input
                      ref={editInputRef}
                      type="text"
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      onBlur={commitEdit}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') commitEdit();
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                      className="flex-1 bg-[#0A0E27] text-[13px] leading-relaxed break-all rounded-md px-1.5 py-0.5 ring-1 ring-[#5B8DEF]/50 focus:outline-none focus:ring-[#5B8DEF] select-text text-[#E8ECFF]"
                    />
                  ) : (
                    <span
                      onDoubleClick={() => startEdit(item)}
                      className={`flex-1 text-[13px] leading-relaxed break-all select-text cursor-text ${
                        item.completed ? 'line-through opacity-50' : 'font-normal'
                      }`}
                      title="双击编辑"
                    >
                      {item.text}
                    </span>
                  )}

                  {/* 删除 */}
                  <button
                    type="button"
                    onClick={() => handleDeleteItem(item.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded text-[#6B7299] hover:text-[#FB7185] hover:bg-[#FB7185]/10 transition-all"
                    title="删除"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </motion.div>
              ))
            ) : (
              <div className="py-10 text-center text-xs text-[#6B7299] select-none">
                今日暂无备忘，点击上方快速记录
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* 4. Footer */}
        <div className="relative px-3.5 py-2 border-t border-white/10 flex items-center justify-between text-[10px] text-[#6B7299]">
          <span>
            <span className="text-[#3DDDFC] font-mono">{items.filter((i) => !i.completed).length}</span>{' '}
            项待办
          </span>
          <span>双击条目可编辑 · 顶栏可拖动</span>
        </div>
          </motion.div>
        )}
      </AnimatePresence>
      </div>
      {/* ↑ v1.1.1: 外层 opacity div 结束 */}

      {/* 顶层：顶部高光线 + 玻璃描边（叠加在内容上方，不拦截鼠标） */}
      <div
        className="absolute inset-0 z-20 pointer-events-none rounded-[18px]"
        style={{ boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.10)' }}
      />
      <div
        className="absolute top-0 inset-x-0 z-20 h-px pointer-events-none"
        style={{
          background: 'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.32) 50%, rgba(255,255,255,0) 100%)',
        }}
      />
    </div>
  );
};
