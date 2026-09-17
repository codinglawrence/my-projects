export type ReviewCategory = '工作事业' | '战略决策' | '个人成长' | '团队协作' | '健康生活';

export interface GoalStep {
  goalStatement: string;
  priority: 'high' | 'medium' | 'low';
  desireVsGoalNote: string; // 达利欧：分清欲望（一阶诱惑）与真实目标（高阶产出）
  targetMetric: string;
}

export interface ProblemStep {
  problemDescription: string;
  severity: 1 | 2 | 3 | 4 | 5; // 1-轻微 5-重大
  isTolerated: boolean; // 达利欧核心：是否在无意中容忍该问题
  painLevel: 1 | 2 | 3 | 4 | 5; // 痛苦指数 (痛苦 + 反思 = 进步)
  impactScope: string;
}

export interface DiagnosisStep {
  proximalCause: string; // 直接原因/诱因 (表面现象)
  rootCause: string; // 深层根本原因 (机器的哪个齿轮坏了/人性的盲点)
  egoBarrier: string; // 自负障碍与思维盲点 (是否防御心理、害怕暴露无知)
  fiveWhys: string[]; // 5个为什么追问链
}

export interface DesignStep {
  planSteps: string[];
  systemicFix: string; // 机器/流程改造：建立什么机制防止再犯
  extractedPrinciple: string; // 提炼的准则
}

export interface ExecutionTask {
  id: string;
  task: string;
  done: boolean;
  dueDate?: string;
}

export interface ExecutionStep {
  checklist: ExecutionTask[];
  status: 'planning' | 'in_progress' | 'completed' | 'evolved';
  reflectionNotes: string;
  evolutionScore: number; // 0 - 100 进化分数
}

export interface ReviewRecord {
  id: string;
  title: string;
  category: ReviewCategory;
  createdAt: string;
  updatedAt: string;
  painLevel: number;
  evolutionScore: number;
  step1_goals: GoalStep;
  step2_problems: ProblemStep;
  step3_diagnosis: DiagnosisStep;
  step4_design: DesignStep;
  step5_execution: ExecutionStep;
  tags: string[];
  aiFeedback?: {
    summary: string;
    blindspotAlert: string;
    futureAdvice: string;
    suggestedPrinciple: string;
    createdAt: string;
  };
}

export interface PersonalPrinciple {
  id: string;
  code: string; // 例如 "1.1", "2.4"
  title: string;
  category: ReviewCategory;
  statement: string; // 核心准则：例如 "永远不要把直接诱因误当根本原因"
  sourceReviewTitle?: string;
  rationale: string;
  applicationCount: number;
  createdAt: string;
  isFavorite?: boolean;
}

export interface AIAnalysisResult {
  analyzedCount: number;
  overallEgoResilience: number; // 0-100
  source?: string;
  keyNotice?: string;
  longTermPatterns: {
    title: string;
    nature: 'blindspot' | 'strength' | 'recurrent_trap';
    description: string;
    evidence: string[];
  }[];
  fiveStepDiagnosis: {
    step: '目标' | '问题' | '诊断' | '设计' | '执行';
    masteryScore: number; // 0-100
    strengths: string;
    weakness: string;
    dalioGuidance: string;
  }[];
  futureDecisionGuidance: {
    scenario: string;
    keyRisk: string;
    actionRule: string;
    checkpoints: string[];
  }[];
  suggestedPrinciples: {
    title: string;
    statement: string;
    rationale: string;
  }[];
}

export interface FutureDecisionPrompt {
  decisionTitle: string;
  context: string;
  options: string[];
  timeframe: string;
}
