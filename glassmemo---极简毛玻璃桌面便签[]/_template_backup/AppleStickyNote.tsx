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
  GripHorizontal,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { DailyNote, MemoItem, StickySettings } from '../types';
import { formatDateLabel, getTodayString, shiftDate } from '../utils/date';
import { MinimalDatePicker } from './MinimalDatePicker';

interface AppleStickyNoteProps {
  currentDate: string;
  onSelectDate: (date: string) => void;
  note: DailyNote;
  allNotes: Record<string, DailyNote>;
  onUpdateNote: (updated: DailyNote) => void;
  settings: StickySettings;
  onUpdateSettings: (newSettings: Partial<StickySettings>) => void;
  onDragEnd: (e: any, info: any) => void;
}

export const AppleStickyNote: React.FC<AppleStickyNoteProps> = ({
  currentDate,
  onSelectDate,
  note,
  allNotes,
  onUpdateNote,
  settings,
  onUpdateSettings,
  onDragEnd,
}) => {
  const [inputText, setInputText] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showOpacitySlider, setShowOpacitySlider] = useState(false);
  const opacityControlRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const items = note?.items || [];
  const todayStr = getTodayString();
  const isToday = currentDate === todayStr;

  // Click outside to close opacity slider
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (opacityControlRef.current && !opacityControlRef.current.contains(e.target as Node)) {
        setShowOpacitySlider(false);
      }
    };
    if (showOpacitySlider) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showOpacitySlider]);

  // Add Item
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
  };

  // Toggle Item Completion
  const handleToggleItem = (id: string) => {
    const updated = items.map((item) =>
      item.id === id ? { ...item, completed: !item.completed } : item
    );
    onUpdateNote({
      ...note,
      items: updated,
    });
  };

  // Delete Item
  const handleDeleteItem = (id: string) => {
    const updated = items.filter((item) => item.id !== id);
    onUpdateNote({
      ...note,
      items: updated,
    });
  };

  // Update Item Text
  const handleUpdateText = (id: string, newText: string) => {
    const trimmed = newText.trim();
    if (!trimmed) return;
    const updated = items.map((item) => (item.id === id ? { ...item, text: trimmed } : item));
    onUpdateNote({
      ...note,
      items: updated,
    });
  };

  const opacityPercent = Math.round(settings.opacity * 100);

  return (
    <motion.div
      id="apple-sticky-note"
      drag
      dragMomentum={false}
      dragHandle=".drag-handle"
      onDragEnd={onDragEnd}
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      className="fixed z-40 w-[340px] sm:w-[360px] max-w-[92vw] rounded-2xl shadow-[0_16px_40px_rgba(0,0,0,0.06),0_2px_10px_rgba(0,0,0,0.03)] border border-white/90 backdrop-blur-2xl flex flex-col overflow-hidden text-neutral-800 select-none transition-shadow"
      style={{
        backgroundColor: `rgba(255, 255, 255, ${settings.opacity})`,
        left: settings.position.x > 0 ? settings.position.x : 'auto',
        right: settings.position.x <= 0 ? '32px' : 'auto',
        top: settings.position.y > 0 ? settings.position.y : '40px',
      }}
    >
      {/* 1. Header: Date Navigator, Drag Handle & Controls */}
      <div className="relative flex items-center justify-between px-3.5 pt-3 pb-2 border-b border-neutral-200/40">
        {/* Date Selector */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setShowDatePicker(!showDatePicker)}
            className="flex items-center gap-1.5 px-2 py-1 -ml-1 rounded-lg text-xs font-semibold text-neutral-800 hover:bg-neutral-100 transition-colors"
            title="选择日期"
          >
            <CalendarIcon className="w-3.5 h-3.5 text-neutral-400" />
            <span>{formatDateLabel(currentDate)}</span>
          </button>

          {!isToday && (
            <button
              type="button"
              onClick={() => onSelectDate(todayStr)}
              className="p-1 rounded text-neutral-400 hover:text-neutral-800 hover:bg-neutral-100 transition-colors text-[10px]"
              title="返回今天"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Center Drag Handle */}
        <div
          className="drag-handle flex-1 flex items-center justify-center py-1 mx-1 cursor-grab active:cursor-grabbing text-neutral-300 hover:text-neutral-500 transition-colors"
          title="按住拖动便签"
        >
          <GripHorizontal className="w-4 h-4" />
        </div>

        {/* Right Tools: Prev/Next Day & Opacity */}
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={() => onSelectDate(shiftDate(currentDate, -1))}
            className="p-1 rounded-md text-neutral-400 hover:text-neutral-800 hover:bg-neutral-100 transition-colors"
            title="前一天"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onSelectDate(shiftDate(currentDate, 1))}
            className="p-1 rounded-md text-neutral-400 hover:text-neutral-800 hover:bg-neutral-100 transition-colors"
            title="后一天"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>

          {/* Opacity Adjustment */}
          <div className="relative ml-1" ref={opacityControlRef}>
            <button
              type="button"
              onClick={() => setShowOpacitySlider(!showOpacitySlider)}
              className={`p-1 rounded-md transition-colors ${
                showOpacitySlider
                  ? 'bg-neutral-200 text-neutral-900'
                  : 'text-neutral-400 hover:text-neutral-800 hover:bg-neutral-100'
              }`}
              title="调节透明度"
            >
              <Sliders className="w-3.5 h-3.5" />
            </button>

            {showOpacitySlider && (
              <div className="absolute right-0 top-7 z-50 w-44 p-3 bg-white/95 backdrop-blur-2xl border border-neutral-200/80 rounded-xl shadow-xl text-neutral-800">
                <div className="flex items-center justify-between text-[11px] mb-1.5 font-medium text-neutral-600">
                  <span>便签透明度</span>
                  <span className="font-mono text-neutral-900">{opacityPercent}%</span>
                </div>
                <input
                  type="range"
                  min="0.35"
                  max="1.0"
                  step="0.05"
                  value={settings.opacity}
                  onChange={(e) => onUpdateSettings({ opacity: parseFloat(e.target.value) })}
                  className="w-full h-1 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-neutral-900"
                />
              </div>
            )}
          </div>
        </div>

        {/* Date Picker Popover */}
        <MinimalDatePicker
          isOpen={showDatePicker}
          onClose={() => setShowDatePicker(false)}
          currentDate={currentDate}
          onSelectDate={onSelectDate}
          notes={allNotes}
        />
      </div>

      {/* 2. Direct Input Field (进入客户端直接输入) */}
      <div className="px-3.5 pt-2.5 pb-1.5">
        <form
          onSubmit={handleAddItem}
          className="flex items-center gap-2 bg-neutral-100/70 hover:bg-neutral-100 focus-within:bg-white focus-within:ring-1 focus-within:ring-neutral-300 rounded-xl px-3 py-2 transition-all border border-transparent focus-within:border-neutral-200"
        >
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="记下要做的事... (按 Enter 保存)"
            className="flex-1 bg-transparent text-xs sm:text-[13px] text-neutral-800 placeholder-neutral-400 focus:outline-none"
          />
          {inputText.trim() && (
            <button
              type="submit"
              className="p-1 rounded-md bg-neutral-900 text-white hover:bg-neutral-800 active:scale-95 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          )}
        </form>
      </div>

      {/* 3. Items List */}
      <div className="px-3.5 py-1.5 max-h-[380px] overflow-y-auto space-y-1 custom-scrollbar">
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
                    ? 'text-neutral-400 bg-neutral-50/50'
                    : 'text-neutral-800 hover:bg-neutral-100/70'
                }`}
              >
                {/* Checkbox */}
                <button
                  type="button"
                  onClick={() => handleToggleItem(item.id)}
                  className={`flex-shrink-0 w-4 h-4 rounded-full border transition-all flex items-center justify-center ${
                    item.completed
                      ? 'bg-neutral-900 border-neutral-900 text-white'
                      : 'border-neutral-300 hover:border-neutral-600 bg-white text-transparent'
                  }`}
                >
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                </button>

                {/* Text Content */}
                <span
                  onDoubleClick={() => {
                    const newText = window.prompt('编辑备忘', item.text);
                    if (newText !== null) handleUpdateText(item.id, newText);
                  }}
                  className={`flex-1 text-xs sm:text-[13px] leading-relaxed break-all select-text cursor-pointer ${
                    item.completed ? 'line-through opacity-50' : 'font-normal'
                  }`}
                  title="双击编辑"
                >
                  {item.text}
                </span>

                {/* Delete Button */}
                <button
                  type="button"
                  onClick={() => handleDeleteItem(item.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded text-neutral-400 hover:text-rose-600 hover:bg-rose-50 transition-all"
                  title="删除"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </motion.div>
            ))
          ) : (
            <div className="py-10 text-center text-xs text-neutral-400 select-none">
              今日暂无备忘，点击上方快速记录
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* 4. Minimal Footer */}
      <div className="px-3.5 py-2 border-t border-neutral-100 flex items-center justify-between text-[10px] text-neutral-400">
        <span>{items.filter((i) => !i.completed).length} 项待办</span>
        <span>顶部可随意拖动</span>
      </div>
    </motion.div>
  );
};
