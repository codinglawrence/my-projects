import React from "react";
import { Compass, Sparkles, BookOpen, User, Eye, ShieldAlert, ChevronRight } from "lucide-react";

export type NavTab = "input" | "ziwei" | "fate" | "yangzhai" | "sihua" | "iching" | "face" | "report";

interface NavbarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  onOpenProfile: () => void;
  onOpenReport: () => void;
  currentName: string;
  hasApiKey: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenProfile,
  onOpenReport,
  currentName,
  hasApiKey,
}) => {
  const navItems = [
    { id: "input" as NavTab, label: "生辰录入", icon: User },
    { id: "ziwei" as NavTab, label: "紫微排盘", icon: Compass },
    { id: "fate" as NavTab, label: "命局透视", icon: Sparkles },
    { id: "yangzhai" as NavTab, label: "阳宅风水", icon: Compass },
    { id: "sihua" as NavTab, label: "四化流年", icon: ShieldAlert },
    { id: "iching" as NavTab, label: "易经命卦", icon: BookOpen },
    { id: "face" as NavTab, label: "面相命相", icon: Eye },
  ];

  return (
    <header className="sticky top-0 z-50 backdrop-blur-2xl bg-white/90 border-b border-slate-200/80 text-slate-800 transition-colors shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Title */}
          <div
            className="flex items-center space-x-3 cursor-pointer group select-none"
            onClick={() => setActiveTab("ziwei")}
          >
            <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200/80 flex items-center justify-center shadow-xs group-hover:border-amber-400/80 transition duration-200">
              <span className="text-base font-serif font-bold text-amber-800">天</span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center space-x-2">
                <span className="text-sm sm:text-base font-serif font-bold text-slate-900 tracking-tight group-hover:text-amber-800 transition">
                  天纪命理决策系统
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-medium">
                  天纪体系
                </span>
              </div>
              <span className="text-[11px] text-slate-500 tracking-wide font-normal">
                以果决行 · 命相同参 · 极简实战
              </span>
            </div>
          </div>

          {/* Apple-style Segmented Nav Control */}
          <nav className="hidden md:flex items-center p-1 rounded-2xl bg-slate-100/90 border border-slate-200/80 shadow-inner space-x-0.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              const isInput = item.id === "input";
              return (
                <button
                  key={item.id}
                  id={`nav-tab-${item.id}`}
                  onClick={() => setActiveTab(item.id)}
                  className={`relative px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 flex items-center space-x-1.5 ${
                    isActive
                      ? "bg-white text-amber-900 shadow-xs border border-slate-200/80 font-semibold"
                      : isInput
                      ? "text-amber-700 hover:text-amber-900 hover:bg-white/60"
                      : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? "text-amber-700" : isInput ? "text-amber-700" : "text-slate-500"}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2.5">
            <button
              id="btn-edit-profile"
              onClick={() => setActiveTab("input")}
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs text-slate-700 hover:text-slate-900 flex items-center space-x-1.5 transition duration-150 shadow-xs"
              title="切换到生辰录入界面"
            >
              <User className="w-3.5 h-3.5 text-amber-700" />
              <span className="max-w-[85px] truncate font-medium">{currentName}</span>
            </button>

            <button
              id="btn-generate-report"
              onClick={onOpenReport}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-700 to-amber-800 hover:from-amber-600 hover:to-amber-700 active:scale-[0.98] text-white text-xs font-medium shadow-sm border border-amber-600/30 flex items-center space-x-1.5 transition duration-150"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-200" />
              <span>决策白皮书</span>
            </button>
          </div>
        </div>

        {/* Mobile Tab Bar */}
        <div className="flex md:hidden overflow-x-auto py-2 space-x-1 border-t border-slate-200/80 scrollbar-none">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`px-3 py-1 rounded-xl text-xs whitespace-nowrap transition ${
                  isActive
                    ? "bg-white text-amber-900 font-semibold border border-slate-200 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};

