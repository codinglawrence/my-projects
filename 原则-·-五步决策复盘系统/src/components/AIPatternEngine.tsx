import React, { useState } from 'react';
import { 
  Sparkles, 
  Brain, 
  ShieldAlert, 
  TrendingUp, 
  CheckCircle, 
  Plus, 
  RefreshCw, 
  ArrowRight, 
  BookOpen, 
  Lightbulb, 
  ChevronRight,
  Loader2,
  Check,
  AlertTriangle,
  KeyRound
} from 'lucide-react';
import { AIAnalysisResult, ReviewCategory } from '../types';
import { analyzeLongTermPatterns } from '../lib/api';

interface AIPatternEngineProps {
  initialAnalysis?: AIAnalysisResult | null;
  onSavePrinciple: (title: string, statement: string, rationale: string, category: ReviewCategory) => void;
  reviewCount: number;
}

export const AIPatternEngine: React.FC<AIPatternEngineProps> = ({
  initialAnalysis,
  onSavePrinciple,
  reviewCount,
}) => {
  const [analysis, setAnalysis] = useState<AIAnalysisResult | null>(initialAnalysis || null);
  const [loading, setLoading] = useState(false);
  const [savedPrincipleIndices, setSavedPrincipleIndices] = useState<number[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleRunAnalysis = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await analyzeLongTermPatterns();
      setAnalysis(res);
      setSavedPrincipleIndices([]);
    } catch (err: any) {
      console.error(err);
      const raw = err.message || '';
      if (raw.includes('leaked') || raw.includes('API key was reported as leaked') || raw.includes('PERMISSION_DENIED')) {
        setErrorMsg('您的 GEMINI_API_KEY 已被 Google 安全策略标记泄露并停用（403 PERMISSION_DENIED）。请在右上角平台 Settings 替换为全新 API Key；目前系统已可调用内置高阶原则引擎继续运作。');
      } else {
        setErrorMsg(raw || 'AI 分析生成失败，请重试');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToBank = (item: any, idx: number) => {
    onSavePrinciple(item.title, item.statement, item.rationale, '战略决策');
    setSavedPrincipleIndices((prev) => [...prev, idx]);
  };

  return (
    <div id="ai-pattern-engine-view" className="space-y-6">
      {/* Top Banner */}
      <div className="bg-[#121316] text-[#FAF9F6] p-6 sm:p-7 rounded-lg border-l-4 border-l-[#C5221F] shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center space-x-2 text-[11px] font-mono uppercase tracking-wider text-[#C5221F] bg-red-950/40 px-2.5 py-1 rounded border border-red-900/60">
              <Brain className="w-3.5 h-3.5" />
              <span>GEMINI 3.8 FLASH · LONG-TERM BEHAVIORAL PATTERN AI</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-white tracking-tight">
              跨周期长期行为模式识别与未来决策洞察
            </h2>
            <p className="text-xs sm:text-sm text-stone-300 leading-relaxed font-sans">
              达利欧核心思想：“单次失误只是偶发现象，而长期行为模式揭示了你‘机器’的深层运作逻辑。”
              系统综合你所有的历史复盘，穿透认知盲点，为未来的重大决策提供指导。
            </p>
          </div>

          <div className="shrink-0">
            <button
              id="trigger-ai-analysis-btn"
              onClick={handleRunAnalysis}
              disabled={loading}
              className="px-5 py-2.5 bg-[#C5221F] hover:bg-[#A81A18] text-white text-xs font-semibold rounded flex items-center space-x-2 transition-all cursor-pointer shadow-sm"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>AI 正在全盘推演...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>{analysis ? '重新运行全局 AI 分析' : '启动达利欧 AI 深度模式洞察'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-start space-x-3">
          <ShieldAlert className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-red-900">提示：</p>
            <p className="text-red-700 leading-relaxed">{errorMsg}</p>
          </div>
        </div>
      )}

      {analysis?.keyNotice && (
        <div className="p-4 bg-amber-50/90 border border-amber-200 text-amber-900 text-xs rounded-lg flex items-start space-x-3">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-amber-950 flex items-center space-x-1.5">
              <span>Gemini API Key 安全状态通知</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 bg-amber-200/70 text-amber-900 rounded">HEURISTIC ACTIVE</span>
            </p>
            <p className="text-amber-800 leading-relaxed">{analysis.keyNotice}</p>
            <p className="text-[11px] text-amber-700">
              当前画像已由内置达利欧演进引擎完整生成；如需恢复 Gemini 3.8 全维大模型实时交互，请在右上角平台 Settings 替换有效 API Key。
            </p>
          </div>
        </div>
      )}

      {!analysis && !loading && (
        <div className="bg-white rounded-lg border border-stone-200 p-12 text-center space-y-4">
          <Brain className="w-12 h-12 text-stone-300 mx-auto" />
          <div className="space-y-1">
            <h3 className="font-serif text-base font-bold text-stone-900">
              尚未生成跨周期的 AI 行为模式画像
            </h3>
            <p className="text-xs text-stone-500 max-w-md mx-auto">
              当前云端已收录 {reviewCount} 篇详细的五步复盘记录。点击上方按钮，让达利欧 AI 为你进行全局思维盲点排查与未来决策指导。
            </p>
          </div>
          <button
            onClick={handleRunAnalysis}
            className="px-4 py-2 bg-[#121316] text-white text-xs font-medium rounded hover:bg-stone-800 transition-colors"
          >
            立即启动模式诊断
          </button>
        </div>
      )}

      {loading && (
        <div className="bg-white rounded-lg border border-stone-200 p-12 text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#C5221F] mx-auto" />
          <h4 className="font-serif text-sm font-bold text-stone-900">
            达利欧 AI 正在横向关联你的全部复盘数据...
          </h4>
          <p className="text-xs text-stone-500 max-w-sm mx-auto font-mono">
            分析近因归因漂移率 · 统计自负障碍触发场景 · 萃取未来决策防御清单
          </p>
        </div>
      )}

      {analysis && !loading && (
        <div className="space-y-6">
          {/* Section 1: Long-term Behavioral Patterns */}
          <div className="bg-white rounded-lg border border-stone-200 p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <div>
                <h3 className="font-serif font-bold text-base text-[#121316] flex items-center space-x-2">
                  <span className="w-1.5 h-4 bg-[#C5221F] inline-block"></span>
                  <span>一、识别出的长期行为模式与认知陷阱</span>
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  基于 {analysis.analyzedCount} 篇复盘交叉印证得出的真实心智模型
                </p>
              </div>
              <span className="text-xs font-mono text-stone-400">BEHAVIORAL INVARIANTS</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {analysis.longTermPatterns?.map((pat, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded border space-y-2.5 flex flex-col justify-between ${
                    pat.nature === 'blindspot'
                      ? 'bg-red-50/40 border-red-200'
                      : pat.nature === 'strength'
                      ? 'bg-emerald-50/40 border-emerald-200'
                      : 'bg-amber-50/40 border-amber-200'
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase ${
                          pat.nature === 'blindspot'
                            ? 'bg-red-100 text-red-800'
                            : pat.nature === 'strength'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {pat.nature === 'blindspot'
                          ? '深层盲点'
                          : pat.nature === 'strength'
                          ? '进化优势'
                          : '高频陷阱'}
                      </span>
                      <span className="text-[10px] font-mono text-stone-400">PAT-{idx + 1}</span>
                    </div>

                    <h4 className="font-serif font-bold text-sm text-stone-900">
                      {pat.title}
                    </h4>

                    <p className="text-xs text-stone-600 leading-relaxed">
                      {pat.description}
                    </p>
                  </div>

                  {pat.evidence && pat.evidence.length > 0 && (
                    <div className="pt-2 border-t border-stone-200/60 text-[11px] text-stone-500 space-y-1">
                      <span className="font-mono font-bold text-stone-700 block">复盘证据支撑：</span>
                      {pat.evidence.map((ev, i) => (
                        <div key={i} className="line-clamp-2 italic">
                          • {ev}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: 5-Step Diagnostics */}
          <div className="bg-white rounded-lg border border-stone-200 p-6 shadow-2xs space-y-4">
            <div className="border-b border-stone-200 pb-3">
              <h3 className="font-serif font-bold text-base text-[#121316] flex items-center space-x-2">
                <span className="w-1.5 h-4 bg-[#C5221F] inline-block"></span>
                <span>二、五步循环各环节失衡与精进建议</span>
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                达利欧：绝不可将各步骤混淆（例如在诊断问题时急于提方案，或在设定目标时受制于眼前问题）
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              {analysis.fiveStepDiagnosis?.map((step, idx) => (
                <div key={idx} className="p-3.5 bg-stone-50 rounded border border-stone-200 space-y-2 text-xs">
                  <div className="flex items-center justify-between font-mono">
                    <span className="font-bold text-stone-800">{step.step}阶段</span>
                    <span className="text-xs font-bold text-[#C5221F]">
                      {step.masteryScore} 分
                    </span>
                  </div>

                  <div>
                    <span className="font-bold text-emerald-800 block text-[11px]">优势表现：</span>
                    <p className="text-stone-600 leading-normal">{step.strengths}</p>
                  </div>

                  <div>
                    <span className="font-bold text-red-800 block text-[11px]">潜在漏洞：</span>
                    <p className="text-stone-600 leading-normal">{step.weakness}</p>
                  </div>

                  <div className="pt-2 border-t border-stone-200 font-serif italic text-stone-700 text-[11px]">
                    {step.dalioGuidance}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Future Decision Guidance */}
          <div className="bg-white rounded-lg border border-stone-200 p-6 shadow-2xs space-y-4">
            <div className="border-b border-stone-200 pb-3">
              <h3 className="font-serif font-bold text-base text-[#121316] flex items-center space-x-2">
                <span className="w-1.5 h-4 bg-[#C5221F] inline-block"></span>
                <span>三、面向未来决策的前瞻性防御指南</span>
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                “复盘不仅是过去的墓碑，更是未来决策的航标灯”
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {analysis.futureDecisionGuidance?.map((item, idx) => (
                <div key={idx} className="p-4 bg-stone-50 rounded border border-stone-200 space-y-3 text-xs">
                  <div className="font-serif font-bold text-stone-900 text-sm flex items-center space-x-2">
                    <Lightbulb className="w-4 h-4 text-amber-600" />
                    <span>场景：{item.scenario}</span>
                  </div>

                  <div className="p-2.5 bg-red-50/70 border border-red-200 rounded">
                    <span className="font-bold text-[#C5221F] block">极易复发的认知风险：</span>
                    <p className="text-stone-700 mt-0.5">{item.keyRisk}</p>
                  </div>

                  <div>
                    <span className="font-bold text-stone-800 block">达利欧确定性行动准则：</span>
                    <p className="text-stone-700 font-serif italic mt-0.5">“{item.actionRule}”</p>
                  </div>

                  {item.checkpoints && (
                    <div className="pt-2 border-t border-stone-200 space-y-1">
                      <span className="font-bold text-stone-800 block text-[11px]">决策前必审检查单：</span>
                      {item.checkpoints.map((cp, cIdx) => (
                        <div key={cIdx} className="flex items-start space-x-1.5 text-stone-600 text-[11px]">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{cp}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Section 4: Distilled Principles ready to save */}
          {analysis.suggestedPrinciples && analysis.suggestedPrinciples.length > 0 && (
            <div className="bg-stone-900 text-white rounded-lg p-6 shadow-md space-y-4">
              <div className="flex items-center justify-between border-b border-stone-800 pb-3">
                <div className="flex items-center space-x-2">
                  <BookOpen className="w-5 h-5 text-[#C5221F]" />
                  <div>
                    <h3 className="font-serif font-bold text-base text-white">
                      AI 针对你的行为特征提炼的个性化原则建议
                    </h3>
                    <p className="text-xs text-stone-400">
                      一键收录至你的《个人原则库》，在面对下一次挑战时随时调取
                    </p>
                  </div>
                </div>
                <span className="text-xs font-mono text-[#C5221F]">CODIFIED PRINCIPLES</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {analysis.suggestedPrinciples.map((sp, idx) => {
                  const isSaved = savedPrincipleIndices.includes(idx);
                  return (
                    <div key={idx} className="p-4 bg-stone-800/80 rounded border border-stone-700 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[10px] text-stone-400">建议原则 #{idx + 1}</span>
                        <button
                          onClick={() => handleSaveToBank(sp, idx)}
                          disabled={isSaved}
                          className={`px-2.5 py-1 rounded text-xs font-medium flex items-center space-x-1 transition-colors cursor-pointer ${
                            isSaved
                              ? 'bg-emerald-900 text-emerald-300'
                              : 'bg-[#C5221F] hover:bg-[#A81A18] text-white'
                          }`}
                        >
                          {isSaved ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                          <span>{isSaved ? '已存入原则库' : '存入原则库'}</span>
                        </button>
                      </div>

                      <h4 className="font-serif font-bold text-sm text-white">{sp.title}</h4>
                      <p className="font-serif italic text-stone-300 bg-stone-900 p-2.5 rounded border border-stone-800 leading-relaxed">
                        “{sp.statement}”
                      </p>
                      <p className="text-stone-400 text-[11px]">{sp.rationale}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
