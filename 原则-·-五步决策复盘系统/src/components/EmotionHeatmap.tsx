import React, { useState, useMemo } from 'react';
import { 
  HeartPulse, 
  Brain, 
  ShieldAlert, 
  Flame, 
  Sparkles, 
  AlertTriangle, 
  CheckCircle2, 
  Eye, 
  HelpCircle, 
  ArrowRight,
  TrendingDown,
  TrendingUp,
  Activity,
  Layers,
  ChevronRight
} from 'lucide-react';
import { ReviewRecord } from '../types';

interface EmotionHeatmapProps {
  reviews: ReviewRecord[];
  onNewReview?: () => void;
}

// Five Steps definition in Dalio's method
const FIVE_STEPS = [
  { id: 'step1', name: '第 1 步 · 明确目标', code: 'GOALS', desc: '分清真实高阶目标与一阶欲望诱惑' },
  { id: 'step2', name: '第 2 步 · 暴露问题', code: 'PROBLEMS', desc: '直面残酷挫折痛感，绝不容忍问题' },
  { id: 'step3', name: '第 3 步 · 诊断根因', code: 'DIAGNOSIS', desc: '穿透自负障碍与盲点，深挖机器缺陷' },
  { id: 'step4', name: '第 4 步 · 机制规划', code: 'DESIGN', desc: '跳脱自我化身工程师，设计防错机制' },
  { id: 'step5', name: '第 5 步 · 坚决执行', code: 'EXECUTION', desc: '克服惰性与知行脱节，完成认知进化' },
];

// Five Psychological & Emotional Dimensions
const EMOTION_DIMENSIONS = [
  {
    id: 'desire',
    name: '欲望诱惑与冲动',
    english: 'Desire Trap & Impulsiveness',
    type: 'negative',
    icon: Flame,
    color: '#D97706', // amber
    desc: '被短期享乐/即时满足/贪念绑架，混淆真实高阶产出与瞬时渴望。',
  },
  {
    id: 'pain',
    name: '挫折刺痛与焦虑',
    english: 'Visceral Pain & Anxiety',
    type: 'negative',
    icon: AlertTriangle,
    color: '#DC2626', // red
    desc: '遭遇现实撞击后的生理性挫败、恼怒与焦虑。达利欧提示：痛苦是认知的警报器。',
  },
  {
    id: 'ego',
    name: '自负防御与抵触',
    english: 'Ego Barrier & Defensiveness',
    type: 'barrier',
    icon: ShieldAlert,
    color: '#C5221F', // dalio crimson
    desc: '下丘脑杏仁核防御，害怕承认无知与犯错，归咎外部环境而非自身机器缺陷。',
  },
  {
    id: 'rational',
    name: '系统理性与克制',
    english: 'Systemic Calm & Rationality',
    type: 'positive',
    icon: Brain,
    color: '#2563EB', // blue
    desc: '前额叶皮层接管，像机器设计者一样冷酷、客观、结构化地拆解现实规律。',
  },
  {
    id: 'evolution',
    name: '掌控笃定与进化',
    english: 'Resolved Agency & Evolution',
    type: 'positive',
    icon: CheckCircle2,
    color: '#059669', // emerald
    desc: '痛苦被反思彻底消化，转化为硬性原则与闭环行动力，心智达到全新稳态。',
  },
];

export const EmotionHeatmap: React.FC<EmotionHeatmapProps> = ({ reviews, onNewReview }) => {
  const [viewMode, setViewMode] = useState<'matrix' | 'timeline'>('matrix');
  const [selectedCell, setSelectedCell] = useState<{ stepIdx: number; dimId: string } | null>({
    stepIdx: 2, // Default to Step 3 Diagnosis - Ego Barrier
    dimId: 'ego',
  });

  // Calculate dynamic matrix data based on real reviews
  const heatmapMatrix = useMemo(() => {
    // Baseline heuristic values if no reviews
    const base = [
      // Step 1: Goals
      { desire: 72, pain: 20, ego: 32, rational: 55, evolution: 45 },
      // Step 2: Problems
      { desire: 18, pain: 84, ego: 58, rational: 35, evolution: 25 },
      // Step 3: Diagnosis
      { desire: 15, pain: 65, ego: 86, rational: 62, evolution: 60 },
      // Step 4: Design
      { desire: 16, pain: 24, ego: 28, rational: 88, evolution: 78 },
      // Step 5: Execution
      { desire: 42, pain: 36, ego: 22, rational: 82, evolution: 89 },
    ];

    if (reviews.length === 0) return base;

    // Adjust based on real review metrics
    const avgPain = reviews.reduce((acc, r) => acc + (r.painLevel || 3), 0) / reviews.length; // 1-5
    const painFactor = avgPain / 3; // ~0.5 to 1.6

    const toleratedRatio = reviews.filter((r) => r.step2_problems?.isTolerated).length / reviews.length;
    const desireRatio = reviews.filter((r) => r.step1_goals?.desireVsGoalNote?.length > 5).length / reviews.length;
    const egoNotesCount = reviews.filter((r) => r.step3_diagnosis?.egoBarrier?.length > 8).length;
    const avgEvolution = reviews.reduce((acc, r) => acc + (r.evolutionScore || 80), 0) / reviews.length; // 0-100

    const adjusted = [...base];

    // Step 1 adjustments
    adjusted[0].desire = Math.min(95, Math.round(55 + desireRatio * 40));
    adjusted[0].rational = Math.min(90, Math.round(50 + (1 - desireRatio) * 35));

    // Step 2 adjustments
    adjusted[1].pain = Math.min(98, Math.round(45 + avgPain * 10));
    adjusted[1].ego = Math.min(90, Math.round(45 + toleratedRatio * 45)); // Tolerating problems signals ego fear

    // Step 3 adjustments
    adjusted[2].ego = Math.min(96, Math.round(60 + (egoNotesCount / reviews.length) * 35));
    adjusted[2].pain = Math.min(90, Math.round(40 + avgPain * 7));

    // Step 4 adjustments
    adjusted[3].rational = Math.min(98, Math.round(70 + (reviews.filter(r => r.step4_design?.systemicFix).length / reviews.length) * 25));

    // Step 5 adjustments
    adjusted[4].evolution = Math.min(98, Math.round(avgEvolution));
    const completionRate = reviews.reduce((acc, r) => {
      const list = r.step5_execution?.checklist || [];
      const done = list.filter(t => t.done).length;
      return acc + (list.length > 0 ? done / list.length : 0.7);
    }, 0) / reviews.length;
    adjusted[4].desire = Math.min(80, Math.round(60 - completionRate * 40)); // higher completion = lower desire trap

    return adjusted;
  }, [reviews]);

  // Selected cell detail helper
  const cellDetail = useMemo(() => {
    if (!selectedCell) return null;
    const step = FIVE_STEPS[selectedCell.stepIdx];
    const dim = EMOTION_DIMENSIONS.find((d) => d.id === selectedCell.dimId);
    if (!step || !dim) return null;

    const value = heatmapMatrix[selectedCell.stepIdx]?.[selectedCell.dimId as keyof typeof heatmapMatrix[0]] || 0;

    // Detailed psychological barrier profiles & Dalio prescriptions
    const barrierAnalysisMap: Record<string, Record<string, {
      subconsciousPattern: string;
      internalDialogue: string;
      dalioPrescription: string;
      mindMechanism: string;
      severityLevel: '极高' | '中高' | '可控' | '稳态';
    }>> = {
      step1: {
        desire: {
          subconsciousPattern: '把“一阶即时诱惑”（欲望）错当成“高阶战略目标”（目标）。追求短暂的虚荣、快感或轻松，忽视长期复利代价。',
          internalDialogue: '“这个机会看起来太诱人了，我必须全都要，哪怕它偏离了主线。”',
          dalioPrescription: '《原则》法则：“你可以拥有你想要的一切，但你不能同时拥有一切。”严格设立一阶诱惑排他清单。',
          mindMechanism: '多巴胺奖励回路诱发亢奋冲动，抑制额叶的长期因果权衡。',
          severityLevel: '极高',
        },
        pain: {
          subconsciousPattern: '在设定目标时因担心做不到而产生的前置焦虑与目标拖延。',
          internalDialogue: '“如果定太高没完成岂不是证明自己无能？还是定个安全但平庸的吧。”',
          dalioPrescription: '“不要为没有达到的目标感到羞愧，羞愧只属于那些不去勇敢追求的人。”',
          mindMechanism: '杏仁核预演失败痛苦，诱使人停留在安全舒适区。',
          severityLevel: '可控',
        },
        ego: {
          subconsciousPattern: '将个人价值捆绑在“必须设立让别人崇拜的宏大愿景”上，而非客观需要。',
          internalDialogue: '“我必须做出一个惊人的成绩让质疑我的人闭嘴。”',
          dalioPrescription: '剥离虚荣心。目标应当来自极度真实的现实规律，而非给自负提供燃料。',
          mindMechanism: '自尊防御引发的情感膨胀。',
          severityLevel: '中高',
        },
        rational: {
          subconsciousPattern: '清晰厘清目标指标与优先级，能冷酷区分欲望与目标。',
          internalDialogue: '“这就是唯一关键北极星指标，其他干扰项一概舍弃。”',
          dalioPrescription: '保持高阶思维（Higher-Level Thinking），站在高处审视机器的目标设定。',
          mindMechanism: '前额叶认知控制处于主导。',
          severityLevel: '稳态',
        },
        evolution: {
          subconsciousPattern: '对目标的本质具有笃定感，明白达成的长周期规律。',
          internalDialogue: '“这是对的因果链条，按照机器运作逻辑稳步推进。”',
          dalioPrescription: '坚信客观规律的力量，循序渐进。',
          mindMechanism: '认知模型与现实高度拟合。',
          severityLevel: '稳态',
        }
      },
      step2: {
        desire: {
          subconsciousPattern: '急于直接寻找解决方案（跳步骤），不愿花时间在残酷问题本身上停留。',
          internalDialogue: '“行了我知道出错了，赶紧做点什么修补一下，别老抓着错误不放！”',
          dalioPrescription: '《原则》严厉禁止：“绝不能在没有彻底看清问题之前就跳到第4步设计方案！”',
          mindMechanism: '回避痛苦的本能驱动认知早闭（Cognitive Closure）。',
          severityLevel: '中高',
        },
        pain: {
          subconsciousPattern: '面对失利、亏损或错误的生理性刺痛。容易转化为消极沮丧或自怨自艾。',
          internalDialogue: '“为什么又搞砸了？这简直是一场噩梦，我根本承受不了这个打击。”',
          dalioPrescription: '达利欧核心心法：“痛苦 + 反思 = 进步。把痛苦当成大自然送给你的礼物，它是神经元进化的天然信号！”',
          mindMechanism: '岛叶皮层与边缘系统被激活，产生等同于生理创伤的神经反应。',
          severityLevel: '极高',
        },
        ego: {
          subconsciousPattern: '【容忍问题障碍】因害怕暴露出自己的缺陷或团队的问题，下意识粉饰太平、拖延直面。',
          internalDialogue: '“这只是个小插曲，大家别小题大做，过几天自然就好了。”',
          dalioPrescription: '“决不能容忍问题！容忍一个微小的隐患，等同于在机器内部埋下一枚延时炸弹。”',
          mindMechanism: '防御机制通过否认现实（Denial）来保护脆弱的自尊。',
          severityLevel: '极高',
        },
        rational: {
          subconsciousPattern: '客观记录事实与偏离指标的客观差距，不附加情绪批判。',
          internalDialogue: '“发生了偏离预期的结果。这是事实，记录下数据，开始排查。”',
          dalioPrescription: '极度求真：做一个无情的现实观察者，事实不会因为你的喜欢与否而改变。',
          mindMechanism: '情绪与认知解耦，客观观察者视角生效。',
          severityLevel: '稳态',
        },
        evolution: {
          subconsciousPattern: '敏锐嗅到问题时的兴奋感，明白又有一次系统升级的机会。',
          internalDialogue: '“太好了，我们找到了一个隐形缺陷，把它修复后机器会更强。”',
          dalioPrescription: '反脆弱心智：真正的高手会主动寻找问题，而非躲避问题。',
          mindMechanism: '将压力重构为挑战（Cognitive Reappraisal）。',
          severityLevel: '稳态',
        }
      },
      step3: {
        desire: {
          subconsciousPattern: '急于把责任草草归结为最容易甩锅的表面原因，以便快速恢复内心的平静。',
          internalDialogue: '“都是因为供应商迟到/下属不用心，下次换一个就行了。”',
          dalioPrescription: '“永远不要把直接诱因（Proximal Cause）误当成根本原因（Root Cause）！”',
          mindMechanism: '认知捷径贪恋心理安全感。',
          severityLevel: '中高',
        },
        pain: {
          subconsciousPattern: '深挖发现原来是自己心智、性格或认知上的深层缺陷时产生的严重受挫感。',
          internalDialogue: '“原来是我一直太盲目自大了……面对这个真相真让人难堪。”',
          dalioPrescription: '“坦然面对自己的弱点是通向卓越的第一步。如果你不能看清自己的盲点，你就会一再撞墙。”',
          mindMechanism: '自我认知破裂带来的存在焦虑。',
          severityLevel: '极高',
        },
        ego: {
          subconsciousPattern: '【核心自负障碍 (The Ego Barrier)】大脑下丘脑的自我防御反射。拼命为错误找借口，执着于“证明自己是对的”而非“探求客观事实”。',
          internalDialogue: '“我的逻辑明明没有错，是市场太变态/别人理解不了我！”',
          dalioPrescription: '“自负障碍是大多数人一生平庸的根本病因。在桥水，极度开放心智（Radical Open-mindedness）意味着随时准备杀死心中的自我偏执。”',
          mindMechanism: '双重大脑冲突：较原始的下丘脑情绪脑试图保护自负，压制了理性的前额叶。',
          severityLevel: '极高',
        },
        rational: {
          subconsciousPattern: '采用 5-Whys 深度穿透，将人与问题剥离，只针对机器零件做根因溯源。',
          internalDialogue: '“在这个场景下，机器的哪个反馈回路失效了？为什么会做出这个次优决策？”',
          dalioPrescription: '把你当成一个机器操作员，站在机器之外，冷静地排查故障点。',
          mindMechanism: '元认知监控（Metacognition）全面主导。',
          severityLevel: '稳态',
        },
        evolution: {
          subconsciousPattern: '谦逊接纳盲点，感到顿悟并卸下了维护虚荣的沉重包袱。',
          internalDialogue: '“看清了这个盲区，太值得了，以后我再也不会在这个坑里跌倒。”',
          dalioPrescription: '心智蜕变的转折点：发现真相的喜悦远远超越了证明自己正确的虚荣。',
          mindMechanism: '神经可塑性重构完成，心理韧性提升。',
          severityLevel: '稳态',
        }
      },
      step4: {
        desire: {
          subconsciousPattern: '过度依赖“意志力与决心”，设计出反人性的空中楼阁式方案。',
          internalDialogue: '“以后我只要更努力、更专注一点就不会再犯了！”',
          dalioPrescription: '“好习惯不是靠意志力维持的，而是靠坚不可摧的机制与制度！不要相信口头承诺，要相信机制约束。”',
          mindMechanism: '盲目乐观偏见与意志力耗竭错觉。',
          severityLevel: '中高',
        },
        pain: {
          subconsciousPattern: '意识到必须修改既有工作流或放弃原有特权时的心理阻抗。',
          internalDialogue: '“加上这个审批流程或者强制检查清单太麻烦了，太限制我了。”',
          dalioPrescription: '“自由不是无序。一流的流程机制正是保护你免于致命灾难的护城河。”',
          mindMechanism: '现状偏见（Status Quo Bias）与损失厌恶。',
          severityLevel: '中高',
        },
        ego: {
          subconsciousPattern: '拒绝采纳他人的更好建议，坚持要用自己原汁原味的做法。',
          internalDialogue: '“我为什么要用别人的规矩？我自己的一套方法才是最棒的。”',
          dalioPrescription: '“有见识的人绝不在意好的想法来自谁，他们只在意这个方案是否符合现实逻辑。”',
          mindMechanism: '虚荣所有权偏见（IKEA Effect / Not Invented Here）。',
          severityLevel: '中高',
        },
        rational: {
          subconsciousPattern: '构建清晰的“如果-那么”（If-Then）防错算法，沉淀为通用原则。',
          internalDialogue: '“建立硬性物理防线：当出现指标异动时，系统自动锁定并触发二次复核。”',
          dalioPrescription: '“把你的决策准则系统化、算法化，让机器即使没有你的即时关注也能健康运转。”',
          mindMechanism: '高阶系统思考与算法化架构能力。',
          severityLevel: '稳态',
        },
        evolution: {
          subconsciousPattern: '对机制落地拥有从容底气，提炼出可跨越行业与周期的通用原则。',
          internalDialogue: '“原则已沉淀到原则库，未来遇到类似情境直接调用成熟策略。”',
          dalioPrescription: '原则是应对现实的最高效率武器，它让你不再需要从零纠结。',
          mindMechanism: '程序性记忆与心智模式固化。',
          severityLevel: '稳态',
        }
      },
      step5: {
        desire: {
          subconsciousPattern: '在执行阶段面对即时享乐或安逸诱惑，知行脱节，重回旧轨道。',
          internalDialogue: '“今天太累了，明天再按照新机制执行吧，一次偷懒不要紧。”',
          dalioPrescription: '“有伟大的计划却没有无情的执行，等同于一无所获。自律是用高阶目标约束一阶诱惑的机器。”',
          mindMechanism: '时间贴现偏见（Present Bias）造成意志力塌方。',
          severityLevel: '极高',
        },
        pain: {
          subconsciousPattern: '改变肌肉记忆与旧思维定势过程中的刻意练习之痛。',
          internalDialogue: '“这种新方法真别扭，效率好像还不如我过去的习惯呢。”',
          dalioPrescription: '“进化总是伴随着阻力。当感到别扭时，说明你的大脑正在长出新的神经连接。”',
          mindMechanism: '旧有神经回路修剪重塑引发的生理摩擦。',
          severityLevel: '中高',
        },
        ego: {
          subconsciousPattern: '当执行遇到挫折时试图证明是新机制有问题，放弃迭代。',
          internalDialogue: '“看吧，按照那个原则做根本不行，还不如我随性发挥。”',
          dalioPrescription: '严格区分机制缺陷与执行不力。不要让借口成为阻碍进化的理由。',
          mindMechanism: '证实偏见（Confirmation Bias）试图挽回自尊。',
          severityLevel: '中高',
        },
        rational: {
          subconsciousPattern: '拆解为无情打勾的执行清单，每日测量进度与指标偏离。',
          internalDialogue: '“清单清晰，按部就班推进，用数据和结果检验落地成效。”',
          dalioPrescription: '“建立有衡量标准的任务清单，让执行变得不可辩驳、极度透明。”',
          mindMechanism: '执行功能与监控回路高效运转。',
          severityLevel: '稳态',
        },
        evolution: {
          subconsciousPattern: '彻底完成五步闭环蜕变，复盘得分转化为强大的认知护城河。',
          internalDialogue: '“机器运转良好，旧弱点已被封堵，自我完成了一次本质进化。”',
          dalioPrescription: '“这就是生活的美妙之处：在追求目标中不断撞墙、反思、进化，攀登更高的山峰。”',
          mindMechanism: '掌控感（Sense of Mastery）神经回路强化。',
          severityLevel: '稳态',
        }
      }
    };

    const specific = barrierAnalysisMap[step.id]?.[dim.id] || {
      subconsciousPattern: '执行过程中心智模式的周期性波动。',
      internalDialogue: '正在对齐现实与认知……',
      dalioPrescription: '保持极度求真与极度透明，用机器化思维审视。',
      mindMechanism: '大脑边缘系统与前额叶皮层博弈。',
      severityLevel: '中高',
    };

    return {
      step,
      dim,
      value,
      ...specific,
    };
  }, [selectedCell, heatmapMatrix]);

  // Overall psychological bottleneck summary
  const summaryInsight = useMemo(() => {
    // Find the highest negative emotion / barrier cell
    let maxVal = -1;
    let bottleneckStep = FIVE_STEPS[2];
    let bottleneckDim = EMOTION_DIMENSIONS[2];

    FIVE_STEPS.forEach((step, sIdx) => {
      EMOTION_DIMENSIONS.filter(d => d.type !== 'positive').forEach(dim => {
        const val = heatmapMatrix[sIdx]?.[dim.id as keyof typeof heatmapMatrix[0]] || 0;
        if (val > maxVal) {
          maxVal = val;
          bottleneckStep = step;
          bottleneckDim = dim;
        }
      });
    });

    return {
      step: bottleneckStep,
      dimension: bottleneckDim,
      intensity: maxVal,
    };
  }, [heatmapMatrix]);

  // Heat cell color calculation
  const getCellBgColor = (stepIdx: number, dimId: string) => {
    const val = heatmapMatrix[stepIdx]?.[dimId as keyof typeof heatmapMatrix[0]] || 0;
    const isSelected = selectedCell?.stepIdx === stepIdx && selectedCell?.dimId === dimId;

    if (dimId === 'ego') {
      // Crimson scale for ego barrier
      if (val >= 80) return 'bg-[#C5221F] text-white';
      if (val >= 60) return 'bg-red-500 text-white';
      if (val >= 40) return 'bg-red-200 text-red-950';
      return 'bg-red-50 text-red-900';
    }

    if (dimId === 'pain') {
      // Vivid Red-Orange scale for pain
      if (val >= 80) return 'bg-red-600 text-white';
      if (val >= 60) return 'bg-orange-500 text-white';
      if (val >= 40) return 'bg-orange-200 text-orange-950';
      return 'bg-orange-50 text-orange-900';
    }

    if (dimId === 'desire') {
      // Amber/Yellow scale for desire trap
      if (val >= 70) return 'bg-amber-500 text-white';
      if (val >= 45) return 'bg-amber-300 text-amber-950';
      if (val >= 25) return 'bg-amber-100 text-amber-900';
      return 'bg-stone-100 text-stone-700';
    }

    if (dimId === 'rational') {
      // Blue/Indigo scale for systemic rationality
      if (val >= 80) return 'bg-blue-600 text-white';
      if (val >= 60) return 'bg-blue-400 text-white';
      if (val >= 40) return 'bg-blue-100 text-blue-900';
      return 'bg-stone-100 text-stone-700';
    }

    // Evolution - Emerald scale
    if (val >= 80) return 'bg-emerald-600 text-white';
    if (val >= 60) return 'bg-emerald-400 text-white';
    if (val >= 40) return 'bg-emerald-100 text-emerald-900';
    return 'bg-stone-100 text-stone-700';
  };

  return (
    <div id="emotion-trend-heatmap-panel" className="bg-white rounded-lg border border-stone-200 shadow-xs overflow-hidden">
      {/* Editorial Header */}
      <div className="bg-[#FAF9F6] border-b border-[#E8E6DF] p-5 sm:p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center space-x-2 text-[11px] font-mono uppercase tracking-wider text-[#C5221F] bg-red-50 px-2 py-0.5 rounded border border-red-100">
              <HeartPulse className="w-3.5 h-3.5" />
              <span>FIVE-STEP EMOTIONAL & COGNITIVE BARRIER HEATMAP</span>
            </div>
            <h3 className="text-lg sm:text-xl font-serif font-bold text-[#121316] tracking-tight">
              五步决策心流演化与心理障碍热力图
            </h3>
            <p className="text-xs sm:text-sm text-stone-600 max-w-3xl">
              达利欧指出：“阻碍人们进化的两大绊脚石是<strong>自负障碍</strong>与<strong>盲点障碍</strong>。” 本热力图量化你在五步循环中的下丘脑情绪震荡与理性进阶轨迹，精准定位认知卡点。
            </p>
          </div>

          {/* View Toggle */}
          <div className="flex items-center space-x-1 bg-stone-200/80 p-1 rounded-md text-xs font-medium self-start md:self-center">
            <button
              id="heatmap-matrix-mode-btn"
              onClick={() => setViewMode('matrix')}
              className={`px-3 py-1.5 rounded transition-all cursor-pointer ${
                viewMode === 'matrix'
                  ? 'bg-white text-stone-900 font-bold shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              五步障碍热力矩阵
            </button>
            <button
              id="heatmap-timeline-mode-btn"
              onClick={() => setViewMode('timeline')}
              className={`px-3 py-1.5 rounded transition-all cursor-pointer ${
                viewMode === 'timeline'
                  ? 'bg-white text-stone-900 font-bold shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              历次复盘心流时序
            </button>
          </div>
        </div>

        {/* Dynamic Highlight Card for Top Bottleneck */}
        <div className="mt-4 p-3.5 bg-white rounded-md border border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded bg-red-100 text-[#C5221F] flex items-center justify-center shrink-0">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <span className="font-mono text-stone-400 text-[10px] block uppercase">PRIMARY PSYCHOLOGICAL FRICTION</span>
              <span className="font-serif font-bold text-stone-900 text-sm">
                当前核心认知卡点：{summaryInsight.step.name} 的【{summaryInsight.dimension.name}】阻力最高 ({summaryInsight.intensity}%)
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-3 text-stone-500 font-sans">
            <span className="hidden lg:inline text-[11px]">
              点击热力格子可查看潜意识隐秘台词与达利欧解药
            </span>
            <span className="font-mono px-2 py-0.5 rounded bg-red-50 text-[#C5221F] border border-red-200 font-semibold">
              阻力指数 {summaryInsight.intensity}/100
            </span>
          </div>
        </div>
      </div>

      {/* Main Heatmap Content */}
      <div className="p-5 sm:p-6 space-y-6">
        {viewMode === 'matrix' ? (
          <div>
            {/* Heatmap Matrix Table */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse min-w-[640px]">
                <thead>
                  <tr>
                    <th className="p-3 text-left font-serif text-xs font-bold text-stone-700 bg-stone-50 border border-stone-200 w-44">
                      情绪心理维度 \ 五步循环
                    </th>
                    {FIVE_STEPS.map((step, sIdx) => (
                      <th
                        key={step.id}
                        className="p-3 text-center border border-stone-200 bg-stone-50"
                      >
                        <div className="font-serif font-bold text-xs text-stone-900">{step.name}</div>
                        <div className="text-[10px] font-mono text-stone-400 mt-0.5">{step.code}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {EMOTION_DIMENSIONS.map((dim) => {
                    const DimIcon = dim.icon;
                    return (
                      <tr key={dim.id}>
                        {/* Row Header */}
                        <td className="p-3 border border-stone-200 bg-white align-middle">
                          <div className="flex items-center space-x-2">
                            <DimIcon className="w-4 h-4 shrink-0" style={{ color: dim.color }} />
                            <div>
                              <div className="font-serif font-bold text-xs text-stone-900">{dim.name}</div>
                              <div className="text-[10px] text-stone-400 font-sans leading-tight mt-0.5">
                                {dim.type === 'positive' ? '正向认知稳态' : '阻碍进化的心智陷阱'}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Step Cells */}
                        {FIVE_STEPS.map((step, sIdx) => {
                          const val = heatmapMatrix[sIdx]?.[dim.id as keyof typeof heatmapMatrix[0]] || 0;
                          const isSelected = selectedCell?.stepIdx === sIdx && selectedCell?.dimId === dim.id;

                          return (
                            <td
                              key={`${dim.id}-${step.id}`}
                              className="p-2 border border-stone-200 text-center align-middle"
                            >
                              <button
                                onClick={() => setSelectedCell({ stepIdx: sIdx, dimId: dim.id })}
                                className={`w-full py-3.5 px-2 rounded transition-all cursor-pointer relative group flex flex-col items-center justify-center ${
                                  getCellBgColor(sIdx, dim.id)
                                } ${
                                  isSelected
                                    ? 'ring-3 ring-[#121316] ring-offset-1 shadow-md scale-[1.02]'
                                    : 'hover:opacity-90 hover:scale-[1.01]'
                                }`}
                              >
                                <span className="font-mono font-bold text-base leading-none">
                                  {val}%
                                </span>
                                <span className="text-[9px] uppercase tracking-tighter opacity-80 mt-1">
                                  {val >= 75 ? '高频活跃' : val >= 50 ? '中度影响' : '低活跃'}
                                </span>
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-3 border-t border-stone-200 text-xs text-stone-500">
              <div className="flex items-center space-x-4">
                <span className="font-serif font-bold text-stone-800">图例说明：</span>
                <div className="flex items-center space-x-1.5">
                  <span className="w-3.5 h-3.5 rounded bg-[#C5221F] inline-block"></span>
                  <span>自负防御高危</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="w-3.5 h-3.5 rounded bg-red-500 inline-block"></span>
                  <span>挫折刺痛剧烈</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="w-3.5 h-3.5 rounded bg-amber-500 inline-block"></span>
                  <span>欲望浮躁诱惑</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="w-3.5 h-3.5 rounded bg-blue-600 inline-block"></span>
                  <span>系统理性接管</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="w-3.5 h-3.5 rounded bg-emerald-600 inline-block"></span>
                  <span>掌控笃定进化</span>
                </div>
              </div>
              <div className="text-[11px] font-mono text-stone-400">
                DATA ENGINE: DALIO 5-STEP HEURISTICS v2.4
              </div>
            </div>

            {/* Deep Insight Analysis Drawer for the Selected Cell */}
            {cellDetail && (
              <div className="mt-6 p-5 sm:p-6 bg-[#FAF9F6] border border-stone-300 rounded-lg shadow-sm space-y-4 transition-all">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-stone-200 pb-3 gap-2">
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 bg-[#121316] text-[#FAF9F6] font-mono text-xs rounded font-bold">
                      {cellDetail.step.code}
                    </span>
                    <h4 className="font-serif font-bold text-stone-900 text-base">
                      {cellDetail.step.name} ✕ 【{cellDetail.dim.name}】
                    </h4>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-stone-500">该维度震荡强度：</span>
                    <span className="font-mono font-bold text-sm text-[#C5221F]">
                      {cellDetail.value}%
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-stone-200 text-stone-700 font-mono">
                      风险级别: {cellDetail.severityLevel}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs sm:text-sm">
                  {/* Left Column: Subconscious trap & Internal Dialogue */}
                  <div className="space-y-3 bg-white p-4 rounded border border-stone-200">
                    <div>
                      <div className="flex items-center space-x-1.5 text-stone-400 font-mono text-[11px] mb-1 uppercase">
                        <Brain className="w-3.5 h-3.5 text-amber-600" />
                        <span>SUBCONSCIOUS PATTERN · 潜意识心理陷阱</span>
                      </div>
                      <p className="text-stone-800 leading-relaxed font-sans">
                        {cellDetail.subconsciousPattern}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-stone-100">
                      <div className="text-[11px] font-mono text-stone-400 mb-1">
                        典型内心自欺对话 (TYPICAL INNER DIALOGUE):
                      </div>
                      <blockquote className="italic font-serif text-stone-700 bg-stone-50 p-2.5 rounded border-l-2 border-[#C5221F]">
                        {cellDetail.internalDialogue}
                      </blockquote>
                    </div>

                    <div className="pt-2 text-[11px] text-stone-500">
                      <span className="font-bold text-stone-700">大脑神经机制：</span> {cellDetail.mindMechanism}
                    </div>
                  </div>

                  {/* Right Column: Dalio Prescription & Algorithm */}
                  <div className="space-y-3 bg-white p-4 rounded border border-stone-200 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center space-x-1.5 text-stone-400 font-mono text-[11px] mb-1 uppercase">
                        <Sparkles className="w-3.5 h-3.5 text-[#C5221F]" />
                        <span>DALIO PRINCIPLE PRESCRIPTION · 达利欧破局解药</span>
                      </div>
                      <p className="font-serif text-stone-900 leading-relaxed bg-red-50/50 p-3 rounded border border-red-100 text-xs sm:text-sm font-medium">
                        {cellDetail.dalioPrescription}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-stone-100">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-stone-500">将本项解药转化为硬性自律机制？</span>
                        {onNewReview && (
                          <button
                            onClick={onNewReview}
                            className="inline-flex items-center space-x-1 text-[#C5221F] hover:text-[#A81A18] font-semibold cursor-pointer"
                          >
                            <span>针对此卡点新建复盘</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* View Mode 2: Timeline flow by case */
          <div className="space-y-4">
            <div className="text-xs text-stone-600 mb-2">
              按复盘事件展开，横向追踪每起决策从第1步到第5步的心理状态迁跃轨迹（共 {reviews.length} 轮五步闭环）：
            </div>

            {reviews.length === 0 ? (
              <div className="text-center py-12 bg-stone-50 rounded border border-dashed border-stone-300">
                <p className="text-stone-500 text-sm font-serif">暂无复盘记录，新建第一轮五步复盘后将生成专属心流时序轨迹</p>
              </div>
            ) : (
              <div className="space-y-3">
                {reviews.map((r, idx) => {
                  const hasDesireConflict = Boolean(r.step1_goals?.desireVsGoalNote);
                  const painStars = r.painLevel || 3;
                  const hasEgoBarrier = Boolean(r.step3_diagnosis?.egoBarrier);
                  const hasSystemicPrinciple = Boolean(r.step4_design?.extractedPrinciple);
                  const isEvolved = r.step5_execution?.status === 'evolved' || (r.evolutionScore || 80) >= 85;

                  return (
                    <div
                      key={r.id}
                      className="bg-stone-50 p-4 rounded-lg border border-stone-200 hover:border-stone-400 transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-xs text-[#C5221F] font-bold">#{reviews.length - idx}</span>
                          <span className="font-serif font-bold text-sm text-stone-900">{r.title}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-white text-stone-600 border border-stone-200">
                            {r.category}
                          </span>
                        </div>
                        <div className="text-xs font-mono text-stone-500">
                          进化得分：<strong className="text-emerald-700">{r.evolutionScore || 85}分</strong> · 痛苦级别：
                          <strong className="text-[#C5221F]">{painStars}星</strong>
                        </div>
                      </div>

                      {/* 5-Step Progress Flow Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                        {/* Step 1 */}
                        <div className="bg-white p-2.5 rounded border border-stone-200 text-xs">
                          <div className="font-mono text-[10px] text-stone-400 uppercase">STEP 1 · 目标</div>
                          <div className="font-serif font-medium text-stone-800 mt-1 truncate" title={r.step1_goals?.goalStatement}>
                            {r.step1_goals?.goalStatement || '明确目标'}
                          </div>
                          <div className="mt-1.5 flex items-center space-x-1">
                            <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                              hasDesireConflict ? 'bg-amber-100 text-amber-900 font-medium' : 'bg-stone-100 text-stone-600'
                            }`}>
                              {hasDesireConflict ? '⚡ 欲望与目标辨析' : '目标清晰'}
                            </span>
                          </div>
                        </div>

                        {/* Step 2 */}
                        <div className="bg-white p-2.5 rounded border border-stone-200 text-xs">
                          <div className="font-mono text-[10px] text-stone-400 uppercase">STEP 2 · 问题</div>
                          <div className="font-serif font-medium text-stone-800 mt-1 truncate" title={r.step2_problems?.problemDescription}>
                            {r.step2_problems?.problemDescription || '暴露真实问题'}
                          </div>
                          <div className="mt-1.5 flex items-center space-x-1">
                            <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                              painStars >= 4 ? 'bg-red-100 text-red-900 font-bold' : 'bg-orange-50 text-orange-900'
                            }`}>
                              🔥 痛感: {painStars}/5星
                            </span>
                          </div>
                        </div>

                        {/* Step 3 */}
                        <div className="bg-white p-2.5 rounded border border-stone-200 text-xs">
                          <div className="font-mono text-[10px] text-stone-400 uppercase">STEP 3 · 诊断</div>
                          <div className="font-serif font-medium text-stone-800 mt-1 truncate" title={r.step3_diagnosis?.rootCause}>
                            {r.step3_diagnosis?.rootCause || '深挖机器缺陷'}
                          </div>
                          <div className="mt-1.5 flex items-center space-x-1">
                            <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                              hasEgoBarrier ? 'bg-red-100 text-[#C5221F] font-bold' : 'bg-stone-100 text-stone-600'
                            }`}>
                              {hasEgoBarrier ? '🛡️ 击碎自负障碍' : '理性穿透'}
                            </span>
                          </div>
                        </div>

                        {/* Step 4 */}
                        <div className="bg-white p-2.5 rounded border border-stone-200 text-xs">
                          <div className="font-mono text-[10px] text-stone-400 uppercase">STEP 4 · 规划</div>
                          <div className="font-serif font-medium text-stone-800 mt-1 truncate" title={r.step4_design?.systemicFix}>
                            {r.step4_design?.systemicFix || '机制重构'}
                          </div>
                          <div className="mt-1.5 flex items-center space-x-1">
                            <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                              hasSystemicPrinciple ? 'bg-purple-100 text-purple-900 font-medium' : 'bg-stone-100 text-stone-600'
                            }`}>
                              {hasSystemicPrinciple ? '📜 沉淀硬准则' : '流程建立'}
                            </span>
                          </div>
                        </div>

                        {/* Step 5 */}
                        <div className="bg-white p-2.5 rounded border border-stone-200 text-xs">
                          <div className="font-mono text-[10px] text-stone-400 uppercase">STEP 5 · 执行</div>
                          <div className="font-serif font-medium text-stone-800 mt-1 truncate">
                            {r.step5_execution?.status === 'evolved' ? '完成闭环蜕变' : '落地执行中'}
                          </div>
                          <div className="mt-1.5 flex items-center space-x-1">
                            <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                              isEvolved ? 'bg-emerald-100 text-emerald-900 font-bold' : 'bg-blue-100 text-blue-900'
                            }`}>
                              {isEvolved ? '🌱 认知进化达成' : '坚决推进'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Actionable Bridgewater Mental Algorithms */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-stone-200">
          <div className="p-3.5 bg-stone-50 rounded border border-stone-200 space-y-1.5">
            <div className="flex items-center space-x-2 font-serif font-bold text-xs text-stone-900">
              <span className="w-5 h-5 rounded-full bg-[#121316] text-white flex items-center justify-center text-[10px] font-mono">1</span>
              <span>两分钟下丘脑急救暂停法则</span>
            </div>
            <p className="text-[11px] text-stone-600 leading-relaxed font-sans">
              当感到心跳加速、面部发热、急于反驳或辩解时，<strong>立即暂停决策 2 分钟</strong>。深呼吸等待杏仁核情绪风暴退去，让前额叶皮层重新接管。
            </p>
          </div>

          <div className="p-3.5 bg-stone-50 rounded border border-stone-200 space-y-1.5">
            <div className="flex items-center space-x-2 font-serif font-bold text-xs text-stone-900">
              <span className="w-5 h-5 rounded-full bg-[#C5221F] text-white flex items-center justify-center text-[10px] font-mono">2</span>
              <span>“极度求真”分离技术</span>
            </div>
            <p className="text-[11px] text-stone-600 leading-relaxed font-sans">
              将“自我价值”与“观点是否正确”彻底分离。犯错并不意味着无能，<strong>执迷不悟地为错误辩护才是不负责任的无能</strong>。
            </p>
          </div>

          <div className="p-3.5 bg-stone-50 rounded border border-stone-200 space-y-1.5">
            <div className="flex items-center space-x-2 font-serif font-bold text-xs text-stone-900">
              <span className="w-5 h-5 rounded-full bg-emerald-700 text-white flex items-center justify-center text-[10px] font-mono">3</span>
              <span>把人看作机器的双重视角</span>
            </div>
            <p className="text-[11px] text-stone-600 leading-relaxed font-sans">
              你既是这台决策机器的操作员，又是这台机器的首席设计师。当操作失误时，<strong>不要惩罚操作员，而要去升级机器的防错齿轮</strong>。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
