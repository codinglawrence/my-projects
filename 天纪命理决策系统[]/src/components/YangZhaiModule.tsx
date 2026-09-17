import React, { useState } from "react";
import { PalaceCell, CompassDirection, FamilyRole, RoomFunction, YangZhaiDiagnosis } from "../types/tianji";
import {
  getInitialYangZhaiLayout,
  diagnoseYangZhai,
  ROLE_NAMES,
  ROOM_NAMES,
  COMPASS_DIRECTIONS,
  DI_MAI_DAO_64_YANGZHAI,
  CLASSIC_FENGSHUI_PRINCIPLES,
  getDiMaiDaoDetail,
} from "../utils/yangzhaiEngine";
import {
  Compass,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  Home,
  BookOpen,
  MapPin,
  Flame,
  Droplets,
  ShieldCheck,
  Search,
} from "lucide-react";

interface YangZhaiModuleProps {
  onOpenReport: () => void;
}

export const YangZhaiModule: React.FC<YangZhaiModuleProps> = ({ onOpenReport }) => {
  const [layout, setLayout] = useState<PalaceCell[]>(getInitialYangZhaiLayout());
  const [selectedCell, setSelectedCell] = useState<PalaceCell>(layout[0]); // Default 西北乾
  const [activeTab, setActiveTab] = useState<"interactive_layout" | "dimai_64" | "classic_lore">("interactive_layout");
  const [dimaiSearch, setDimaiSearch] = useState("");
  const [selectedDimaiHexagram, setSelectedDimaiHexagram] = useState<string>("乾为天");

  const diagnoses = diagnoseYangZhai(layout);

  const handleRoleChange = (role: FamilyRole) => {
    setLayout((prev) =>
      prev.map((c) => (c.direction === selectedCell.direction ? { ...c, assignedRole: role } : c))
    );
    setSelectedCell((prev) => ({ ...prev, assignedRole: role }));
  };

  const handleRoomChange = (room: RoomFunction) => {
    setLayout((prev) =>
      prev.map((c) => (c.direction === selectedCell.direction ? { ...c, roomFunction: room } : c))
    );
    setSelectedCell((prev) => ({ ...prev, roomFunction: room }));
  };

  // Preset Layout Switcher
  const applyPreset = (presetName: string) => {
    const base = getInitialYangZhaiLayout();
    if (presetName === "taitai") {
      // 地天泰富贵和睦宅: 父母居西南主卧(地天泰), 长男居正东(震为雷), 厨房正东, 东南大门
      setLayout([
        { direction: "NW", trigram: "乾", nameZh: "西北 (乾位)", defaultRole: "父亲/一家之主", element: "金", assignedRole: "empty", roomFunction: "study" },
        { direction: "N",  trigram: "坎", nameZh: "正北 (坎位)", defaultRole: "次男/中男", element: "水", assignedRole: "son_middle", roomFunction: "middle_son_room" },
        { direction: "NE", trigram: "艮", nameZh: "东北 (艮位)", defaultRole: "少男/三子", element: "土", assignedRole: "son_youngest", roomFunction: "storage" },
        { direction: "W",  trigram: "兑", nameZh: "正西 (兑位)", defaultRole: "少女/三女", element: "金", assignedRole: "daughter_youngest", roomFunction: "youngest_daughter_room" },
        { direction: "C",  trigram: "中", nameZh: "中央 (中宫)", defaultRole: "太极枢纽", element: "土", assignedRole: "empty", roomFunction: "living_room" },
        { direction: "E",  trigram: "震", nameZh: "正东 (震位)", defaultRole: "长男", element: "木", assignedRole: "son_eldest", roomFunction: "eldest_son_room" },
        { direction: "SW", trigram: "坤", nameZh: "西南 (坤位)", defaultRole: "母亲/女主人", element: "土", assignedRole: "father", roomFunction: "master_bedroom" },
        { direction: "S",  trigram: "离", nameZh: "正南 (离位)", defaultRole: "次女/中女", element: "火", assignedRole: "daughter_middle", roomFunction: "kitchen" },
        { direction: "SE", trigram: "巽", nameZh: "东南 (巽位)", defaultRole: "长女", element: "木", assignedRole: "daughter_eldest", roomFunction: "front_door" },
      ]);
    } else if (presetName === "fire_nw") {
      // 常见火烧天门宅: 厨房在西北, 卫生间在正东
      setLayout([
        { direction: "NW", trigram: "乾", nameZh: "西北 (乾位)", defaultRole: "父亲/一家之主", element: "金", assignedRole: "empty", roomFunction: "kitchen" },
        { direction: "N",  trigram: "坎", nameZh: "正北 (坎位)", defaultRole: "次男/中男", element: "水", assignedRole: "father", roomFunction: "master_bedroom" },
        { direction: "NE", trigram: "艮", nameZh: "东北 (艮位)", defaultRole: "少男/三子", element: "土", assignedRole: "son_youngest", roomFunction: "study" },
        { direction: "W",  trigram: "兑", nameZh: "正西 (兑位)", defaultRole: "少女/三女", element: "金", assignedRole: "daughter_youngest", roomFunction: "youngest_daughter_room" },
        { direction: "C",  trigram: "中", nameZh: "中央 (中宫)", defaultRole: "太极枢纽", element: "土", assignedRole: "empty", roomFunction: "living_room" },
        { direction: "E",  trigram: "震", nameZh: "正东 (震位)", defaultRole: "长男", element: "木", assignedRole: "son_eldest", roomFunction: "bathroom" },
        { direction: "SW", trigram: "坤", nameZh: "西南 (坤位)", defaultRole: "母亲/女主人", element: "土", assignedRole: "mother", roomFunction: "storage" },
        { direction: "S",  trigram: "离", nameZh: "正南 (离位)", defaultRole: "次女/中女", element: "火", assignedRole: "daughter_middle", roomFunction: "middle_daughter_room" },
        { direction: "SE", trigram: "巽", nameZh: "东南 (巽位)", defaultRole: "长女", element: "木", assignedRole: "daughter_eldest", roomFunction: "front_door" },
      ]);
    } else if (presetName === "wuwang") {
      // 长子当家天雷无妄宅: 长子居西北乾位
      setLayout([
        { direction: "NW", trigram: "乾", nameZh: "西北 (乾位)", defaultRole: "父亲/一家之主", element: "金", assignedRole: "son_eldest", roomFunction: "eldest_son_room" },
        { direction: "N",  trigram: "坎", nameZh: "正北 (坎位)", defaultRole: "次男/中男", element: "水", assignedRole: "son_middle", roomFunction: "middle_son_room" },
        { direction: "NE", trigram: "艮", nameZh: "东北 (艮位)", defaultRole: "少男/三子", element: "土", assignedRole: "son_youngest", roomFunction: "study" },
        { direction: "W",  trigram: "兑", nameZh: "正西 (兑位)", defaultRole: "少女/三女", element: "金", assignedRole: "daughter_youngest", roomFunction: "youngest_daughter_room" },
        { direction: "C",  trigram: "中", nameZh: "中央 (中宫)", defaultRole: "太极枢纽", element: "土", assignedRole: "empty", roomFunction: "living_room" },
        { direction: "E",  trigram: "震", nameZh: "正东 (震位)", defaultRole: "长男", element: "木", assignedRole: "father", roomFunction: "master_bedroom" },
        { direction: "SW", trigram: "坤", nameZh: "西南 (坤位)", defaultRole: "母亲/女主人", element: "土", assignedRole: "mother", roomFunction: "storage" },
        { direction: "S",  trigram: "离", nameZh: "正南 (离位)", defaultRole: "次女/中女", element: "火", assignedRole: "empty", roomFunction: "kitchen" },
        { direction: "SE", trigram: "巽", nameZh: "东南 (巽位)", defaultRole: "长女", element: "木", assignedRole: "daughter_eldest", roomFunction: "front_door" },
      ]);
    } else {
      setLayout(base);
    }
  };

  const MAP_GRID: CompassDirection[][] = [
    ["NW", "N", "NE"],
    ["W", "C", "E"],
    ["SW", "S", "SE"],
  ];

  const currentDimaiDetail = getDiMaiDaoDetail(selectedDimaiHexagram) || DI_MAI_DAO_64_YANGZHAI["乾为天"];

  const filteredDimaiKeys = Object.keys(DI_MAI_DAO_64_YANGZHAI).filter(
    (name) =>
      name.includes(dimaiSearch) ||
      DI_MAI_DAO_64_YANGZHAI[name].pinyin.toLowerCase().includes(dimaiSearch.toLowerCase()) ||
      DI_MAI_DAO_64_YANGZHAI[name].phenomenon.includes(dimaiSearch)
  );

  return (
    <div className="space-y-6">
      {/* Module Header & Presets */}
      <div className="bg-[#131720]/90 border border-white/[0.08] rounded-2xl p-5 sm:p-6 shadow-sm backdrop-blur-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-xs font-medium">
                《天纪·地脉道》阳宅真传
              </span>
              <h2 className="text-xl font-serif font-bold text-white tracking-tight">
                阳宅风水九宫八卦评估与《地脉道》六十四卦化解系统
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-300/90 leading-relaxed">
              先天八卦为体，后天八卦为用。门主灶三要审定，名位与实际方位相合为得位，相克则生病灾破败。
            </p>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={onOpenReport}
              className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 active:scale-[0.98] text-white rounded-xl text-xs font-medium shadow-sm border border-emerald-400/30 flex items-center justify-center space-x-1.5 transition duration-150"
            >
              <Sparkles className="w-4 h-4 text-emerald-200" />
              <span>生成阳宅调理风水专案</span>
            </button>
          </div>
        </div>

        {/* Sub Tabs */}
        <div className="flex flex-wrap gap-2 mt-6 border-b border-white/[0.06] pb-3">
          <button
            onClick={() => setActiveTab("interactive_layout")}
            className={`px-3.5 py-2 rounded-xl text-xs font-medium transition duration-150 flex items-center space-x-2 ${
              activeTab === "interactive_layout"
                ? "bg-white/[0.1] text-emerald-300 border border-emerald-500/30 font-semibold shadow-sm"
                : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]"
            }`}
          >
            <Home className="w-3.5 h-3.5" />
            <span>九宫八卦交互排布诊断</span>
          </button>
          <button
            onClick={() => setActiveTab("dimai_64")}
            className={`px-3.5 py-2 rounded-xl text-xs font-medium transition duration-150 flex items-center space-x-2 ${
              activeTab === "dimai_64"
                ? "bg-white/[0.1] text-emerald-300 border border-emerald-500/30 font-semibold shadow-sm"
                : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>《地脉道》64卦阳宅全景断语速查</span>
          </button>
          <button
            onClick={() => setActiveTab("classic_lore")}
            className={`px-3.5 py-2 rounded-xl text-xs font-medium transition duration-150 flex items-center space-x-2 ${
              activeTab === "classic_lore"
                ? "bg-white/[0.1] text-emerald-300 border border-emerald-500/30 font-semibold shadow-sm"
                : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]"
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>风水堪舆四大秘要（龙水穴向）</span>
          </button>
        </div>
      </div>

      {/* TAB 1: INTERACTIVE 9-PALACE LAYOUT */}
      {activeTab === "interactive_layout" && (
        <div className="space-y-6">
          {/* Preset Buttons */}
          <div className="flex flex-wrap items-center gap-2 bg-[#131720]/80 border border-white/[0.06] p-3 rounded-2xl">
            <span className="text-xs text-slate-400 font-medium font-serif">快速套用经典格局：</span>
            <button
              onClick={() => applyPreset("taitai")}
              className="px-3 py-1.5 bg-[#191D26] hover:bg-[#222733] border border-emerald-500/30 text-emerald-300 rounded-xl text-xs transition duration-150"
            >
              👑 地天泰（富贵延年）
            </button>
            <button
              onClick={() => applyPreset("wuwang")}
              className="px-3 py-1.5 bg-[#191D26] hover:bg-[#222733] border border-amber-500/30 text-amber-300 rounded-xl text-xs transition duration-150"
            >
              ⚡ 天雷无妄（长子当家）
            </button>
            <button
              onClick={() => applyPreset("fire_nw")}
              className="px-3 py-1.5 bg-[#191D26] hover:bg-[#222733] border border-rose-500/30 text-rose-300 rounded-xl text-xs transition duration-150"
            >
              🔥 火烧天门（凶象示例）
            </button>
            <button
              onClick={() => applyPreset("default")}
              className="px-3 py-1.5 bg-[#191D26] hover:bg-[#222733] border border-white/[0.08] text-slate-300 rounded-xl text-xs transition duration-150 flex items-center space-x-1"
            >
              <RefreshCw className="w-3 h-3" />
              <span>恢复各安其位</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left 7 Cols: Interactive 9-Grid Floorplan */}
            <div className="lg:col-span-7 bg-[#131720]/90 border border-white/[0.08] rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                <div className="flex items-center space-x-2">
                  <Compass className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-sm font-serif font-bold text-white">
                    九宫八卦罗盘平面图（点击宫位配置成员与房间）
                  </h3>
                </div>
                <span className="text-[11px] text-slate-500 font-mono">上北下南 · 左西右东</span>
              </div>

              {/* 3x3 Grid */}
              <div className="grid grid-cols-3 gap-3 aspect-square max-w-[500px] mx-auto p-3 bg-[#0B0D11] rounded-2xl border border-white/[0.06]">
                {MAP_GRID.flat().map((dir) => {
                  const cell = layout.find((c) => c.direction === dir)!;
                  const isSelected = selectedCell.direction === dir;
                  const diag = diagnoses.find((d) => d.direction === dir);

                  let statusBorder = "border-white/[0.06]";
                  let statusBg = "bg-[#191D26]/70";
                  if (diag?.status === "danger") {
                    statusBorder = "border-rose-500/40 shadow-sm";
                    statusBg = "bg-rose-500/10";
                  } else if (diag?.status === "warning") {
                    statusBorder = "border-amber-500/40";
                    statusBg = "bg-amber-500/10";
                  } else if (diag?.status === "auspicious") {
                    statusBorder = "border-emerald-500/40";
                    statusBg = "bg-emerald-500/10";
                  }

                  return (
                    <div
                      key={dir}
                      onClick={() => setSelectedCell(cell)}
                      className={`relative rounded-2xl p-3 flex flex-col justify-between cursor-pointer transition duration-150 ${statusBg} ${statusBorder} border ${
                        isSelected ? "ring-2 ring-emerald-400 ring-offset-2 ring-offset-[#0B0D11]" : "hover:bg-[#222733]"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-serif font-bold text-white">{cell.nameZh}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-black/40 text-amber-300 font-mono border border-white/[0.04]">
                          {cell.trigram}卦
                        </span>
                      </div>

                      <div className="my-1 space-y-0.5 text-center">
                        <div className="text-xs font-medium text-emerald-300 truncate">
                          {ROOM_NAMES[cell.roomFunction]}
                        </div>
                        <div className="text-[11px] text-slate-300/80 truncate">
                          居住: {ROLE_NAMES[cell.assignedRole]}
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1.5 border-t border-white/[0.06]">
                        <span className="truncate">{diag?.hexagramName || "平"}</span>
                        {diag?.status === "danger" && <Flame className="w-3.5 h-3.5 text-rose-400 shrink-0" />}
                        {diag?.status === "warning" && <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                        {diag?.status === "auspicious" && <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right 5 Cols: Cell Configuration & Remedy */}
            <div className="lg:col-span-5 bg-[#131720]/90 border border-white/[0.08] rounded-2xl p-5 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                <div>
                  <span className="text-[10px] text-emerald-400 font-semibold tracking-wider block">
                    当前选定宫位配置
                  </span>
                  <h3 className="text-base font-serif font-bold text-white">
                    {selectedCell.nameZh}（{selectedCell.trigram}卦 · 五行属{selectedCell.element}）
                  </h3>
                </div>
                <span className="text-xs text-slate-400">本位：{selectedCell.defaultRole}</span>
              </div>

              {/* Selector Controls */}
              <div className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1.5 font-medium font-serif">
                    实际居住成员（名与位）：
                  </label>
                  <select
                    value={selectedCell.assignedRole}
                    onChange={(e) => handleRoleChange(e.target.value as FamilyRole)}
                    className="w-full bg-[#141822] border border-white/[0.08] rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500/50 transition"
                  >
                    {Object.entries(ROLE_NAMES).map(([role, label]) => (
                      <option key={role} value={role}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1.5 font-medium font-serif">
                    房间功能划分（门主灶）：
                  </label>
                  <select
                    value={selectedCell.roomFunction}
                    onChange={(e) => handleRoomChange(e.target.value as RoomFunction)}
                    className="w-full bg-[#141822] border border-white/[0.08] rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500/50 transition"
                  >
                    {Object.entries(ROOM_NAMES).map(([func, label]) => (
                      <option key={func} value={func}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Real-time Diagnostics for this cell */}
              {(() => {
                const cellDiag = diagnoses.find((d) => d.direction === selectedCell.direction);
                if (!cellDiag) return null;

                return (
                  <div className="p-4 bg-[#141822] rounded-2xl border border-white/[0.06] space-y-3 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-serif font-bold text-white text-sm">
                        {cellDiag.title}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-lg text-[10px] font-medium ${
                          cellDiag.status === "danger"
                            ? "bg-rose-500/10 text-rose-300 border border-rose-500/20"
                            : cellDiag.status === "warning"
                            ? "bg-amber-500/10 text-amber-300 border border-amber-500/20"
                            : cellDiag.status === "auspicious"
                            ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                            : "bg-white/[0.06] text-slate-300"
                        }`}
                      >
                        卦象：{cellDiag.hexagramName}
                      </span>
                    </div>

                    <p className="text-slate-300/90 leading-relaxed">{cellDiag.phenomenon}</p>

                    <div className="pt-2 border-t border-white/[0.06] space-y-1">
                      <span className="text-emerald-400 font-medium block font-serif">《天纪》化解与调理法则：</span>
                      <p className="text-slate-200 leading-relaxed">{cellDiag.remedy}</p>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* 全宅格局综合诊断清单 */}
          <div className="bg-[#131720]/90 border border-white/[0.08] rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
              <div className="flex items-center space-x-2">
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-serif font-bold text-white">
                  全宅吉凶克应与名位相参综合诊断报告
                </h3>
              </div>
              <span className="text-xs text-slate-400">已评估 9 大宫位卦象</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {diagnoses.map((diag, idx) => (
                <div
                  key={idx}
                  className={`p-3.5 rounded-2xl border text-xs space-y-2 ${
                    diag.status === "danger"
                      ? "bg-rose-500/10 border-rose-500/20"
                      : diag.status === "warning"
                      ? "bg-amber-500/10 border-amber-500/20"
                      : diag.status === "auspicious"
                      ? "bg-emerald-500/10 border-emerald-500/20"
                      : "bg-[#191D26] border-white/[0.06]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-serif font-bold text-white">{diag.title}</span>
                    <span className="text-[10px] text-amber-300 font-mono">{diag.hexagramName}</span>
                  </div>
                  <p className="text-slate-300/90 leading-relaxed text-[11px]">{diag.phenomenon}</p>
                  <div className="text-slate-400 text-[10px] pt-1.5 border-t border-white/[0.06]">
                    <strong className="text-emerald-400">解法：</strong>
                    {diag.remedy}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: 《地脉道》64卦阳宅全景断语速查 */}
      {activeTab === "dimai_64" && (
        <div className="space-y-6">
          <div className="bg-[#131720]/90 border border-white/[0.08] rounded-2xl p-4 flex items-center space-x-3 shadow-sm backdrop-blur-xl">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="搜索地脉道阳宅卦名、拼音或断语克应（如：乾为天、地天泰、水地比、火烧天门...）"
              value={dimaiSearch}
              onChange={(e) => setDimaiSearch(e.target.value)}
              className="bg-transparent border-none text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none flex-1"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left 4 Cols: List of 64 Hexagrams */}
            <div className="lg:col-span-4 bg-[#131720]/90 border border-white/[0.08] rounded-2xl p-3 shadow-sm max-h-[600px] overflow-y-auto space-y-1.5 backdrop-blur-xl">
              {filteredDimaiKeys.map((name) => {
                const item = DI_MAI_DAO_64_YANGZHAI[name];
                const isSelected = selectedDimaiHexagram === name;

                return (
                  <div
                    key={name}
                    onClick={() => setSelectedDimaiHexagram(name)}
                    className={`p-3 rounded-xl cursor-pointer transition duration-150 flex items-center justify-between ${
                      isSelected
                        ? "bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-semibold shadow-sm"
                        : "hover:bg-white/[0.04] text-slate-300"
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <span className="text-base font-serif">{item.symbol}</span>
                      <span className="text-xs font-serif">{name}</span>
                    </div>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                        isSelected
                          ? "bg-black/30 text-emerald-200"
                          : item.status === "auspicious"
                          ? "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20"
                          : item.status === "danger"
                          ? "text-rose-400 bg-rose-500/10 border border-rose-500/20"
                          : "text-slate-400 bg-white/[0.04]"
                      }`}
                    >
                      {item.status === "auspicious" ? "大吉" : item.status === "danger" ? "凶险" : "平"}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Right 8 Cols: Detailed Di Mai Dao Insight */}
            <div className="lg:col-span-8 bg-[#131720]/90 border border-white/[0.08] rounded-2xl p-6 shadow-sm space-y-5 backdrop-blur-xl">
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
                <div className="flex items-center space-x-3.5">
                  <span className="text-4xl font-serif text-emerald-400">
                    {currentDimaiDetail.symbol}
                  </span>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-medium">
                        第 {currentDimaiDetail.number} 卦 · {currentDimaiDetail.pinyin}
                      </span>
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                          currentDimaiDetail.status === "auspicious"
                            ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                            : currentDimaiDetail.status === "danger"
                            ? "bg-rose-500/10 text-rose-300 border border-rose-500/20"
                            : "bg-amber-500/10 text-amber-300 border border-amber-500/20"
                        }`}
                      >
                        {currentDimaiDetail.status === "auspicious" ? "吉亨宅局" : currentDimaiDetail.status === "danger" ? "凶险警示" : "平顺变化"}
                      </span>
                    </div>
                    <h3 className="text-xl font-serif font-bold text-white tracking-tight mt-1.5">
                      {selectedDimaiHexagram}
                    </h3>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs text-slate-400 block font-serif">阳宅居位对应</span>
                  <span className="text-xs text-amber-300 font-mono">
                    {currentDimaiDetail.applicableLayout}
                  </span>
                </div>
              </div>

              {/* Phenomenon */}
              <div className="bg-[#141822] p-4 rounded-2xl border border-white/[0.06] space-y-2 text-xs">
                <span className="text-amber-400 font-serif font-bold block text-sm">
                  【地脉道真传断语与事象克应】
                </span>
                <p className="text-slate-200 leading-relaxed">{currentDimaiDetail.phenomenon}</p>
              </div>

              {/* Zodiac & Timing */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="bg-[#141822] p-4 rounded-2xl border border-white/[0.06] space-y-1.5">
                  <span className="text-slate-400 block font-serif font-medium">【生肖相合与克应】</span>
                  <p className="text-slate-200 leading-relaxed">{currentDimaiDetail.zodiacImpact}</p>
                </div>
                <div className="bg-[#141822] p-4 rounded-2xl border border-white/[0.06] space-y-1.5">
                  <span className="text-slate-400 block font-serif font-medium">【流年加减与应期】</span>
                  <p className="text-slate-200 leading-relaxed">{currentDimaiDetail.timing}</p>
                </div>
              </div>

              {/* Remedy */}
              <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl text-xs space-y-2">
                <span className="text-emerald-300 font-serif font-bold block text-sm">
                  【倪海厦《天纪》化解与归位之道】
                </span>
                <p className="text-emerald-100 leading-relaxed">{currentDimaiDetail.remedy}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CLASSIC FENGSHUI LORE */}
      {activeTab === "classic_lore" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 四灵诀 */}
            <div className="bg-[#131720]/90 border border-white/[0.08] rounded-2xl p-5 shadow-sm space-y-3.5 text-xs backdrop-blur-xl">
              <div className="flex items-center space-x-2 text-amber-300 font-serif font-bold text-sm border-b border-white/[0.06] pb-2.5">
                <MapPin className="w-4 h-4" />
                <span>一、四灵山势与形峦正局（左青龙右白虎）</span>
              </div>
              <p className="text-slate-300 leading-relaxed font-mono">
                {CLASSIC_FENGSHUI_PRINCIPLES.siLingJue.desc}
              </p>
              <div className="space-y-1.5 pt-2 text-slate-300">
                <p><strong className="text-amber-400">左青龙：</strong>{CLASSIC_FENGSHUI_PRINCIPLES.siLingJue.qinglong}</p>
                <p><strong className="text-amber-400">右白虎：</strong>{CLASSIC_FENGSHUI_PRINCIPLES.siLingJue.baihu}</p>
                <p><strong className="text-amber-400">前朱雀：</strong>{CLASSIC_FENGSHUI_PRINCIPLES.siLingJue.zhuque}</p>
                <p><strong className="text-amber-400">后玄武：</strong>{CLASSIC_FENGSHUI_PRINCIPLES.siLingJue.xuanwu}</p>
              </div>
            </div>

            {/* 天星四贵催官水 */}
            <div className="bg-[#131720]/90 border border-white/[0.08] rounded-2xl p-5 shadow-sm space-y-3.5 text-xs backdrop-blur-xl">
              <div className="flex items-center space-x-2 text-emerald-300 font-serif font-bold text-sm border-b border-white/[0.06] pb-2.5">
                <Droplets className="w-4 h-4" />
                <span>二、天星四贵催官发富水法</span>
              </div>
              <p className="text-slate-300 leading-relaxed">
                {CLASSIC_FENGSHUI_PRINCIPLES.tianXingSiGui.desc}
              </p>
              <div className="space-y-1.5 pt-2 text-slate-300">
                <p><strong className="text-emerald-400">嗨（紫微垣）：</strong>{CLASSIC_FENGSHUI_PRINCIPLES.tianXingSiGui.positions.hai}</p>
                <p><strong className="text-emerald-400">艮（天市垣）：</strong>{CLASSIC_FENGSHUI_PRINCIPLES.tianXingSiGui.positions.gen}</p>
                <p><strong className="text-emerald-400">丙（太微垣）：</strong>{CLASSIC_FENGSHUI_PRINCIPLES.tianXingSiGui.positions.bing}</p>
                <p><strong className="text-emerald-400">巽（太乙垣）：</strong>{CLASSIC_FENGSHUI_PRINCIPLES.tianXingSiGui.positions.xun}</p>
              </div>
            </div>

            {/* 八路黄泉大煞水 */}
            <div className="bg-[#131720]/90 border border-white/[0.08] rounded-2xl p-5 shadow-sm space-y-3.5 text-xs backdrop-blur-xl">
              <div className="flex items-center space-x-2 text-rose-300 font-serif font-bold text-sm border-b border-white/[0.06] pb-2.5">
                <ShieldAlert className="w-4 h-4" />
                <span>三、八路黄泉八煞绝水秘诀（大凶切忌）</span>
              </div>
              <div className="p-3 bg-[#0B0D11] rounded-xl font-mono text-rose-300/90 text-center border border-rose-500/20">
                {CLASSIC_FENGSHUI_PRINCIPLES.baLuHuangQuan.verse}
              </div>
              <p className="text-slate-300 leading-relaxed pt-1">
                {CLASSIC_FENGSHUI_PRINCIPLES.baLuHuangQuan.meaning}
              </p>
            </div>

            {/* 天圆地方与九星理气 */}
            <div className="bg-[#131720]/90 border border-white/[0.08] rounded-2xl p-5 shadow-sm space-y-3.5 text-xs backdrop-blur-xl">
              <div className="flex items-center space-x-2 text-cyan-300 font-serif font-bold text-sm border-b border-white/[0.06] pb-2.5">
                <Sparkles className="w-4 h-4" />
                <span>四、天圆地方与阳宅名位相参真诀</span>
              </div>
              <p className="text-slate-300 leading-relaxed">
                {CLASSIC_FENGSHUI_PRINCIPLES.tianYuanDiFang.core}
              </p>
              <div className="bg-[#0B0D11] p-3.5 rounded-xl border border-white/[0.06] text-slate-300 space-y-1.5">
                <span className="text-cyan-400 font-serif font-bold block">【倪师阳宅三大原则】：</span>
                <p className="text-slate-300/90">1. 先天为体，后天为用（易经八卦定身份与位置）</p>
                <p className="text-slate-300/90">2. 门主灶三要：大门纳气、主卧定性、厨房司病</p>
                <p className="text-slate-300/90">3. 移星换斗：通过改变居住方位与作息，改写命中定数</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
