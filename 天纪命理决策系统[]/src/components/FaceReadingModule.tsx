import React, { useState } from "react";
import { FACIAL_PALACES } from "../utils/faceReadingData";
import { FacialPalace } from "../types/tianji";
import { Eye, Award, AlertTriangle, Sparkles, CheckCircle, HelpCircle } from "lucide-react";

interface FaceReadingModuleProps {
  onOpenReport: () => void;
}

export const FaceReadingModule: React.FC<FaceReadingModuleProps> = ({ onOpenReport }) => {
  const [selectedPalace, setSelectedPalace] = useState<FacialPalace>(FACIAL_PALACES[1]); // Default 印堂/命宫

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-[#131720]/90 border border-white/[0.08] rounded-2xl p-5 sm:p-6 shadow-sm backdrop-blur-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 text-xs font-medium">
                天纪·面相学
              </span>
              <h2 className="text-xl font-serif font-bold text-white tracking-tight">
                面相神韵与“命相同参”多维互证系统
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-300/90 leading-relaxed">
              传形不如传神。紫微斗数查天命流年，面相察当下心性气色，阳宅调空间气场，三者互证方为全吉。
            </p>
          </div>

          <button
            onClick={onOpenReport}
            className="px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 active:scale-[0.98] text-white rounded-xl text-xs font-medium shadow-sm border border-amber-400/30 flex items-center justify-center space-x-1.5 transition duration-150 shrink-0"
          >
            <Sparkles className="w-4 h-4 text-amber-200" />
            <span>生成命相全景报告</span>
          </button>
        </div>
      </div>

      {/* Main Layout: Face Palace Interactive Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Interactive Facial Palace List / Visual Map */}
        <div className="lg:col-span-5 bg-[#131720]/90 border border-white/[0.08] rounded-2xl p-5 shadow-sm space-y-3 backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
            <h3 className="text-sm font-serif font-bold text-white flex items-center space-x-2">
              <Eye className="w-4 h-4 text-amber-400" />
              <span>天纪面相十二宫位索引</span>
            </h3>
            <span className="text-xs text-slate-400 font-sans">点击部位查看</span>
          </div>

          <div className="space-y-1.5 max-h-[560px] overflow-y-auto pr-1">
            {FACIAL_PALACES.map((palace) => {
              const isSelected = selectedPalace.id === palace.id;
              return (
                <button
                  key={palace.id}
                  id={`face-palace-${palace.id}`}
                  onClick={() => setSelectedPalace(palace)}
                  className={`w-full p-3 rounded-xl border text-left transition duration-150 flex items-center justify-between ${
                    isSelected
                      ? "bg-gradient-to-r from-amber-600/20 to-amber-500/10 border-amber-500/40 text-amber-200 shadow-sm"
                      : "bg-[#141822] border-white/[0.04] text-slate-300 hover:bg-white/[0.04] hover:border-white/[0.08]"
                  }`}
                >
                  <div>
                    <span className="text-xs font-serif font-bold block text-white">
                      {palace.name}
                    </span>
                    <span className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                      {palace.correspondsTo}
                    </span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#191D26] border border-white/[0.08] font-mono text-amber-400/90 shrink-0 ml-2">
                    {palace.id}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Selected Facial Palace Deep Analysis */}
        <div className="lg:col-span-7 bg-[#131720]/90 border border-white/[0.08] rounded-2xl p-6 shadow-sm space-y-4 backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
            <div>
              <h3 className="text-xl font-serif font-bold text-white tracking-tight">
                {selectedPalace.name}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                位置：{selectedPalace.location} · 对应：{selectedPalace.correspondsTo}
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 text-xs font-medium">
              天纪相法
            </span>
          </div>

          {/* Auspicious vs Inauspicious signs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="p-4 bg-[#141822] border border-emerald-500/20 rounded-2xl space-y-2">
              <div className="flex items-center space-x-1.5 text-xs font-serif font-bold text-emerald-400">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>吉相大格特征</span>
              </div>
              <p className="text-xs text-slate-300/90 leading-relaxed">
                {selectedPalace.auspiciousSigns}
              </p>
            </div>

            <div className="p-4 bg-[#141822] border border-rose-500/20 rounded-2xl space-y-2">
              <div className="flex items-center space-x-1.5 text-xs font-serif font-bold text-rose-400">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>凶象与警示征兆</span>
              </div>
              <p className="text-xs text-slate-300/90 leading-relaxed">
                {selectedPalace.inauspiciousSigns}
              </p>
            </div>
          </div>

          {/* Ni Haixia Tian Ji Facial Insight */}
          <div className="p-4 bg-[#141822] rounded-2xl border border-white/[0.06] space-y-2">
            <div className="flex items-center space-x-2 text-xs font-serif font-bold text-amber-300">
              <Sparkles className="w-4 h-4" />
              <span>倪师天纪·命相实战参断要诀</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-200/90 leading-relaxed">
              {selectedPalace.tianjiInsight}
            </p>
          </div>

          {/* Multi-modality Correlation Card */}
          <div className="p-4 bg-gradient-to-r from-amber-500/10 to-transparent border border-amber-500/20 rounded-2xl space-y-2 text-xs text-slate-300/90 leading-relaxed">
            <span className="font-serif font-bold text-amber-300 block text-sm">
              【命相同参实战口诀】：
            </span>
            <p>
              若紫微命盘官禄逢化禄化权，但天庭晦暗、印堂发青，此时断不可冒险扩张，宜以相为准暂缓行动；若命盘逢大限低谷，但眼神清亮坚定、鼻准黄润，主暗伏生机，必能逆势突围。形神兼备，方不误判。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
