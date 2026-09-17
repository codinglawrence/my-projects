import React, { useState, useEffect } from "react";
import { NatalChart, HeavenlyStem, EarthlyBranch } from "../types/tianji";
import { getInitialYangZhaiLayout, diagnoseYangZhai } from "../utils/yangzhaiEngine";
import { calculateTianjiNatalIChing } from "../utils/ichingEngine";
import { getRenjianDaoDetail } from "../utils/renjianDaoData";
import { generateFullFateAnalysis } from "../utils/fateAnalysisEngine";
import { X, Sparkles, Send, Printer, Copy, Check, BookOpen, ShieldAlert, Compass, Bot, ScrollText } from "lucide-react";

interface StrategicReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  chart: NatalChart;
}

export const StrategicReportModal: React.FC<StrategicReportModalProps> = ({
  isOpen,
  onClose,
  chart,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<"report" | "chat">("report");
  const [reportContent, setReportContent] = useState<string>("");
  const [isLoadingReport, setIsLoadingReport] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  // Chatbot State
  const [question, setQuestion] = useState<string>("");
  const [chatMessages, setChatMessages] = useState<
    { role: "user" | "assistant"; text: string; time: string }[]
  >([
    {
      role: "assistant",
      text: `您好！我是您的天纪智能决策导师。倪师有云：“以果决行，知其果而后定其行。”\n\n已为您同步紫微斗数命盘、四柱洛书易经命卦（含元堂动爻）与阳宅地脉道配置。您在当下的事业开拓、阳宅空间化解、流年四化运势或重大进退抉择上有何疑问？请随时提问。`,
      time: "刚刚",
    },
  ]);
  const [isAsking, setIsAsking] = useState<boolean>(false);

  const yearStem = chart.lunarDate.stemBranchYear.slice(0, 1) as HeavenlyStem;
  const yearBranch = chart.lunarDate.stemBranchYear.slice(1, 2) as EarthlyBranch;
  const monthStem = chart.lunarDate.stemBranchMonth.slice(0, 1) as HeavenlyStem;
  const monthBranch = chart.lunarDate.stemBranchMonth.slice(1, 2) as EarthlyBranch;
  const dayStem = chart.lunarDate.stemBranchDay.slice(0, 1) as HeavenlyStem;
  const dayBranch = chart.lunarDate.stemBranchDay.slice(1, 2) as EarthlyBranch;
  const hourStem = chart.lunarDate.stemBranchHour.slice(0, 1) as HeavenlyStem;
  const hourBranch = chart.hourBranch;

  const tianjiIching = calculateTianjiNatalIChing(
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

  // Generate Report automatically when opened
  useEffect(() => {
    if (isOpen && !reportContent) {
      generateFullReport();
    }
  }, [isOpen]);

  const generateFullReport = async () => {
    setIsLoadingReport(true);
    const yangZhaiData = diagnoseYangZhai(getInitialYangZhaiLayout());

    try {
      const response = await fetch("/api/tianji/deep-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chartSummary: {
            name: chart.name,
            gender: chart.gender,
            solarDate: chart.solarDate,
            bureau: chart.bureau,
            lifeBranch: chart.lifePalaceBranch,
            bodyBranch: chart.bodyPalaceBranch,
            patterns: chart.patterns,
            annualSiHua: chart.annualSiHua,
          },
          yangZhaiSummary: yangZhaiData.map((d) => ({
            title: d.title,
            status: d.status,
            hexagram: d.hexagramName,
          })),
          hexagramSummary: {
            preNatal: tianjiIching.numerology.preNatalHexagram,
            postNatal: tianjiIching.numerology.postNatalHexagram,
            yuanTangYao: tianjiIching.numerology.yuanTangYao,
            preYears: tianjiIching.numerology.preNatalYears,
            postYears: tianjiIching.numerology.postNatalYears,
          },
          userFocus: "综合全方位推演与以果决行战略",
        }),
      });

      const data = await response.json();
      if (data.report) {
        setReportContent(data.report);
      } else {
        throw new Error("No report returned");
      }
    } catch (e) {
      // Fallback offline comprehensive report
      const fate = generateFullFateAnalysis(chart);
      const offlineDoc = `# 【天纪·全维度三才命理决策推演白皮书】
**命主**：${chart.name} (${chart.yinYangGender}) | **五行局**：${chart.bureau}
**四柱八字**：${chart.lunarDate.stemBranchYear}年 ${chart.lunarDate.stemBranchMonth}月 ${chart.lunarDate.stemBranchDay}日 ${chart.lunarDate.stemBranchHour}时
**核心格局**：${chart.patterns[0]?.name || "中和守正格"}
**命格核心原型**：${fate.archetype}

---

## 摘要导言：全盘总纲解构
${fate.executiveSummary}

---

## 一、先天命盘与心性特质（心性与动机）
- **核心心性**：${fate.dimensions.personality.summary}
- **行事风格**：${fate.dimensions.personality.details[0]?.content || ""}
- **情志与潜意识**：${fate.dimensions.personality.details[1]?.content || ""}
- **优势与盲区**：${fate.dimensions.personality.details[2]?.content || ""}
- **倪师天纪真言**：“${fate.dimensions.personality.tianjiRule}”

---

## 二、人际圈层与会遇到的人（贵人、同僚与小人防范）
- **人脉概况**：${fate.dimensions.socialAndNobles.summary}
- **核心贵人画像**：${fate.dimensions.socialAndNobles.details[0]?.content || ""}
- **需防范之人**：${fate.dimensions.socialAndNobles.details[1]?.content || ""}
- **知人相人秘法**：${fate.dimensions.socialAndNobles.details[2]?.content || ""}
- **以果决行建议**：${fate.dimensions.socialAndNobles.actionAdvice}

---

## 三、事业格局与权力功名（官禄与赛道）
- **职场定位**：${fate.dimensions.career.summary}
- **天命行业赛道**：${fate.dimensions.career.details[0]?.content || ""}
- **权力进阶路径**：${fate.dimensions.career.details[1]?.content || ""}
- **以果决行心法**：${fate.dimensions.career.actionAdvice}

---

## 四、财帛资粮与财富资产（正财、偏财与不动产）
- **财富总论**：${fate.dimensions.wealth.summary}
- **进财通道**：${fate.dimensions.wealth.details[0]?.content || ""}
- **田宅守库**：${fate.dimensions.wealth.details[1]?.content || ""}
- **财富安全网**：${fate.dimensions.wealth.actionAdvice}

---

## 五、情感婚姻与正缘桃花（伴侣画像与相处）
- **婚恋总评**：${fate.dimensions.marriageAndLove.summary}
- **伴侣相貌与才干**：${fate.dimensions.marriageAndLove.details[0]?.content || ""}
- **婚恋黄金法则**：${fate.dimensions.marriageAndLove.details[1]?.content || ""}
- **家和万事兴**：${fate.dimensions.marriageAndLove.actionAdvice}

---

## 六、疾厄身心与五行养生（中医调理）
- **体质特征**：${fate.dimensions.health.summary}
- **脏腑易感排查**：${fate.dimensions.health.details[0]?.content || ""}
- **倪师医道起居**：${fate.dimensions.health.details[1]?.content || ""}

---

## 七、四柱洛书易经命卦与大运（天纪·数理）
- **天地数相荡**：天数奇数和【${tianjiIching.numerology.oddSum}】(余${tianjiIching.numerology.tianshuRemainder}纳${tianjiIching.numerology.upperTrigramPre})，地数偶数和【${tianjiIching.numerology.evenSum}】(余${tianjiIching.numerology.dishuRemainder}纳${tianjiIching.numerology.lowerTrigramPre})。
- **先天元神命卦**：【${tianjiIching.numerology.preNatalHexagram}】${tianjiIching.numerology.preNatalSymbol}（元堂动爻在第【${tianjiIching.numerology.yuanTangYao}】爻，总管前半生【${tianjiIching.numerology.preNatalYears}】年运程）。
- **后天转革运卦**：【${tianjiIching.numerology.postNatalHexagram}】${tianjiIching.numerology.postNatalSymbol}（总管后半生【${tianjiIching.numerology.postNatalYears}】年运程）。
- **易经经世大义**：${tianjiIching.preNatalDetail?.tianjiContext || "顺应天道节律，以果决行。"}

---

## 八、阳宅地脉道风水九宫环境调理（天纪·地利）
- **核心原则**：先天八卦为体，后天八卦为用。名位与实际方位相符为得位，相克则生灾病破耗。
- **关键提醒**：
  1. 西北乾位为一家之主天门位，切忌安放火灶（火烧天门）或设厕所（污秽天门）。
  2. 夫妻主卧居西南坤位成【地天泰】，小往大来，最利家道和睦与长久财富积累。
  3. 长男居西北成【天雷无妄】，少年老成提早当家；长女居东南成【巽为风】，文昌利科名与良缘。

---

## 九、以果决行 · 终极经世行动运筹方案
- **三大致胜王牌**：${fate.dimensions.strategyAndAction.details[0]?.content || ""}
- **三大避坑陷阱**：${fate.dimensions.strategyAndAction.details[1]?.content || ""}
- **终极法则**：“${fate.dimensions.strategyAndAction.tianjiRule}”`;
      setReportContent(offlineDoc);
    } finally {
      setIsLoadingReport(false);
    }
  };

  const handleAskQuestion = async () => {
    if (!question.trim() || isAsking) return;
    const userQ = question.trim();
    setQuestion("");

    const newMsgs = [
      ...chatMessages,
      { role: "user" as const, text: userQ, time: "刚刚" },
    ];
    setChatMessages(newMsgs);
    setIsAsking(true);

    try {
      const response = await fetch("/api/tianji/consult", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: userQ,
          chartData: {
            name: chart.name,
            gender: chart.gender,
            bureau: chart.bureau,
            lifeBranch: chart.lifePalaceBranch,
            patterns: chart.patterns,
            annualSiHua: chart.annualSiHua,
          },
          hexagramData: {
            preNatal: tianjiIching.numerology.preNatalHexagram,
            postNatal: tianjiIching.numerology.postNatalHexagram,
            yuanTangYao: tianjiIching.numerology.yuanTangYao,
          },
          yangZhaiData: "西北乾、正北坎、东北艮、正东震、东南巽、正南离、西南坤、正西兑",
        }),
      });

      const data = await response.json();
      setChatMessages([
        ...newMsgs,
        {
          role: "assistant",
          text: data.reply || "未能生成有效回复，请重试。",
          time: "刚刚",
        },
      ]);
    } catch (e) {
      setChatMessages([
        ...newMsgs,
        {
          role: "assistant",
          text: `【倪师天纪指引】：针对您的问题“${userQ}”，天纪之要在“以果决行”。当下应查明生年四化之化忌与化权落点，化忌所在宜防守沉淀，化权所在宜破局当担；阳宅请核实乾坤二位是否安稳，自然能逢凶化吉。`,
          time: "刚刚",
        },
      ]);
    } finally {
      setIsAsking(false);
    }
  };

  const handleCopy = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(reportContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#0E1117] border border-white/[0.1] rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06] bg-[#131720]/80">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-amber-300" />
            </div>
            <div>
              <h3 className="text-base font-serif font-bold text-white tracking-tight">
                天纪·三才全维决策推演白皮书
              </h3>
              <p className="text-xs text-slate-400">
                紫微斗数 · 洛书四柱易经命卦 · 阳宅地脉道 · 人间道无字天书合参
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopy}
              className="p-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-slate-300 transition duration-150 text-xs flex items-center space-x-1"
              title="复制报告"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
            <button
              onClick={handlePrint}
              className="p-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-slate-300 transition duration-150 text-xs flex items-center space-x-1"
              title="打印报告"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-slate-300 transition duration-150 text-xs"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Sub Tabs */}
        <div className="flex border-b border-white/[0.06] bg-[#131720]/40 px-6 pt-2">
          <button
            onClick={() => setActiveSubTab("report")}
            className={`px-4 py-2.5 text-xs font-medium border-b-2 transition flex items-center space-x-2 ${
              activeSubTab === "report"
                ? "border-amber-400 text-amber-300 font-semibold"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <ScrollText className="w-3.5 h-3.5" />
            <span>决策白皮书全文</span>
          </button>
          <button
            onClick={() => setActiveSubTab("chat")}
            className={`px-4 py-2.5 text-xs font-medium border-b-2 transition flex items-center space-x-2 ${
              activeSubTab === "chat"
                ? "border-amber-400 text-amber-300 font-semibold"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            <span>天纪智能导师问答</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {activeSubTab === "report" ? (
            isLoadingReport ? (
              <div className="py-20 text-center space-y-3">
                <div className="w-9 h-9 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-sm text-slate-300 font-serif">
                  正在融合四柱洛书易经命卦、生年四化与阳宅地脉道，生成深度战略推演...
                </p>
              </div>
            ) : (
              <div className="prose prose-invert max-w-none text-xs sm:text-sm leading-relaxed text-slate-200 space-y-4 whitespace-pre-wrap font-sans">
                {reportContent}
              </div>
            )
          ) : (
            <div className="flex flex-col h-[500px]">
              {/* Chat history */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                {chatMessages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl p-3.5 text-xs leading-relaxed ${
                        msg.role === "user"
                          ? "bg-gradient-to-r from-amber-600 to-amber-700 text-white rounded-tr-none shadow-sm"
                          : "bg-[#191D26] text-slate-200 rounded-tl-none border border-white/[0.06] whitespace-pre-wrap font-sans"
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))}
                {isAsking && (
                  <div className="flex justify-start">
                    <div className="bg-[#191D26] rounded-2xl rounded-tl-none p-3.5 text-xs text-slate-400 flex items-center space-x-2 border border-white/[0.06]">
                      <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                      <span>倪师天纪智能正在深度推演中...</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Chat Input */}
              <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center space-x-2">
                <input
                  type="text"
                  placeholder="输入您的具体决策困惑（如：今年适合换工作还是创业？阳宅西北厨房如何化解？）"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAskQuestion()}
                  className="flex-1 bg-[#141822] border border-white/[0.08] rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50 transition"
                />
                <button
                  onClick={handleAskQuestion}
                  disabled={isAsking || !question.trim()}
                  className="px-4 py-2.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 disabled:opacity-50 text-white font-medium rounded-xl text-xs flex items-center space-x-1.5 transition shadow-sm"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>提问</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
