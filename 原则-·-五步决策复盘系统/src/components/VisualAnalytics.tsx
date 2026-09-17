import React, { useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, 
  LineChart, Line, CartesianGrid, Legend, Cell, AreaChart, Area 
} from 'recharts';
import { Flame, TrendingUp, ShieldAlert, CheckCircle2, Target, Sliders, Award } from 'lucide-react';
import { ReviewRecord } from '../types';
import { EmotionHeatmap } from './EmotionHeatmap';

interface VisualAnalyticsProps {
  reviews: ReviewRecord[];
  onNewReview: () => void;
}

export const VisualAnalytics: React.FC<VisualAnalyticsProps> = ({ reviews, onNewReview }) => {
  // 1. Radar data calculation
  const radarData = useMemo(() => {
    if (reviews.length === 0) {
      return [
        { subject: '目标设定', A: 80, fullMark: 100 },
        { subject: '问题敏感度', A: 75, fullMark: 100 },
        { subject: '根因穿透', A: 85, fullMark: 100 },
        { subject: '机制设计', A: 70, fullMark: 100 },
        { subject: '坚决执行', A: 82, fullMark: 100 },
      ];
    }

    // Heuristic scores based on reviews content
    const totalGoalsScore = reviews.reduce((acc, r) => {
      let s = 70;
      if (r.step1_goals?.goalStatement?.length > 20) s += 15;
      if (r.step1_goals?.desireVsGoalNote) s += 15;
      return acc + Math.min(s, 100);
    }, 0) / reviews.length;

    const totalProblemsScore = reviews.reduce((acc, r) => {
      let s = 65;
      if (!r.step2_problems?.isTolerated) s += 20;
      if (r.step2_problems?.severity >= 3) s += 15;
      return acc + Math.min(s, 100);
    }, 0) / reviews.length;

    const totalDiagnosisScore = reviews.reduce((acc, r) => {
      let s = 60;
      if (r.step3_diagnosis?.rootCause) s += 20;
      if (r.step3_diagnosis?.egoBarrier) s += 20;
      return acc + Math.min(s, 100);
    }, 0) / reviews.length;

    const totalDesignScore = reviews.reduce((acc, r) => {
      let s = 65;
      if (r.step4_design?.systemicFix) s += 20;
      if (r.step4_design?.extractedPrinciple) s += 15;
      return acc + Math.min(s, 100);
    }, 0) / reviews.length;

    const totalExecutionScore = reviews.reduce((acc, r) => {
      const checklist = r.step5_execution?.checklist || [];
      const doneCount = checklist.filter((t) => t.done).length;
      const ratio = checklist.length > 0 ? doneCount / checklist.length : 0.7;
      return acc + Math.round(ratio * 100);
    }, 0) / reviews.length;

    return [
      { subject: '明确目标', score: Math.round(totalGoalsScore), fullMark: 100 },
      { subject: '暴露问题', score: Math.round(totalProblemsScore), fullMark: 100 },
      { subject: '诊断根因', score: Math.round(totalDiagnosisScore), fullMark: 100 },
      { subject: '规划方案', score: Math.round(totalDesignScore), fullMark: 100 },
      { subject: '坚决执行', score: Math.round(totalExecutionScore), fullMark: 100 },
    ];
  }, [reviews]);

  // 2. Pain + Reflection = Progress Timeline
  const timelineData = useMemo(() => {
    return reviews
      .map((r, idx) => ({
        name: r.title.length > 8 ? `${r.title.slice(0, 8)}...` : r.title,
        date: r.createdAt ? new Date(r.createdAt).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' }) : `第${idx + 1}次`,
        painLevel: (r.painLevel || 3) * 20, // scaled to 100
        rawPain: r.painLevel || 3,
        evolutionScore: r.evolutionScore || 85,
      }))
      .reverse();
  }, [reviews]);

  // 3. Category distribution
  const categoryStats = useMemo(() => {
    const counts: Record<string, number> = {};
    reviews.forEach((r) => {
      counts[r.category] = (counts[r.category] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({
      name,
      value,
    }));
  }, [reviews]);

  // Key metrics
  const avgEvolution = Math.round(
    reviews.reduce((acc, r) => acc + (r.evolutionScore || 85), 0) / (reviews.length || 1)
  );
  const highPainResolved = reviews.filter((r) => r.painLevel >= 4 && r.step5_execution?.status === 'evolved').length;
  const totalPrinciplesExtracted = reviews.filter((r) => r.step4_design?.extractedPrinciple).length;

  return (
    <div id="analytics-view" className="space-y-6">
      {/* Top metrics bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-stone-200 shadow-2xs">
          <div className="flex items-center justify-between text-stone-400 font-mono text-xs">
            <span>EVOLUTION AVERAGE</span>
            <Award className="w-4 h-4 text-[#C5221F]" />
          </div>
          <div className="text-2xl font-serif font-black text-[#121316] mt-1">
            {avgEvolution} <span className="text-xs font-mono font-normal text-stone-500">/ 100</span>
          </div>
          <p className="text-xs text-stone-500 mt-0.5">平均认知反思进化得分</p>
        </div>

        <div className="bg-white p-4 rounded-lg border border-stone-200 shadow-2xs">
          <div className="flex items-center justify-between text-stone-400 font-mono text-xs">
            <span>PAIN TRANSFORMED</span>
            <Flame className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-serif font-black text-amber-600 mt-1">
            {highPainResolved} <span className="text-xs font-mono font-normal text-stone-500">次突破</span>
          </div>
          <p className="text-xs text-stone-500 mt-0.5">4-5级高痛苦事件成功完成蜕变</p>
        </div>

        <div className="bg-white p-4 rounded-lg border border-stone-200 shadow-2xs">
          <div className="flex items-center justify-between text-stone-400 font-mono text-xs">
            <span>PRINCIPLES EXTRACTED</span>
            <Target className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-serif font-black text-purple-700 mt-1">
            {totalPrinciplesExtracted} <span className="text-xs font-mono font-normal text-stone-500">条原则</span>
          </div>
          <p className="text-xs text-stone-500 mt-0.5">从惨痛教训中沉淀的硬性准则</p>
        </div>

        <div className="bg-white p-4 rounded-lg border border-stone-200 shadow-2xs">
          <div className="flex items-center justify-between text-stone-400 font-mono text-xs">
            <span>TOTAL CYCLES</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-serif font-black text-emerald-700 mt-1">
            {reviews.length} <span className="text-xs font-mono font-normal text-stone-500">轮闭环</span>
          </div>
          <p className="text-xs text-stone-500 mt-0.5">五步循环推演完整记录数</p>
        </div>
      </div>

      {/* Five-Step Emotional Trend & Cognitive Barrier Heatmap */}
      <EmotionHeatmap reviews={reviews} onNewReview={onNewReview} />

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Chart 1: Five Step Competency Radar */}
        <div className="lg:col-span-6 bg-white p-5 rounded-lg border border-stone-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-serif font-bold text-[#121316] text-base">
                达利欧五步循环胜任力雷达
              </h3>
              <p className="text-xs text-stone-500">
                诊断五步中哪一步是你当前的短板（木桶理论：短板决定整体进化上限）
              </p>
            </div>
            <span className="text-xs font-mono text-stone-400">5-STEP RADAR</span>
          </div>

          <div className="h-72 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="#E5E7EB" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#374151', fontSize: 11, fontFamily: 'serif' }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9, fill: '#9CA3AF' }} />
                <Radar
                  name="当前能力得分"
                  dataKey="score"
                  stroke="#C5221F"
                  fill="#C5221F"
                  fillOpacity={0.35}
                />
                <Tooltip
                  formatter={(value: any) => [`${value} 分`, '胜任度']}
                  contentStyle={{ backgroundColor: '#121316', color: '#FAF9F6', borderRadius: '4px', fontSize: '11px' }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <div className="p-3 bg-stone-50 rounded border border-stone-200 text-xs text-stone-600 leading-relaxed">
            <span className="font-bold text-stone-900">达利欧洞察：</span>
            五步流程中的每一个环节都需要不同的心智技能。几乎没有人天生在五项上全部完美无瑕。识别出自己的薄弱步骤，通过团队合作或系统机制予以弥补。
          </div>
        </div>

        {/* Chart 2: Pain + Reflection = Progress Trend */}
        <div className="lg:col-span-6 bg-white p-5 rounded-lg border border-stone-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-serif font-bold text-[#121316] text-base">
                痛苦 + 反思 = 进步 进化轨迹
              </h3>
              <p className="text-xs text-stone-500">
                PAIN LEVEL（痛苦指数） VS EVOLUTION SCORE（进化成果）
              </p>
            </div>
            <span className="text-xs font-mono text-[#C5221F]">P + R = P</span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timelineData}>
                <defs>
                  <linearGradient id="colorEvolution" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorPain" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#C5221F" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#C5221F" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#6B7280' }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#6B7280' }} />
                <Tooltip
                  formatter={(value: any, name: any) => [
                    name === 'evolutionScore' ? `${value}分 (进化)` : `${value / 20}星 (痛苦)`,
                    name === 'evolutionScore' ? '进化得分' : '挫折痛苦',
                  ]}
                  contentStyle={{ backgroundColor: '#121316', color: '#FAF9F6', borderRadius: '4px', fontSize: '11px' }}
                />
                <Legend
                  formatter={(val) => (val === 'evolutionScore' ? '认知进化得分' : '原始痛苦级别(百分制)')}
                  wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }}
                />
                <Area
                  type="monotone"
                  dataKey="evolutionScore"
                  stroke="#10B981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorEvolution)"
                />
                <Area
                  type="monotone"
                  dataKey="painLevel"
                  stroke="#C5221F"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  fillOpacity={1}
                  fill="url(#colorPain)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="p-3 bg-red-50/60 rounded border border-red-100 text-xs text-stone-700 leading-relaxed">
            <span className="font-bold text-[#C5221F]">规律显现：</span>
            剧烈痛苦往往催生最高分值的系统化机制迭代。痛苦不是失败的判决书，而是认知升级的必经试金石。
          </div>
        </div>
      </div>

      {/* Category distribution bar */}
      <div className="bg-white p-5 rounded-lg border border-stone-200 shadow-2xs">
        <h3 className="font-serif font-bold text-[#121316] text-sm mb-3">
          复盘决策场景分布与沉淀密度
        </h3>
        <div className="h-44 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={categoryStats} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#4B5563' }} />
              <YAxis tick={{ fontSize: 11, fill: '#4B5563' }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#121316', color: '#FAF9F6', borderRadius: '4px', fontSize: '11px' }}
              />
              <Bar dataKey="value" fill="#121316" radius={[4, 4, 0, 0]}>
                {categoryStats.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={index % 2 === 0 ? '#121316' : '#C5221F'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
