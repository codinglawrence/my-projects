import React, { useState } from "react";
import { NatalChart } from "../types/tianji";
import { generateFullFateAnalysis, FateDimensionAnalysis } from "../utils/fateAnalysisEngine";
import {
  User,
  Compass,
  Users,
  Briefcase,
  Coins,
  Heart,
  Activity,
  Award,
  Sparkles,
  ShieldAlert,
  ChevronRight,
  Info,
  CheckCircle2,
  FileText,
  Layers,
  ArrowUpRight,
} from "lucide-react";

interface FateAnalysisPanelProps {
  chart: NatalChart;
  onOpenReport: () => void;
}

type DimensionKey =
  | "all"
  | "personality"
  | "overallFate"
  | "socialAndNobles"
  | "career"
  | "wealth"
  | "marriageAndLove"
  | "health"
  | "strategyAndAction";

const DIMENSION_TABS: { key: DimensionKey; label: string; icon: any; color: string }[] = [
  { key: "personality", label: "心性性格", icon: User, color: "text-amber-400" },
  { key: "overallFate", label: "总体运势", icon: Compass, color: "text-sky-400" },
  { key: "socialAndNobles", label: "所遇之人·贵人", icon: Users, color: "text-emerald-400" },
  { key: "career", label: "事业职场", icon: Briefcase, color: "text-indigo-400" },
  { key: "wealth", label: "财帛资产", icon: Coins, color: "text-yellow-400" },
  { key: "marriageAndLove", label: "婚恋正缘", icon: Heart, color: "text-rose-400" },
  { key: "health", label: "健康调养", icon: Activity, color: "text-teal-400" },
  { key: "strategyAndAction", label: "破局运筹", icon: Award, color: "text-amber-300" },
  { key: "all", label: "全盘合卷", icon: Layers, color: "text-purple-400" },
];

export const FateAnalysisPanel: React.FC<FateAnalysisPanelProps> = ({ chart, onOpenReport }) => {
  const [activeTab, setActiveTab] = useState<DimensionKey>("personality");
  const analysis = generateFullFateAnalysis(chart);

  const getDimensionData = (key: DimensionKey): FateDimensionAnalysis | null => {
    if (key === "all") return null;
    return analysis.dimensions[key] || null;
  };

  const currentDim = getDimensionData(activeTab);

  return (
    <div className="bg-[#131720]/90 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-5 sm:p-6 shadow-sm space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/[0.06] pb-5">
        <div className="space-y-1.5">
          <div className="flex items-center space-x-2.5">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 text-xs font-medium flex items-center space-x-1">
              <Sparkles className="w-3.5 h-3.5 mr-1 text-amber-300" />
              天纪命学 · 全盘命运多维透视
            </span>
            <span className="text-xs text-slate-400 font-mono">
              【{chart.name} · {chart.yinYangGender} · {chart.bureau}】
            </span>
          </div>
          <h3 className="text-lg sm:text-xl font-serif font-bold text-white tracking-tight flex items-center space-x-2">
            <span>核心命格原型：</span>
            <span className="text-amber-300">{analysis.archetype}</span>
          </h3>
          <p className="text-xs sm:text-sm text-slate-300/90 max-w-3xl leading-relaxed">
            {analysis.archetypeDescription}
          </p>
        </div>

        {/* Action Button */}
        <div className="shrink-0 flex items-center space-x-3">
          <button
            onClick={onOpenReport}
            className="w-full md:w-auto px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 active:scale-[0.98] text-white rounded-xl text-xs font-medium shadow-sm border border-amber-400/30 flex items-center justify-center space-x-2 transition duration-150"
          >
            <FileText className="w-4 h-4 text-amber-200" />
            <span>导出全案决策白皮书</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Multi-Dimensional Quick Score Radar Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3">
        <div
          onClick={() => setActiveTab("personality")}
          className={`p-3.5 rounded-2xl border cursor-pointer transition duration-150 ${
            activeTab === "personality"
              ? "bg-amber-500/15 border-amber-500/40 shadow-sm ring-1 ring-amber-500/30"
              : "bg-[#191D26]/70 border-white/[0.06] hover:bg-[#222733] hover:border-white/[0.12]"
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>心性秉赋</span>
            <User className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="mt-1.5 flex items-baseline justify-between">
            <span className="text-xl font-bold font-mono text-white">{analysis.scores.personality}</span>
            <span className="text-[10px] text-amber-300 font-semibold">{analysis.dimensions.personality.scoreLabel}</span>
          </div>
          <div className="w-full bg-white/[0.08] h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-amber-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${analysis.scores.personality}%` }}
            />
          </div>
        </div>

        <div
          onClick={() => setActiveTab("career")}
          className={`p-3.5 rounded-2xl border cursor-pointer transition duration-150 ${
            activeTab === "career"
              ? "bg-indigo-500/15 border-indigo-500/40 shadow-sm ring-1 ring-indigo-500/30"
              : "bg-[#191D26]/70 border-white/[0.06] hover:bg-[#222733] hover:border-white/[0.12]"
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>事业权力</span>
            <Briefcase className="w-3.5 h-3.5 text-indigo-400" />
          </div>
          <div className="mt-1.5 flex items-baseline justify-between">
            <span className="text-xl font-bold font-mono text-white">{analysis.scores.career}</span>
            <span className="text-[10px] text-indigo-300 font-semibold">{analysis.dimensions.career.scoreLabel}</span>
          </div>
          <div className="w-full bg-white/[0.08] h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-indigo-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${analysis.scores.career}%` }}
            />
          </div>
        </div>

        <div
          onClick={() => setActiveTab("wealth")}
          className={`p-3.5 rounded-2xl border cursor-pointer transition duration-150 ${
            activeTab === "wealth"
              ? "bg-amber-500/15 border-amber-500/40 shadow-sm ring-1 ring-amber-500/30"
              : "bg-[#191D26]/70 border-white/[0.06] hover:bg-[#222733] hover:border-white/[0.12]"
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>财帛资粮</span>
            <Coins className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="mt-1.5 flex items-baseline justify-between">
            <span className="text-xl font-bold font-mono text-white">{analysis.scores.wealth}</span>
            <span className="text-[10px] text-amber-300 font-semibold">{analysis.dimensions.wealth.scoreLabel}</span>
          </div>
          <div className="w-full bg-white/[0.08] h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-amber-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${analysis.scores.wealth}%` }}
            />
          </div>
        </div>

        <div
          onClick={() => setActiveTab("socialAndNobles")}
          className={`p-3.5 rounded-2xl border cursor-pointer transition duration-150 ${
            activeTab === "socialAndNobles"
              ? "bg-emerald-500/15 border-emerald-500/40 shadow-sm ring-1 ring-emerald-500/30"
              : "bg-[#191D26]/70 border-white/[0.06] hover:bg-[#222733] hover:border-white/[0.12]"
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>贵人遇合</span>
            <Users className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="mt-1.5 flex items-baseline justify-between">
            <span className="text-xl font-bold font-mono text-white">{analysis.scores.nobles}</span>
            <span className="text-[10px] text-emerald-300 font-semibold">{analysis.dimensions.socialAndNobles.scoreLabel}</span>
          </div>
          <div className="w-full bg-white/[0.08] h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${analysis.scores.nobles}%` }}
            />
          </div>
        </div>

        <div
          onClick={() => setActiveTab("marriageAndLove")}
          className={`p-3.5 rounded-2xl border cursor-pointer transition duration-150 ${
            activeTab === "marriageAndLove"
              ? "bg-rose-500/15 border-rose-500/40 shadow-sm ring-1 ring-rose-500/30"
              : "bg-[#191D26]/70 border-white/[0.06] hover:bg-[#222733] hover:border-white/[0.12]"
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>婚恋正缘</span>
            <Heart className="w-3.5 h-3.5 text-rose-400" />
          </div>
          <div className="mt-1.5 flex items-baseline justify-between">
            <span className="text-xl font-bold font-mono text-white">{analysis.scores.love}</span>
            <span className="text-[10px] text-rose-300 font-semibold">{analysis.dimensions.marriageAndLove.scoreLabel}</span>
          </div>
          <div className="w-full bg-white/[0.08] h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-rose-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${analysis.scores.love}%` }}
            />
          </div>
        </div>

        <div
          onClick={() => setActiveTab("health")}
          className={`p-3.5 rounded-2xl border cursor-pointer transition duration-150 ${
            activeTab === "health"
              ? "bg-teal-500/15 border-teal-500/40 shadow-sm ring-1 ring-teal-500/30"
              : "bg-[#191D26]/70 border-white/[0.06] hover:bg-[#222733] hover:border-white/[0.12]"
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>身心健康</span>
            <Activity className="w-3.5 h-3.5 text-teal-400" />
          </div>
          <div className="mt-1.5 flex items-baseline justify-between">
            <span className="text-xl font-bold font-mono text-white">{analysis.scores.health}</span>
            <span className="text-[10px] text-teal-300 font-semibold">{analysis.dimensions.health.scoreLabel}</span>
          </div>
          <div className="w-full bg-white/[0.08] h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-teal-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${analysis.scores.health}%` }}
            />
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-1.5 sm:gap-2 p-1.5 bg-[#191D26] rounded-2xl border border-white/[0.06]">
        {DIMENSION_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-3 py-2 rounded-xl text-xs font-medium flex items-center space-x-1.5 transition duration-150 whitespace-nowrap ${
                isActive
                  ? "bg-white/[0.1] text-white border border-white/[0.1] shadow-sm font-semibold"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]"
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${tab.color}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Analysis Display Area */}
      {activeTab !== "all" && currentDim ? (
        <div className="space-y-5 animate-in fade-in duration-200">
          {/* Dimension Header Banner */}
          <div className="bg-[#191D26]/70 border border-white/[0.06] rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <h4 className="text-base sm:text-lg font-serif font-bold text-white tracking-tight">
                  {currentDim.title}
                </h4>
                <span className="text-xs text-slate-400">({currentDim.subtitle})</span>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {currentDim.tagList.map((tag, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-0.5 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/20 text-[11px] font-mono"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex items-center space-x-2 shrink-0 bg-[#131720] px-3.5 py-1.5 rounded-xl border border-white/[0.08]">
              <span className="text-xs text-slate-400">综合指数</span>
              <span className="text-lg font-bold text-amber-300 font-mono">{currentDim.score}</span>
              <span className="text-xs text-slate-300 font-medium">({currentDim.scoreLabel})</span>
            </div>
          </div>

          {/* Dimension Executive Summary */}
          <div className="p-4 bg-[#141822] rounded-2xl border border-white/[0.06] text-xs sm:text-sm text-slate-200 leading-relaxed font-sans">
            <p>{currentDim.summary}</p>
          </div>

          {/* Deep In-Depth Detail Sections */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {currentDim.details.map((item, dIdx) => (
              <div
                key={dIdx}
                className="bg-[#191D26]/70 border border-white/[0.06] rounded-2xl p-4 sm:p-5 space-y-2.5"
              >
                <h5 className="text-xs sm:text-sm font-serif font-bold text-amber-300 flex items-center space-x-1.5">
                  <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>{item.heading}</span>
                </h5>
                <p className="text-xs sm:text-sm text-slate-300/90 leading-relaxed whitespace-pre-line">
                  {item.content}
                </p>
              </div>
            ))}
          </div>

          {/* Tian Ji Rule & Action Guidance */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {/* Ni Haixia Core Axiom */}
            <div className="p-4 bg-amber-500/10 rounded-2xl border border-amber-500/20 space-y-1.5">
              <div className="flex items-center space-x-1.5 text-xs font-serif font-bold text-amber-300">
                <Info className="w-4 h-4 text-amber-400" />
                <span>倪师《天纪》命理真言</span>
              </div>
              <p className="text-xs text-slate-300/90 leading-relaxed font-serif italic">
                "{currentDim.tianjiRule}"
              </p>
            </div>

            {/* Actionable Strategy */}
            <div className="p-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 space-y-1.5">
              <div className="flex items-center space-x-1.5 text-xs font-serif font-bold text-emerald-300">
                <Award className="w-4 h-4 text-emerald-400" />
                <span>以果决行 · 破局决策</span>
              </div>
              <p className="text-xs text-slate-200 leading-relaxed">
                {currentDim.actionAdvice}
              </p>
            </div>
          </div>

          {/* Risk Warning Notice */}
          {currentDim.riskNotice && (
            <div className="p-3.5 bg-rose-500/10 rounded-2xl border border-rose-500/20 flex items-start space-x-2 text-xs text-rose-300">
              <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold mr-1">君子防线：</span>
                <span>{currentDim.riskNotice}</span>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Full Scroll Combined View */
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="p-4 sm:p-5 bg-[#141822] rounded-2xl border border-white/[0.06] space-y-3">
            <h4 className="text-base font-serif font-bold text-amber-300 flex items-center space-x-2">
              <FileText className="w-4 h-4 text-amber-400" />
              <span>全盘命理解构·总纲判词</span>
            </h4>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {analysis.executiveSummary}
            </p>
          </div>

          {/* Render All Major Dimensions in Stack */}
          {Object.values(analysis.dimensions).map((dim, idx) => (
            <div
              key={idx}
              className="bg-[#191D26]/70 border border-white/[0.06] rounded-2xl p-4 sm:p-5 space-y-3"
            >
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
                <div className="flex items-center space-x-2">
                  <span className="w-6 h-6 rounded-full bg-amber-500/15 text-amber-300 text-xs font-semibold flex items-center justify-center font-mono border border-amber-500/20">
                    0{idx + 1}
                  </span>
                  <h5 className="text-sm sm:text-base font-serif font-bold text-white">
                    {dim.title}
                  </h5>
                </div>
                <div className="flex items-center space-x-1.5 text-xs text-slate-400 font-mono">
                  <span>指数:</span>
                  <span className="text-amber-300 font-bold">{dim.score}</span>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-slate-300/90 leading-relaxed">
                {dim.summary}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                {dim.details.map((item, dIdx) => (
                  <div key={dIdx} className="p-3 bg-[#131720]/80 rounded-xl border border-white/[0.06] text-xs text-slate-300">
                    <span className="font-bold text-amber-300 block mb-1">【{item.heading}】</span>
                    <span className="whitespace-pre-line leading-relaxed">{item.content}</span>
                  </div>
                ))}
              </div>

              <div className="p-3 bg-[#131720]/80 rounded-xl border border-white/[0.06] text-xs text-slate-300 flex items-center justify-between">
                <span className="font-serif italic text-amber-300/90 text-[11px]">"{dim.tianjiRule}"</span>
                <span className="text-emerald-300 font-medium text-[11px] shrink-0 ml-2">以果决行：{dim.actionAdvice}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
