import React, { useState } from 'react';
import { 
  Layers, 
  Sparkles, 
  ShieldAlert, 
  CheckCircle2, 
  HelpCircle, 
  ArrowRight, 
  AlertOctagon, 
  Brain, 
  BookOpen, 
  Scale, 
  Compass,
  Loader2,
  AlertTriangle
} from 'lucide-react';
import { simulateFutureDecision } from '../lib/api';

interface FutureDecisionSandboxProps {
  principlesCount: number;
  reviewsCount: number;
}

export const FutureDecisionSandbox: React.FC<FutureDecisionSandboxProps> = ({
  principlesCount,
  reviewsCount,
}) => {
  const [decisionTitle, setDecisionTitle] = useState('');
  const [context, setContext] = useState('');
  const [options, setOptions] = useState(['选项 A: ', '选项 B: ']);
  const [timeframe, setTimeframe] = useState('未来 3-6 个月');
  const [loading, setLoading] = useState(false);
  const [simulationResult, setSimulationResult] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleOptionChange = (idx: number, val: string) => {
    const updated = [...options];
    updated[idx] = val;
    setOptions(updated);
  };

  const addOption = () => {
    if (options.length < 4) {
      setOptions([...options, `选项 ${String.fromCharCode(65 + options.length)}: `]);
    }
  };

  const handleSimulate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!decisionTitle.trim() || !context.trim()) {
      setErrorMsg('请填写未来决策的主题与背景');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await simulateFutureDecision({
        decisionTitle,
        context,
        options: options.filter(Boolean),
        timeframe,
      });
      setSimulationResult(res);
    } catch (err: any) {
      console.error(err);
      const raw = err.message || '';
      if (raw.includes('leaked') || raw.includes('API key was reported as leaked') || raw.includes('PERMISSION_DENIED')) {
        setErrorMsg('您的 GEMINI_API_KEY 已被 Google 安全策略标记泄露并停用（403 PERMISSION_DENIED）。系统已启用内置事前尸检推演；您可随时在平台 Settings 菜单替换为全新 API Key。');
      } else {
        setErrorMsg(raw || '决策推演失败，请重试');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="future-sandbox-view" className="space-y-6">
      {/* Banner */}
      <div className="bg-[#FAF9F6] border border-[#E8E6DF] rounded-lg p-6 shadow-xs relative overflow-hidden">
        <div className="space-y-1.5 max-w-2xl">
          <div className="inline-flex items-center space-x-2 text-[11px] font-mono uppercase tracking-wider text-[#C5221F] bg-red-50 px-2.5 py-0.5 rounded border border-red-100">
            <Scale className="w-3.5 h-3.5" />
            <span>DALIO PRE-MORTEM & DECISION SANDBOX</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#121316]">
            未来决策推演沙盘（前瞻性指导）
          </h2>
          <p className="text-xs sm:text-sm text-stone-600 leading-relaxed font-sans">
            达利欧：“在你做出决策之前，先进行一次‘事前尸检’（Pre-Mortem）。想象未来已经彻底失败，借由你历史复盘中的盲点与原则，倒推最可能的根因并设置预防闸门。”
          </p>
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

      {simulationResult?.keyNotice && (
        <div className="p-4 bg-amber-50/90 border border-amber-200 text-amber-900 text-xs rounded-lg flex items-start space-x-3">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-amber-950 flex items-center space-x-1.5">
              <span>Gemini API Key 安全状态通知</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 bg-amber-200/70 text-amber-900 rounded">HEURISTIC ACTIVE</span>
            </p>
            <p className="text-amber-800 leading-relaxed">{simulationResult.keyNotice}</p>
            <p className="text-[11px] text-amber-700">
              当前事前尸检推演已由内置达利欧规则引擎生成；如需恢复 Gemini 3.8 大模型实时推理，请在平台 Settings 菜单更新全新 API Key。
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form: Decision Formulation */}
        <div className="lg:col-span-5 bg-white p-6 rounded-lg border border-stone-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-stone-200 pb-3">
            <h3 className="font-serif font-bold text-base text-[#121316] flex items-center space-x-2">
              <Compass className="w-4 h-4 text-[#C5221F]" />
              <span>输入你面临的重大决策</span>
            </h3>
            <span className="text-xs font-mono text-stone-400">INPUT MATRIX</span>
          </div>

          <form onSubmit={handleSimulate} className="space-y-3.5 text-xs">
            <div>
              <label className="block font-bold text-stone-800 mb-1">
                决策主题 / 纠结抉择 *
              </label>
              <input
                type="text"
                value={decisionTitle}
                onChange={(e) => setDecisionTitle(e.target.value)}
                placeholder="例如：是否投入50万启动全新独立产品线 / 是否更换核心合伙人"
                className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded focus:bg-white focus:border-[#C5221F] focus:outline-hidden text-sm"
              />
            </div>

            <div>
              <label className="block font-bold text-stone-800 mb-1">
                背景细节与当前顾虑 *
              </label>
              <textarea
                rows={4}
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder="描述当前事实状况、核心不确定性、以及你在权衡时内心的顾虑与直觉..."
                className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded focus:bg-white focus:border-[#C5221F] focus:outline-hidden"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-bold text-stone-800">备选方案分支</label>
                {options.length < 4 && (
                  <button
                    type="button"
                    onClick={addOption}
                    className="text-xs text-[#C5221F] hover:underline font-mono"
                  >
                    + 增加分支
                  </button>
                )}
              </div>
              <div className="space-y-2">
                {options.map((opt, idx) => (
                  <input
                    key={idx}
                    type="text"
                    value={opt}
                    onChange={(e) => handleOptionChange(idx, e.target.value)}
                    className="w-full p-2 bg-white border border-stone-300 rounded"
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="block font-bold text-stone-800 mb-1">评估时间周期</label>
              <select
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value)}
                className="w-full p-2 bg-white border border-stone-300 rounded"
              >
                <option value="未来 1 个月内">未来 1 个月内 (敏捷短线)</option>
                <option value="未来 3-6 个月">未来 3-6 个月 (中期阶段)</option>
                <option value="未来 1-3 年">未来 1-3 年 (长期战略)</option>
              </select>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-[#121316] hover:bg-stone-800 text-white font-medium rounded flex items-center justify-center space-x-2 transition-colors cursor-pointer shadow-xs"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-[#C5221F]" />
                    <span>达利欧沙盘推演中...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-[#C5221F]" />
                    <span>基于历史复盘运行事前尸检沙盘</span>
                  </>
                )}
              </button>
              <p className="text-[10px] text-stone-400 font-mono text-center mt-1.5">
                结合云端 {reviewsCount} 份复盘教训与 {principlesCount} 条原则进行多维度压力测试
              </p>
            </div>
          </form>
        </div>

        {/* Right Output: Dalio Pre-Mortem Result */}
        <div className="lg:col-span-7 space-y-4">
          {!simulationResult && !loading && (
            <div className="bg-white rounded-lg border border-stone-200 p-12 text-center space-y-3 h-full flex flex-col items-center justify-center">
              <Scale className="w-12 h-12 text-stone-300" />
              <h4 className="font-serif font-bold text-stone-800 text-base">
                等待输入决策并启动推演
              </h4>
              <p className="text-xs text-stone-500 max-w-sm">
                达利欧推演引擎将模拟极端恶劣场景，揭示你是否在重犯过去的“盲目乐观”或“近因偏差”，并给出可信度加权决策建议。
              </p>
            </div>
          )}

          {loading && (
            <div className="bg-white rounded-lg border border-stone-200 p-12 text-center space-y-3 h-full flex flex-col items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-[#C5221F]" />
              <h4 className="font-serif font-bold text-stone-800 text-sm">
                达利欧正在模拟最坏情景（Pre-Mortem）...
              </h4>
              <p className="text-xs text-stone-400 font-mono">
                检索历史盲点相似度 · 审查个人原则抵触度 · 制定前置风控闸门
              </p>
            </div>
          )}

          {simulationResult && !loading && (
            <div className="bg-white rounded-lg border border-stone-200 p-6 shadow-2xs space-y-5 animate-in fade-in">
              {/* Executive Summary */}
              <div className="p-4 bg-[#121316] text-[#FAF9F6] rounded border-l-4 border-l-[#C5221F] space-y-2">
                <div className="flex items-center justify-between text-xs font-mono text-[#C5221F]">
                  <span className="font-bold flex items-center space-x-1">
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>达利欧事前尸检高阶评述</span>
                  </span>
                  <span>PRE-MORTEM EXECUTIVE AUDIT</span>
                </div>
                <p className="text-xs sm:text-sm text-stone-200 font-serif leading-relaxed">
                  {simulationResult.executiveSummary}
                </p>
              </div>

              {/* Matched Past Lessons */}
              {simulationResult.pastLessonsMatched && (
                <div className="p-4 bg-stone-50 rounded border border-stone-200 space-y-2 text-xs">
                  <span className="font-bold text-stone-900 block flex items-center space-x-1.5">
                    <Brain className="w-4 h-4 text-purple-600" />
                    <span>与历史复盘教训的关联性印证：</span>
                  </span>
                  <div className="space-y-1">
                    {simulationResult.pastLessonsMatched.map((lesson: string, idx: number) => (
                      <div key={idx} className="flex items-start space-x-2 text-stone-700">
                        <span className="text-[#C5221F] font-bold">•</span>
                        <span>{lesson}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Failure Modes & Preventions */}
              <div className="space-y-3">
                <h4 className="font-serif font-bold text-stone-900 text-sm flex items-center space-x-2">
                  <AlertOctagon className="w-4 h-4 text-[#C5221F]" />
                  <span>事前尸检：如果一年后彻底失败，极可能是因为什么？</span>
                </h4>

                <div className="space-y-3 text-xs">
                  {simulationResult.preMortemFailures?.map((fail: any, idx: number) => (
                    <div key={idx} className="p-4 bg-red-50/60 rounded border border-red-200 space-y-2">
                      <div className="font-bold text-red-900 flex items-center space-x-1.5">
                        <span>悲观情景推演 #{idx + 1}：</span>
                        <span>{fail.failureMode}</span>
                      </div>
                      <div className="text-stone-700">
                        <strong className="text-stone-900">根因预测：</strong>
                        {fail.rootCausePrediction}
                      </div>
                      <div className="p-2 bg-white rounded border border-red-100 text-emerald-800">
                        <strong className="text-emerald-950">现在就必须设立的防范机制：</strong>
                        <p className="mt-0.5 italic">{fail.preventionTactic}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Dalio Scorecard */}
              {simulationResult.dalioScorecard && (
                <div className="p-4 bg-stone-50 rounded border border-stone-200 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-stone-400 font-mono block text-[10px]">盲点暴露风险等级</span>
                    <span className="text-base font-serif font-bold text-[#C5221F]">
                      {simulationResult.dalioScorecard.blindspotRisk}
                    </span>
                  </div>
                  <div>
                    <span className="text-stone-400 font-mono block text-[10px]">推荐的权衡方向</span>
                    <span className="text-xs font-bold text-stone-800">
                      {simulationResult.dalioScorecard.recommendedOption}
                    </span>
                  </div>
                  <div className="sm:col-span-2 pt-2 border-t border-stone-200">
                    <span className="text-stone-500 font-bold block mb-1">
                      可信度加权建议（Credibility-Weighted Decision Advice）：
                    </span>
                    <p className="text-stone-700 leading-relaxed font-serif">
                      {simulationResult.dalioScorecard.credibilityWeightedAdvice}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
