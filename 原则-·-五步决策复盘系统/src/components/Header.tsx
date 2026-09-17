import React from 'react';
import { 
  Compass, 
  BookOpen, 
  BarChart3, 
  Sparkles, 
  Bookmark, 
  Plus, 
  Smartphone, 
  Wifi, 
  Layers
} from 'lucide-react';

interface HeaderProps {
  activeTab: 'reviews' | 'analytics' | 'ai-patterns' | 'principles' | 'future-sandbox';
  setActiveTab?: (tab: 'reviews' | 'analytics' | 'ai-patterns' | 'principles' | 'future-sandbox') => void;
  onTabChange?: (tab: 'reviews' | 'analytics' | 'ai-patterns' | 'principles' | 'future-sandbox') => void;
  onNewReview?: () => void;
  onOpenBookModal: () => void;
  onOpenSyncModal: () => void;
  serverStatus: 'online' | 'offline' | 'checking';
  reviewsCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onTabChange,
  onNewReview,
  onOpenBookModal,
  onOpenSyncModal,
  serverStatus,
  reviewsCount = 0,
}) => {
  const handleTabClick = (tab: 'reviews' | 'analytics' | 'ai-patterns' | 'principles' | 'future-sandbox') => {
    if (setActiveTab) {
      setActiveTab(tab);
    }
    if (onTabChange) {
      onTabChange(tab);
    }
  };
  return (
    <header id="main-header" className="sticky top-0 z-40 bg-[#FAF9F6]/95 backdrop-blur border-b border-[#E8E6DF] transition-all">
      {/* Top Thin Editorial Bar */}
      <div className="bg-[#121316] text-[#FAF9F6] text-xs py-1.5 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between font-mono tracking-wider">
          <div className="flex items-center space-x-3">
            <span className="inline-block w-2 h-2 rounded-full bg-[#C5221F]"></span>
            <span className="uppercase text-[11px] text-stone-300">
              RAY DALIO'S FIVE-STEP DECISION PROCESS
            </span>
            <span className="hidden sm:inline text-stone-500">|</span>
            <span className="hidden sm:inline text-stone-300 font-serif italic text-xs">
              “痛苦 + 反思 = 进步” (Pain + Reflection = Progress)
            </span>
          </div>

          <div className="flex items-center space-x-4">
            <button
              id="header-cloud-sync-btn"
              onClick={onOpenSyncModal}
              className="flex items-center space-x-1.5 hover:text-white transition-colors cursor-pointer text-[11px]"
              title="查看云端同步与手机端访问"
            >
              <Wifi className={`w-3.5 h-3.5 ${serverStatus === 'online' ? 'text-emerald-400' : 'text-amber-400'}`} />
              <span className="hidden sm:inline">
                {serverStatus === 'online' ? '云端服务在线 · 手机电脑互通' : '本地离线缓存模式'}
              </span>
              <span className="sm:hidden">多端互通</span>
            </button>

            <button
              id="header-principles-book-btn"
              onClick={onOpenBookModal}
              className="flex items-center space-x-1 text-stone-300 hover:text-white transition-colors cursor-pointer text-[11px]"
            >
              <BookOpen className="w-3.5 h-3.5 text-[#C5221F]" />
              <span>《原则》典藏</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Navigation Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Logo & Identity */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 cursor-pointer" onClick={() => handleTabClick('reviews')}>
              <div className="w-10 h-10 rounded-sm bg-[#121316] text-[#FAF9F6] flex flex-col items-center justify-center border-l-4 border-[#C5221F] shadow-sm">
                <span className="font-serif font-black text-base leading-none">原</span>
                <span className="text-[8px] tracking-widest uppercase font-mono text-stone-400 mt-0.5">5-STEP</span>
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h1 className="text-lg sm:text-xl font-serif font-bold tracking-tight text-[#121316]">
                    原则 · 五步决策复盘系统
                  </h1>
                  <span className="hidden lg:inline text-[10px] font-mono px-1.5 py-0.5 border border-stone-300 rounded text-stone-600">
                    BRIDGEWATER SYSTEM
                  </span>
                </div>
                <p className="text-xs text-[#575A65] font-sans">
                  以极度求真与极度透明，将失败与反思转化为长期行为进化的机器
                </p>
              </div>
            </div>

            {/* Mobile Actions */}
            <div className="flex items-center space-x-2 md:hidden">
              <button
                id="mobile-new-review-btn"
                onClick={onNewReview}
                className="p-2 bg-[#C5221F] text-white rounded hover:bg-[#A81A18] transition-colors cursor-pointer"
                title="新建五步复盘"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Center Tabs */}
          <nav className="flex items-center space-x-1 overflow-x-auto pb-1 md:pb-0 scrollbar-none text-xs sm:text-sm font-medium">
            <button
              id="tab-reviews-btn"
              onClick={() => handleTabClick('reviews')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'reviews'
                  ? 'bg-[#121316] text-[#FAF9F6] font-semibold shadow-xs'
                  : 'text-[#575A65] hover:text-[#121316] hover:bg-stone-200/60'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>复盘工作台</span>
              <span className="ml-1 text-[10px] opacity-70 px-1.5 py-0.2 rounded-full bg-stone-500/20">
                {reviewsCount}
              </span>
            </button>

            <button
              id="tab-analytics-btn"
              onClick={() => handleTabClick('analytics')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'analytics'
                  ? 'bg-[#121316] text-[#FAF9F6] font-semibold shadow-xs'
                  : 'text-[#575A65] hover:text-[#121316] hover:bg-stone-200/60'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>进化看板</span>
            </button>

            <button
              id="tab-ai-patterns-btn"
              onClick={() => handleTabClick('ai-patterns')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'ai-patterns'
                  ? 'bg-[#121316] text-[#FAF9F6] font-semibold shadow-xs'
                  : 'text-[#575A65] hover:text-[#121316] hover:bg-stone-200/60'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-[#C5221F]" />
              <span>AI 行为模式</span>
            </button>

            <button
              id="tab-principles-btn"
              onClick={() => handleTabClick('principles')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'principles'
                  ? 'bg-[#121316] text-[#FAF9F6] font-semibold shadow-xs'
                  : 'text-[#575A65] hover:text-[#121316] hover:bg-stone-200/60'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>个人原则库</span>
            </button>

            <button
              id="tab-future-sandbox-btn"
              onClick={() => handleTabClick('future-sandbox')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'future-sandbox'
                  ? 'bg-[#121316] text-[#FAF9F6] font-semibold shadow-xs'
                  : 'text-[#575A65] hover:text-[#121316] hover:bg-stone-200/60'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>未来决策沙盘</span>
            </button>
          </nav>

          {/* Right Action */}
          <div className="hidden md:flex items-center space-x-3">
            <button
              id="header-new-review-btn"
              onClick={onNewReview}
              className="flex items-center space-x-1.5 bg-[#C5221F] hover:bg-[#A81A18] text-white px-3.5 py-2 rounded text-xs sm:text-sm font-medium tracking-wide shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>开启五步复盘</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
