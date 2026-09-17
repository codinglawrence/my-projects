import React, { useState } from "react";
import { NatalChart, HeavenlyStem, EarthlyBranch } from "../types/tianji";
import { SIHUA_TABLE, INDEX_TO_BRANCH } from "../utils/ziweiEngine";
import { HEAVENLY_STEMS, EARTHLY_BRANCHES } from "../utils/lunarCalendar";
import { ShieldAlert, TrendingUp, Award, DollarSign, Zap, Calendar, Compass, AlertTriangle, ArrowRight, HelpCircle, Info } from "lucide-react";

interface SiHuaTimelineProps {
  chart: NatalChart;
  onOpenReport: () => void;
}

export const SiHuaTimeline: React.FC<SiHuaTimelineProps> = ({ chart, onOpenReport }) => {
  // Parse Birth Date components
  const [birthYearStr, birthMonthStr, birthDayStr] = (chart.solarDate || "1990-01-01").split("-");
  const birthYear = Number(birthYearStr) || 1990;
  const birthMonth = Number(birthMonthStr) || 1;
  const birthDay = Number(birthDayStr) || 1;

  const currentActualYear = 2026;
  const initialAge = Math.max(1, currentActualYear - birthYear + 1);

  // selectedAge is traditional nominal age (虚岁)
  const [selectedAge, setSelectedAge] = useState<number>(initialAge);
  const [showAgeExplanation, setShowAgeExplanation] = useState<boolean>(true);

  // Corresponding Gregorian Year
  const selectedYear = birthYear + selectedAge - 1;

  // Gregorian Full Age (周岁 / 实岁) in this target year:
  // Before birth date in that year: selectedYear - birthYear - 1
  // On/after birth date in that year: selectedYear - birthYear
  const fullAgeBeforeBirthday = Math.max(0, selectedYear - birthYear - 1);
  const fullAgeAfterBirthday = Math.max(0, selectedYear - birthYear);

  // Annual Stem & Branch
  const yearOffset = selectedYear - 1924;
  const annualStem = HEAVENLY_STEMS[(yearOffset % 10 + 10) % 10];
  const annualBranch = EARTHLY_BRANCHES[(yearOffset % 12 + 12) % 12];
  const annualSiHua = SIHUA_TABLE[annualStem];

  // Find Current Decadal Limit (大限)
  const currentDecadePalace = chart.palaces.find(
    (p) => selectedAge >= p.decadeStartAge && selectedAge <= p.decadeEndAge
  ) || chart.palaces[0];

  // Decade Stem Si Hua
  const decadeSiHua = SIHUA_TABLE[currentDecadePalace.stem];

  // Annual Palace (流年命宫 sits on annual Earthly Branch)
  const annualPalace = chart.palaces.find((p) => p.branch === annualBranch) || chart.palaces[0];

  // Risk & Opportunity calculation
  const isHighRisk = annualSiHua.ji === "太阳" || annualSiHua.ji === "廉贞" || annualSiHua.ji === "文昌" || annualSiHua.ji === "巨门";
  const hasStrongPower = annualSiHua.quan === "破军" || annualSiHua.quan === "天梁" || annualSiHua.quan === "天同";

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-[#131720]/90 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-300 border border-rose-500/20 text-xs font-medium">
                天纪·四化运行规律
              </span>
              <h2 className="text-lg font-serif font-bold text-white tracking-tight">
                大限与流年运势推演（知进退 · 以果决行）
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-300/90">
              四化星（科、权、禄、忌）乃紫微斗数命运之发动机。顺应天道节律，君子问祸不问福。
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
            <div className="flex items-center space-x-2 text-xs font-mono bg-[#191D26] border border-white/[0.08] px-3.5 py-2 rounded-xl">
              <Calendar className="w-4 h-4 text-amber-400" />
              <div className="flex items-center space-x-1.5">
                <span className="text-amber-300 font-semibold text-sm">{selectedAge} 虚岁</span>
                <span className="text-xs text-amber-400/80">（实岁 {fullAgeBeforeBirthday}~{fullAgeAfterBirthday} 岁）</span>
                <span className="text-slate-400 font-normal">| {selectedYear} {annualStem}{annualBranch}年</span>
              </div>
            </div>

            <button
              onClick={() => setShowAgeExplanation(!showAgeExplanation)}
              className="px-3 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] text-xs text-slate-300 hover:text-white flex items-center space-x-1 transition duration-150"
              title="查看虚岁与实岁（周岁）换算原理"
            >
              <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
              <span>虚岁/实岁释疑</span>
            </button>
          </div>
        </div>
      </div>

      {/* Age Explanation Banner (Traditional Nominal Age vs Modern Gregorian Age) */}
      {showAgeExplanation && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 sm:p-5 shadow-sm text-xs text-slate-300 space-y-2.5 transition-all">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-amber-200 font-serif font-bold text-sm">
              <Info className="w-4 h-4 text-amber-400 shrink-0" />
              <span>【传统命理岁数释疑】：为什么推演显示为「{selectedAge}岁（虚岁）」？</span>
            </div>
            <button
              onClick={() => setShowAgeExplanation(false)}
              className="text-slate-400 hover:text-slate-200 text-xs underline"
            >
              收起说明
            </button>
          </div>

          <div className="leading-relaxed space-y-1.5 text-slate-300/90">
            <p>
              1. <strong className="text-amber-200">紫微斗数统一度量：</strong>中华传统命理（紫微斗数、八字、倪海厦《天纪》）的所有【十年大限】（如水二局2-11岁、木三局3-12岁）与【流年排盘】，<span className="text-amber-300 underline font-semibold">自古均严格采用「传统虚岁」</span>（出生当年即算1虚岁，每逢新春立春长1岁）。
            </p>
            <p>
              2. <strong className="text-amber-200">以您的生辰为例（{birthYear}年{birthMonth}月{birthDay}日出生）：</strong>
            </p>
            <div className="p-3 bg-[#131720]/80 rounded-xl border border-white/[0.06] font-mono text-[11px] sm:text-xs text-slate-200 space-y-1">
              <div>• <span className="text-amber-300">传统虚岁：</span>{selectedYear}年 − {birthYear}年 + 1 = <span className="text-amber-300 font-bold">{selectedAge} 虚岁</span>（排盘大限与流年对应此数字）。</div>
              <div>• <span className="text-emerald-300">公历实岁（周岁）：</span>在 {selectedYear} 年中，{birthMonth}月{birthDay}日生日前为 <span className="text-emerald-300 font-bold">{fullAgeBeforeBirthday} 周岁</span>，{birthMonth}月{birthDay}日生日后满 <span className="text-emerald-300 font-bold">{fullAgeAfterBirthday} 周岁</span>。因此该年实岁确为 {fullAgeBeforeBirthday}~{fullAgeAfterBirthday} 岁。</div>
            </div>
            <p className="text-slate-400 text-[11px]">
              系统已在所有流年与大限模块中同时标注 <span className="text-amber-300">虚岁</span> 与 <span className="text-emerald-300">实岁</span>，方便您对照现代公历与传统命理大限。
            </p>
          </div>
        </div>
      )}

      {/* Age & Decade Timeline Scrubber */}
      <div className="bg-[#131720]/90 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
            生命运势时间轴推演器（拖动滑块或点击十岁大运区间）
          </span>
          <span className="text-xs text-amber-300 font-medium">
            当前大限：{currentDecadePalace.decadeStartAge} - {currentDecadePalace.decadeEndAge} 虚岁（{currentDecadePalace.name}）
          </span>
        </div>

        {/* Decade Limits Fast Selector */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {chart.palaces.map((p, idx) => {
            const isCurrent = selectedAge >= p.decadeStartAge && selectedAge <= p.decadeEndAge;
            const decStartReal = Math.max(0, p.decadeStartAge - 2);
            const decEndReal = Math.max(0, p.decadeEndAge - 1);
            return (
              <button
                key={idx}
                onClick={() => setSelectedAge(p.decadeStartAge + 2)}
                className={`p-2.5 rounded-xl border text-left transition duration-150 ${
                  isCurrent
                    ? "bg-amber-500/15 border-amber-500/40 text-amber-200 shadow-sm"
                    : "bg-[#191D26]/70 border-white/[0.06] text-slate-300 hover:bg-[#222733] hover:border-white/[0.12]"
                }`}
              >
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold font-serif">{p.name}</span>
                  <span className="font-mono text-[10px] text-slate-400">{p.stem}{p.branch}</span>
                </div>
                <div className="text-xs font-mono font-bold mt-1 text-amber-300">
                  {p.decadeStartAge}-{p.decadeEndAge}虚岁
                </div>
                <div className="text-[10px] text-slate-400 font-mono">
                  实约{decStartReal}-{decEndReal}岁
                </div>
              </button>
            );
          })}
        </div>

        {/* Age Slider */}
        <div className="space-y-2 pt-2">
          <input
            type="range"
            id="age-range-slider"
            min={1}
            max={88}
            value={selectedAge}
            onChange={(e) => setSelectedAge(Number(e.target.value))}
            className="w-full h-2 bg-[#191D26] rounded-lg appearance-none cursor-pointer accent-amber-500"
          />
          <div className="flex justify-between text-[10px] text-slate-500 font-mono">
            <span>1虚岁 (幼年)</span>
            <span>20虚岁 (学业开拓)</span>
            <span>35虚岁 (事业黄金期)</span>
            <span>50虚岁 (知天命之年)</span>
            <span>65虚岁 (晚年安泰)</span>
            <span>88虚岁</span>
          </div>
        </div>
      </div>

      {/* Main Analysis Grid: Decade Limit vs Annual Limit */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Ten-Year Decade Limit Analysis */}
        <div className="bg-[#131720]/90 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-300 font-serif font-bold text-sm">
                限
              </div>
              <div>
                <h3 className="text-base font-serif font-bold text-white tracking-tight">
                  十年大限【{currentDecadePalace.name}】（{currentDecadePalace.decadeStartAge}-{currentDecadePalace.decadeEndAge}虚岁）
                </h3>
                <p className="text-xs text-slate-400 font-mono">
                  大限干支：{currentDecadePalace.stem}{currentDecadePalace.branch}宫 · 约合实岁 {Math.max(0, currentDecadePalace.decadeStartAge - 2)}-{Math.max(0, currentDecadePalace.decadeEndAge - 1)} 岁
                </p>
              </div>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-xs font-medium">
              十年大运
            </span>
          </div>

          {/* Decade Si Hua Grid */}
          <div className="space-y-1.5">
            <span className="text-xs font-medium text-slate-400">大限四化引动（{currentDecadePalace.stem}干）：</span>
            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <span className="text-[10px] text-emerald-400 block font-medium">化禄（财机）</span>
                <span className="font-bold text-white mt-0.5 block">{decadeSiHua.lu}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20">
                <span className="text-[10px] text-rose-400 block font-medium">化权（权柄）</span>
                <span className="font-bold text-white mt-0.5 block">{decadeSiHua.quan}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-sky-500/10 border border-sky-500/20">
                <span className="text-[10px] text-sky-400 block font-medium">化科（名声）</span>
                <span className="font-bold text-white mt-0.5 block">{decadeSiHua.ke}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <span className="text-[10px] text-amber-400 block font-medium">化忌（执念/险）</span>
                <span className="font-bold text-white mt-0.5 block">{decadeSiHua.ji}</span>
              </div>
            </div>
          </div>

          {/* Decade Strategy Guidance */}
          <div className="p-3.5 bg-[#191D26]/70 rounded-xl border border-white/[0.06] space-y-2 text-xs leading-relaxed text-slate-300">
            <div className="font-serif font-bold text-amber-300 flex items-center space-x-1.5">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>倪师天纪·十年大限战略研判</span>
            </div>
            <p>
              此十年行运至【{currentDecadePalace.name}】，受【{decadeSiHua.lu}化禄】与【{decadeSiHua.quan}化权】加持，主事业版图迎来升级扩容之契机。
            </p>
            <p className="text-amber-300/90 border-t border-white/[0.06] pt-1.5">
              【防守核心】：严防【{decadeSiHua.ji}化忌】所对应之领域（合约细节、文书担保或合伙分账），不可因为盲目自信而轻敌。
            </p>
          </div>
        </div>

        {/* Current Year Annual Limit Analysis */}
        <div className="bg-[#131720]/90 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-300 font-serif font-bold text-sm">
                年
              </div>
              <div>
                <h3 className="text-base font-serif font-bold text-white tracking-tight">
                  {selectedYear}【{annualStem}{annualBranch}年】流年推演（{selectedAge}虚岁 · 实岁{fullAgeBeforeBirthday}~{fullAgeAfterBirthday}岁）
                </h3>
                <p className="text-xs text-slate-400 font-mono">
                  流年命宫落【{annualBranch}】宫 · 当年执行战术
                </p>
              </div>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 text-xs font-medium">
              流年应事
            </span>
          </div>

          {/* Annual Si Hua Grid */}
          <div className="space-y-1.5">
            <span className="text-xs font-medium text-slate-400">流年四化引动（{annualStem}干）：</span>
            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <span className="text-[10px] text-emerald-400 block font-medium">流年禄</span>
                <span className="font-bold text-white mt-0.5 block">{annualSiHua.lu}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20">
                <span className="text-[10px] text-rose-400 block font-medium">流年权</span>
                <span className="font-bold text-white mt-0.5 block">{annualSiHua.quan}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-sky-500/10 border border-sky-500/20">
                <span className="text-[10px] text-sky-400 block font-medium">流年科</span>
                <span className="font-bold text-white mt-0.5 block">{annualSiHua.ke}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <span className="text-[10px] text-amber-400 block font-medium">流年忌</span>
                <span className="font-bold text-white mt-0.5 block">{annualSiHua.ji}</span>
              </div>
            </div>
          </div>

          {/* Annual Tactical Advice */}
          <div className="p-3.5 bg-[#191D26]/70 rounded-xl border border-white/[0.06] space-y-2 text-xs leading-relaxed text-slate-300">
            <div className="font-serif font-bold text-amber-300 flex items-center space-x-1.5">
              <Zap className="w-3.5 h-3.5" />
              <span>以果决行·流年即时战术指令</span>
            </div>
            <p>
              今年应事重心在【{annualPalace.name}】。以【{annualSiHua.quan}化权】破局，行事应果决干脆，不拖泥带水。
            </p>
            <p className="text-rose-300/90 border-t border-white/[0.06] pt-1.5">
              【流年避凶】：凡见【{annualSiHua.ji}化忌】冲照，宜在农历立春与生日前后主动进行体检洁牙或调整阳宅西北乾位以泄化煞气。
            </p>
          </div>
        </div>
      </div>

      {/* Tian Ji Strategic Timing Matrix */}
      <div className="bg-[#131720]/90 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
          <div className="flex items-center space-x-2">
            <Compass className="w-4 h-4 text-amber-400" />
            <h3 className="text-base font-serif font-bold text-white tracking-tight">
              天纪进退决策法则（以果决行·行动矩阵）
            </h3>
          </div>
          <span className="text-xs text-slate-400">
            知其果而后定其行，顺势而为
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl space-y-2">
            <div className="flex items-center space-x-2 text-emerald-400 text-xs font-serif font-bold">
              <TrendingUp className="w-4 h-4" />
              <span>大举进攻期（顺水推舟）</span>
            </div>
            <p className="text-xs text-slate-300/90 leading-relaxed">
              当大限逢化禄与化权同度，且流年无煞星交加。宜果断创业、购房置业、融资拓张，借天时之风破万里浪。
            </p>
          </div>

          <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl space-y-2">
            <div className="flex items-center space-x-2 text-amber-400 text-xs font-serif font-bold">
              <ShieldAlert className="w-4 h-4" />
              <span>静修沉潜期（韬光养晦）</span>
            </div>
            <p className="text-xs text-slate-300/90 leading-relaxed">
              当流年逢化忌坐守且受羊陀夹击，切忌盲目大额投资或借贷作保。宜深造考证、修心养性、调和身体。
            </p>
          </div>

          <div className="p-4 bg-sky-500/10 border border-sky-500/20 rounded-xl space-y-2">
            <div className="flex items-center space-x-2 text-sky-400 text-xs font-serif font-bold">
              <Award className="w-4 h-4" />
              <span>声名转化期（以德配位）</span>
            </div>
            <p className="text-xs text-slate-300/90 leading-relaxed">
              当化科星主事，注重个人品牌塑造、知识沉淀与学术发表。积善之家必有余庆，广修阴德以迎后福。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

