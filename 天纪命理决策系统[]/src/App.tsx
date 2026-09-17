import React, { useState, useMemo } from "react";
import { Gender, EarthlyBranch } from "./types/tianji";
import { calculateNatalChart } from "./utils/ziweiEngine";
import { Navbar, NavTab } from "./components/Navbar";
import { ZiweiChart } from "./components/ZiweiChart";
import { YangZhaiModule } from "./components/YangZhaiModule";
import { SiHuaTimeline } from "./components/SiHuaTimeline";
import { IChingModule } from "./components/IChingModule";
import { FaceReadingModule } from "./components/FaceReadingModule";
import { StrategicReportModal } from "./components/StrategicReportModal";
import { ProfileInputModal } from "./components/ProfileInputModal";
import { BirthInputPanel } from "./components/BirthInputPanel";
import { FateAnalysisPanel } from "./components/FateAnalysisPanel";
import { Compass, BookOpen, ShieldAlert, Sparkles, User, Info, CheckCircle2 } from "lucide-react";

export function App() {
  // Navigation State
  const [activeTab, setActiveTab] = useState<NavTab>("ziwei");

  // Profile State
  const [name, setName] = useState<string>("倪师经典：青年创业破局");
  const [gender, setGender] = useState<Gender>("male");
  const [solarDate, setSolarDate] = useState<string>("1992-06-15");
  const [hourBranch, setHourBranch] = useState<EarthlyBranch>("午");

  // Modals
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);

  // Dynamic Natal Chart Calculation
  const chart = useMemo(() => {
    return calculateNatalChart(name, gender, solarDate, hourBranch);
  }, [name, gender, solarDate, hourBranch]);

  const handleSaveProfile = (
    newName: string,
    newGender: Gender,
    newSolarDate: string,
    newHourBranch: EarthlyBranch
  ) => {
    setName(newName);
    setGender(newGender);
    setSolarDate(newSolarDate);
    setHourBranch(newHourBranch);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex flex-col font-sans selection:bg-amber-100 selection:text-amber-900">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenProfile={() => setIsProfileModalOpen(true)}
        onOpenReport={() => setIsReportModalOpen(true)}
        currentName={name}
        hasApiKey={true}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Screen 1: Dedicated Input Screen */}
        {activeTab === "input" ? (
          <div className="space-y-6">
            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-medium flex items-center space-x-1">
                    <User className="w-3 h-3 mr-1 text-amber-700" />
                    第一步 · 生辰八字与命盘录入台
                  </span>
                </div>
                <h2 className="text-lg sm:text-xl font-serif font-bold text-slate-900 tracking-tight">
                  录入或选择生辰，即刻生成天纪全盘推演
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  支持阳历/农历快速切换、年代年份速选、十二时辰盘及经典命造一键对照。录入完成后点击下方按钮进入全息分析。
                </p>
              </div>
              <button
                onClick={() => setActiveTab("ziwei")}
                className="shrink-0 px-5 py-2.5 bg-gradient-to-r from-amber-700 to-amber-800 hover:from-amber-600 hover:to-amber-700 active:scale-[0.98] text-white rounded-xl text-xs sm:text-sm font-medium shadow-sm border border-amber-600/30 flex items-center justify-center space-x-2 transition duration-150"
              >
                <span>进入分析结果界面 ➔</span>
              </button>
            </div>

            <BirthInputPanel
              currentName={name}
              currentGender={gender}
              currentSolarDate={solarDate}
              currentHourBranch={hourBranch}
              chart={chart}
              onApplyProfile={handleSaveProfile}
              onOpenReport={() => setIsReportModalOpen(true)}
              onEnterAnalysis={() => setActiveTab("ziwei")}
            />
          </div>
        ) : (
          /* Screen 2: Analysis & Deduction Screen */
          <div className="space-y-6">
            {/* Top Compact Profile Bar */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:px-6 sm:py-3.5 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center">
                    <User className="w-4 h-4 text-amber-700" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-sm text-slate-900">{chart.name}</span>
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-amber-800 border border-slate-200 font-medium">
                        {chart.yinYangGender}
                      </span>
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 font-mono">
                        {chart.bureau}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="h-4 w-px bg-slate-200 hidden sm:block" />

                {/* Four Pillars quick chips */}
                <div className="flex items-center space-x-1.5 text-xs text-slate-700 font-mono">
                  <span className="text-slate-500">四柱:</span>
                  <span className="px-2 py-0.5 rounded-lg bg-amber-50 text-amber-900 border border-amber-200/70 font-semibold">
                    {chart.lunarDate?.stemBranchYear}年
                  </span>
                  <span className="px-2 py-0.5 rounded-lg bg-amber-50 text-amber-900 border border-amber-200/70 font-semibold">
                    {chart.lunarDate?.stemBranchMonth}月
                  </span>
                  <span className="px-2 py-0.5 rounded-lg bg-amber-50 text-amber-900 border border-amber-200/70 font-semibold">
                    {chart.lunarDate?.stemBranchDay}日
                  </span>
                  <span className="px-2 py-0.5 rounded-lg bg-amber-50 text-amber-900 border border-amber-200/70 font-semibold">
                    {chart.lunarDate?.stemBranchHour}时
                  </span>
                </div>

                <div className="h-4 w-px bg-slate-200 hidden md:block" />

                {/* Palace and Pattern chips */}
                <div className="hidden md:flex items-center space-x-2 text-xs text-slate-600">
                  <span>命坐【{chart.lifePalaceBranch}】</span>
                  <span>身坐【{chart.bodyPalaceBranch}】</span>
                  <span className="text-amber-800 font-semibold truncate max-w-[200px]">
                    【{chart.patterns[0]?.name?.split("（")[0] || "稳健常局"}】
                  </span>
                </div>
              </div>

              {/* Action Buttons: Switch/Edit Profile & Report */}
              <div className="flex items-center space-x-2.5 shrink-0">
                <button
                  onClick={() => setActiveTab("input")}
                  className="px-3.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-900 rounded-xl text-xs font-medium border border-slate-200/80 flex items-center space-x-1.5 transition duration-150 shadow-xs"
                >
                  <User className="w-3.5 h-3.5 text-amber-700" />
                  <span>修改生辰 / 切换命盘</span>
                </button>

                <button
                  onClick={() => setIsReportModalOpen(true)}
                  className="px-3.5 py-1.5 bg-gradient-to-r from-amber-700 to-amber-800 hover:from-amber-600 hover:to-amber-700 active:scale-[0.98] text-white rounded-xl text-xs font-medium shadow-sm border border-amber-600/30 flex items-center space-x-1.5 transition duration-150"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-200" />
                  <span>决策白皮书</span>
                </button>
              </div>
            </div>


            {/* Render Selected Analysis Module */}
            {activeTab === "ziwei" && (
              <ZiweiChart chart={chart} onOpenReport={() => setIsReportModalOpen(true)} />
            )}

            {activeTab === "fate" && (
              <FateAnalysisPanel chart={chart} onOpenReport={() => setIsReportModalOpen(true)} />
            )}

            {activeTab === "yangzhai" && (
              <YangZhaiModule onOpenReport={() => setIsReportModalOpen(true)} />
            )}

            {activeTab === "sihua" && (
              <SiHuaTimeline chart={chart} onOpenReport={() => setIsReportModalOpen(true)} />
            )}

            {activeTab === "iching" && (
              <IChingModule chart={chart} onOpenReport={() => setIsReportModalOpen(true)} />
            )}

            {activeTab === "face" && (
              <FaceReadingModule onOpenReport={() => setIsReportModalOpen(true)} />
            )}
          </div>
        )}
      </main>

      {/* Philosophy & Craft Footer */}
      <footer className="bg-slate-50 border-t border-slate-200 py-8 text-slate-600 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-amber-600" />
              <span className="font-serif font-bold text-slate-800 text-sm">
                天纪·自然法则与决策管理系统
              </span>
              <span className="text-[11px] text-slate-500">| 倪海厦宗师《天纪》正统传承</span>
            </div>
            <div className="text-center md:text-right text-[11px] text-amber-800 font-serif font-medium">
              “天纪就是自然法则，是真理，不需要你去定义它，它本来就是这样。” —— 倪海厦
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-500">
            <p>三纪体系合参：天纪（自然法则） · 人纪（伦理医术） · 地纪（史实归纳）</p>
            <p>严谨客观 · 破除迷信 · 辅助理性决策 · 以果决行</p>
          </div>
        </div>
      </footer>

      {/* Profile Editor Modal */}
      <ProfileInputModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        onSave={handleSaveProfile}
        initialName={name}
        initialGender={gender}
        initialDate={solarDate}
        initialHourBranch={hourBranch}
      />

      {/* Strategic Report Modal */}
      <StrategicReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        chart={chart}
      />
    </div>
  );
}

export default App;
