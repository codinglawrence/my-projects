import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Local persistent file storage
const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'principles_store.json');

// Initialize Gemini Client safely
let aiClient: GoogleGenAI | null = null;
function getGemini(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    try {
      aiClient = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
    } catch (err) {
      console.error('Failed to initialize GoogleGenAI client:', err);
    }
  }
  return aiClient;
}

// Initial seed data inspired by Ray Dalio's Principles
const DEFAULT_SEED_DATA = {
  reviews: [
    {
      id: 'rev-001',
      title: '重大系统架构重构延期与交付质量事故',
      category: '工作事业',
      createdAt: '2026-08-28T09:30:00.000Z',
      updatedAt: '2026-08-28T16:20:00.000Z',
      painLevel: 5,
      evolutionScore: 92,
      tags: ['技术交付', '沟通透明度', '时间预估', '机器思维'],
      step1_goals: {
        goalStatement: '在Q3顺利完成核心交易模块解耦，并在零业务中断的前提下按期上线。',
        priority: 'high',
        desireVsGoalNote: '欲望是渴望向管理层展示“我能在极端苛刻的工期内创造奇迹”以获得即时赞誉；而真实目标是系统的长期健壮稳定与团队的可持续交付。',
        targetMetric: '按期上线，测试覆盖率>85%，零P1故障。',
      },
      step2_problems: {
        problemDescription: '上线日前3天发现两个第三方网关的竞态死锁，导致整体延期2周，并在测试环境发生严重数据不一致。',
        severity: 5,
        isTolerated: false,
        painLevel: 5,
        impactScope: '阻塞上下游业务线，团队被迫通宵排查，受到业务负责人严肃质疑。',
      },
      step3_diagnosis: {
        proximalCause: '第三方供应商接口返回结构变更未通知，压测时间被压缩到最后48小时。',
        rootCause: '【机器缺陷】在规划机制上存在“乐观偏差”漏洞，没有把不确定性（第三方不可控依赖）设计为前置熔断关卡；【自负障碍】在项目中期已经发现进度吃紧，但因害怕显得无能而未能如实向团队敲响警钟，违背了极度求真。',
        egoBarrier: '自尊心作祟（Ego Barrier）：宁愿自己死扛通宵也不愿提前2周坦白风险，把“承认困难”等同于“个人能力低下”。',
        fiveWhys: [
          '为什么会延期？因为上线前3天发现严重竞态死锁。',
          '为什么前3天才发现？因为端到端压测被挤压到了最后一刻。',
          '为什么压测被挤压？因为前置模块开发耗时超出预期50%。',
          '为什么耗时超预期却未调整上线窗口？因为我害怕向业务方承认时间预估失误。',
          '为什么害怕承认失误？根源在于自负障碍（Ego Barrier），将外部赞赏凌驾于客观现实之上。',
        ],
      },
      step4_design: {
        planSteps: [
          '建立外部依赖“契约锁定沙箱”，所有第三方调用必须在开发第1周通过模拟混沌测试。',
          '推行“红黄绿风险公开看板”，任何延期>24小时的子任务自动触发全员公开重估会议。',
          '重构架构容灾逻辑，增加本地异步补偿流水线。',
        ],
        systemicFix: '将项目风险由“人肉汇报”转变为“客观指标触发系统”，彻底剔除人为掩盖可能。',
        extractedPrinciple: '原则 2.3：痛苦 + 反思 = 进步。绝不要因保全面子而掩盖隐患，及早暴露坏消息的价值十倍于事后弥补。',
      },
      step5_execution: {
        checklist: [
          { id: 't1', task: '编写第三方网关混沌测试自动化脚本', done: true, dueDate: '2026-09-01' },
          { id: 't2', task: '召开团队事后无指责复盘会，公开复盘记录', done: true, dueDate: '2026-09-02' },
          { id: 't3', task: '修改敏捷管理流程，加入48小时红线预警机制', done: true, dueDate: '2026-09-04' },
        ],
        status: 'evolved',
        reflectionNotes: '通过这一次沉重打击，我和团队建立起了极度透明的文化，大家敢于在站会上直接说出阻碍，机器更加强韧。',
        evolutionScore: 92,
      },
      aiFeedback: {
        summary: '极为典范的达利欧式五步推演。成功穿透了“第三方接口”的近因，直击“自负障碍与盲目乐观”的深层根因。',
        blindspotAlert: '注意警惕在下一次大项目中出现“防卫过当”的过度冗余设计，寻找谨慎与敏捷的极佳平衡点。',
        futureAdvice: '在未来面对不确定性决策时，务必引入“可信度加权决策”（Credibility-Weighted Decision Making），让资深技术伙伴进行盲审。',
        suggestedPrinciple: '永远将客观现实置于主观愿望之上；面对痛苦时，停下来深呼吸并写下真实根因。',
        createdAt: '2026-08-28T16:30:00.000Z',
      },
    },
    {
      id: 'rev-002',
      title: '团队关键人才流失与管理反馈失灵',
      category: '团队协作',
      createdAt: '2026-08-15T14:10:00.000Z',
      updatedAt: '2026-08-16T11:00:00.000Z',
      painLevel: 4,
      evolutionScore: 85,
      tags: ['人才匹配', '极度透明', '绩效对话', '棒球卡机制'],
      step1_goals: {
        goalStatement: '打造一支自驱、高信任、目标一致的精英小队，核心成员留存率90%以上。',
        priority: 'high',
        desireVsGoalNote: '欲望是做一个“受所有人喜爱的温和好老板”，不愿发生让人不适的严厉对话；目标是团队各就其位，达成极致卓越。',
        targetMetric: '季度离职率<5%，团队心理安全感与求真度问卷>4.5分。',
      },
      step2_problems: {
        problemDescription: '核心骨干A突然提出离职，且反馈“长期感受不到清晰的方向与真实的能力评价，内部沟通存在客套和模糊”。',
        severity: 4,
        isTolerated: false,
        painLevel: 4,
        impactScope: '短期内交接断层，对其他团队成员信心造成动摇。',
      },
      step3_diagnosis: {
        proximalCause: '竞对开出更高薪资，且当前业务压力大。',
        rootCause: '【管理盲点】平时在1on1中习惯维持表面和谐，未能践行“极度求真与极度透明”；没有像达利欧的“棒球卡”那样客观量化伙伴的优劣势与抱负匹配度。',
        egoBarrier: '回避人际冲突的情感脆弱（Conflict Avoidance）。把“指出问题”误认为是“伤害感情”。',
        fiveWhys: [
          '为什么A会突然离职？因为他积攒了对工作方向与反馈的不满。',
          '为什么他的不满没有及早被发现？因为日常沟通多停留在业务汇报，缺乏深度心智校准。',
          '为什么缺乏深度校准？因为我害怕触碰尴尬话题，不愿挑明其能力瓶颈。',
          '为什么害怕挑明？因为我想维持“好人”形象。',
          '根本原因：对“友善”的错误定义——虚假的客套是最大的残忍，真诚坦率才是真正的尊重。',
        ],
      },
      step4_design: {
        planSteps: [
          '全面推行达利欧式“棒球卡”与双向极度坦率评估制（每双周30分钟聚焦痛点与成长）。',
          '明确岗位胜任力雷达图，将“敢于说出不同意见”纳入绩效加分项。',
          '在离职挽留未果后，坦诚向全队复盘本次管理的失职，邀请全队监督。',
        ],
        systemicFix: '建立结构化、无面子顾虑的定期校准机制，消除信息真空。',
        extractedPrinciple: '原则 4.1：极度求真与极度透明是卓越的基石。回避冲突从来不能解决冲突，只会让问题在暗处腐烂。',
      },
      step5_execution: {
        checklist: [
          { id: 't1', task: '为全队成员设计个人原则与优势画像卡', done: true, dueDate: '2026-08-20' },
          { id: 't2', task: '开展第一轮极度坦诚双向1on1沟通', done: true, dueDate: '2026-08-25' },
          { id: 't3', task: '公开管理盲点与整改承诺清单', done: true, dueDate: '2026-08-27' },
        ],
        status: 'completed',
        reflectionNotes: '在坦白了自身盲点后，团队氛围反而更加凝练，新引进的工程师能迅速融入透明的文化。',
        evolutionScore: 88,
      },
      aiFeedback: {
        summary: '深刻突破了“表面和谐”的情感束缚。达利欧在桥水基金正是依靠极度透明打造了无与伦比的智识合伙关系。',
        blindspotAlert: '坦诚不等于粗暴，透明必须建立在深切关怀与理性质询之上。',
        futureAdvice: '建立日常“点子记录器”（Dot Collector）式的实时微反馈习惯，避免将问题拖到离职阶段。',
        suggestedPrinciple: '不要让客套阻碍追求真相；对问题保持敏锐，对伙伴保持真诚。',
        createdAt: '2026-08-16T12:00:00.000Z',
      },
    },
    {
      id: 'rev-003',
      title: '高杠杆战略投资决策受情绪干扰追高被套',
      category: '战略决策',
      createdAt: '2026-07-10T10:00:00.000Z',
      updatedAt: '2026-07-12T15:00:00.000Z',
      painLevel: 5,
      evolutionScore: 95,
      tags: ['投资决策', '自控力', '系统化模型', '反人性'],
      step1_goals: {
        goalStatement: '构建长期抗周期的复合投资组合，年化夏普比率>1.5，最大回撤控制在8%以内。',
        priority: 'high',
        desireVsGoalNote: '欲望：看到市场FOMO狂热时，渴望“快速暴富”的赌徒心理；目标：严格遵守大类资产配置与全天候对冲模型。',
        targetMetric: '净值回撤<8%，规则遵守率100%。',
      },
      step2_problems: {
        problemDescription: '在市场狂热期违反预设止盈止损线，擅自加大单一高风险标的仓位，随后遭遇急跌导致账面回撤18%。',
        severity: 5,
        isTolerated: false,
        painLevel: 5,
        impactScope: '重创账户资金曲线，产生强烈的挫败感与焦虑情绪。',
      },
      step3_diagnosis: {
        proximalCause: '宏观流动性突变降息落空，标的高位跳水。',
        rootCause: '【缺乏算法化执行机制】依然依赖肉身主观意志做交易决策。当多巴胺和肾上腺素激增时，理性大脑被动物本能劫持，规则形同虚设。',
        egoBarrier: '贪婪与自大（Overconfidence Bias）：误将牛市的贝塔红利归功于自己的阿尔法能力。',
        fiveWhys: [
          '为什么违规加仓？因为担心错过下一波翻倍涨幅。',
          '为什么没有按照交易清单核验？因为觉得这次机会“千载难逢，与众不同”。',
          '为什么会产生“这次不一样”的幻觉？历史数据从未支持这种判断，纯粹是情绪驱动。',
          '为什么情绪能轻易击穿纪律？因为交易软件触手可及，没有任何硬性系统防错闸门。',
          '根本原因：没有将决策计算机化/规则化，放任人性弱点暴露在市场屠刀之下。',
        ],
      },
      step4_design: {
        planSteps: [
          '编写个人投资的“全天候决策代码清单”，所有交易必须提前24小时经过硬性准则自检表。',
          '设置物理冷却期：单笔调仓超过总资产3%必须冷冻24小时并在系统内写出正反三条推演。',
          '果断平仓违规头寸，回归既定资产配置矩阵。',
        ],
        systemicFix: '将个人从“主观交易员”改造为“客观算法监护人”，用代码和硬性流程约束贪婪。',
        extractedPrinciple: '原则 1.5：把你的原则系统化、可执行化。依靠意志力抵御人性弱点注定会失败，唯有机制与系统不可动摇。',
      },
      step5_execution: {
        checklist: [
          { id: 't1', task: '清点所有仓位并重置对冲比例', done: true, dueDate: '2026-07-11' },
          { id: 't2', task: '制定并打印纸质《投资决策否决清单》贴于显示器旁', done: true, dueDate: '2026-07-12' },
          { id: 't3', task: '建立模拟账本与强制24小时冷冻规则', done: true, dueDate: '2026-07-15' },
        ],
        status: 'evolved',
        reflectionNotes: '斩断了贪婪的幻想后，投资心态回归平静。这一堂课代价昂贵，但换回了终生受益的系统化交易护城河。',
        evolutionScore: 95,
      },
      aiFeedback: {
        summary: '这正呼应了达利欧在1982年墨西哥债务危机惨败后创立“全天候对冲基金”的经典顿悟时刻。',
        blindspotAlert: '人在顺境时最容易遗忘系统化机制，必须在行情平稳时定期演练极限压力测试。',
        futureAdvice: '建立自动化指标监控，将“买入决定”转化为公式化权衡，彻底剥离直觉交易。',
        suggestedPrinciple: '如果你不能系统化地表达你的投资逻辑，你只是在碰运气。',
        createdAt: '2026-07-12T16:00:00.000Z',
      },
    },
  ],
  principles: [
    {
      id: 'p-1',
      code: '1.1',
      title: '极度求真与极度透明',
      category: '战略决策',
      statement: '做一个极度求真和极度透明的人。拥抱现实，认清现实，绝不要让主观愿望扭曲对客观规律的认知。',
      sourceReviewTitle: '全书核心基石',
      rationale: '唯有了解事情的本来面目，才能做出明智的决策。谎言、粉饰与逃避只会让问题加倍恶化。',
      applicationCount: 14,
      createdAt: '2026-06-01T00:00:00.000Z',
      isFavorite: true,
    },
    {
      id: 'p-2',
      code: '1.2',
      title: '痛苦 + 反思 = 进步',
      category: '个人成长',
      statement: '不要逃避痛苦，痛苦是现实给你的最明确信号，提示你正在碰壁或存在盲点。停下来，深入反思，将其转化为进化的阶梯。',
      sourceReviewTitle: '重大系统架构重构延期事故',
      rationale: '回避痛苦就是回避成长。直面挫折并将情绪降温为理性质询，是人生进化的唯一公式。',
      applicationCount: 22,
      createdAt: '2026-06-05T00:00:00.000Z',
      isFavorite: true,
    },
    {
      id: 'p-3',
      code: '2.1',
      title: '决不容忍任何已知问题',
      category: '工作事业',
      statement: '发现问题就要解决问题，决不妥协。小问题的滋生是系统崩溃的前兆，容忍问题等同于主动放弃卓越。',
      sourceReviewTitle: '团队关键人才流失事件',
      rationale: '对平庸和漏洞的容忍会迅速腐蚀整个团队与个人标准。',
      applicationCount: 9,
      createdAt: '2026-07-02T00:00:00.000Z',
      isFavorite: false,
    },
    {
      id: 'p-4',
      code: '3.1',
      title: '严密区分直接诱因与根本原因',
      category: '工作事业',
      statement: '直接诱因（Proximal Cause）通常是一个具体动作或偶发事件，而根本原因（Root Cause）必然深植于机制设计漏洞或人性的盲点中。',
      sourceReviewTitle: '架构交付延期深层复盘',
      rationale: '解决诱因只是“头痛医头”，下一次必然换个花样重复发生；唯有修补机制才能绝后患。',
      applicationCount: 18,
      createdAt: '2026-07-20T00:00:00.000Z',
      isFavorite: true,
    },
    {
      id: 'p-5',
      code: '4.2',
      title: '将机器与机制置于个人意志力之上',
      category: '战略决策',
      statement: '把你的工作与生活当成一台机器来审视。当你发现产出不理想时，调整机器的零部件和运转流程，而不是单凭意志力苦撑。',
      sourceReviewTitle: '高杠杆投资追高被套复盘',
      rationale: '意志力是有限的消耗品，优秀运转的自动化制度与检查单才能抵御人性的脆弱。',
      applicationCount: 12,
      createdAt: '2026-08-01T00:00:00.000Z',
      isFavorite: true,
    },
  ],
};

function readDb() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(DATA_FILE)) {
      fs.writeFileSync(DATA_FILE, JSON.stringify(DEFAULT_SEED_DATA, null, 2), 'utf-8');
      return DEFAULT_SEED_DATA;
    }
    const content = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(content);
  } catch (err) {
    console.error('Error reading db file:', err);
    return DEFAULT_SEED_DATA;
  }
}

function writeDb(data: any) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Error writing db file:', err);
    return false;
  }
}

// ---------------- API ROUTES ----------------

// Health check & sync status
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Principles 5-Step System API',
    geminiAvailable: !!process.env.GEMINI_API_KEY,
    timestamp: new Date().toISOString(),
  });
});

// Reviews endpoints
app.get('/api/reviews', (req, res) => {
  const db = readDb();
  res.json({ success: true, data: db.reviews || [] });
});

app.post('/api/reviews', (req, res) => {
  const db = readDb();
  const newReview = {
    ...req.body,
    id: req.body.id || `rev-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    createdAt: req.body.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.reviews = [newReview, ...(db.reviews || [])];
  writeDb(db);
  res.status(201).json({ success: true, data: newReview });
});

app.put('/api/reviews/:id', (req, res) => {
  const { id } = req.params;
  const db = readDb();
  const index = (db.reviews || []).findIndex((r: any) => r.id === id);

  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Review record not found' });
  }

  const updated = {
    ...db.reviews[index],
    ...req.body,
    id, // protect id
    updatedAt: new Date().toISOString(),
  };

  db.reviews[index] = updated;
  writeDb(db);
  res.json({ success: true, data: updated });
});

app.delete('/api/reviews/:id', (req, res) => {
  const { id } = req.params;
  const db = readDb();
  db.reviews = (db.reviews || []).filter((r: any) => r.id !== id);
  writeDb(db);
  res.json({ success: true, message: 'Review deleted successfully' });
});

// Principles endpoints
app.get('/api/principles', (req, res) => {
  const db = readDb();
  res.json({ success: true, data: db.principles || [] });
});

app.post('/api/principles', (req, res) => {
  const db = readDb();
  const newPrinciple = {
    ...req.body,
    id: req.body.id || `p-${Date.now()}`,
    code: req.body.code || `${(db.principles?.length || 0) + 1}.0`,
    createdAt: req.body.createdAt || new Date().toISOString(),
    applicationCount: req.body.applicationCount || 1,
  };

  db.principles = [newPrinciple, ...(db.principles || [])];
  writeDb(db);
  res.status(201).json({ success: true, data: newPrinciple });
});

app.put('/api/principles/:id', (req, res) => {
  const { id } = req.params;
  const db = readDb();
  const index = (db.principles || []).findIndex((p: any) => p.id === id);

  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Principle not found' });
  }

  db.principles[index] = { ...db.principles[index], ...req.body, id };
  writeDb(db);
  res.json({ success: true, data: db.principles[index] });
});

app.delete('/api/principles/:id', (req, res) => {
  const { id } = req.params;
  const db = readDb();
  db.principles = (db.principles || []).filter((p: any) => p.id !== id);
  writeDb(db);
  res.json({ success: true, message: 'Principle deleted' });
});

// Check if error is related to API Key leak / revoked / permission denied
function isKeyError(err: any): boolean {
  const str = String(err?.message || '') + ' ' + JSON.stringify(err || '');
  return (
    str.includes('leaked') ||
    str.includes('API key was reported as leaked') ||
    str.includes('PERMISSION_DENIED') ||
    str.includes('API_KEY_INVALID') ||
    str.includes('API key not valid') ||
    err?.status === 403 ||
    err?.status === 401
  );
}

// Heuristic behavioral pattern engine
function getHeuristicPatternAnalysis(reviews: any[], principles: any[]) {
  const highPainCount = reviews.filter((r: any) => r.painLevel >= 4).length;
  const recentReview = reviews[0] || {};
  const recentTitle = recentReview.title || '系统工程任务';
  const recentProximal = recentReview.step3_diagnosis?.proximalCause || '外部环境不确定性与临时变动';

  return {
    analyzedCount: reviews.length,
    overallEgoResilience: Math.min(95, Math.max(78, 80 + highPainCount * 3)),
    longTermPatterns: [
      {
        title: '“近因归因”习惯性漂移倾向',
        nature: 'blindspot' as const,
        description: '在多次任务遭遇延期或挫折时，初期第一反应往往是归咎于外部合作方接口变更、突发干扰等诱因，需要强力引导才能穿透至机器机制与自负障碍。',
        evidence: [
          `在近期复盘《${recentTitle}》中，初期分析多聚焦于“${recentProximal.slice(0, 30)}”`,
          '历史复盘数据显示高痛感事件初期偏向外部环境不可控因素',
        ],
      },
      {
        title: '极度痛苦驱动的深层反思韧性',
        nature: 'strength' as const,
        description: '具备难能可贵的自我解剖精神（Pain + Reflection = Progress）。一旦痛苦指数达到4-5级，能够迅速冷静下来并转化为制度化原则。',
        evidence: [
          `已完成 ${reviews.length} 轮五步推演，其中 ${highPainCount} 次深度痛感事件均成功沉淀为原则与防错闭环`,
          '能够直面自负障碍（Ego Barrier），勇于将个人失误解构成机器运转缺陷',
        ],
      },
      {
        title: '计划过度乐观而缓冲机制不足',
        nature: 'recurrent_trap' as const,
        description: '对工期和执行阻力的预估通常假设在“理想无扰动状态”，缺乏前置的混沌测试与最坏情景沙盘推演。',
        evidence: [
          '交付与任务执行阶段易被突发阻塞事项打破节奏',
          '在机制设计环节需要更加注重前置防御性防火墙',
        ],
      },
    ],
    fiveStepDiagnosis: [
      {
        step: '目标' as const,
        masteryScore: 88,
        strengths: '善于区分一阶欲望与高阶目标，目标表述量化明确。',
        weakness: '偶有在短期利益或即时成就感诱惑下偏离核心长期目标的冲动。',
        dalioGuidance: '“不要把成功的装饰误认为是成功本身。”',
      },
      {
        step: '问题' as const,
        masteryScore: 82,
        strengths: '对重大事故与延期容忍度低，记录及时。',
        weakness: '对日常微小瑕疵存在偶发性容忍，易演化为系统性漏洞。',
        dalioGuidance: '“绝不要容忍你明知存在的问题，哪怕它看起来微不足道。”',
      },
      {
        step: '诊断' as const,
        masteryScore: 90,
        strengths: '5-Whys工具使用娴熟，能勇敢解剖自尊心与Ego障碍。',
        weakness: '有时需要借助外界追问才能看清自己的盲区。',
        dalioGuidance: '“寻找最具有可信度的人来挑战你的假设。”',
      },
      {
        step: '设计' as const,
        masteryScore: 85,
        strengths: '方案偏向机器思维与流程防错，非单纯喊口号。',
        weakness: '方案机制有时过重，执行成本偏高。',
        dalioGuidance: '“把你的生活当做一台机器来设计，好方案应当清晰可测。”',
      },
      {
        step: '执行' as const,
        masteryScore: 84,
        strengths: '清单打勾完成率超80%，跟进认真。',
        weakness: '在任务周期延长后，后半段执行精力存在衰减。',
        dalioGuidance: '“优秀的规划如果不能被坚决执行，就毫无价值。”',
      },
    ],
    futureDecisionGuidance: [
      {
        scenario: '面对高不确定性或重大利益诱惑的战略决策',
        keyRisk: '被短期多巴胺劫持，产生“这次行情/机会非同寻常”的侥幸自负心理。',
        actionRule: '启动“物理24小时冷冻期”，必须由至少2位不同视角的伙伴进行红蓝对抗质询。',
        checkpoints: [
          '是否违反了个人原则库中的硬性否决项？',
          '如果出现最坏情况（概率10%但冲击致命），是否有退路？',
          '这个决定是在理性冷静期做的，还是在情绪高涨期做的？',
        ],
      },
      {
        scenario: '与团队或外部伙伴面临潜在人际冲突与负面反馈',
        keyRisk: '追求虚假的表面客套与和谐，导致关键问题在暗处发酵为不可逆危机。',
        actionRule: '践行“极度透明”，将批评转变为关于“机器零件如何优化”的客观技术讨论。',
        checkpoints: [
          '我是否在因害怕尴尬而保留真相？',
          '沟通的出发点是证明我是对的，还是探寻客观现实？',
          '是否记录了双向客观期望与具体可跟踪的事实依据？',
        ],
      },
    ],
    suggestedPrinciples: [
      {
        title: '逆境冷却原则',
        statement: '在重大情绪波动（狂喜或焦虑）时，封锁决策权限24小时，先反思后行动。',
        rationale: '防止本能情绪大脑越过机器机制做出破坏性动作。',
      },
      {
        title: '前置混沌校验原则',
        statement: '任何关键链条的外部依赖，必须在第一阶段进行极端断裂测试。',
        rationale: '把黑天鹅扼杀在可控沙盒中，不将希望寄托于运气。',
      },
    ],
  };
}

// Heuristic future decision simulation engine
function getHeuristicSimulation(
  decisionTitle: string,
  context: string,
  options: string[] = [],
  timeframe: string = '未来 1-3 个月',
  reviews: any[] = [],
  principles: any[] = []
) {
  const optList = options.filter(Boolean);
  const bestOption = optList[0] || '选择风险可控、具备止损机制的稳健方案';

  return {
    executiveSummary: `针对未来决策【${decisionTitle}】（周期：${timeframe || '近期'}），系统结合你历史复盘中的自负防御与乐观偏好，完成了事前尸检（Pre-Mortem）。在高不确定性场景下，最关键的不是方案本身多完美，而是是否设计了对最坏情况的物理熔断闸门。`,
    pastLessonsMatched: [
      '历史复盘经验：在涉及外部多方协同或时间敏感的项目中，容易出现进度预估乐观偏差。',
      principles.length > 0
        ? `关联原则护栏：已链接《${principles[0].title}》等 ${principles.length} 项原则作为防御底线。`
        : '关联原则护栏：原则 1.1（极度求真）与 原则 4.2（把机制置于意志力之上）。',
    ],
    preMortemFailures: [
      {
        failureMode: '最可能出现的悲观情景：由于未设置硬性冷冻期与外部质询，急于拍板导致后续严重受挫或重构。',
        rootCausePrediction: '下丘脑产生的即时成就欲望（一阶诱惑）压制了对二阶、三阶衍生后果的理性排查。',
        preventionTactic: '在执行前锁定“否决性红线清单”：若触发关键指标异动，立即无条件中止，不依赖当下的情绪意志力。',
      },
      {
        failureMode: '多方依赖断裂：关键外部支撑方延误或环境骤变，导致方案失去前提。',
        rootCausePrediction: '未将不确定性当做必然发生的系统常态，缺乏异步隔离与冗余退路设计。',
        preventionTactic: '方案中必须预留至少 30% 的缓冲冗余与至少 1 套可立即生效的 B 计划。',
      },
    ],
    dalioScorecard: {
      clarityOfGoal: 88,
      blindspotRisk: '中度偏高',
      recommendedOption: bestOption,
      credibilityWeightedAdvice: '寻找至少 2 位在相关领域有多次成功穿越周期经验、且敢于直言不讳的可信度人士进行对抗性压力测试。',
    },
  };
}

// AI Step Challenge / Review Mentor
app.post('/api/ai/step-challenge', async (req, res) => {
  const { stepNumber, stepData, fullReview } = req.body;
  try {
    const ai = getGemini();

    if (!ai) {
      return res.json({
        success: true,
        source: 'built-in-coach',
        feedback: {
          criticalQuestion: stepNumber === 3
            ? '达利欧核心追问：你在此处是否把“表面诱因”当做了根本原因？有没有触碰你自己最不愿承认的自负障碍（Ego Barrier）？'
            : stepNumber === 1
            ? '达利欧核心追问：这项设定是否经得起现实规律的检验？是否存在将一阶即时欲望与高阶目标混淆的隐患？'
            : '达利欧核心追问：这项设计是否足够具体到机器层面？如果换一个人来操作这台机器，能否产生相同的结果？',
          dalioQuote: '“发现问题并容忍它，比完全没有发现问题还要糟糕得多。” —— 瑞·达利欧',
          suggestion: '请务必继续问自己3个“为什么”，直到触碰到机器的设计缺陷或思维盲点。',
          deepDiagnosisAdvice: '警惕自负障碍（Ego Barrier），不要害怕承认自己的失误与无知。',
        },
      });
    }

    const prompt = `你现在是瑞·达利欧（Ray Dalio），《原则》（Principles）的作者，桥水基金创始人。
用户正在使用“五步决策法”进行日常任务与决策复盘。
当前用户正在审视第 ${stepNumber} 步。
用户当前输入的数据内容为：
${JSON.stringify(stepData, null, 2)}

整体复盘上下文：
标题: ${fullReview?.title || '未命名'}
分类: ${fullReview?.category || '未分类'}

请以达利欧极度求真、极度透明、理性质询的语调，给用户提供深度点拨。
输出格式要求为严格的 JSON 字符串（不要附带任何 markdown 标记或其他文本），包含以下字段：
{
  "criticalQuestion": "直击灵魂的达利欧式追问（针对该步骤是否存在自欺欺人、混淆欲望与目标、把近因当根因、或方案不够具体）",
  "dalioQuote": "一句最贴切的《原则》书摘金句",
  "suggestion": "具体操作指导，如何让这一步更具机器化和可执行性",
  "deepDiagnosisAdvice": "如果是在诊断阶段，给出思维盲点预警"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text?.trim() || '{}');
    res.json({ success: true, source: 'gemini', feedback: parsed });
  } catch (err: any) {
    console.error('AI Step challenge error (falling back to built-in Dalio coach):', err);
    const leaked = isKeyError(err);
    const keyNotice = leaked
      ? '当前的 GEMINI_API_KEY 已被 Google 安全策略阻断（标记已泄露/失效，403 PERMISSION_DENIED）。系统已无缝切入达利欧内置质询引擎。请在平台 Settings 菜单更新全新 API Key。'
      : undefined;

    res.json({
      success: true,
      source: 'built-in-coach',
      keyNotice,
      feedback: {
        criticalQuestion: stepNumber === 3
          ? '达利欧核心追问：你在此处是否把“表面诱因”当做了根本原因？有没有触碰你自己最不愿承认的自负障碍（Ego Barrier）？'
          : stepNumber === 1
          ? '达利欧核心追问：这项设定是否经得起现实规律的检验？是否存在将一阶即时欲望与高阶目标混淆的隐患？'
          : '达利欧核心追问：这项设计是否足够具体到机器层面？如果换一个人来操作这台机器，能否产生相同的结果？',
        dalioQuote: '“不要把成功的装饰误认为是成功本身；直面惨淡的真相，是进化的起点。” —— 瑞·达利欧',
        suggestion: '继续问自己5个为什么，把自尊心与防御心理剥离出来，找出可量化防错的系统机制。',
        deepDiagnosisAdvice: '警惕自负障碍（Ego Barrier），直面现实机器缺陷。',
      },
    });
  }
});

// AI Long-term Behavior Pattern Analysis across all reviews
app.post('/api/ai/analyze-patterns', async (req, res) => {
  const db = readDb();
  const reviews = db.reviews || [];
  const principles = db.principles || [];

  if (reviews.length === 0) {
    return res.status(400).json({ success: false, message: '暂无复盘记录可供分析' });
  }

  const ai = getGemini();

  if (!ai) {
    const data = getHeuristicPatternAnalysis(reviews, principles);
    return res.json({
      success: true,
      source: 'heuristic-engine',
      data,
    });
  }

  try {
    const reviewSummaries = reviews.map((r: any) => ({
      title: r.title,
      category: r.category,
      painLevel: r.painLevel,
      evolutionScore: r.evolutionScore,
      goals: r.step1_goals?.goalStatement,
      problems: r.step2_problems?.problemDescription,
      proximal: r.step3_diagnosis?.proximalCause,
      root: r.step3_diagnosis?.rootCause,
      ego: r.step3_diagnosis?.egoBarrier,
      extractedPrinciple: r.step4_design?.extractedPrinciple,
      systemicFix: r.step4_design?.systemicFix,
      executionStatus: r.step5_execution?.status,
    }));

    const prompt = `你现在是世界顶级对冲基金桥水（Bridgewater Associates）创始人瑞·达利欧（Ray Dalio）。
请分析用户累计提交的 ${reviews.length} 次基于“五步循环决策法”的真实复盘记录，深入识别用户的长期行为模式、五步决策失衡点，并提供面向未来的前瞻性决策指南。

用户历史复盘数据摘要：
${JSON.stringify(reviewSummaries, null, 2)}

现存原则库条目数: ${principles.length}

请必须严格输出为符合下列结构的合法 JSON 字符串（绝不要输出 markdown 语法块或任何非 JSON 字符）：
{
  "analyzedCount": ${reviews.length},
  "overallEgoResilience": 88,
  "longTermPatterns": [
    {
      "title": "模式标题（例如：近因归因漂移 / 完美主义迟滞）",
      "nature": "blindspot 或 strength 或 recurrent_trap",
      "description": "详细的行为模式分析阐述，指出用户往往在什么场景下陷入什么误区",
      "evidence": ["提取自复盘具体案例的证据支撑"]
    }
  ],
  "fiveStepDiagnosis": [
    {
      "step": "目标",
      "masteryScore": 85,
      "strengths": "优势",
      "weakness": "薄弱点",
      "dalioGuidance": "达利欧针对该步骤的指导箴言"
    },
    {
      "step": "问题",
      "masteryScore": 80,
      "strengths": "优势",
      "weakness": "薄弱点",
      "dalioGuidance": "箴言"
    },
    {
      "step": "诊断",
      "masteryScore": 88,
      "strengths": "优势",
      "weakness": "薄弱点",
      "dalioGuidance": "箴言"
    },
    {
      "step": "设计",
      "masteryScore": 82,
      "strengths": "优势",
      "weakness": "薄弱点",
      "dalioGuidance": "箴言"
    },
    {
      "step": "执行",
      "masteryScore": 85,
      "strengths": "优势",
      "weakness": "薄弱点",
      "dalioGuidance": "箴言"
    }
  ],
  "futureDecisionGuidance": [
    {
      "scenario": "未来高频决策场景（例如：重大投资、新项目启动、团队问责）",
      "keyRisk": "基于用户过去的盲点，预测其极可能再次踩中的认知陷阱",
      "actionRule": "达利欧式确定性行动准则",
      "checkpoints": ["行动前必须勾选的3个核心核查项"]
    }
  ],
  "suggestedPrinciples": [
    {
      "title": "提炼的新原则标题",
      "statement": "可直接沉淀入个人原则库的精炼准则",
      "rationale": "背后的演变依据"
    }
  ]
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text?.trim() || '{}');
    res.json({ success: true, source: 'gemini', data: parsed });
  } catch (err: any) {
    console.error('Pattern analysis error (falling back to heuristic engine):', err);
    const leaked = isKeyError(err);
    const keyNotice = leaked
      ? '当前的 GEMINI_API_KEY 已被 Google 安全机制阻断（标记为在公网泄露失效，403 PERMISSION_DENIED）。系统已平滑切换至内置《原则》演进引擎为您生成画像。您可在平台 Settings 菜单更新全新 API Key。'
      : undefined;

    const data = getHeuristicPatternAnalysis(reviews, principles);
    res.json({
      success: true,
      source: 'heuristic-engine',
      keyNotice,
      data: {
        ...data,
        keyNotice,
      },
    });
  }
});

// Future Decision Pre-Mortem Sandbox simulation
app.post('/api/ai/future-decision-simulate', async (req, res) => {
  const { decisionTitle, context, options, timeframe } = req.body;
  const db = readDb();
  const reviews = db.reviews || [];
  const principles = db.principles || [];
  const ai = getGemini();

  if (!ai) {
    const simulation = getHeuristicSimulation(decisionTitle, context, options, timeframe, reviews, principles);
    return res.json({
      success: true,
      source: 'pre-mortem-heuristic',
      simulation,
    });
  }

  try {
    const prompt = `你现在是瑞·达利欧（Ray Dalio）。
用户正面临一项重要的未来决策，需要你基于他过去的五步复盘教训与个人原则库，进行事前尸检（Pre-Mortem）与未来决策推演沙盘。

未来决策标题: ${decisionTitle}
背景上下文: ${context}
备选方案: ${JSON.stringify(options || [])}
时间框架: ${timeframe || '未指定'}

用户已沉淀的原则清单：
${JSON.stringify(principles.map((p: any) => ({ code: p.code, title: p.title, statement: p.statement })), null, 2)}

请以严谨客观的达利欧视角，输出一段深度推演 JSON（绝不要添加 markdown 代码块标签）：
{
  "executiveSummary": "针对该未来决策的高阶达利欧式总体评述",
  "pastLessonsMatched": [
    "匹配到的历史复盘相似教训与原则关联点"
  ],
  "preMortemFailures": [
    {
      "failureMode": "推演假设：如果一年后这个决策彻底失败了，最可能是因为什么？",
      "rootCausePrediction": "背后的深层人性弱点或机器缺陷预测",
      "preventionTactic": "现在就应设立的防范机制与防火墙"
    }
  ],
  "dalioScorecard": {
    "clarityOfGoal": 88,
    "blindspotRisk": "低/中/高",
    "recommendedOption": "推荐的权衡取舍方向",
    "credibilityWeightedAdvice": "可信度加权建议：应找怎样背景的专家做压力测试"
  }
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text?.trim() || '{}');
    res.json({ success: true, source: 'gemini', simulation: parsed });
  } catch (err: any) {
    console.error('Future decision simulation error (falling back to pre-mortem heuristic):', err);
    const leaked = isKeyError(err);
    const keyNotice = leaked
      ? '当前的 GEMINI_API_KEY 已被 Google 安全机制阻断（标记为在公网泄露失效，403 PERMISSION_DENIED）。系统已平滑切换至内置事前尸检规则引擎。您可在平台 Settings 菜单更新全新 API Key。'
      : undefined;

    const simulation = getHeuristicSimulation(decisionTitle, context, options, timeframe, reviews, principles);
    res.json({
      success: true,
      source: 'pre-mortem-heuristic',
      keyNotice,
      simulation: {
        ...simulation,
        keyNotice,
      },
    });
  }
});

// Start server with Vite middleware in dev mode
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Principles 5-Step System running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
