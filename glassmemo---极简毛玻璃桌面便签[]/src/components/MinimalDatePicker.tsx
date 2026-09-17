import React, { useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getTodayString, getCalendarGrid } from '../utils/date';
import { DailyNote } from '../types';

interface MinimalDatePickerProps {
  isOpen: boolean;
  onClose: () => void;
  currentDate: string;
  onSelectDate: (date: string) => void;
  notes: Record<string, DailyNote>;
}

export const MinimalDatePicker: React.FC<MinimalDatePickerProps> = ({
  isOpen,
  onClose,
  currentDate,
  onSelectDate,
  notes,
}) => {
  const popupRef = useRef<HTMLDivElement>(null);
  const todayStr = getTodayString();

  const [y, m] = currentDate.split('-').map(Number);
  const [viewYear, setViewYear] = React.useState(isNaN(y) ? new Date().getFullYear() : y);
  const [viewMonth, setViewMonth] = React.useState(isNaN(m) ? new Date().getMonth() : m - 1);

  useEffect(() => {
    const [ny, nm] = currentDate.split('-').map(Number);
    if (!isNaN(ny) && !isNaN(nm)) {
      setViewYear(ny);
      setViewMonth(nm - 1);
    }
  }, [currentDate]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const calendarGrid = getCalendarGrid(viewYear, viewMonth);
  const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
  const weekHeaders = ['日', '一', '二', '三', '四', '五', '六'];

  return (
    <AnimatePresence>
      {isOpen && (
      <motion.div
        ref={popupRef}
        initial={{ opacity: 0, y: -4, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -4, scale: 0.98 }}
        transition={{ duration: 0.15 }}
        className="app-region-no-drag absolute left-3 top-12 z-50 w-64 p-3 bg-[#141A3A]/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-[0_16px_44px_rgba(0,0,0,0.6)] text-[#E8ECFF] select-none"
      >
        {/* Month Header */}
        <div className="flex items-center justify-between px-1 mb-2">
          <span className="text-xs font-semibold tracking-tight">
            {viewYear}年 {monthNames[viewMonth]}
          </span>
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1 rounded-md text-[#A8B0D0] hover:text-[#E8ECFF] hover:bg-white/5 transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1 rounded-md text-[#A8B0D0] hover:text-[#E8ECFF] hover:bg-white/5 transition-colors"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Weekday Row */}
        <div className="grid grid-cols-7 gap-1 text-center mb-1">
          {weekHeaders.map((w, idx) => (
            <span
              key={w}
              className={`text-[10px] font-medium ${idx === 0 || idx === 6 ? 'text-[#6B7299]/70' : 'text-[#6B7299]'}`}
            >
              {w}
            </span>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-1">
          {calendarGrid.map((item) => {
            const isSelected = item.dateStr === currentDate;
            const noteForDay = notes[item.dateStr];
            const hasItems = noteForDay && noteForDay.items && noteForDay.items.length > 0;

            return (
              <button
                key={item.dateStr}
                type="button"
                onClick={() => {
                  onSelectDate(item.dateStr);
                  onClose();
                }}
                className={`relative flex flex-col items-center justify-center h-7 rounded-lg text-xs transition-all ${
                  isSelected
                    ? 'bg-gradient-to-br from-[#5B8DEF] to-[#A26BFA] text-white font-medium shadow-[0_0_12px_rgba(91,139,239,0.45)]'
                    : item.isCurrentMonth
                    ? 'text-[#E8ECFF] hover:bg-white/5'
                    : 'text-[#6B7299]/50 hover:bg-white/5'
                } ${item.isToday && !isSelected ? 'text-[#3DDDFC] font-semibold ring-1 ring-[#5B8DEF]/60' : ''}`}
              >
                <span>{item.dayNumber}</span>
                {hasItems && (
                  <span
                    className={`absolute bottom-0.5 w-1 h-1 rounded-full ${
                      isSelected ? 'bg-white' : 'bg-[#5B8DEF]'
                    }`}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Footer Jump to Today */}
        <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center justify-between text-[11px]">
          <span className="text-[10px] text-[#6B7299]">小圆点表示该日有便签</span>
          <button
            type="button"
            onClick={() => {
              onSelectDate(todayStr);
              onClose();
            }}
            className="text-[#3DDDFC] hover:underline font-medium text-[11px] transition-colors"
          >
            回到今天
          </button>
        </div>
      </motion.div>
      )}
    </AnimatePresence>
  );
};
