import React, { useState, useEffect } from 'react';
import { 
  X, 
  ArrowRight, 
  ArrowLeft, 
  Check, 
  Sparkles, 
  Target, 
  AlertTriangle, 
  Search, 
  Sliders, 
  CheckCircle2, 
  Plus, 
  Trash2, 
  Flame, 
  ShieldAlert, 
  BookOpen, 
  HelpCircle,
  Loader2
} from 'lucide-react';
import { ReviewRecord, ReviewCategory, GoalStep, ProblemStep, DiagnosisStep, DesignStep, ExecutionStep } from '../types';
import { requestStepChallenge } from '../lib/api';

interface FiveStepModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (review: Partial<ReviewRecord>) => Promise<void>;
  initialData?: ReviewRecord | null;
  onSavePrincipleFromReview?: (title: string, statement: string, rationale: string, category: ReviewCategory) => void;
}

export const FiveStepModal: React.FC<FiveStepModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  onSavePrincipleFromReview,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ReviewCategory>('工作事业');
  const [tagsInput, setTagsInput] = useState('');
  
  // Step 1: Goals
  const [step1, setStep1] = useState<GoalStep>({
    goalStatement: '',
    priority: 'high',
    desireVsGoalNote: '',
    targetMetric: '',
  });

  // Step 2: Problems
  const [step2, setStep2] = useState<ProblemStep>({
    problemDescription: '',
    severity: 3,
    isTolerated: false,
    painLevel: 4,
    impactScope: '',
  });

  // Step 3: Diagnosis
  const [step3, setStep3] = useState<DiagnosisStep>({
    proximalCause: '',
    rootCause: '',
    egoBarrier: '',
    fiveWhys: ['', '', ''],
  });

  // Step 4: Design
  const [step4, setStep4] = useState<DesignStep>({
    planSteps: [''],
    systemicFix: '',
    extractedPrinciple: '',
  });

  // Step 5: Execution
  const [step5, setStep5] = useState<ExecutionStep>({
    checklist: [{ id: 't-1', task: '', done: false, dueDate: '' }],
    status: 'in_progress',
    reflectionNotes: '',
    evolutionScore: 85,
  });

  // AI Mentor feedback state
  const [aiLoading, setAiLoading] = useState(false);
  const [aiFeedback, setAiFeedback] = useState<{
    criticalQuestion: string;
    dalioQuote: string;
    suggestion: string;
  } | null>(null);

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setCategory(initialData.category);
      setTagsInput(initialData.tags?.join(', ') || '');
      setStep1(initialData.step1_goals || step1);
      setStep2(initialData.step2_problems || step2);
      setStep3(initialData.step3_diagnosis || step3);
      setStep4(initialData.step4_design || step4);
      setStep5(initialData.step5_execution || step5);
      setCurrentStep(1);
      setAiFeedback(null);
    } else {
      resetForm();
    }
  }, [initialData, isOpen]);

  const resetForm = () => {
    setTitle('');
    setCategory('工作事业');
    setTagsInput('');
    setCurrentStep(1);
    setAiFeedback(null);
    setStep1({
      goalStatement: '',
      priority: 'high',
      desireVsGoalNote: '',
      targetMetric: '',
    });
    setStep2({
      problemDescription: '',
      severity: 3,
      isTolerated: false,
      painLevel: 4,
      impactScope: '',
    });
    setStep3({
      proximalCause: '',
      rootCause: '',
      egoBarrier: '',
      fiveWhys: ['', '', ''],
    });
    setStep4({
      planSteps: [''],
      systemicFix: '',
      extractedPrinciple: '',
    });
    setStep5({
      checklist: [{ id: 't-1', task: '', done: false, dueDate: '' }],
      status: 'in_progress',
      reflectionNotes: '',
      evolutionScore: 85,
    });
  };

  if (!isOpen) return null;

  // Handle AI mentor challenge for current step
  const handleTriggerAIChallenge = async () => {
    setAiLoading(true);
    try {
      const stepDataMap: Record<number, any> = {
        1: step1,
        2: step2,
        3: step3,
        4: step4,
        5: step5,
      };

      const result = await requestStepChallenge({
        stepNumber: currentStep,
        stepData: stepDataMap[currentStep],
        fullReview: {
          title,
          category,
          step1_goals: step1,
          step2_problems: step2,
          step3_diagnosis: step3,
          step4_design: step4,
          step5_execution: step5,
        },
      });

      setAiFeedback(result);
    } catch (err) {
      console.error(err);
    } finally {
      setAiLoading(false);
    }
  };

  // 5-Whys handlers
  const handleWhyChange = (index: number, val: string) => {
    const updated = [...step3.fiveWhys];
    updated[index] = val;
    setStep3({ ...step3, fiveWhys: updated });
  };

  const addWhy = () => {
    if (step3.fiveWhys.length < 6) {
      setStep3({ ...step3, fiveWhys: [...step3.fiveWhys, ''] });
    }
  };

  const removeWhy = (index: number) => {
    const updated = step3.fiveWhys.filter((_, i) => i !== index);
    setStep3({ ...step3, fiveWhys: updated });
  };

  // Plan steps handlers
  const handlePlanStepChange = (index: number, val: string) => {
    const updated = [...step4.planSteps];
    updated[index] = val;
    setStep4({ ...step4, planSteps: updated });
  };

  const addPlanStep = () => {
    setStep4({ ...step4, planSteps: [...step4.planSteps, ''] });
  };

  const removePlanStep = (index: number) => {
    setStep4({ ...step4, planSteps: step4.planSteps.filter((_, i) => i !== index) });
  };

  // Checklist handlers
  const handleTaskChange = (index: number, field: string, value: any) => {
    const updated = [...step5.checklist];
    updated[index] = { ...updated[index], [field]: value };
    setStep5({ ...step5, checklist: updated });
  };

  const addTask = () => {
    setStep5({
      ...step5,
      checklist: [
        ...step5.checklist,
        { id: `t-${Date.now()}`, task: '', done: false, dueDate: '' },
      ],
    });
  };

  const removeTask = (index: number) => {
    setStep5({ ...step5, checklist: step5.checklist.filter((_, i) => i !== index) });
  };

  // Save full review
  const handleSubmit = async () => {
    if (!title.trim()) {
      alert('请输入本次复盘任务/事件的标题');
      return;
    }

    setSaving(true);
    try {
      const tags = tagsInput
        .split(/[,， ]+/)
        .map((t) => t.trim())
        .filter(Boolean);

      const reviewPayload: Partial<ReviewRecord> = {
        ...(initialData ? { id: initialData.id } : {}),
        title,
        category,
        tags: tags.length > 0 ? tags : ['达利欧复盘'],
        painLevel: step2.painLevel,
        evolutionScore: step5.evolutionScore,
        step1_goals: step1,
        step2_problems: step2,
        step3_diagnosis: step3,
        step4_design: step4,
        step5_execution: step5,
      };

      await onSave(reviewPayload);

      // Optionally if user created a new principle in Step 4, prompt to save to principles bank
      if (step4.extractedPrinciple.trim() && onSavePrincipleFromReview) {
        onSavePrincipleFromReview(
          `${title} · 沉淀准则`,
          step4.extractedPrinciple,
          step3.rootCause || step3.proximalCause,
          category
        );
      }

      onClose();
    } catch (err) {
      console.error(err);
      alert('保存失败，请检查网络或重试');
    } finally {
      setSaving(false);
    }
  };

  const stepMeta = [
    { num: 1, label: '明确目标', icon: Target, desc: '明确愿景，严禁将欲望误认为目标' },
    { num: 2, label: '暴露问题', icon: AlertTriangle, desc: '决不容忍问题，直视痛苦与障碍' },
    { num: 3, label: '诊断根因', icon: Search, desc: '穿透表面诱因，识别自负障碍与盲点' },
    { num: 4, label: '规划方案', icon: Sliders, desc: '机器化设计，制定防错机制并沉淀原则' },
    { num: 5, label: '坚决执行', icon: CheckCircle2, desc: '清单推进，量化衡量，形成进化闭环' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/65 backdrop-blur-xs overflow-y-auto">
      <div 
        id="five-step-review-modal" 
        className="w-full max-w-4xl bg-[#FAF9F6] border border-[#E8E6DF] rounded-lg shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Modal Topbar */}
        <div className="bg-[#121316] text-[#FAF9F6] px-6 py-4 flex items-center justify-between border-b-2 border-[#C5221F] shrink-0">
          <div className="flex items-center space-x-3">
            <span className="w-6 h-6 rounded bg-[#C5221F] text-white flex items-center justify-center font-bold text-xs">
              {currentStep}
            </span>
            <div>
              <h3 className="font-serif text-base sm:text-lg font-bold">
                {initialData ? '编辑达利欧五步复盘' : '创建达利欧五步循环复盘'}
              </h3>
              <p className="text-xs text-stone-400 font-mono">
                THE 5-STEP PROCESS: GOALS → PROBLEMS → DIAGNOSIS → DESIGN → EXECUTION
              </p>
            </div>
          </div>
          <button
            id="close-five-step-modal-btn"
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-white rounded hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Global Basic Info Bar */}
        <div className="bg-white px-6 py-3 border-b border-stone-200 grid grid-cols-1 md:grid-cols-12 gap-3 shrink-0">
          <div className="md:col-span-6">
            <label className="block text-[11px] font-mono text-stone-500 uppercase tracking-wider mb-1">
              复盘任务 / 决策事件名称 *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例如：核心模块延期交付 / 追高投资失利 / 团队关键成员冲突"
              className="w-full text-sm font-medium px-3 py-1.5 border border-stone-300 rounded focus:border-[#C5221F] focus:outline-hidden"
            />
          </div>

          <div className="md:col-span-3">
            <label className="block text-[11px] font-mono text-stone-500 uppercase tracking-wider mb-1">
              所属领域分类
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ReviewCategory)}
              className="w-full text-xs font-medium px-2.5 py-2 border border-stone-300 rounded bg-white focus:border-[#C5221F] focus:outline-hidden"
            >
              <option value="工作事业">工作事业</option>
              <option value="战略决策">战略决策</option>
              <option value="个人成长">个人成长</option>
              <option value="团队协作">团队协作</option>
              <option value="健康生活">健康生活</option>
            </select>
          </div>

          <div className="md:col-span-3">
            <label className="block text-[11px] font-mono text-stone-500 uppercase tracking-wider mb-1">
              标签（逗号隔开）
            </label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="敏捷, 沟通, 盲点"
              className="w-full text-xs px-2.5 py-1.5 border border-stone-300 rounded focus:border-[#C5221F] focus:outline-hidden"
            />
          </div>
        </div>

        {/* 5-Step Stepper Header */}
        <div className="bg-[#FAF9F6] px-4 sm:px-6 py-2.5 border-b border-stone-200 overflow-x-auto scrollbar-none shrink-0">
          <div className="flex items-center justify-between min-w-[540px]">
            {stepMeta.map((s, idx) => {
              const Icon = s.icon;
              const isActive = currentStep === s.num;
              const isPassed = currentStep > s.num;
              return (
                <div key={s.num} className="flex items-center flex-1 last:flex-none">
                  <button
                    onClick={() => setCurrentStep(s.num)}
                    className={`flex items-center space-x-2 px-2 py-1 rounded transition-colors text-left cursor-pointer ${
                      isActive
                        ? 'bg-[#121316] text-white shadow-xs'
                        : isPassed
                        ? 'text-emerald-800 bg-emerald-50 hover:bg-emerald-100'
                        : 'text-stone-500 hover:text-stone-900 hover:bg-stone-200'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono font-bold ${
                        isActive
                          ? 'bg-[#C5221F] text-white'
                          : isPassed
                          ? 'bg-emerald-600 text-white'
                          : 'bg-stone-300 text-stone-700'
                      }`}
                    >
                      {isPassed ? <Check className="w-3 h-3" /> : s.num}
                    </div>
                    <div>
                      <div className="text-xs font-bold leading-tight">{s.label}</div>
                    </div>
                  </button>

                  {idx < stepMeta.length - 1 && (
                    <div className={`h-[1px] flex-1 mx-2 ${isPassed ? 'bg-emerald-400' : 'bg-stone-300'}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Form Body Scrollable */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-[#FAF9F6]">
          {/* Active Step Subtitle Guidance */}
          <div className="flex items-center justify-between p-3.5 bg-white rounded border-l-4 border-l-[#C5221F] border border-stone-200 shadow-2xs">
            <div>
              <h4 className="font-serif font-bold text-stone-900 text-sm flex items-center space-x-2">
                <span>第 {currentStep} 步：{stepMeta[currentStep - 1].label}</span>
              </h4>
              <p className="text-xs text-stone-600 mt-0.5">
                {stepMeta[currentStep - 1].desc}
              </p>
            </div>

            {/* Dalio AI Challenge Button */}
            <button
              id="dalio-ai-mentor-btn"
              onClick={handleTriggerAIChallenge}
              disabled={aiLoading}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-[#C5221F] rounded border border-red-200 text-xs font-medium cursor-pointer transition-colors shadow-2xs"
              title="呼叫达利欧 AI 导师对本步骤进行极度求真质询"
            >
              {aiLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              <span>{aiLoading ? '达利欧正在推演...' : '达利欧 AI 深度质询'}</span>
            </button>
          </div>

          {/* AI Feedback Card if activated */}
          {aiFeedback && (
            <div className="p-4 bg-red-50/70 border border-red-200 rounded text-xs space-y-2 text-stone-800 animate-in fade-in">
              <div className="flex items-center justify-between font-serif font-bold text-[#C5221F]">
                <span className="flex items-center space-x-1.5">
                  <BookOpen className="w-4 h-4" />
                  <span>达利欧导师实录点拨</span>
                </span>
                <span className="text-[10px] font-mono text-stone-400">RAY DALIO AI MENTOR</span>
              </div>
              <p className="font-serif italic text-stone-700 bg-white/70 p-2.5 rounded border border-red-100">
                {aiFeedback.dalioQuote}
              </p>
              <div className="space-y-1">
                <div className="font-bold text-stone-900">核心灵魂拷问：</div>
                <div className="text-stone-700 leading-relaxed font-medium">
                  {aiFeedback.criticalQuestion}
                </div>
              </div>
              <div className="space-y-1">
                <div className="font-bold text-stone-900">实操建议：</div>
                <div className="text-stone-600 leading-relaxed">{aiFeedback.suggestion}</div>
              </div>
            </div>
          )}

          {/* ================= STEP 1: GOALS ================= */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1">
                  1. 终极目标具体陈述 (Specific Goal) *
                </label>
                <textarea
                  rows={3}
                  value={step1.goalStatement}
                  onChange={(e) => setStep1({ ...step1, goalStatement: e.target.value })}
                  placeholder="清晰地描述你想达成的具体结果，例如：在Q3实现核心模块解耦，零故障交付..."
                  className="w-full text-sm p-3 bg-white border border-stone-300 rounded focus:border-[#C5221F] focus:outline-hidden"
                />
              </div>

              <div className="p-4 bg-amber-50/60 rounded border border-amber-200 space-y-2">
                <label className="block text-xs font-bold text-amber-950 flex items-center space-x-1">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-700" />
                  <span>达利欧核心辨析：欲望 vs 真实目标 (Desire vs Real Goal)</span>
                </label>
                <p className="text-[11px] text-amber-900 leading-relaxed">
                  达利欧特别指出：欲望是一阶结果（如想获得即时赞扬、想偷懒、想证明我是对的），它们往往阻碍你达成高阶真正的终极目标。
                </p>
                <textarea
                  rows={2}
                  value={step1.desireVsGoalNote}
                  onChange={(e) => setStep1({ ...step1, desireVsGoalNote: e.target.value })}
                  placeholder="自我审视：在追求该目标过程中，是否有某些短期欲望/虚荣心在干扰你的长期判断？"
                  className="w-full text-xs p-2.5 bg-white border border-amber-300 rounded focus:border-amber-600 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">
                    优先级排序 (Priority)
                  </label>
                  <select
                    value={step1.priority}
                    onChange={(e) => setStep1({ ...step1, priority: e.target.value as any })}
                    className="w-full text-xs p-2.5 bg-white border border-stone-300 rounded"
                  >
                    <option value="high">核心首要目标 (最高优先级)</option>
                    <option value="medium">重要推进目标 (中优先级)</option>
                    <option value="low">次要辅助目标 (低优先级)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">
                    衡量达标的量化指标 (Target Metric)
                  </label>
                  <input
                    type="text"
                    value={step1.targetMetric}
                    onChange={(e) => setStep1({ ...step1, targetMetric: e.target.value })}
                    placeholder="如：上线准点率100%, 单元测试率>85%"
                    className="w-full text-xs p-2.5 bg-white border border-stone-300 rounded"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ================= STEP 2: PROBLEMS ================= */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1">
                  1. 阻碍达成目标的具体问题或失败阻碍 (The Problem) *
                </label>
                <textarea
                  rows={3}
                  value={step2.problemDescription}
                  onChange={(e) => setStep2({ ...step2, problemDescription: e.target.value })}
                  placeholder="精确且不加掩饰地描述所碰到的问题。达利欧要求：绝不容忍问题，精准识别。"
                  className="w-full text-sm p-3 bg-white border border-stone-300 rounded focus:border-[#C5221F] focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-white rounded border border-stone-200">
                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1 flex items-center space-x-1">
                    <Flame className="w-3.5 h-3.5 text-[#C5221F]" />
                    <span>痛苦指数 (Pain Level: 1-5星)</span>
                  </label>
                  <p className="text-[11px] text-stone-500 mb-2">
                    达利欧：痛苦是你正在碰壁的最真实生理信号，也是进化的起点。
                  </p>
                  <div className="flex items-center space-x-2">
                    {[1, 2, 3, 4, 5].map((lvl) => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => setStep2({ ...step2, painLevel: lvl as any })}
                        className={`w-8 h-8 rounded text-xs font-mono font-bold transition-all cursor-pointer ${
                          step2.painLevel >= lvl
                            ? 'bg-[#C5221F] text-white shadow-xs'
                            : 'bg-stone-100 text-stone-600 border border-stone-300'
                        }`}
                      >
                        {lvl}
                      </button>
                    ))}
                    <span className="text-xs font-mono text-stone-600 ml-2">
                      {step2.painLevel === 5 ? '剧烈重创' : step2.painLevel >= 3 ? '显著挫折' : '轻微不适'}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">
                    是否在无意间“容忍”过该问题？
                  </label>
                  <p className="text-[11px] text-stone-500 mb-2">
                    “发现问题却容忍它，比完全没发现问题还要致命。”
                  </p>
                  <div className="flex items-center space-x-4 pt-1">
                    <label className="flex items-center space-x-1.5 cursor-pointer text-xs">
                      <input
                        type="radio"
                        checked={step2.isTolerated === false}
                        onChange={() => setStep2({ ...step2, isTolerated: false })}
                        className="text-[#C5221F] focus:ring-[#C5221F]"
                      />
                      <span className="font-medium text-emerald-700">绝不容忍，立案深查</span>
                    </label>
                    <label className="flex items-center space-x-1.5 cursor-pointer text-xs">
                      <input
                        type="radio"
                        checked={step2.isTolerated === true}
                        onChange={() => setStep2({ ...step2, isTolerated: true })}
                        className="text-[#C5221F] focus:ring-[#C5221F]"
                      />
                      <span className="text-amber-700">曾心存侥幸/拖延容忍</span>
                    </label>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1">
                  影响范围与损失破坏评估 (Impact Scope)
                </label>
                <input
                  type="text"
                  value={step2.impactScope}
                  onChange={(e) => setStep2({ ...step2, impactScope: e.target.value })}
                  placeholder="如：导致全队通宵排查，延误主线版本发布2周，产生信任赤字"
                  className="w-full text-xs p-2.5 bg-white border border-stone-300 rounded"
                />
              </div>
            </div>
          )}

          {/* ================= STEP 3: DIAGNOSIS ================= */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3.5 bg-stone-100 rounded border border-stone-300 space-y-1.5">
                  <label className="block text-xs font-bold text-stone-700">
                    A. 直接诱因 (Proximal Cause - 表面现象)
                  </label>
                  <p className="text-[11px] text-stone-500">
                    通常是一个具体事件或动作，如“对方突然改接口”、“闹钟没响”、“时间不够”。
                  </p>
                  <textarea
                    rows={2}
                    value={step3.proximalCause}
                    onChange={(e) => setStep3({ ...step3, proximalCause: e.target.value })}
                    placeholder="表面上是什么导致了问题发生？"
                    className="w-full text-xs p-2.5 bg-white border border-stone-300 rounded"
                  />
                </div>

                <div className="p-3.5 bg-red-50/70 rounded border border-red-300 space-y-1.5">
                  <label className="block text-xs font-bold text-[#C5221F]">
                    B. 根本原因 (Root Cause - 机器与心智缺陷) *
                  </label>
                  <p className="text-[11px] text-stone-600">
                    达利欧核心：根因必然深植于“机器的设计漏洞”或“人性的盲点”中。
                  </p>
                  <textarea
                    rows={2}
                    value={step3.rootCause}
                    onChange={(e) => setStep3({ ...step3, rootCause: e.target.value })}
                    placeholder="机器的哪台齿轮坏了？为什么系统未能提前防范？"
                    className="w-full text-xs p-2.5 bg-white border border-red-300 rounded focus:border-[#C5221F] focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Ego barrier self reflection */}
              <div className="p-4 bg-white rounded border border-stone-300 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-stone-900 flex items-center space-x-1.5">
                    <ShieldAlert className="w-4 h-4 text-[#C5221F]" />
                    <span>自负障碍与盲点自白 (The Ego Barrier & Blindspot)</span>
                  </label>
                  <span className="text-[10px] font-mono text-stone-400">极度求真</span>
                </div>
                <p className="text-[11px] text-stone-600 leading-relaxed">
                  达利欧强调两大障碍：自负障碍（害怕承认自己不行、害怕被批评、面子心理）与思维盲点（由于思维结构不同而看不到全貌）。请坦白你的心智障碍：
                </p>
                <textarea
                  rows={2}
                  value={step3.egoBarrier}
                  onChange={(e) => setStep3({ ...step3, egoBarrier: e.target.value })}
                  placeholder="我当时是否有防御心理？是否害怕被看轻？是否执着于“证明自己是对的”而非“探寻客观事实”？"
                  className="w-full text-xs p-2.5 bg-white border border-stone-300 rounded focus:border-[#C5221F] focus:outline-hidden"
                />
              </div>

              {/* 5-Whys Chain */}
              <div className="p-4 bg-stone-50 rounded border border-stone-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-stone-800">
                    5个为什么（5-Whys）深度穿透推导链
                  </label>
                  <button
                    type="button"
                    onClick={addWhy}
                    className="text-xs font-mono text-[#C5221F] hover:underline flex items-center space-x-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>增加一层追问</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {step3.fiveWhys.map((why, idx) => (
                    <div key={idx} className="flex items-center space-x-2">
                      <span className="text-xs font-mono font-bold text-stone-400 w-16 shrink-0">
                        Why {idx + 1}:
                      </span>
                      <input
                        type="text"
                        value={why}
                        onChange={(e) => handleWhyChange(idx, e.target.value)}
                        placeholder={`第 ${idx + 1} 层为什么？进一步挖掘背后的假设或机制缺失...`}
                        className="flex-1 text-xs p-2 bg-white border border-stone-300 rounded"
                      />
                      {step3.fiveWhys.length > 2 && (
                        <button
                          type="button"
                          onClick={() => removeWhy(idx)}
                          className="p-1 text-stone-400 hover:text-red-600"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ================= STEP 4: DESIGN ================= */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <div className="p-4 bg-white rounded border border-stone-300 space-y-2">
                <label className="block text-xs font-bold text-stone-900">
                  1. 机器/系统机制修复 (Systemic Fix & Machine Redesign) *
                </label>
                <p className="text-[11px] text-stone-500">
                  绝不要写“下次我更加注意”这种口号。必须把方案设计成制度、自动化工具、强制闸门或双人复核机制。
                </p>
                <textarea
                  rows={2}
                  value={step4.systemicFix}
                  onChange={(e) => setStep4({ ...step4, systemicFix: e.target.value })}
                  placeholder="例如：建立48小时红线自动化报警机制；设立强制性可信度加权盲审清单..."
                  className="w-full text-xs p-2.5 bg-white border border-stone-300 rounded focus:border-[#C5221F] focus:outline-hidden"
                />
              </div>

              {/* Action Plan steps */}
              <div className="p-4 bg-stone-50 rounded border border-stone-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-stone-800">
                    2. 落地实施方案步骤 (Action Plan Steps)
                  </label>
                  <button
                    type="button"
                    onClick={addPlanStep}
                    className="text-xs font-mono text-[#C5221F] hover:underline flex items-center space-x-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>添加步骤</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {step4.planSteps.map((step, idx) => (
                    <div key={idx} className="flex items-center space-x-2">
                      <span className="text-xs font-mono font-bold text-stone-400 w-12 shrink-0">
                        {idx + 1}.
                      </span>
                      <input
                        type="text"
                        value={step}
                        onChange={(e) => handlePlanStepChange(idx, e.target.value)}
                        placeholder={`步骤 ${idx + 1} 的具体交付物或行为...`}
                        className="flex-1 text-xs p-2 bg-white border border-stone-300 rounded"
                      />
                      {step4.planSteps.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removePlanStep(idx)}
                          className="p-1 text-stone-400 hover:text-red-600"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Distilled Principle */}
              <div className="p-4 bg-stone-900 text-[#FAF9F6] rounded border border-stone-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-serif font-bold text-white flex items-center space-x-1.5">
                    <BookOpen className="w-4 h-4 text-[#C5221F]" />
                    <span>提炼沉淀为个人通用原则 (Extracted Universal Principle)</span>
                  </label>
                  <span className="text-[10px] font-mono text-[#C5221F]">沉淀入原则库</span>
                </div>
                <p className="text-[11px] text-stone-300 leading-relaxed">
                  将此次受挫的惨痛教训，抽象为一句未来面对类似情境时可直接作为行动准则的警句：
                </p>
                <textarea
                  rows={2}
                  value={step4.extractedPrinciple}
                  onChange={(e) => setStep4({ ...step4, extractedPrinciple: e.target.value })}
                  placeholder="例如：原则 3.2：永远不要把对方的口头承诺当做系统依赖，所有关键交付必须前置混沌测试。"
                  className="w-full text-xs p-2.5 bg-stone-800 text-white border border-stone-700 rounded focus:border-[#C5221F] focus:outline-hidden"
                />
              </div>
            </div>
          )}

          {/* ================= STEP 5: EXECUTION ================= */}
          {currentStep === 5 && (
            <div className="space-y-4">
              {/* Checklist */}
              <div className="p-4 bg-white rounded border border-stone-300 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-bold text-stone-900">
                      坚决执行任务清单 (Execution Action Checklist) *
                    </label>
                    <p className="text-[11px] text-stone-500">
                      有条不紊地将方案拆解为可打勾的动作，达利欧：“执行是检验规划的唯一试金石。”
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={addTask}
                    className="text-xs font-mono text-[#C5221F] hover:underline flex items-center space-x-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>新增任务</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {step5.checklist.map((task, idx) => (
                    <div key={task.id || idx} className="flex items-center space-x-2 p-2 bg-stone-50 rounded border border-stone-200">
                      <input
                        type="checkbox"
                        checked={task.done}
                        onChange={(e) => handleTaskChange(idx, 'done', e.target.checked)}
                        className="w-4 h-4 text-[#C5221F] rounded focus:ring-[#C5221F] cursor-pointer"
                      />
                      <input
                        type="text"
                        value={task.task}
                        onChange={(e) => handleTaskChange(idx, 'task', e.target.value)}
                        placeholder="具体待办任务..."
                        className="flex-1 text-xs px-2 py-1 bg-white border border-stone-300 rounded"
                      />
                      <input
                        type="date"
                        value={task.dueDate || ''}
                        onChange={(e) => handleTaskChange(idx, 'dueDate', e.target.value)}
                        className="text-xs px-2 py-1 bg-white border border-stone-300 rounded text-stone-600"
                      />
                      {step5.checklist.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeTask(idx)}
                          className="p-1 text-stone-400 hover:text-red-600 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Status and evolution score */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-stone-50 rounded border border-stone-200">
                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">
                    当前执行闭环状态
                  </label>
                  <select
                    value={step5.status}
                    onChange={(e) => setStep5({ ...step5, status: e.target.value as any })}
                    className="w-full text-xs p-2 bg-white border border-stone-300 rounded"
                  >
                    <option value="in_progress">推进执行中 (In Progress)</option>
                    <option value="completed">任务已全部验收 (Completed)</option>
                    <option value="evolved">已完成机器蜕变与习惯进化 (Evolved)</option>
                    <option value="planning">待启动 (Planning)</option>
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-stone-800">
                      本次复盘认知进化得分 (0-100)
                    </label>
                    <span className="text-xs font-mono font-bold text-[#C5221F]">
                      {step5.evolutionScore} 分
                    </span>
                  </div>
                  <input
                    type="range"
                    min={40}
                    max={100}
                    value={step5.evolutionScore}
                    onChange={(e) => setStep5({ ...step5, evolutionScore: Number(e.target.value) })}
                    className="w-full accent-[#C5221F] cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-stone-400 font-mono mt-1">
                    <span>40 浅尝辄止</span>
                    <span>70 触及机制</span>
                    <span>100 彻底蜕变</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1">
                  反思总结与机器迭代复盘笔记
                </label>
                <textarea
                  rows={3}
                  value={step5.reflectionNotes}
                  onChange={(e) => setStep5({ ...step5, reflectionNotes: e.target.value })}
                  placeholder="记录践行这套方案后的真实心得：你的心理状态发生了什么改变？机器的运转是否比之前更顺畅？"
                  className="w-full text-xs p-3 bg-white border border-stone-300 rounded"
                />
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="bg-stone-100 px-6 py-3 border-t border-stone-200 flex items-center justify-between shrink-0">
          <div>
            {currentStep > 1 && (
              <button
                type="button"
                onClick={() => setCurrentStep((prev) => prev - 1)}
                className="px-3.5 py-1.5 bg-white border border-stone-300 text-stone-700 text-xs font-medium rounded hover:bg-stone-50 flex items-center space-x-1 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>上一步</span>
              </button>
            )}
          </div>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-stone-600 hover:text-stone-900 text-xs font-medium cursor-pointer"
            >
              取消
            </button>

            {currentStep < 5 ? (
              <button
                type="button"
                onClick={() => setCurrentStep((prev) => prev + 1)}
                className="px-4 py-1.5 bg-[#121316] hover:bg-stone-800 text-white text-xs font-medium rounded flex items-center space-x-1 cursor-pointer transition-colors shadow-xs"
              >
                <span>下一步：{stepMeta[currentStep].label}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={saving}
                className="px-5 py-1.5 bg-[#C5221F] hover:bg-[#A81A18] text-white text-xs font-medium rounded flex items-center space-x-1.5 cursor-pointer transition-colors shadow-xs"
              >
                <Check className="w-4 h-4" />
                <span>{saving ? '保存至云端中...' : '完成复盘并同步云端'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
