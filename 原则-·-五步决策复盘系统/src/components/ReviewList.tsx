import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Flame, 
  ChevronRight, 
  ChevronDown, 
  CheckCircle2, 
  Clock, 
  Trash2, 
  Edit3, 
  Tag, 
  Sparkles, 
  Layers, 
  Check, 
  AlertTriangle,
  Compass
} from 'lucide-react';
import { ReviewRecord, ReviewCategory } from '../types';

interface ReviewListProps {
  reviews: ReviewRecord[];
  onNewReview: () => void;
  onEditReview: (review: ReviewRecord) => void;
  onDeleteReview: (id: string) => void;
  onToggleTaskDone: (reviewId: string, taskId: string) => void;
  onOpenBookModal: () => void;
}

export const ReviewList: React.FC<ReviewListProps> = ({
  reviews,
  onNewReview,
  onEditReview,
  onDeleteReview,
  onToggleTaskDone,
  onOpenBookModal,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('全部');
  const [expandedId, setExpandedId] = useState<string | null>(reviews[0]?.id || null);

  const categories = ['全部', '工作事业', '战略决策', '个人成长', '团队协作', '健康生活'];

  const filteredReviews = reviews.filter((r) => {
    const matchesCat = selectedCategory === '全部' || r.category === selectedCategory;
    const matchesSearch =
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.tags?.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())) ||
      r.step3_diagnosis?.rootCause?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.step4_design?.extractedPrinciple?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div id="review-list-view" className="space-y-6">
      {/* Top Banner with Dalio Quote and Quick Stats */}
      <div className="bg-[#FAF9F6] border border-[#E8E6DF] rounded-lg p-5 shadow-xs relative overflow-hidden">
        <div className="absolute -right-8 -bottom-8 opacity-5 text-stone-900 pointer-events-none font-serif font-black text-9xl">
          原
        </div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <div className="inline-flex items-center space-x-2 text-[11px] font-mono uppercase tracking-wider text-[#C5221F] bg-red-50 px-2 py-0.5 rounded border border-red-100">
              <span>DALIO DECISION CYCLES</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#121316] tracking-tight">
              五步循环决策复盘工作台
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 max-w-2xl font-sans">
              “痛苦 + 反思 = 进步。不要容忍现实中的盲点，像工程师检查机器一样复盘每一次碰壁。”
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              id="list-open-book-btn"
              onClick={onOpenBookModal}
              className="px-3 py-2 bg-white hover:bg-stone-50 border border-stone-300 text-stone-700 text-xs font-medium rounded transition-colors shadow-2xs"
            >
              学习五步法图解
            </button>
            <button
              id="list-new-review-btn"
              onClick={onNewReview}
              className="px-4 py-2 bg-[#C5221F] hover:bg-[#A81A18] text-white text-xs font-semibold rounded flex items-center space-x-1.5 transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>新建五步复盘</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-lg border border-stone-200">
        {/* Category Pills */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none text-xs">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded text-xs font-medium whitespace-nowrap cursor-pointer transition-colors ${
                selectedCategory === cat
                  ? 'bg-[#121316] text-[#FAF9F6]'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search input */}
        <div className="relative min-w-[240px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索复盘、根因、原则、标签..."
            className="w-full text-xs pl-8 pr-3 py-1.5 bg-stone-50 border border-stone-200 rounded focus:bg-white focus:border-[#C5221F] focus:outline-hidden"
          />
        </div>
      </div>

      {/* Review Records List */}
      {filteredReviews.length === 0 ? (
        <div className="bg-white rounded-lg border border-stone-200 p-12 text-center space-y-3">
          <Compass className="w-10 h-10 text-stone-300 mx-auto" />
          <h3 className="font-serif text-base font-bold text-stone-800">
            暂无匹配的五步复盘记录
          </h3>
          <p className="text-xs text-stone-500 max-w-sm mx-auto">
            每一次碰壁都是进化的宝贵契机。立刻开始记录你最近遇到的挑战与失误，运用五步法穿透根因。
          </p>
          <button
            onClick={onNewReview}
            className="inline-flex items-center space-x-1.5 px-4 py-2 bg-[#C5221F] text-white text-xs font-medium rounded hover:bg-[#A81A18] transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>开启第一份复盘</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReviews.map((review) => {
            const isExpanded = expandedId === review.id;
            const completedTasks = review.step5_execution?.checklist?.filter((t) => t.done).length || 0;
            const totalTasks = review.step5_execution?.checklist?.length || 0;

            return (
              <div
                key={review.id}
                id={`review-card-${review.id}`}
                className="bg-white rounded-lg border border-stone-200 shadow-2xs overflow-hidden transition-all hover:border-stone-300"
              >
                {/* Header Strip */}
                <div
                  onClick={() => setExpandedId(isExpanded ? null : review.id)}
                  className="p-4 sm:p-5 flex items-start justify-between gap-4 cursor-pointer select-none bg-stone-50/40 hover:bg-stone-50/80 transition-colors"
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="font-mono text-[11px] font-bold px-2 py-0.5 bg-stone-900 text-white rounded">
                        {review.category}
                      </span>
                      <span className="text-stone-400 text-[11px] font-mono">
                        {new Date(review.createdAt).toLocaleDateString('zh-CN', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </span>

                      {/* Pain Level Badge */}
                      <span className="inline-flex items-center space-x-1 text-[11px] font-mono px-2 py-0.5 rounded bg-red-50 text-[#C5221F] border border-red-100">
                        <Flame className="w-3 h-3" />
                        <span>痛苦指数: {review.painLevel} / 5</span>
                      </span>

                      {/* Evolution Score Badge */}
                      <span className="inline-flex items-center space-x-1 text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-100">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>进化得分: {review.evolutionScore || 85}</span>
                      </span>

                      {/* Status */}
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase font-semibold ${
                          review.step5_execution?.status === 'evolved'
                            ? 'bg-purple-100 text-purple-800'
                            : review.step5_execution?.status === 'completed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {review.step5_execution?.status === 'evolved'
                          ? '机器已进化'
                          : review.step5_execution?.status === 'completed'
                          ? '任务已验收'
                          : '执行推进中'}
                      </span>
                    </div>

                    <h3 className="font-serif text-base sm:text-lg font-bold text-[#121316] leading-snug">
                      {review.title}
                    </h3>

                    {/* Quick extracted principle snapshot */}
                    {review.step4_design?.extractedPrinciple && (
                      <p className="text-xs font-serif italic text-stone-700 line-clamp-1 border-l-2 border-[#C5221F] pl-2">
                        “{review.step4_design.extractedPrinciple}”
                      </p>
                    )}
                  </div>

                  <div className="flex items-center space-x-2 shrink-0 pt-1">
                    <div className="text-right hidden sm:block">
                      <div className="text-[11px] font-mono text-stone-400">执行清单</div>
                      <div className="text-xs font-bold text-stone-700">
                        {completedTasks} / {totalTasks} 完成
                      </div>
                    </div>
                    <div className="p-1.5 rounded-full bg-stone-200/70 text-stone-600">
                      {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </div>
                  </div>
                </div>

                {/* Expanded Detailed 5-Step View */}
                {isExpanded && (
                  <div className="p-5 sm:p-6 border-t border-stone-200 space-y-6 bg-white animate-in fade-in">
                    {/* Five Step Breakdown Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 text-xs">
                      {/* Step 1: Goals */}
                      <div className="p-3.5 bg-stone-50 rounded border border-stone-200 space-y-2">
                        <div className="font-mono text-[10px] uppercase font-bold text-[#C5221F]">
                          STEP 1 · 明确目标
                        </div>
                        <div className="font-semibold text-stone-900">
                          {review.step1_goals?.goalStatement || '未详细记录目标'}
                        </div>
                        {review.step1_goals?.desireVsGoalNote && (
                          <div className="text-[11px] text-stone-500 bg-white p-2 rounded border border-stone-200">
                            <span className="font-bold text-amber-800">欲望vs目标：</span>
                            <span className="italic">{review.step1_goals.desireVsGoalNote}</span>
                          </div>
                        )}
                        {review.step1_goals?.targetMetric && (
                          <div className="text-[11px] text-stone-600 font-mono">
                            指标: {review.step1_goals.targetMetric}
                          </div>
                        )}
                      </div>

                      {/* Step 2: Problems */}
                      <div className="p-3.5 bg-stone-50 rounded border border-stone-200 space-y-2">
                        <div className="font-mono text-[10px] uppercase font-bold text-[#C5221F]">
                          STEP 2 · 暴露问题
                        </div>
                        <div className="font-semibold text-stone-900">
                          {review.step2_problems?.problemDescription || '未记录'}
                        </div>
                        <div className="text-[11px] text-stone-600">
                          <span className="font-bold">是否容忍：</span>
                          <span>{review.step2_problems?.isTolerated ? '⚠️ 曾心存容忍' : '✅ 决不妥协'}</span>
                        </div>
                        {review.step2_problems?.impactScope && (
                          <div className="text-[11px] text-stone-500">
                            影响: {review.step2_problems.impactScope}
                          </div>
                        )}
                      </div>

                      {/* Step 3: Diagnosis */}
                      <div className="p-3.5 bg-red-50/40 rounded border border-red-200 space-y-2">
                        <div className="font-mono text-[10px] uppercase font-bold text-[#C5221F]">
                          STEP 3 · 诊断根因
                        </div>
                        <div className="text-[11px]">
                          <span className="text-stone-500 font-bold block">直接诱因 (表面):</span>
                          <span className="text-stone-700">{review.step3_diagnosis?.proximalCause || '无'}</span>
                        </div>
                        <div className="text-[11px]">
                          <span className="text-[#C5221F] font-bold block">机器根因 (本质):</span>
                          <span className="text-stone-900 font-medium">
                            {review.step3_diagnosis?.rootCause || '未探明'}
                          </span>
                        </div>
                        {review.step3_diagnosis?.egoBarrier && (
                          <div className="text-[11px] bg-white p-1.5 rounded border border-red-100 text-stone-600">
                            <span className="font-bold text-red-900">自负障碍自白: </span>
                            {review.step3_diagnosis.egoBarrier}
                          </div>
                        )}
                      </div>

                      {/* Step 4: Design */}
                      <div className="p-3.5 bg-stone-50 rounded border border-stone-200 space-y-2">
                        <div className="font-mono text-[10px] uppercase font-bold text-[#C5221F]">
                          STEP 4 · 机制规划
                        </div>
                        <div className="text-[11px] font-semibold text-stone-900">
                          {review.step4_design?.systemicFix || '无机制防错设计'}
                        </div>
                        {review.step4_design?.extractedPrinciple && (
                          <div className="bg-stone-900 text-white p-2 rounded text-[11px] font-serif">
                            <span className="text-[#C5221F] font-mono block text-[9px]">沉淀原则</span>
                            {review.step4_design.extractedPrinciple}
                          </div>
                        )}
                      </div>

                      {/* Step 5: Execution */}
                      <div className="p-3.5 bg-stone-50 rounded border border-stone-200 space-y-2">
                        <div className="font-mono text-[10px] uppercase font-bold text-[#C5221F]">
                          STEP 5 · 坚决执行
                        </div>
                        <div className="text-[11px] text-stone-700">
                          完成度: {completedTasks} / {totalTasks}
                        </div>
                        {review.step5_execution?.reflectionNotes && (
                          <p className="text-[11px] text-stone-500 italic">
                            “{review.step5_execution.reflectionNotes}”
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Interactive Checklist in Expanded View */}
                    {review.step5_execution?.checklist && review.step5_execution.checklist.length > 0 && (
                      <div className="p-4 bg-stone-50 rounded border border-stone-200 space-y-2">
                        <div className="text-xs font-bold text-stone-900 flex items-center justify-between">
                          <span>实操执行检查清单（点击可实时打勾更新云端状态）</span>
                          <span className="text-[11px] font-mono text-stone-500">
                            {completedTasks} / {totalTasks} DONE
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {review.step5_execution.checklist.map((task) => (
                            <label
                              key={task.id}
                              className={`flex items-center space-x-2.5 p-2 rounded text-xs border cursor-pointer transition-colors ${
                                task.done
                                  ? 'bg-emerald-50/70 border-emerald-200 text-stone-500 line-through'
                                  : 'bg-white border-stone-200 text-stone-800 hover:border-stone-400'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={task.done}
                                onChange={() => onToggleTaskDone(review.id, task.id)}
                                className="w-4 h-4 text-[#C5221F] rounded cursor-pointer"
                              />
                              <span className="flex-1 font-medium">{task.task}</span>
                              {task.dueDate && (
                                <span className="text-[10px] font-mono text-stone-400">
                                  {task.dueDate}
                                </span>
                              )}
                            </label>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* AI Feedback Display if available */}
                    {review.aiFeedback && (
                      <div className="p-4 bg-stone-900 text-[#FAF9F6] rounded-md text-xs space-y-2">
                        <div className="flex items-center justify-between font-mono text-[#C5221F]">
                          <span className="flex items-center space-x-1.5 font-bold">
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>达利欧 AI 历史点评档案</span>
                          </span>
                          <span className="text-[10px] text-stone-400">
                            {review.aiFeedback.createdAt?.slice(0, 10)}
                          </span>
                        </div>
                        <p className="text-stone-300 leading-relaxed font-serif">
                          {review.aiFeedback.summary}
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 text-[11px] border-t border-stone-800">
                          <div>
                            <span className="text-amber-400 font-bold block">盲点防范：</span>
                            <span className="text-stone-300">{review.aiFeedback.blindspotAlert}</span>
                          </div>
                          <div>
                            <span className="text-emerald-400 font-bold block">未来决策行动指导：</span>
                            <span className="text-stone-300">{review.aiFeedback.futureAdvice}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Card Actions */}
                    <div className="flex items-center justify-between pt-2 border-t border-stone-200">
                      <div className="flex items-center space-x-1 text-xs text-stone-400">
                        <Tag className="w-3.5 h-3.5" />
                        <span>{review.tags?.join(' · ') || '达利欧复盘'}</span>
                      </div>

                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => onEditReview(review)}
                          className="px-3 py-1 text-xs font-medium text-stone-700 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 rounded flex items-center space-x-1 transition-colors cursor-pointer"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>重新校准</span>
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`确定要删除复盘记录“${review.title}”吗？`)) {
                              onDeleteReview(review.id);
                            }
                          }}
                          className="px-2 py-1 text-xs text-stone-400 hover:text-red-600 rounded transition-colors cursor-pointer"
                          title="删除记录"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
