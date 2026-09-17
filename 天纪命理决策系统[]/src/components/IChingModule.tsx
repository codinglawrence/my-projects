import React, { useState, useMemo } from "react";
import { NatalChart, HexagramData, HeavenlyStem, EarthlyBranch } from "../types/tianji";
import {
  ALL_64_HEXAGRAMS_BRIEF,
  calculateTianjiNatalIChing,
  TRIGRAM_SYMBOLS,
  TRIGRAM_ELEMENTS,
} from "../utils/ichingEngine";
import { RENJIAN_DAO_64_DATABASE, getRenjianDaoDetail } from "../utils/renjianDaoData";
import {
  BookOpen,
  Sparkles,
  Compass,
  ShieldCheck,
  Search,
  ChevronRight,
  HelpCircle,
  Clock,
  Layers,
  Award,
  ScrollText,
  AlertTriangle,
  Lightbulb,
} from "lucide-react";

interface IChingModuleProps {
  chart: NatalChart;
  onOpenReport: () => void;
}

export const IChingModule: React.FC<IChingModuleProps> = ({ chart, onOpenReport }) => {
  // 解析八字四柱干支
  const yearStem = chart.lunarDate.stemBranchYear.slice(0, 1) as HeavenlyStem;
  const yearBranch = chart.lunarDate.stemBranchYear.slice(1, 2) as EarthlyBranch;
  const monthStem = chart.lunarDate.stemBranchMonth.slice(0, 1) as HeavenlyStem;
  const monthBranch = chart.lunarDate.stemBranchMonth.slice(1, 2) as EarthlyBranch;
  const dayStem = chart.lunarDate.stemBranchDay.slice(0, 1) as HeavenlyStem;
  const dayBranch = chart.lunarDate.stemBranchDay.slice(1, 2) as EarthlyBranch;
  const hourStem = chart.lunarDate.stemBranchHour.slice(0, 1) as HeavenlyStem;
  const hourBranch = chart.hourBranch;

  // 使用《天机道》第44~60页正统河洛数理与八卦相荡算法
  const {
    numerology,
    preNatalDetail,
    postNatalDetail,
    renjianDaoPre,
    renjianDaoPost,
  } = useMemo(() => {
    return calculateTianjiNatalIChing(
      yearStem,
      yearBranch,
      monthStem,
      monthBranch,
      dayStem,
      dayBranch,
      hourStem,
      hourBranch,
      chart.gender,
      chart.lunarDate.month
    );
  }, [
    yearStem,
    yearBranch,
    monthStem,
    monthBranch,
    dayStem,
    dayBranch,
    hourStem,
    hourBranch,
    chart.gender,
    chart.lunarDate.month,
  ]);

  const [activeSubTab, setActiveSubTab] = useState<"natal_hexagram" | "renjian_dao" | "all_hexagrams">("natal_hexagram");
  const [selectedHexagramName, setSelectedHexagramName] = useState<string>(numerology.preNatalHexagram);
  const [searchTerm, setSearchTerm] = useState("");
  const [dilemmaCategory, setDilemmaCategory] = useState<"action" | "business" | "relationship" | "health">("action");

  // 选中的《人间道》详细卦象
  const currentRenjianDetail = useMemo(() => {
    return getRenjianDaoDetail(selectedHexagramName) || renjianDaoPre || RENJIAN_DAO_64_DATABASE["乾为天"];
  }, [selectedHexagramName, renjianDaoPre]);

  const filteredHexagrams = ALL_64_HEXAGRAMS_BRIEF.filter(
    (h) =>
      h.name.includes(searchTerm) ||
      h.pinyin.toLowerCase().includes(searchTerm.toLowerCase()) ||
      h.tianjiContext.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-[#131720]/90 border border-white/[0.08] rounded-2xl p-5 sm:p-6 shadow-sm backdrop-blur-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 text-xs font-medium">
                《天机道》易经推命 · 《人间道》以果决行
              </span>
              <h2 className="text-xl font-serif font-bold text-white tracking-tight">
                四柱易经命卦数理与无字天书经世决策
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-300/90 leading-relaxed">
              《天纪》精髓：君子静则观象以悟其辞，动则观变以玩其占。以洛书河图定四柱命卦，洞察动爻大运，以果决行。
            </p>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={onOpenReport}
              className="px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 active:scale-[0.98] text-white rounded-xl text-xs font-medium shadow-sm border border-amber-400/30 flex items-center justify-center space-x-1.5 transition duration-150"
            >
              <Sparkles className="w-4 h-4 text-amber-200" />
              <span>生成天纪全维决策白皮书</span>
            </button>
          </div>
        </div>

        {/* Sub Navigation */}
        <div className="flex flex-wrap gap-2 mt-6 border-b border-white/[0.06] pb-3">
          <button
            onClick={() => setActiveSubTab("natal_hexagram")}
            className={`px-3.5 py-2 rounded-xl text-xs font-medium transition duration-150 flex items-center space-x-2 ${
              activeSubTab === "natal_hexagram"
                ? "bg-white/[0.1] text-amber-300 border border-amber-400/30 font-semibold shadow-sm"
                : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]"
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>四柱先后天命卦与大运（天机道）</span>
          </button>
          <button
            onClick={() => setActiveSubTab("renjian_dao")}
            className={`px-3.5 py-2 rounded-xl text-xs font-medium transition duration-150 flex items-center space-x-2 ${
              activeSubTab === "renjian_dao"
                ? "bg-white/[0.1] text-amber-300 border border-amber-400/30 font-semibold shadow-sm"
                : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]"
            }`}
          >
            <ScrollText className="w-3.5 h-3.5" />
            <span>六十四卦无字天书图解（人间道）</span>
          </button>
          <button
            onClick={() => setActiveSubTab("all_hexagrams")}
            className={`px-3.5 py-2 rounded-xl text-xs font-medium transition duration-150 flex items-center space-x-2 ${
              activeSubTab === "all_hexagrams"
                ? "bg-white/[0.1] text-amber-300 border border-amber-400/30 font-semibold shadow-sm"
                : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>六十四卦以果决行索引</span>
          </button>
        </div>
      </div>

      {/* SUB TAB 1: NATAL HEXAGRAM & NUMEROLOGY */}
      {activeSubTab === "natal_hexagram" && (
        <div className="space-y-6">
          {/* 四柱洛书河图数理展示卡 */}
          <div className="bg-[#131720]/90 border border-white/[0.08] rounded-2xl p-5 shadow-sm space-y-4 backdrop-blur-xl">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
              <div className="flex items-center space-x-2">
                <Layers className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-serif font-bold text-white">
                  四柱八字取数与天地数相荡算法（《天机道》真传数理）
                </h3>
              </div>
              <span className="text-xs text-amber-400/90 font-mono">
                {chart.yinYangGender} · {chart.name}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="bg-[#141822] p-3.5 rounded-xl border border-white/[0.06] space-y-1">
                <span className="text-slate-400 text-[11px] block">年柱 {chart.lunarDate.stemBranchYear}</span>
                <p className="text-slate-200 font-mono">天干 {yearStem}：{numerology.yearStemNum} (洛书)</p>
                <p className="text-slate-400 font-mono text-[11px]">地支 {yearBranch}：{numerology.yearBranchNum.odd}/{numerology.yearBranchNum.even} (河图)</p>
              </div>
              <div className="bg-[#141822] p-3.5 rounded-xl border border-white/[0.06] space-y-1">
                <span className="text-slate-400 text-[11px] block">月柱 {chart.lunarDate.stemBranchMonth}</span>
                <p className="text-slate-200 font-mono">天干 {monthStem}：{numerology.monthStemNum} (洛书)</p>
                <p className="text-slate-400 font-mono text-[11px]">地支 {monthBranch}：{numerology.monthBranchNum.odd}/{numerology.monthBranchNum.even} (河图)</p>
              </div>
              <div className="bg-[#141822] p-3.5 rounded-xl border border-white/[0.06] space-y-1">
                <span className="text-slate-400 text-[11px] block">日柱 {chart.lunarDate.stemBranchDay}</span>
                <p className="text-slate-200 font-mono">天干 {dayStem}：{numerology.dayStemNum} (洛书)</p>
                <p className="text-slate-400 font-mono text-[11px]">地支 {dayBranch}：{numerology.dayBranchNum.odd}/{numerology.dayBranchNum.even} (河图)</p>
              </div>
              <div className="bg-[#141822] p-3.5 rounded-xl border border-white/[0.06] space-y-1">
                <span className="text-slate-400 text-[11px] block">时柱 {chart.lunarDate.stemBranchHour}</span>
                <p className="text-slate-200 font-mono">天干 {hourStem}：{numerology.hourStemNum} (洛书)</p>
                <p className="text-slate-400 font-mono text-[11px]">地支 {hourBranch}：{numerology.hourBranchNum.odd}/{numerology.hourBranchNum.even} (河图)</p>
              </div>
            </div>

            <div className="bg-amber-500/10 border border-amber-500/20 p-3.5 rounded-xl text-xs text-amber-200/90 leading-relaxed flex flex-wrap gap-y-1.5 gap-x-6 items-center">
              <div>
                <span className="text-slate-400">天数（单数总和）：</span>
                <strong className="text-amber-300 font-mono text-sm">{numerology.oddSum}</strong>
                <span className="text-slate-400 text-[11px] ml-1.5">(除25余数 {numerology.tianshuRemainder} → 纳【{numerology.upperTrigramPre}卦】)</span>
              </div>
              <div>
                <span className="text-slate-400">地数（双数总和）：</span>
                <strong className="text-amber-300 font-mono text-sm">{numerology.evenSum}</strong>
                <span className="text-slate-400 text-[11px] ml-1.5">(除30余数 {numerology.dishuRemainder} → 纳【{numerology.lowerTrigramPre}卦】)</span>
              </div>
              <div>
                <span className="text-slate-400">元堂动爻：</span>
                <strong className="text-emerald-400 font-mono text-sm">第 {numerology.yuanTangYao} 爻</strong>
                <span className="text-slate-400 text-[11px] ml-1.5">({hourBranch}时生人)</span>
              </div>
            </div>
          </div>

          {/* 先天卦与后天卦对比面板 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 先天元神卦 */}
            <div className="bg-[#131720]/90 border border-white/[0.08] rounded-2xl p-5 shadow-sm space-y-4 backdrop-blur-xl">
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                <div className="flex items-center space-x-3">
                  <div className="text-3xl font-serif text-amber-300">
                    {numerology.preNatalSymbol}
                  </div>
                  <div>
                    <span className="text-[10px] text-amber-400 font-semibold tracking-wider block">
                      先天元神命卦 (管前 {numerology.preNatalYears} 年)
                    </span>
                    <h3 className="text-lg font-serif font-bold text-white">
                      {numerology.preNatalHexagram}
                    </h3>
                  </div>
                </div>
                <span className="text-xs text-slate-400 font-mono">
                  上{numerology.upperTrigramPre} · 下{numerology.lowerTrigramPre}
                </span>
              </div>

              <div className="space-y-2 text-xs leading-relaxed text-slate-300">
                <p className="font-serif text-amber-200/90 font-medium">
                  【元堂动爻】：第 {numerology.yuanTangYao} 爻（命宫之位）
                </p>
                <div className="p-3.5 bg-[#141822] rounded-xl border border-white/[0.06] text-xs text-slate-200 space-y-1.5">
                  <span className="text-amber-400 font-serif font-bold block">《天纪》先天命理精义：</span>
                  <p className="text-slate-300/90 leading-relaxed">{preNatalDetail?.tianjiContext}</p>
                  <p className="text-emerald-300/90 pt-1 font-serif">【以果决行】：{preNatalDetail?.actionGuidance}</p>
                </div>
              </div>
            </div>

            {/* 后天更革卦 */}
            <div className="bg-[#131720]/90 border border-white/[0.08] rounded-2xl p-5 shadow-sm space-y-4 backdrop-blur-xl">
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                <div className="flex items-center space-x-3">
                  <div className="text-3xl font-serif text-emerald-400">
                    {numerology.postNatalSymbol}
                  </div>
                  <div>
                    <span className="text-[10px] text-emerald-400 font-semibold tracking-wider block">
                      后天转革运卦 (管后 {numerology.postNatalYears} 年)
                    </span>
                    <h3 className="text-lg font-serif font-bold text-white">
                      {numerology.postNatalHexagram}
                    </h3>
                  </div>
                </div>
                <span className="text-xs text-slate-400 font-mono">
                  天旋地转 · 内外更革
                </span>
              </div>

              <div className="space-y-2 text-xs leading-relaxed text-slate-300">
                <p className="font-serif text-emerald-200/90 font-medium">
                  【转革枢机】：元堂爻变阴阳，内外出入
                </p>
                <div className="p-3.5 bg-[#141822] rounded-xl border border-white/[0.06] text-xs text-slate-200 space-y-1.5">
                  <span className="text-emerald-400 font-serif font-bold block">《天纪》后天造化精义：</span>
                  <p className="text-slate-300/90 leading-relaxed">{postNatalDetail?.tianjiContext}</p>
                  <p className="text-amber-300/90 pt-1 font-serif">【以果决行】：{postNatalDetail?.actionGuidance}</p>
                </div>
              </div>
            </div>
          </div>

          {/* 易经大运时间轴 */}
          <div className="bg-[#131720]/90 border border-white/[0.08] rounded-2xl p-5 shadow-sm space-y-4 backdrop-blur-xl">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-serif font-bold text-white">
                  易经推命大运推演轴（阳爻管九年 · 阴爻管六年）
                </h3>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                先天卦管 {numerology.preNatalYears} 年 + 后天卦管 {numerology.postNatalYears} 年
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {numerology.decadeTimeline.map((item, idx) => (
                <div
                  key={idx}
                  className={`p-3.5 rounded-xl border text-xs space-y-1.5 ${
                    item.stage === "先天卦大运"
                      ? "bg-[#141822] border-amber-500/20 text-amber-200/90"
                      : "bg-[#141822] border-emerald-500/20 text-emerald-200/90"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white font-mono">{item.ageRange}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                        item.stage === "先天卦大运"
                          ? "bg-amber-500/10 text-amber-300 border border-amber-500/20"
                          : "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                      }`}
                    >
                      {item.stage}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400 text-[11px] pt-1 border-t border-white/[0.04]">
                    <span>卦象：{item.hexagram}</span>
                    <span>
                      第 {item.yaoIndex} 爻 ({item.yaoNature}爻管 {item.years} 年)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUB TAB 2: RENJIAN DAO - 无字天书图象解与逐爻经世 */}
      {activeSubTab === "renjian_dao" && (
        <div className="space-y-6">
          {/* 卦象选择器 */}
          <div className="flex flex-wrap gap-2 p-3.5 bg-[#131720]/80 border border-white/[0.06] rounded-2xl">
            <span className="text-xs text-slate-400 flex items-center pr-2 font-serif">快速选择卦象：</span>
            {ALL_64_HEXAGRAMS_BRIEF.map((h) => (
              <button
                key={h.name}
                onClick={() => setSelectedHexagramName(h.name)}
                className={`px-3 py-1.5 rounded-xl text-xs font-serif transition duration-150 ${
                  selectedHexagramName === h.name
                    ? "bg-gradient-to-r from-amber-600 to-amber-700 text-white font-semibold shadow-sm border border-amber-400/40"
                    : "bg-[#191D26] text-slate-300 hover:text-white hover:bg-[#222733] border border-white/[0.06]"
                }`}
              >
                {h.name}
              </button>
            ))}
          </div>

          {/* 无字天书图象解卡片 */}
          <div className="bg-[#131720]/90 border border-white/[0.08] rounded-2xl p-5 sm:p-6 shadow-sm space-y-5 backdrop-blur-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.06] pb-4">
              <div className="flex items-center space-x-3.5">
                <div className="text-4xl font-serif text-amber-300">
                  {currentRenjianDetail.symbol}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 font-medium">
                      第 {currentRenjianDetail.number} 卦 · {currentRenjianDetail.lessonTitle}
                    </span>
                  </div>
                  <h3 className="text-xl font-serif font-bold text-white tracking-tight mt-1.5">
                    {currentRenjianDetail.name}（{currentRenjianDetail.pinyin}）
                  </h3>
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs text-slate-400 block font-serif">历史断验出处</span>
                <span className="text-xs text-amber-200/90 font-mono">
                  {currentRenjianDetail.historicalContext}
                </span>
              </div>
            </div>

            {/* 图中无字天书景物与象解 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="bg-[#141822] p-4 rounded-2xl border border-white/[0.06] space-y-3">
                <div className="flex items-center space-x-2 text-amber-400 text-xs font-serif font-bold">
                  <ScrollText className="w-4 h-4" />
                  <span>【图中无字天书景物】</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {currentRenjianDetail.imageObjects.map((obj, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 bg-[#191D26] text-slate-200 rounded-xl text-xs border border-white/[0.06]"
                    >
                      {obj}
                    </span>
                  ))}
                </div>
                <div className="pt-2 text-xs text-slate-300/90 leading-relaxed font-serif">
                  <span className="text-amber-400 font-bold block mb-1">人间道核心大义：</span>
                  {currentRenjianDetail.corePhilosophy}
                </div>
              </div>

              <div className="bg-[#141822] p-4 rounded-2xl border border-white/[0.06] space-y-3">
                <div className="flex items-center space-x-2 text-amber-400 text-xs font-serif font-bold">
                  <Lightbulb className="w-4 h-4" />
                  <span>【卦图象解·玄机破译】</span>
                </div>
                <ul className="space-y-1.5 text-xs text-slate-300/90">
                  {currentRenjianDetail.baguaTuXiangJie.map((line, i) => (
                    <li key={i} className="flex items-start space-x-2">
                      <span className="text-amber-500 font-bold">•</span>
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* 逐爻经世智慧与决策进退法则 */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center space-x-2 text-white text-sm font-serif font-bold">
                <Award className="w-4 h-4 text-emerald-400" />
                <span>初爻至上爻 · 人间道逐爻处世与进退法则</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {currentRenjianDetail.yaos.map((y, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 bg-[#141822] rounded-xl border border-white/[0.06] hover:border-white/[0.12] space-y-2 text-xs transition duration-150"
                  >
                    <div className="flex items-center justify-between border-b border-white/[0.06] pb-1.5">
                      <span className="font-serif font-bold text-amber-300 text-sm">
                        {y.yao}：{y.text}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">{y.xiang}</span>
                    </div>
                    <p className="text-slate-300/90 leading-relaxed">{y.explanation}</p>
                    <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-[11px] text-emerald-300 font-medium leading-relaxed">
                      {y.actionRule}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB TAB 3: ALL 64 HEXAGRAMS MATRIX */}
      {activeSubTab === "all_hexagrams" && (
        <div className="space-y-6">
          {/* Search bar */}
          <div className="bg-[#131720]/90 border border-white/[0.08] rounded-2xl p-4 flex items-center space-x-3 shadow-sm backdrop-blur-xl">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="搜索六十四卦名称、拼音或经世要义（如：泰、否、既济、无妄、大壮...）"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent border-none text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none flex-1"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredHexagrams.map((h) => (
              <div
                key={h.number}
                onClick={() => {
                  setSelectedHexagramName(h.name);
                  setActiveSubTab("renjian_dao");
                }}
                className="bg-[#131720]/90 hover:bg-[#191D26] border border-white/[0.08] hover:border-amber-500/40 rounded-2xl p-4 shadow-sm cursor-pointer transition duration-150 space-y-3 group backdrop-blur-xl"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <span className="text-2xl font-serif text-amber-300 group-hover:scale-105 transition duration-150">
                      {h.symbol}
                    </span>
                    <div>
                      <h4 className="text-sm font-serif font-bold text-white">
                        {h.name}
                      </h4>
                      <span className="text-[10px] text-slate-500 font-mono">
                        第 {h.number} 卦 · 上{h.upperTrigram}下{h.lowerTrigram}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-amber-400 transition" />
                </div>

                <p className="text-xs text-slate-300/90 line-clamp-2 leading-relaxed">
                  {h.tianjiContext}
                </p>

                <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-[11px]">
                  <span className="text-amber-400 font-serif">以果决行指引</span>
                  <span className="text-slate-500">点击查阅无字天书图解 →</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
