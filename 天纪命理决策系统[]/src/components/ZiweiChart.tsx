import React, { useState } from "react";
import { NatalChart, PalaceData, StarInfo } from "../types/tianji";
import { FateAnalysisPanel } from "./FateAnalysisPanel";
import { Compass, Info, X, ShieldAlert, Award, ChevronRight, Sparkles, BookOpen } from "lucide-react";

interface ZiweiChartProps {
  chart: NatalChart;
  onOpenReport: () => void;
}

// 12 Palaces in standard 4x4 perimeter grid coordinates
// Top Row: 巳 (index 5), 午 (index 6), 未 (index 7), 申 (index 8)
// Right Row: 酉 (index 9), 戌 (index 10)
// Bottom Row: 亥 (index 11), 子 (index 0), 丑 (index 1), 寅 (index 2) [ordered left to right on screen: 寅(2), 丑(1), 子(0), 亥(11)]
// Left Row: 辰 (index 4), 卯 (index 3)
const GRID_CELLS: { branchIdx: number; row: number; col: number }[] = [
  { branchIdx: 5, row: 0, col: 0 }, // 巳 (Top-Left)
  { branchIdx: 6, row: 0, col: 1 }, // 午 (Top-MidLeft)
  { branchIdx: 7, row: 0, col: 2 }, // 未 (Top-MidRight)
  { branchIdx: 8, row: 0, col: 3 }, // 申 (Top-Right)
  { branchIdx: 4, row: 1, col: 0 }, // 辰 (Row 1 Left)
  { branchIdx: 9, row: 1, col: 3 }, // 酉 (Row 1 Right)
  { branchIdx: 3, row: 2, col: 0 }, // 卯 (Row 2 Left)
  { branchIdx: 10, row: 2, col: 3 }, // 戌 (Row 2 Right)
  { branchIdx: 2, row: 3, col: 0 }, // 寅 (Bottom-Left)
  { branchIdx: 1, row: 3, col: 1 }, // 丑 (Bottom-MidLeft)
  { branchIdx: 0, row: 3, col: 2 }, // 子 (Bottom-MidRight)
  { branchIdx: 11, row: 3, col: 3 }, // 亥 (Bottom-Right)
];

export const ZiweiChart: React.FC<ZiweiChartProps> = ({ chart, onOpenReport }) => {
  const [selectedPalace, setSelectedPalace] = useState<PalaceData | null>(
    chart.palaces.find((p) => p.isLifePalace) || chart.palaces[0]
  );

  return (
    <div className="space-y-6">
      {/* Top Banner: Core Formation & Strategy */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center space-x-2.5">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-medium">
                天纪·核心格局
              </span>
              <h2 className="text-base sm:text-lg font-serif font-bold text-slate-900 tracking-tight">
                {chart.patterns[0]?.name || "稳健守正之局"}
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-3xl">
              {chart.patterns[0]?.description}
            </p>
          </div>
          <div className="flex items-center space-x-3 shrink-0">
            <button
              onClick={onOpenReport}
              className="w-full md:w-auto px-4 py-2 bg-gradient-to-r from-amber-700 to-amber-800 hover:from-amber-600 hover:to-amber-700 active:scale-[0.98] text-white rounded-xl text-xs font-medium shadow-xs border border-amber-600/30 flex items-center justify-center space-x-1.5 transition duration-150"
            >
              <Sparkles className="w-4 h-4 text-amber-200" />
              <span>推演完整决策白皮书</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main 12-Palace Traditional Square Board */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-white border border-slate-200/90 rounded-2xl p-3 sm:p-4 shadow-xs">
          <div className="grid grid-cols-4 grid-rows-4 gap-1.5 sm:gap-2 aspect-square max-w-2xl mx-auto">
            {/* 12 Palaces */}
            {GRID_CELLS.map((cell) => {
              const palace = chart.palaces.find((p) => p.index === cell.branchIdx);
              if (!palace) return null;
              const isSelected = selectedPalace?.index === palace.index;

              return (
                <div
                  key={palace.index}
                  id={`palace-cell-${palace.branch}`}
                  onClick={() => setSelectedPalace(palace)}
                  style={{
                    gridRowStart: cell.row + 1,
                    gridColumnStart: cell.col + 1,
                  }}
                  className={`relative p-1.5 sm:p-2.5 rounded-xl cursor-pointer transition-all duration-150 flex flex-col justify-between border ${
                    isSelected
                      ? "bg-amber-50/90 border-amber-500 shadow-xs ring-1 ring-amber-400/40"
                      : palace.isLifePalace
                      ? "bg-amber-50/40 border-amber-300 hover:border-amber-400"
                      : palace.isBodyPalace
                      ? "bg-teal-50/40 border-teal-300 hover:border-teal-400"
                      : "bg-slate-50/80 border-slate-200 hover:bg-slate-100/80 hover:border-slate-300"
                  }`}
                >
                  {/* Palace Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1">
                      <span className="text-[10px] sm:text-xs font-mono font-medium text-slate-500">
                        {palace.stem}{palace.branch}
                      </span>
                      {palace.isLifePalace && (
                        <span className="px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-[9px] sm:text-[10px] font-bold">
                          命
                        </span>
                      )}
                      {palace.isBodyPalace && (
                        <span className="px-1.5 py-0.2 rounded-full bg-teal-100 text-teal-900 border border-teal-300 text-[9px] sm:text-[10px] font-bold">
                          身
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] sm:text-xs font-serif font-bold text-amber-950">
                      {palace.name}
                    </span>
                  </div>

                  {/* Major Stars Display */}
                  <div className="my-1 space-y-0.5 sm:space-y-1">
                    {palace.majorStars.map((star, sIdx) => (
                      <div key={sIdx} className="flex items-center justify-between text-[11px] sm:text-xs">
                        <span
                          className={`font-serif font-bold ${
                            star.sihua === "禄"
                              ? "text-emerald-700"
                              : star.sihua === "权"
                              ? "text-rose-700"
                              : star.sihua === "科"
                              ? "text-sky-700"
                              : star.sihua === "忌"
                              ? "text-amber-800"
                              : "text-slate-900"
                          }`}
                        >
                          {star.name}
                          {star.brightness && (
                            <span className="text-[9px] text-slate-400 font-normal ml-0.5">
                              {star.brightness}
                            </span>
                          )}
                        </span>

                        {star.sihua && (
                          <span
                            className={`px-1.5 py-0.2 rounded-full text-[9px] font-bold ${
                              star.sihua === "禄"
                                ? "bg-emerald-100 text-emerald-900 border border-emerald-300"
                                : star.sihua === "权"
                                ? "bg-rose-100 text-rose-900 border border-rose-300"
                                : star.sihua === "科"
                                ? "bg-sky-100 text-sky-900 border border-sky-300"
                                : "bg-amber-100 text-amber-900 border border-amber-300"
                            }`}
                          >
                            化{star.sihua}
                          </span>
                        )}
                      </div>
                    ))}

                    {/* Key Minor Stars (Top 3) */}
                    <div className="flex flex-wrap gap-0.5 pt-0.5">
                      {palace.minorStars.slice(0, 3).map((mStar, mIdx) => (
                        <span
                          key={mIdx}
                          className={`text-[9px] sm:text-[10px] px-1.5 py-0.2 rounded-md ${
                            mStar.type === "auspicious"
                              ? "text-teal-800 bg-teal-50 border border-teal-200"
                              : mStar.type === "inauspicious"
                              ? "text-rose-800 bg-rose-50 border border-rose-200"
                              : "text-slate-600 bg-slate-100 border border-slate-200"
                          }`}
                        >
                          {mStar.name}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Palace Footer: Decadal Limit */}
                  <div className="flex items-center justify-between text-[9px] sm:text-[10px] text-slate-500 border-t border-slate-200 pt-1">
                    <span>大限</span>
                    <span className="font-mono text-slate-700 font-medium">
                      {palace.decadeStartAge}-{palace.decadeEndAge}虚岁
                    </span>
                  </div>
                </div>
              );
            })}

            {/* Center Box: Tian Pan & Natal Summary */}
            <div
              style={{
                gridRow: "2 / span 2",
                gridColumn: "2 / span 2",
              }}
              className="bg-slate-50 border border-slate-200 rounded-2xl p-3 sm:p-4 flex flex-col justify-between shadow-inner"
            >
              <div className="text-center border-b border-slate-200 pb-1.5">
                <h3 className="text-sm sm:text-base font-serif font-bold text-amber-950 tracking-tight">
                  {chart.name} · 紫微天盘
                </h3>
                <p className="text-[10px] sm:text-xs text-slate-500 font-mono">
                  {chart.yinYangGender} · {chart.bureau}
                </p>
              </div>

              {/* Four Pillars */}
              <div className="grid grid-cols-4 gap-1 text-center py-1.5 bg-white rounded-xl border border-slate-200 text-[10px] sm:text-xs shadow-xs">
                <div>
                  <span className="text-slate-400 block text-[9px]">年柱</span>
                  <span className="font-mono text-amber-800 font-bold">{chart.lunarDate.stemBranchYear}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[9px]">月柱</span>
                  <span className="font-mono text-slate-800 font-bold">{chart.lunarDate.stemBranchMonth}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[9px]">日柱</span>
                  <span className="font-mono text-slate-800 font-bold">{chart.lunarDate.stemBranchDay}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[9px]">时柱</span>
                  <span className="font-mono text-slate-800 font-bold">{chart.lunarDate.stemBranchHour}</span>
                </div>
              </div>

              {/* Si Hua of Year */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[10px] sm:text-xs text-slate-600">
                  <span>生年四化：</span>
                  <span className="font-mono text-amber-800 font-bold">[{chart.annualSiHua.stem}干]</span>
                </div>
                <div className="grid grid-cols-4 gap-1 text-center text-[9px] sm:text-[11px]">
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-1 py-0.5 text-emerald-800 font-medium">
                    禄: {chart.annualSiHua.lu}
                  </div>
                  <div className="bg-rose-50 border border-rose-200 rounded-lg px-1 py-0.5 text-rose-800 font-medium">
                    权: {chart.annualSiHua.quan}
                  </div>
                  <div className="bg-sky-50 border border-sky-200 rounded-lg px-1 py-0.5 text-sky-800 font-medium">
                    科: {chart.annualSiHua.ke}
                  </div>
                  <div className="bg-amber-50 border border-amber-200 rounded-lg px-1 py-0.5 text-amber-800 font-medium">
                    忌: {chart.annualSiHua.ji}
                  </div>
                </div>
              </div>

              {/* Footer Motto */}
              <div className="text-center pt-1 border-t border-slate-200 text-[10px] text-amber-900 font-serif font-medium">
                以果决行 · 命相同参 · 知进退
              </div>
            </div>
          </div>
        </div>

        {/* Palace Detail & Tian Ji Strategic Analysis Sidebar */}
        <div className="lg:col-span-4 bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          {selectedPalace ? (
            <div className="space-y-4">
              {/* Selected Palace Header */}
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-800 font-serif font-bold text-sm">
                    {selectedPalace.name.slice(0, 1)}
                  </div>
                  <div>
                    <h3 className="text-base font-serif font-bold text-slate-900 tracking-tight">
                      {selectedPalace.name}（{selectedPalace.stem}{selectedPalace.branch}宫）
                    </h3>
                    <p className="text-xs text-slate-500">
                      大限：{selectedPalace.decadeStartAge} - {selectedPalace.decadeEndAge} 虚岁（实岁约 {Math.max(0, selectedPalace.decadeStartAge - 2)}-{Math.max(0, selectedPalace.decadeEndAge - 1)} 岁）
                    </p>
                  </div>
                </div>
                {selectedPalace.isLifePalace && (
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-medium">
                    本命宫
                  </span>
                )}
              </div>

              {/* Stars in Palace */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  宫内星曜配置
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {selectedPalace.majorStars.map((s, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-amber-950 flex items-center space-x-1"
                    >
                      <span>{s.name}</span>
                      {s.brightness && <span className="text-[10px] text-slate-400 font-normal">[{s.brightness}]</span>}
                      {s.sihua && <span className="text-[10px] text-rose-700 font-mono">·化{s.sihua}</span>}
                    </span>
                  ))}
                  {selectedPalace.minorStars.map((s, i) => (
                    <span
                      key={i}
                      className={`px-2 py-1 rounded-xl text-xs font-medium ${
                        s.type === "auspicious"
                          ? "bg-teal-50 text-teal-800 border border-teal-200"
                          : s.type === "inauspicious"
                          ? "bg-rose-50 text-rose-800 border border-rose-200"
                          : "bg-slate-50 text-slate-700 border border-slate-200"
                      }`}
                    >
                      {s.name}
                    </span>
                  ))}
                </div>
              </div>

              {/* Ni Haixia Tian Ji Analysis */}
              <div className="space-y-3 pt-2">
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                  <div className="flex items-center space-x-1.5 text-xs font-serif font-bold text-amber-900">
                    <Info className="w-3.5 h-3.5" />
                    <span>天纪逐宫精解</span>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    {selectedPalace.niHaixiaAnalysis.overview}
                  </p>
                </div>

                <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200 space-y-1.5">
                  <div className="flex items-center space-x-1.5 text-xs font-serif font-bold text-emerald-800">
                    <Award className="w-3.5 h-3.5" />
                    <span>以果决行·决策指导</span>
                  </div>
                  <p className="text-xs text-emerald-950 leading-relaxed">
                    {selectedPalace.niHaixiaAnalysis.actionAdvice}
                  </p>
                </div>

                <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 space-y-1.5">
                  <div className="flex items-center space-x-1.5 text-xs font-serif font-bold text-amber-900">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>君子问祸不问福·避坑防线</span>
                  </div>
                  <p className="text-xs text-amber-950 leading-relaxed">
                    {selectedPalace.niHaixiaAnalysis.warningNote}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400 text-sm">
              点击左侧十二宫位以查看天纪深度推演
            </div>
          )}

          {/* Quick Guidance Footer */}
          <div className="mt-4 pt-3 border-t border-slate-200 text-[11px] text-slate-500 flex items-center justify-between">
            <span>点击任意宫位可实时切换研判</span>
            <button
              onClick={() => setSelectedPalace(chart.palaces.find((p) => p.isLifePalace) || null)}
              className="text-amber-800 hover:text-amber-900 font-medium flex items-center transition"
            >
              返回命宫 <ChevronRight className="w-3 h-3 ml-0.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center space-x-2 text-xs text-slate-600">
          <BookOpen className="w-4 h-4 text-amber-700" />
          <span>想要从心性、大运、贵人、事业、财富、婚恋、健康等 8 大维度全息剖析？</span>
        </div>
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <button
            onClick={onOpenReport}
            className="w-full sm:w-auto px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-800 hover:text-slate-950 rounded-xl text-xs font-medium border border-slate-200 transition duration-150 shadow-xs"
          >
            查看天纪决策白皮书
          </button>
        </div>
      </div>
    </div>
  );
};
