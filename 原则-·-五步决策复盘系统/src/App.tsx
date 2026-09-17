import React, { useState, useEffect, useCallback } from 'react';
import { 
  fetchReviews, 
  saveReview, 
  deleteReviewApi, 
  updateReviewTaskStatus,
  fetchPrinciples, 
  savePrincipleApi, 
  updatePrincipleApi, 
  deletePrincipleApi,
  getLatestAIAnalysis,
  checkHealth
} from './lib/api';
import { ReviewRecord, PersonalPrinciple, AIAnalysisResult, ReviewCategory } from './types';
import { Header } from './components/Header';
import { ReviewList } from './components/ReviewList';
import { VisualAnalytics } from './components/VisualAnalytics';
import { AIPatternEngine } from './components/AIPatternEngine';
import { PrinciplesBank } from './components/PrinciplesBank';
import { FutureDecisionSandbox } from './components/FutureDecisionSandbox';
import { BookShowcaseModal } from './components/BookShowcaseModal';
import { MultiDeviceSyncModal } from './components/MultiDeviceSyncModal';
import { FiveStepModal } from './components/FiveStepModal';
import { Plus, Smartphone, Monitor, ShieldCheck, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

export type TabType = 'reviews' | 'analytics' | 'ai-patterns' | 'principles' | 'future-sandbox';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('reviews');
  
  // Data states
  const [reviews, setReviews] = useState<ReviewRecord[]>([]);
  const [principles, setPrinciples] = useState<PersonalPrinciple[]>([]);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysisResult | null>(null);
  const [serverStatus, setServerStatus] = useState<'online' | 'offline' | 'checking'>('checking');

  // Modals state
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [isFiveStepModalOpen, setIsFiveStepModalOpen] = useState(false);
  const [editingReview, setEditingReview] = useState<ReviewRecord | null>(null);

  // Mobile simulator mode (preview mobile layout on desktop)
  const [isMobileSimulator, setIsMobileSimulator] = useState(false);

  // Floating Action Button Ripples state
  const [btnRipples, setBtnRipples] = useState<Array<{ id: number; x: number; y: number; size: number }>>([]);

  const handleFloatingBtnClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const button = e.currentTarget;
    const rect = button.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const size = Math.max(rect.width, rect.height) * 2.6;

    const newRipple = {
      id: Date.now() + Math.random(),
      x,
      y,
      size,
    };

    setBtnRipples((prev) => [...prev, newRipple]);
    setTimeout(() => {
      setBtnRipples((prev) => prev.filter((r) => r.id !== newRipple.id));
    }, 700);

    openNewReviewModal();
  };

  // Load data from Express server
  const loadData = useCallback(async () => {
    try {
      const isHealthy = await checkHealth();
      setServerStatus(isHealthy ? 'online' : 'offline');

      const [reviewsData, principlesData, analysisData] = await Promise.all([
        fetchReviews(),
        fetchPrinciples(),
        getLatestAIAnalysis(),
      ]);

      setReviews(reviewsData);
      setPrinciples(principlesData);
      if (analysisData) {
        setAiAnalysis(analysisData);
      }
    } catch (err) {
      console.error('Failed to load initial data:', err);
      setServerStatus('offline');
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Review Operations
  const handleSaveReview = async (reviewPayload: Partial<ReviewRecord>) => {
    const saved = await saveReview(reviewPayload);
    setReviews((prev) => {
      const existingIdx = prev.findIndex((r) => r.id === saved.id);
      if (existingIdx >= 0) {
        const next = [...prev];
        next[existingIdx] = saved;
        return next;
      }
      return [saved, ...prev];
    });
  };

  const handleDeleteReview = async (id: string) => {
    await deleteReviewApi(id);
    setReviews((prev) => prev.filter((r) => r.id !== id));
  };

  const handleToggleTaskDone = async (reviewId: string, taskId: string) => {
    const review = reviews.find((r) => r.id === reviewId);
    if (!review || !review.step5_execution?.checklist) return;

    const targetTask = review.step5_execution.checklist.find((t) => t.id === taskId);
    if (!targetTask) return;

    const newStatus = !targetTask.done;

    // Optimistic UI update
    setReviews((prev) =>
      prev.map((r) => {
        if (r.id !== reviewId) return r;
        const updatedList = (r.step5_execution?.checklist || []).map((t) =>
          t.id === taskId ? { ...t, done: newStatus } : t
        );
        return {
          ...r,
          step5_execution: {
            ...r.step5_execution,
            checklist: updatedList,
          },
        };
      })
    );

    await updateReviewTaskStatus(reviewId, taskId, newStatus);
  };

  // Principle Operations
  const handleAddPrinciple = async (principlePayload: Partial<PersonalPrinciple>) => {
    const created = await savePrincipleApi(principlePayload);
    setPrinciples((prev) => [created, ...prev]);
  };

  const handleUpdatePrinciple = async (id: string, principlePayload: Partial<PersonalPrinciple>) => {
    const updated = await updatePrincipleApi(id, principlePayload);
    setPrinciples((prev) => prev.map((p) => (p.id === id ? updated : p)));
  };

  const handleDeletePrinciple = async (id: string) => {
    await deletePrincipleApi(id);
    setPrinciples((prev) => prev.filter((p) => p.id !== id));
  };

  const handleSavePrincipleFromReview = async (
    title: string,
    statement: string,
    rationale: string,
    category: ReviewCategory
  ) => {
    await handleAddPrinciple({
      code: `${principles.length + 1}.0`,
      title,
      statement,
      rationale,
      category,
      applicationCount: 1,
      isFavorite: false,
    });
  };

  // Open creation modal
  const openNewReviewModal = () => {
    setEditingReview(null);
    setIsFiveStepModalOpen(true);
  };

  // Open edit modal
  const openEditReviewModal = (review: ReviewRecord) => {
    setEditingReview(review);
    setIsFiveStepModalOpen(true);
  };

  // Content renderer
  const renderActiveView = () => {
    switch (activeTab) {
      case 'reviews':
        return (
          <ReviewList
            reviews={reviews}
            onNewReview={openNewReviewModal}
            onEditReview={openEditReviewModal}
            onDeleteReview={handleDeleteReview}
            onToggleTaskDone={handleToggleTaskDone}
            onOpenBookModal={() => setIsBookModalOpen(true)}
          />
        );
      case 'analytics':
        return (
          <VisualAnalytics
            reviews={reviews}
            onNewReview={openNewReviewModal}
          />
        );
      case 'ai-patterns':
        return (
          <AIPatternEngine
            initialAnalysis={aiAnalysis}
            onSavePrinciple={handleSavePrincipleFromReview}
            reviewCount={reviews.length}
          />
        );
      case 'principles':
        return (
          <PrinciplesBank
            principles={principles}
            onAddPrinciple={handleAddPrinciple}
            onUpdatePrinciple={handleUpdatePrinciple}
            onDeletePrinciple={handleDeletePrinciple}
          />
        );
      case 'future-sandbox':
        return (
          <FutureDecisionSandbox
            principlesCount={principles.length}
            reviewsCount={reviews.length}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#121316] selection:bg-[#C5221F] selection:text-white flex flex-col">
      {/* Mobile Simulator Frame Container if active */}
      {isMobileSimulator ? (
        <div className="flex-1 bg-stone-900 py-6 px-4 flex flex-col items-center justify-start min-h-screen overflow-y-auto">
          {/* Controls bar above simulator */}
          <div className="w-full max-w-sm flex items-center justify-between mb-3 text-stone-300 text-xs">
            <div className="flex items-center space-x-2">
              <Smartphone className="w-4 h-4 text-[#C5221F]" />
              <span className="font-mono font-bold">手机端实时视窗体验 (iPhone Frame)</span>
            </div>
            <button
              onClick={() => setIsMobileSimulator(false)}
              className="px-2.5 py-1 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded text-xs cursor-pointer"
            >
              切回宽屏电脑端
            </button>
          </div>

          {/* Phone Shell */}
          <div className="w-full max-w-[400px] h-[844px] bg-[#FAF9F6] border-8 border-stone-800 rounded-[48px] shadow-2xl overflow-hidden flex flex-col relative">
            {/* Dynamic Island Notch */}
            <div className="w-28 h-5 bg-stone-900 rounded-full mx-auto mt-2 shrink-0 z-30 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-stone-800 mr-2"></div>
            </div>

            {/* Scrollable phone content inside */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col">
              <Header
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                onTabChange={setActiveTab}
                onNewReview={openNewReviewModal}
                reviewsCount={reviews.length}
                serverStatus={serverStatus}
                onOpenBookModal={() => setIsBookModalOpen(true)}
                onOpenSyncModal={() => setIsSyncModalOpen(true)}
              />
              <main className="p-4 flex-1">
                {renderActiveView()}
              </main>
              {/* Home bar */}
              <div className="w-32 h-1 bg-stone-300 rounded-full mx-auto my-2 shrink-0"></div>
            </div>
          </div>
        </div>
      ) : (
        /* Normal Responsive Desktop / Mobile Layout */
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <Header
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            onTabChange={setActiveTab}
            onNewReview={openNewReviewModal}
            reviewsCount={reviews.length}
            serverStatus={serverStatus}
            onOpenBookModal={() => setIsBookModalOpen(true)}
            onOpenSyncModal={() => setIsSyncModalOpen(true)}
          />

          {/* Main Workspace */}
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
            {renderActiveView()}
          </main>

          {/* Footer with Dalio Essence */}
          <footer className="border-t border-stone-200 bg-white py-6 mt-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between text-xs text-stone-500 gap-4">
              <div className="flex items-center space-x-3">
                <span className="font-serif font-bold text-stone-800">
                  达利欧《原则》五步决策与复盘进化系统
                </span>
                <span className="text-stone-300">|</span>
                <span className="font-mono text-[11px] text-[#C5221F]">
                  PAIN + REFLECTION = PROGRESS
                </span>
              </div>

              <div className="flex items-center space-x-4 text-[11px]">
                <button
                  onClick={() => setIsSyncModalOpen(true)}
                  className="hover:text-stone-800 flex items-center space-x-1 cursor-pointer"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>云端实时同步保障</span>
                </button>
                <button
                  onClick={() => setIsMobileSimulator(true)}
                  className="hover:text-stone-800 flex items-center space-x-1 cursor-pointer"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>手机端视窗模拟</span>
                </button>
                <button
                  onClick={() => setIsBookModalOpen(true)}
                  className="hover:text-stone-800 cursor-pointer"
                >
                  《原则》原著图解
                </button>
              </div>
            </div>
          </footer>
        </div>
      )}

      {/* Floating Action Button for Quick New Review */}
      <div className="fixed bottom-6 right-6 z-40 flex items-center group">
        {/* Guiding Tooltip Label */}
        <div className="mr-3 px-3 py-1.5 rounded-full bg-[#121316]/95 backdrop-blur-xs text-white text-xs font-serif shadow-xl opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 pointer-events-none hidden sm:flex items-center space-x-2 border border-white/10 select-none">
          <span className="w-1.5 h-1.5 rounded-full bg-[#C5221F] animate-ping" />
          <span>新建五步复盘推演</span>
          <span className="text-[10px] font-mono text-stone-400">P+R=P</span>
        </div>

        <motion.button
          id="floating-new-review-btn"
          onClick={handleFloatingBtnClick}
          whileHover={{
            y: [0, -6, 0],
            scale: 1.08,
            boxShadow:
              '0 20px 32px -4px rgba(197, 34, 31, 0.45), 0 8px 16px -2px rgba(197, 34, 31, 0.3)',
            transition: {
              y: {
                repeat: Infinity,
                duration: 1.5,
                ease: 'easeInOut',
              },
              scale: {
                type: 'spring',
                stiffness: 400,
                damping: 20,
              },
            },
          }}
          whileTap={{ scale: 0.92 }}
          className="relative overflow-hidden w-14 h-14 rounded-full bg-[#C5221F] hover:bg-[#B01E1B] text-white shadow-xl flex items-center justify-center cursor-pointer select-none transition-colors border-2 border-white/25"
          title="新建五步复盘记录"
          aria-label="新建五步复盘记录"
        >
          {/* Water Ripple Circles */}
          {btnRipples.map((ripple) => (
            <motion.span
              key={ripple.id}
              initial={{
                width: 0,
                height: 0,
                opacity: 0.7,
                transform: 'translate(-50%, -50%)',
              }}
              animate={{
                width: ripple.size,
                height: ripple.size,
                opacity: 0,
                transform: 'translate(-50%, -50%)',
              }}
              transition={{
                duration: 0.65,
                ease: 'easeOut',
              }}
              className="absolute rounded-full bg-white/50 pointer-events-none"
              style={{
                left: ripple.x,
                top: ripple.y,
              }}
            />
          ))}

          <Plus className="w-6 h-6 relative z-10 transition-transform duration-300 group-hover:rotate-90" />
        </motion.button>
      </div>

      {/* Modals */}
      <BookShowcaseModal
        isOpen={isBookModalOpen}
        onClose={() => setIsBookModalOpen(false)}
      />

      <MultiDeviceSyncModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        serverStatus={serverStatus}
        onForceSync={loadData}
        isMobileSimulatorActive={isMobileSimulator}
        onToggleMobileSimulator={() => setIsMobileSimulator(!isMobileSimulator)}
      />

      <FiveStepModal
        isOpen={isFiveStepModalOpen}
        onClose={() => {
          setIsFiveStepModalOpen(false);
          setEditingReview(null);
        }}
        onSave={handleSaveReview}
        initialData={editingReview}
        onSavePrincipleFromReview={handleSavePrincipleFromReview}
      />
    </div>
  );
}
