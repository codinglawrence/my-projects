import { NatalChart, PalaceData, StarInfo } from "../types/tianji";

export interface FateDimensionAnalysis {
  id: string;
  title: string;
  subtitle: string;
  score: number; // 0 - 100
  scoreLabel: string; // e.g. "极强", "优异", "稳健", "吉顺", "慎守"
  tagList: string[];
  icon: string;
  summary: string;
  details: {
    heading: string;
    content: string;
    highlights?: string[];
  }[];
  tianjiRule: string; // 倪师天纪精辟论断
  actionAdvice: string; // 以果决行破局建议
  riskNotice?: string; // 避坑/风险防线
}

export interface FullFateAnalysis {
  chartName: string;
  archetype: string; // 核心命格原型
  archetypeDescription: string;
  coreEnergyTags: string[];
  dimensions: {
    personality: FateDimensionAnalysis; // 1. 心性本质与性格特质
    overallFate: FateDimensionAnalysis; // 2. 总体运势与大运格局
    socialAndNobles: FateDimensionAnalysis; // 3. 人际圈层与会遇到什么样的人
    career: FateDimensionAnalysis; // 4. 事业职场与权力功名
    wealth: FateDimensionAnalysis; // 5. 财帛资粮与财富资产
    marriageAndLove: FateDimensionAnalysis; // 6. 情感婚姻与正缘桃花
    health: FateDimensionAnalysis; // 7. 疾厄身心与五行调养
    strategyAndAction: FateDimensionAnalysis; // 8. 天纪经世实战运筹
  };
  executiveSummary: string;
  scores: {
    personality: number;
    career: number;
    wealth: number;
    love: number;
    nobles: number;
    health: number;
    resilience: number;
  };
}

// Helper to find palace by name
function getPalace(chart: NatalChart, name: string): PalaceData {
  return chart.palaces.find((p) => p.name === name) || chart.palaces[0];
}

// Extract major stars from palace
function getMajorStarNames(palace: PalaceData): string[] {
  return palace.majorStars.map((s) => s.name);
}

// Check if stars exist in palace
function hasAnyStar(palace: PalaceData, starNames: string[]): boolean {
  const allNames = [...palace.majorStars, ...palace.minorStars].map((s) => s.name);
  return starNames.some((n) => allNames.includes(n));
}

// Check SiHua in palace
function getPalaceSiHua(palace: PalaceData): { lu: boolean; quan: boolean; ke: boolean; ji: boolean } {
  const stars = [...palace.majorStars, ...palace.minorStars];
  return {
    lu: stars.some((s) => s.sihua === "禄"),
    quan: stars.some((s) => s.sihua === "权"),
    ke: stars.some((s) => s.sihua === "科"),
    ji: stars.some((s) => s.sihua === "忌"),
  };
}

/**
 * Highly granular, multi-layered archetype resolver based on:
 * 1. Specific Famous Formations (格局优先)
 * 2. Exact Double-Star Combinations (双星同宫)
 * 3. Exact Single-Star Placement (单星独坐)
 * 4. Empty Palace borrowing from opposite palace (命无正曜借对宫)
 * 5. San Fang Si Zheng supporting stars and SiHua
 */
function resolveDetailedArchetype(
  lifeStars: string[],
  travelStars: string[],
  careerStars: string[],
  wealthStars: string[],
  lifePalaceBranch: string,
  patterns: { name: string; type: string }[],
  sihua: { stem: string; lu: string; quan: string; ke: string; ji: string }
): { archetype: string; archetypeDescription: string; coreEnergyTags: string[] } {
  // Check auspicious formations first
  const patternNames = patterns.map((p) => p.name);

  // 1. Prestigious Named Formations
  if (patternNames.some((n) => n.includes("极向离明"))) {
    return {
      archetype: "极向离明·九五至尊统御型",
      archetypeDescription: "紫微在午位独坐坐命，无煞星冲破。乃紫微斗数至尊大格，天生自带帝王统摄之气与中枢定力，善于执掌全局、经天纬地。",
      coreEnergyTags: ["帝星入庙", "九五之尊", "统揽全局", "威严厚重", "经世济民"],
    };
  }
  if (patternNames.some((n) => n.includes("紫府同宫") || n.includes("紫府朝垣"))) {
    return {
      archetype: "紫府同临·王霸经世领袖型",
      archetypeDescription: "紫微北斗帝星与天府南斗令星同宫或交会，兼具号令四方之威严与库藏万物之仁厚，属于能聚合各方诸侯、开创基业的领军巨擘。",
      coreEnergyTags: ["紫府同宫", "帝令兼备", "政商通达", "富贵双全", "坐镇中枢"],
    };
  }
  if (patternNames.some((n) => n.includes("阳梁昌禄"))) {
    return {
      archetype: "阳梁昌禄·学冠群伦金榜型",
      archetypeDescription: "太阳、天梁、文昌、禄存四吉星会照。天生文采风流、博学鸿儒，极利公职、学术、国家大考与高端专业领域，能名扬四海、青史留名。",
      coreEnergyTags: ["国家栋梁", "清贵显赫", "名扬海内", "金榜题名", "法度威严"],
    };
  }
  if (patternNames.some((n) => n.includes("日月并明") || n.includes("丹墀桂墀"))) {
    return {
      archetype: "日月并明·经纬天地政商型",
      archetypeDescription: "太阳居巳午庙旺，太阴居酉戌生辉。阴阳并照，才思敏捷，心胸如日月朗照乾坤，在政界、商界或高层管理中出类拔萃，功名显达。",
      coreEnergyTags: ["日月争辉", "光明磊落", "才高八斗", "贵气逼人", "登峰造极"],
    };
  }
  if (patternNames.some((n) => n.includes("武贪同行") || n.includes("火贪") || n.includes("铃贪"))) {
    return {
      archetype: "武贪爆发·白手起家巨富型",
      archetypeDescription: "武曲财星遇贪狼才艺之星，属于典型'先贫后富、中年暴发'之格。早年历经淬炼磨砺，中年遇良机如鹰击长空，能迅速聚敛巨额财富。",
      coreEnergyTags: ["白手起家", "中年暴发", "商界奇才", "果敢勇决", "富甲一方"],
    };
  }
  if (patternNames.some((n) => n.includes("巨日同宫"))) {
    return {
      archetype: "巨日同宫·辩才无碍名播型",
      archetypeDescription: "太阳与巨门在寅申同坐。借太阳之光驱散巨门之暗，口才极佳，思维宏阔，极善演讲公关、涉外贸易、法律法学与跨国产业开拓。",
      coreEnergyTags: ["辩才无碍", "声播海外", "跨界先驱", "光明正大", "破暗生辉"],
    };
  }
  if (patternNames.some((n) => n.includes("三奇嘉会"))) {
    return {
      archetype: "三奇嘉会·文武兼备大成型",
      archetypeDescription: "命宫三方四正同时会合化禄、化权、化科三大吉化。命主才干出众，兼具财源机遇、权力魄力与卓越名望，乃百年难遇之经邦大才。",
      coreEnergyTags: ["三奇嘉会", "科权禄齐", "平步青云", "名利双收", "经邦济世"],
    };
  }
  if (patternNames.some((n) => n.includes("明珠出海"))) {
    return {
      archetype: "明珠出海·名扬四海通达型",
      archetypeDescription: "命坐未宫无主星，得卯宫太阳庙旺、亥宫太阴入庙会照。如明珠出蚌，光芒万丈，早岁得志，四海扬名，贵不可言。",
      coreEnergyTags: ["明珠出海", "贵人提携", "名气极盛", "财运顺达", "格局清贵"],
    };
  }
  if (patternNames.some((n) => n.includes("石中隐玉"))) {
    return {
      archetype: "石中隐玉·深沉冷峻谋略型",
      archetypeDescription: "巨门在子午坐命，化禄或化权。如璞玉藏于顽石，早年不显山不露水，经岁月琢磨后锋芒毕露，在幕后参谋、深度研发或高难博弈中一锤定音。",
      coreEnergyTags: ["石中隐玉", "厚积薄发", "洞察入微", "智计绝伦", "一鸣惊人"],
    };
  }
  if (patternNames.some((n) => n.includes("府相朝垣") || n.includes("君臣庆会"))) {
    return {
      archetype: "府相朝垣·厚德载物柱石型",
      archetypeDescription: "天府与天相拱卫命宫，食禄万钟，稳健端庄。行事大公无私，极具公信力与社会威望，常居集团核心、政府枢要或公门宰辅。",
      coreEnergyTags: ["府相朝垣", "食禄万钟", "稳健持重", "中流砥柱", "人脉极广"],
    };
  }

  // 2. Double Star Combinations in Life Palace
  const pair = lifeStars.slice().sort().join("+");

  if (lifeStars.includes("紫微") && lifeStars.includes("七杀")) {
    return {
      archetype: "将相合一·果决统帅型",
      archetypeDescription: "紫微化杀为权，兼备帝王之远见与战将之凌厉。极具魄力与执行力，敢于打硬仗、挑重担，在商战或军政领域能独当一面。",
      coreEnergyTags: ["化杀为权", "大将之风", "雷厉风行", "威震四方", "铁血手腕"],
    };
  }
  if (lifeStars.includes("紫微") && lifeStars.includes("破军")) {
    return {
      archetype: "锐意革新·开疆辟土先锋型",
      archetypeDescription: "紫微帝星驾驭破军狂飙之势，一生敢破敢立。不甘居人之下，善于颠覆传统、开创新赛道，是天生的行业颠覆者与创业领军人。",
      coreEnergyTags: ["锐意创新", "打破常规", "破旧立新", "勇猛精进", "自立门户"],
    };
  }
  if (lifeStars.includes("紫微") && lifeStars.includes("贪狼")) {
    return {
      archetype: "才艺双绝·桃花帝旺魅力型",
      archetypeDescription: "紫微遇贪狼，将尊贵帝气与圆融情商融为一体。交际手腕极其高超，情商超群，善于在政商社交圈中如鱼得水、整合庞大人脉网络。",
      coreEnergyTags: ["八面玲珑", "魅力非凡", "才貌双全", "政商通融", "资源整合"],
    };
  }
  if (lifeStars.includes("紫微") && lifeStars.includes("天相")) {
    return {
      archetype: "君臣庆会·威严宰辅重臣型",
      archetypeDescription: "帝印相随，处事公允端庄，极讲信誉与规矩。适合执掌中枢大印、集团治理或高层运营，深得上下各界信赖。",
      coreEnergyTags: ["执掌枢要", "处事公允", "贵人重臣", "信誉卓著", "稳固根基"],
    };
  }
  if (lifeStars.includes("廉贞") && lifeStars.includes("七杀")) {
    return {
      archetype: "雄宿朝元·刚毅威权实战型",
      archetypeDescription: "廉贞七杀在丑未坐命，积聚冲天气魄。为人极具原则，敢爱敢恨，在竞争激烈或高压实战环境中能脱颖而出、建功立业。",
      coreEnergyTags: ["刚毅果决", "实战先锋", "勇挑重担", "百折不挠", "战功赫赫"],
    };
  }
  if (lifeStars.includes("廉贞") && lifeStars.includes("破军")) {
    return {
      archetype: "雷厉风行·前沿破局探路型",
      archetypeDescription: "廉破坐命，冲劲十足，思维敏锐而不拘一格。最擅长开拓新市场、研发新技术或执行紧急破局任务，敢于承担高风险高回报之重任。",
      coreEnergyTags: ["雷厉风行", "敢为人先", "破局突围", "机变百出", "前沿探路"],
    };
  }
  if (lifeStars.includes("廉贞") && lifeStars.includes("天相")) {
    return {
      archetype: "严谨律己·经国宰辅重臣型",
      archetypeDescription: "廉相坐命，外圆内方，原则性极强。在公门、法律、金融风控或大型企业治理中，能以制度化管理带领团队迈向正轨。",
      coreEnergyTags: ["严明法度", "外圆内方", "风控掌门", "重诺守信", "公门显达"],
    };
  }
  if (lifeStars.includes("天机") && lifeStars.includes("太阴")) {
    return {
      archetype: "智谋深邃·内秀清雅策士型",
      archetypeDescription: "天机之智慧与太阴之细腻相融，策划能力与心理洞察力极强。善于在幕后运筹帷幄、规划战略，文思泉涌，多才多艺。",
      coreEnergyTags: ["深谋远虑", "心理洞察", "战略策士", "清雅高洁", "文思泉涌"],
    };
  }
  if (lifeStars.includes("天机") && lifeStars.includes("巨门")) {
    return {
      archetype: "神机妙算·辩才纵横谋略型",
      archetypeDescription: "天机智慧与巨门辩才交汇，思维缜密，善于发现事物盲点与底层逻辑。在咨询、辩护、谈判与高维博弈中无往不利。",
      coreEnergyTags: ["神机妙算", "辩才无碍", "博弈高手", "逻辑严密", "一针见血"],
    };
  }
  if (lifeStars.includes("天机") && lifeStars.includes("天梁")) {
    return {
      archetype: "善荫朝纲·高深谋略导师型",
      archetypeDescription: "机梁同宫，智仁兼备。既有神机妙算的谋略，又有天梁老成持重的仁厚，常为政企高层之首席顾问或行业宗师级导师。",
      coreEnergyTags: ["智仁兼备", "首席顾问", "行业导师", "化险为夷", "老成谋国"],
    };
  }
  if (lifeStars.includes("天同") && lifeStars.includes("天梁")) {
    return {
      archetype: "福寿双全·温润清贵仁厚型",
      archetypeDescription: "同梁坐命，福星与荫星并聚。一生多逢凶化吉之奇遇，为人善良宽厚，德高望重，善结善缘，晚年福寿绵长。",
      coreEnergyTags: ["福星高照", "遇难呈祥", "温润如玉", "仁者无敌", "福寿康宁"],
    };
  }
  if (lifeStars.includes("天同") && lifeStars.includes("太阴")) {
    return {
      archetype: "灵秀温雅·审美灵感艺术型",
      archetypeDescription: "同阴坐命于子丑，水澄桂萼。容貌清秀，富于艺术灵感与生活情趣，在文化、创意、设计或高端消费领域极具天赋。",
      coreEnergyTags: ["水澄桂萼", "审美卓绝", "温婉灵秀", "艺术天赋", "人缘极佳"],
    };
  }
  if (lifeStars.includes("天同") && lifeStars.includes("巨门")) {
    return {
      archetype: "先苦后甜·细腻深思钻研型",
      archetypeDescription: "同巨坐命，早年需经历一番心性淬炼，中年后大显身手。思维细致入微，善于钻研冷门高深学问或技术专长，后劲无穷。",
      coreEnergyTags: ["厚积薄发", "专研精深", "先苦后甜", "大器晚成", "技冠群芳"],
    };
  }
  if (lifeStars.includes("武曲") && lifeStars.includes("天府")) {
    return {
      archetype: "财库丰沛·实业巨擘金阀型",
      archetypeDescription: "武曲正财星与天府大财库同宫于子午，天生具备强烈的商业嗅觉与资产管理能力。为人沉稳务实，聚财守库，实业根基极为雄厚。",
      coreEnergyTags: ["财库丰沛", "实业巨头", "资产大亨", "沉着厚重", "富贵绵长"],
    };
  }
  if (lifeStars.includes("武曲") && lifeStars.includes("天相")) {
    return {
      archetype: "刚柔相济·实干经略宰执型",
      archetypeDescription: "武曲之刚毅与天相之端庄互补，既有果决的执行魄力，又有协调各方的外交手腕，是现代企业运营与资本运作的卓越舵手。",
      coreEnergyTags: ["刚柔并济", "经略实干", "运营舵手", "资本运作", "信誉第一"],
    };
  }
  if (lifeStars.includes("武曲") && lifeStars.includes("七杀")) {
    return {
      archetype: "白手创业·铁血战将先锋型",
      archetypeDescription: "武杀坐命，个性刚烈坚韧，具有极强的生存本能与拼搏意志。面对艰难险阻敢打敢拼，往往能凭借硬实力在荒原上杀出一条血路。",
      coreEnergyTags: ["铁血战将", "白手起家", "杀伐果断", "硬汉作风", "逆境狂飙"],
    };
  }
  if (lifeStars.includes("武曲") && lifeStars.includes("破军")) {
    return {
      archetype: "破而后立·巧艺生财弄潮型",
      archetypeDescription: "武破坐命，敢于打破常规模式，勇于进行颠覆性投资或跨界重组。具有独特的商业直觉与巧艺专长，善于在行业周期波动中捕捉暴利。",
      coreEnergyTags: ["破旧立新", "颠覆投资", "周期猎手", "巧艺通达", "敢为人先"],
    };
  }
  if (lifeStars.includes("太阳") && lifeStars.includes("太阴")) {
    return {
      archetype: "日月同临·文韬武略变通型",
      archetypeDescription: "太阳与太阴同守命宫于丑未，兼具太阳之博爱远见与太阴之细腻审慎。性格圆通变通，极善顺应时势，能游刃有余地驾驭复杂人际与商业局面。",
      coreEnergyTags: ["日月同临", "兼收并蓄", "进退自如", "变通应变", "大格局"],
    };
  }

  // 3. Single Star Life Palace
  if (lifeStars.includes("七杀")) {
    return {
      archetype: "独当一面·横刀立马大将型",
      archetypeDescription: "七杀为南斗大将之星，坐命主个性孤高果断，有独挽狂澜之志。不喜依赖他人，敢于独立挑起最艰难之事业重担，大将之风一览无余。",
      coreEnergyTags: ["横刀立马", "独当一面", "果断威严", "重任在肩", "披荆斩棘"],
    };
  }
  if (lifeStars.includes("破军")) {
    return {
      archetype: "革故鼎新·先锋破浪弄潮型",
      archetypeDescription: "破军为开路先锋之星，坐命主一生求新求变。敢于向既定规则发起挑战，在创新、创业、产业重构与前沿探索中往往能开辟全新天地。",
      coreEnergyTags: ["破浪前行", "革故鼎新", "创新领袖", "无所畏惧", "自创新局"],
    };
  }
  if (lifeStars.includes("贪狼")) {
    return {
      archetype: "多面奇才·圆通纵横名流型",
      archetypeDescription: "贪狼为第一才艺与桃花之星，为人多才多艺，灵动多变，极善人际斡旋与公关交际。在多元化赛道、商界名利场中如鱼得水。",
      coreEnergyTags: ["多才多艺", "圆融通达", "公关名流", "敏锐多智", "运筹帷幄"],
    };
  }
  if (lifeStars.includes("紫微")) {
    return {
      archetype: "尊贵自持·执掌乾坤领袖型",
      archetypeDescription: "紫微帝星独坐命宫，气度威严高贵，自带领袖气场。处事高瞻远瞩，重视声誉与风范，善于聚拢贤才、驾驭大局。",
      coreEnergyTags: ["紫微帝座", "高瞻远瞩", "尊贵稳重", "统领四方", "王者风范"],
    };
  }
  if (lifeStars.includes("天府")) {
    return {
      archetype: "厚德载物·坐镇中枢令尹型",
      archetypeDescription: "天府为南斗主星、号令之神与财库之尊。个性沉着宽厚，不骄不躁，善于守成与资源统筹，是团队与家族中最可靠的定海神针。",
      coreEnergyTags: ["天府令星", "厚德载物", "库藏充盈", "定海神针", "宽仁大度"],
    };
  }
  if (lifeStars.includes("太阳")) {
    return {
      archetype: "光明磊落·博施济众领袖型",
      archetypeDescription: "太阳官禄主星，光芒万丈，重情重义。具有极强的社会责任感与大局观，常为公众福祉、行业标准或集体利益奔走呼号，威望极高。",
      coreEnergyTags: ["如日中天", "光明磊落", "重义轻利", "威望素著", "博爱天下"],
    };
  }
  if (lifeStars.includes("太阴")) {
    return {
      archetype: "细腻内敛·富贵潜藏智者型",
      archetypeDescription: "太阴田宅主星，心细如发，智慧深藏。擅长资产配置、不动产投资与幕后谋划，性格温和沉静，财不外露，富贵绵远。",
      coreEnergyTags: ["太阴明澈", "富贵潜藏", "财智过人", "宁静致远", "内秀充盈"],
    };
  }
  if (lifeStars.includes("武曲")) {
    return {
      archetype: "刚毅果敢·实干求富金星型",
      archetypeDescription: "武曲正财金星，办事雷厉风行，重信守诺，讲究实效。不喜空谈，以强大的行动力与财务敏锐度直击核心目标，实干成大器。",
      coreEnergyTags: ["武曲金星", "刚毅果断", "务实高效", "财源通达", "一诺千金"],
    };
  }
  if (lifeStars.includes("天同")) {
    return {
      archetype: "知足常乐·福星高照温润型",
      archetypeDescription: "天同福星坐命，性情温和谦逊，与人为善。一生贵人多助，心态豁达从容，能享清福，且在文化创意、教育公益领域极具亲和力。",
      coreEnergyTags: ["天同福星", "和气生财", "与人为善", "清福无边", "福缘深厚"],
    };
  }
  if (lifeStars.includes("廉贞")) {
    return {
      archetype: "傲骨自持·原则至上执法型",
      archetypeDescription: "廉贞次桃花兼事业星，清高自律，原则性极强。凡事要求精益求精，在技术专研、法律合规、政界政务中能恪尽职守、威严赫赫。",
      coreEnergyTags: ["廉洁奉公", "原则分明", "精益求精", "傲骨凌霜", "克己奉公"],
    };
  }
  if (lifeStars.includes("巨门")) {
    return {
      archetype: "洞若观火·雄辩审慎专家型",
      archetypeDescription: "巨门主暗与口才，洞察力极强，对细节与潜在漏洞有天然直觉。擅长分析、研究、法律、公关谈判与学术辩论，靠硬核专业立世。",
      coreEnergyTags: ["明察秋毫", "辩才卓绝", "专家本色", "逻辑深邃", "独具慧眼"],
    };
  }
  if (lifeStars.includes("天相")) {
    return {
      archetype: "公正严明·中枢辅佐宰执型",
      archetypeDescription: "天相掌印之星，仪表堂堂，仗义执言，处事公平公道。深得团队与领导信任，善于协调复杂人际，是不可多得的高层中枢宰执之才。",
      coreEnergyTags: ["掌印宰辅", "公正廉明", "深得信赖", "仪态万方", "四海归心"],
    };
  }
  if (lifeStars.includes("天梁")) {
    return {
      archetype: "仁厚长者·解厄清流宗师型",
      archetypeDescription: "天梁为荫星与清流之星，老成持重，好打抱不平。具有宗师风范与化险为夷之超凡能力，在医疗、法律、教育、科研界享有崇高声誉。",
      coreEnergyTags: ["天梁化荫", "德高望重", "化险为夷", "一代宗师", "仁者爱人"],
    };
  }
  if (lifeStars.includes("天机")) {
    return {
      archetype: "思维超群·机变灵动智囊型",
      archetypeDescription: "天机为智慧谋略之星，反应敏捷，算无遗策。擅长战略推演、IT科创、运筹规划与复杂系统架构，是不可或缺的军师大脑。",
      coreEnergyTags: ["智慧超群", "机变神算", "军师谋略", "科技先锋", "洞悉先机"],
    };
  }

  // 4. Empty Palace (命无主星，借对宫迁移宫)
  if (lifeStars.length === 0) {
    if (travelStars.length > 0) {
      return {
        archetype: `借星造极·${travelStars.join("")}乾坤借运型`,
        archetypeDescription: `命宫无主星，借对宫迁移宫【${travelStars.join("、")}】星光照入。命主心胸开阔，不拘泥于固定框架，极善顺应环境变化、借力打力，在异地或跨界领域更易成大器。`,
        coreEnergyTags: ["借力打力", "圆融变通", "跨界突围", "外出大发", "乾坤借势"],
      };
    }
    return {
      archetype: "圆融应变·借势腾达型",
      archetypeDescription: "命无正曜，纳八方吉气。性格极具包容性与灵活性，善于捕捉外界风口与贵人资源，以柔克刚，借势而上。",
      coreEnergyTags: ["以柔克刚", "善借外力", "灵动应变", "纳福迎祥", "圆融自得"],
    };
  }

  // Final fallback based on Branch & Stem
  return {
    archetype: "乾坤正气·厚积薄发笃行型",
    archetypeDescription: "性格沉着坚毅，注重长远筹谋与实干根基。行事有章法，不疾不徐，在专业领域或经营管理中能厚积薄发、稳步登顶。",
    coreEnergyTags: ["厚积薄发", "脚踏实地", "沉稳坚韧", "基业长青", "笃行致远"],
  };
}

export function generateFullFateAnalysis(chart: NatalChart): FullFateAnalysis {
  const lifePalace = chart.palaces.find((p) => p.isLifePalace) || chart.palaces[0];
  const bodyPalace = chart.palaces.find((p) => p.isBodyPalace) || chart.palaces[0];
  const careerPalace = getPalace(chart, "官禄宫");
  const wealthPalace = getPalace(chart, "财帛宫");
  const marriagePalace = getPalace(chart, "夫妻宫");
  const travelPalace = getPalace(chart, "迁移宫");
  const friendsPalace = getPalace(chart, "仆役宫");
  const healthPalace = getPalace(chart, "疾厄宫");
  const propertyPalace = getPalace(chart, "田宅宫");
  const fortunePalace = getPalace(chart, "福德宫");

  const lifeStars = getMajorStarNames(lifePalace);
  const bodyStars = getMajorStarNames(bodyPalace);
  const careerStars = getMajorStarNames(careerPalace);
  const wealthStars = getMajorStarNames(wealthPalace);
  const marriageStars = getMajorStarNames(marriagePalace);
  const travelStars = getMajorStarNames(travelPalace);
  const friendsStars = getMajorStarNames(friendsPalace);
  const healthStars = getMajorStarNames(healthPalace);
  const propertyStars = getMajorStarNames(propertyPalace);
  const fortuneStars = getMajorStarNames(fortunePalace);

  const lifeSiHua = getPalaceSiHua(lifePalace);
  const careerSiHua = getPalaceSiHua(careerPalace);
  const wealthSiHua = getPalaceSiHua(wealthPalace);
  const marriageSiHua = getPalaceSiHua(marriagePalace);
  const travelSiHua = getPalaceSiHua(travelPalace);
  const friendsSiHua = getPalaceSiHua(friendsPalace);
  const healthSiHua = getPalaceSiHua(healthPalace);
  const propertySiHua = getPalaceSiHua(propertyPalace);
  const fortuneSiHua = getPalaceSiHua(fortunePalace);

  // Dynamic Archetype Calculation
  const { archetype, archetypeDescription, coreEnergyTags } = resolveDetailedArchetype(
    lifeStars,
    travelStars,
    careerStars,
    wealthStars,
    lifePalace.branch,
    chart.patterns,
    chart.annualSiHua
  );

  // --- Dimension 1: Personality & Psyche (心性性格) ---
  const personalityScore = lifeSiHua.quan ? 94 : lifeSiHua.ke ? 92 : lifeSiHua.lu ? 90 : 86;
  const pTags: string[] = [];
  if (lifeStars.includes("紫微")) pTags.push("尊贵自重", "领导风范");
  if (lifeStars.includes("天府")) pTags.push("沉稳老练", "包容大度");
  if (lifeStars.includes("天机")) pTags.push("神机妙算", "机变敏锐");
  if (lifeStars.includes("太阳")) pTags.push("光明磊落", "重义乐施");
  if (lifeStars.includes("武曲")) pTags.push("刚毅果断", "务实干练");
  if (lifeStars.includes("天同")) pTags.push("温文尔雅", "知足常乐");
  if (lifeStars.includes("廉贞")) pTags.push("清高自律", "极具原则");
  if (lifeStars.includes("太阴")) pTags.push("心思细腻", "富于审美");
  if (lifeStars.includes("贪狼")) pTags.push("多才多艺", "圆融通达");
  if (lifeStars.includes("巨门")) pTags.push("辩才无碍", "洞察入微");
  if (lifeStars.includes("天相")) pTags.push("端庄仗义", "处事公允");
  if (lifeStars.includes("天梁")) pTags.push("仁厚持重", "好为人师");
  if (lifeStars.includes("七杀")) pTags.push("果敢威猛", "独当一面");
  if (lifeStars.includes("破军")) pTags.push("敢破敢立", "勇于创新");
  if (pTags.length === 0) {
    pTags.push(...travelStars.map((s) => `${s}借照`), "借力使力", "适应敏捷");
  }

  const personalityDimension: FateDimensionAnalysis = {
    id: "personality",
    title: "心性本质与性格特质",
    subtitle: "命身同参 · 核心秉赋与潜意识驱动力",
    score: personalityScore,
    scoreLabel: personalityScore >= 90 ? "极具魄力" : "明澈坚韧",
    tagList: [...coreEnergyTags.slice(0, 3), ...pTags.slice(0, 3)].slice(0, 5),
    icon: "User",
    summary: `命主命坐【${lifePalace.branch}】宫，核心坐守星曜为【${lifeStars.join("、") || `空宫（借迁移宫${travelStars.join("、")}照入）`}】，身宫坐【${bodyPalace.branch}】宫（${bodyPalace.name}）。性格呈现${archetype}之宏伟气象，兼具卓绝之执行魄力与大局洞察。`,
    details: [
      {
        heading: "表象性格与日常处世风格",
        content: `日常处世与社交中，命主展现出${
          lifeStars.some((s) => ["七杀", "破军", "武曲"].includes(s))
            ? "极其干脆利落、讲求实效的办事风格，不喜拖泥带水，说话一针见血，对认准的目标有极强的推进行动力与斩将夺旗之气魄。"
            : lifeStars.some((s) => ["紫微", "天府", "天梁", "天相"].includes(s))
            ? "端庄稳重、气度轩昂的领袖风范。处事不骄不躁，善于倾听各方意见后作出权威决断，在集体中极易成为核心支柱与定海神针。"
            : lifeStars.some((s) => ["天机", "巨门", "太阴"].includes(s))
            ? "思维深邃敏捷、算无遗策之军师气质。洞察入微，善于运用逻辑与智慧化解复杂矛盾，在谋略规划上常发常新。"
            : "灵动圆融、温文尔雅的君子风范。待人接物客气周到，擅长借力打力、整合多方利益，令人如沐春风。"
        }`,
      },
      {
        heading: "潜意识情志与内在真实动机（身宫与福德宫互动）",
        content: `身宫坐${bodyPalace.name}，主宰后天三十岁后的行为重心理念。福德宫坐守【${fortuneStars.join("、") || "天府天梁会照"}】。命主内心深处${
          fortuneStars.some((s) => ["天同", "太阴", "贪狼"].includes(s))
            ? "非常重视精神生活的品位与自我愉悦感，物质财富是基础，但心灵的从容自在、审美升华与情感共鸣才是终极追求。"
            : fortuneStars.some((s) => ["紫微", "武曲", "七杀", "天府"].includes(s))
            ? "有极强的事业野心与成就动机，渴望通过实实在在的功名、权柄与实业成果证明自身价值，耐得住寂寞与重压，不甘平庸。"
            : "追求安稳有序的生活节奏与精神富足，重视家庭天伦与知己同行，凡事讲求问心无愧与长远心安。"
        }`,
      },
      {
        heading: "性格优势与盲点警示",
        content: `【最大优势】：${pTags.slice(0, 3).join("、")}，在重大变局与逆境中具备超凡之定力与韧性。【盲点避坑】：${
          lifeSiHua.ji || hasAnyStar(lifePalace, ["擎羊", "陀罗", "化忌"])
            ? "偶有执念过深或在某些细节上过于严苛，宜修习倪师'以柔克刚、顺势而为'之道，放宽心量方能成就更大事业。"
            : "在关键抉择时刻切忌瞻前顾后或过于顾及面子，需牢记倪师'以果决行'心法，当断则断。"
        }`,
      },
    ],
    tianjiRule: "倪师天纪论心性：命为先天禀赋，身为后天修为。心性正则万事顺，有容乃大，唯公生明，唯廉生威。",
    actionAdvice: "以果决行：发挥自身主星之先天优势，在团队中敢于承担核心决策，同时对身边伙伴多施以包容与授权。",
    riskNotice: "严防因好胜心切而陷入孤立无援，修习《易经·地天泰》之虚怀若谷。",
  };

  // --- Dimension 2: Overall Life Trajectory (总体运势与大运格局) ---
  // Find Decades 2, 3, 4, 5, 6
  const sortedPalacesByDecade = [...chart.palaces].sort((a, b) => a.decadeStartAge - b.decadeStartAge);
  const decade2 = sortedPalacesByDecade[1] || sortedPalacesByDecade[0]; // Youth (approx 12-25)
  const decade3 = sortedPalacesByDecade[2] || decade2; // Young Adult (approx 22-35)
  const decade4 = sortedPalacesByDecade[3] || decade3; // Middle Age (approx 32-45)
  const decade5 = sortedPalacesByDecade[4] || decade4; // Mature Middle (approx 42-55)
  const decade6 = sortedPalacesByDecade[5] || decade5; // Later (52+)

  const d23Stars = [...decade2.majorStars, ...decade3.majorStars].map((s) => s.name);
  const d23HasJi = [...decade2.majorStars, ...decade2.minorStars, ...decade3.majorStars, ...decade3.minorStars].some((s) => s.sihua === "忌");
  const d23HasLuQuan = [...decade2.majorStars, ...decade2.minorStars, ...decade3.majorStars, ...decade3.minorStars].some((s) => s.sihua === "禄" || s.sihua === "权");
  const d23HasSha = [...decade2.minorStars, ...decade3.minorStars].some((s) => ["擎羊", "陀罗", "火星", "铃星", "地空", "地劫"].includes(s.name));

  const d45Stars = [...decade4.majorStars, ...decade5.majorStars].map((s) => s.name);
  const d45HasJi = [...decade4.majorStars, ...decade4.minorStars, ...decade5.majorStars, ...decade5.minorStars].some((s) => s.sihua === "忌");
  const d45HasLuQuan = [...decade4.majorStars, ...decade4.minorStars, ...decade5.majorStars, ...decade5.minorStars].some((s) => s.sihua === "禄" || s.sihua === "权");
  const d45HasSha = [...decade4.minorStars, ...decade5.minorStars].some((s) => ["擎羊", "陀罗", "火星", "铃星", "地空", "地劫"].includes(s.name));

  const d6Stars = [...decade6.majorStars].map((s) => s.name);
  const d6HasJi = [...decade6.majorStars, ...decade6.minorStars].some((s) => s.sihua === "忌");

  // Realistic stage 1 text
  let stage1Text = "";
  if (d23HasJi || d23HasSha) {
    stage1Text = `● 【青年探索与磨砺期 (${decade2.decadeStartAge}-${decade3.decadeEndAge}岁)】：大限步入【${decade2.name}】与【${decade3.name}】，逢${d23Stars.slice(0, 2).join("、") || "星曜散落"}见煞忌扰动。初入社会或求学阶段多遇探索与试错，可能会经历换方向、收入拮据、竞争压力或方向迷茫。此乃常人扎根之必经淬炼，切忌眼高手低或盲目借贷，踏实学精一门看家本领为第一要务。`;
  } else if (d23HasLuQuan) {
    stage1Text = `● 【青年顺境进阶期 (${decade2.decadeStartAge}-${decade3.decadeEndAge}岁)】：大限行至【${decade2.name}】与【${decade3.name}】，逢${d23Stars.slice(0, 2).join("、")}得权禄吉星相扶。青年起步阶段机遇较好，适应力强，求学或职场开局相对顺遂，宜趁势打好专业功底。`;
  } else {
    stage1Text = `● 【青年平稳筑基期 (${decade2.decadeStartAge}-${decade3.decadeEndAge}岁)】：大限星情平实稳健。无大起大落之风浪，亦无骤然爆发之暴富。按部就班求学或就业，在平凡岗位上一步一个脚印积累技能、履历与人际经验。`;
  }

  // Realistic stage 2 text
  let stage2Text = "";
  if (d45HasJi || d45HasSha) {
    stage2Text = `● 【中年负重与攻坚期 (${decade4.decadeStartAge}-${decade5.decadeEndAge}岁)】：大限步入【${decade4.name}】与【${decade5.name}】（${d45Stars.slice(0, 2).join("、")}逢煞忌）。中年期上有老下有小，职场易遇瓶颈或行业调整，生活开支与责任倍增。常人立命此阶段务必'求稳防亏'，守住主业现金流，严控大额杠杆债务与非理性投资，保重身心健康即可安稳渡过难关。`;
  } else if (d45HasLuQuan) {
    stage2Text = `● 【中年掌舵与成长期 (${decade4.decadeStartAge}-${decade5.decadeEndAge}岁)】：大限逢${d45Stars.slice(0, 2).join("、")}配合吉化，迎来人生精力与经验的黄金兑现期。责任加重的同时平台与回报亦相应提升，宜专注核心主业，稳扎稳打夯实家庭资产基本盘。`;
  } else {
    stage2Text = `● 【中年平稳持家期 (${decade4.decadeStartAge}-${decade5.decadeEndAge}岁)】：大限星曜平稳温和。生活以工作平稳、薪水持家、子女教育与家庭安康为主轴。不盲目羡慕虚妄投机，量入为出，过好踏实本分的烟火生活。`;
  }

  // Realistic stage 3 text
  let stage3Text = "";
  if (d6HasJi) {
    stage3Text = `● 【晚景调养与守成期 (${decade6.decadeStartAge}岁以后)】：大限注重退居幕后与身心修养。凡事看开看淡，不为琐事过度操心劳力，把重心放在健康保养、规律作息与享受清静上。`;
  } else {
    stage3Text = `● 【晚景安和与福泽期 (${decade6.decadeStartAge}岁以后)】：运势渐趋平稳安宁，经验与资产沉淀见效，能够安享家庭天伦与恬淡生活。`;
  }

  const overallScore = chart.patterns[0]?.type === "auspicious" ? 90 : 82;
  const overallDimension: FateDimensionAnalysis = {
    id: "overallFate",
    title: "总体命运走势与人生格局",
    subtitle: "宏观生命周期 · 真实大运起伏与常人立命法则",
    score: overallScore,
    scoreLabel: overallScore >= 88 ? "大局清朗" : "平稳务实",
    tagList: [
      chart.patterns[0]?.name.split("（")[0] || archetype.split("·")[0],
      `${chart.bureau}`,
      chart.yinYangGender,
      d23HasJi ? "早年磨砺" : "步步为营",
      d45HasJi ? "中年求稳" : "中年守正",
      "常人安命",
    ],
    icon: "Compass",
    summary: `命造核心格局呈现【${chart.patterns[0]?.name || archetype}】。世间绝大多数人皆为寻常百姓，大运有起有落、有顺有阻实为常态。本盘大运轨迹清晰揭示了各个年龄段的真实发力点与避坑重心。`,
    details: [
      {
        heading: "人生发展三阶段真实起伏透视（依实际大限星情）",
        content: `${stage1Text}\n\n${stage2Text}\n\n${stage3Text}`,
      },
      {
        heading: "常人立命与现实生存智慧（破除虚妄幻想）",
        content: `《天纪》核心告诫：世间十之八九皆为常人，大富大贵与极凶极险之局千中无一。命理之真谛绝非兜售虚妄富贵，而是让人'知己之长短、明运之顺逆'：\n1. 【顺境时不骄狂】：遇吉限时多积蓄本金与口碑，不铺张浪费。\n2. 【逆境时不盲动】：逢煞忌运势时切忌加杠杆孤注一掷，守好本职工作与健康即是胜利。\n3. 【平淡时知足常乐】：不陷入焦虑内耗，过好柴米油盐寻常生活，也是一种了不起的成功。`,
      },
    ],
    tianjiRule: "天纪核心铁律：君子问祸不问福。识时务者为俊杰，知进退者为神明。命好不如习惯好，运好不如心胸好。",
    actionAdvice: "根据各阶段大运之真实顺逆调整预期与行动节奏：顺境发力求进，阻滞期以守为攻、沉淀技能。",
  };

  // --- Dimension 3: Social Circles & Nobles (会遇到什么样的人 / 贵人小人) ---
  const nobleScore =
    hasAnyStar(travelPalace, ["天魁", "天钺", "左辅", "右弼"]) ||
    hasAnyStar(friendsPalace, ["天魁", "天钺", "左辅", "右弼"]) ||
    travelSiHua.lu ||
    travelSiHua.quan
      ? 94
      : 86;

  const nobleTags: string[] = ["师长提携", "同行助力"];
  if (hasAnyStar(travelPalace, ["天魁", "天钺"])) nobleTags.push("长辈贵人", "官场引荐");
  if (hasAnyStar(friendsPalace, ["左辅", "右弼"])) nobleTags.push("得力干将", "同舟共济");
  if (hasAnyStar(travelPalace, ["文昌", "文曲"])) nobleTags.push("儒雅文士", "学术导师");
  if (travelSiHua.lu || friendsSiHua.lu) nobleTags.push("财源搭档", "贵客临门");

  const socialAndNoblesDimension: FateDimensionAnalysis = {
    id: "socialAndNobles",
    title: "人际圈层与会遇到的人（贵人与因缘）",
    subtitle: "仆役宫与迁移宫穿透 · 社交画像与知人任相",
    score: nobleScore,
    scoreLabel: nobleScore >= 90 ? "贵人极盛" : "交游广阔",
    tagList: nobleTags.slice(0, 5),
    icon: "Users",
    summary: `命主一生人际网络丰富，迁移宫坐【${travelPalace.branch}】（主出外机缘与外在人际环境），仆役宫坐【${friendsPalace.branch}】（主同僚、下属与合伙因缘）。命理显示极易吸引具备专业才干与社会声望的贵人相助。`,
    details: [
      {
        heading: "生命中会遇到的【核心贵人类型】画像",
        content: `1. 【年长位尊的权威长辈/行业导师】：通常性格威重、掌握核心产业资源或官方渠道，在命主青年或事业转型关键期给予关键指点与引荐。\n2. 【同舟共济的实干合伙人/得力副手】：为人踏实刚毅，能弥补命主某些精细执行面的不足，是命主开疆拓土路上最坚实的后盾。\n3. 【海外或异地跨界贵人】：迁移宫吉星汇聚，命主出外、跨城市或涉外交流时，极易结识高层次人脉，常有'异地遇知音'之奇缘。`,
      },
      {
        heading: "需警惕防范的【消耗型人群】特征（小人与合伙防线）",
        content: `【相貌与行事特征】：言语轻浮、眼神飘忽不定、承诺过高但从不落地的投机之辈。凡仆役宫逢${
          friendsSiHua.ji || hasAnyStar(friendsPalace, ["陀罗", "化忌", "地劫"])
            ? "化忌或煞星，切忌与无诚信之人进行大额资金借贷或草率合伙，必须白纸黑字明定权责。"
            : "羊陀火铃冲破时，需防同僚争功或下属懈怠，宜制度治人而非人情治人。"
        }`,
      },
      {
        heading: "倪师相人识人秘法与驭人之术",
        content: `《天纪·相法精义》：观人先观双目。眼神清澈坚定者必为君子，目光闪烁游移者心怀鬼胎；鼻准丰隆者心无毒，双耳贴脑者有大志。任用贤能宜多用厚重沉稳之人。`,
      },
    ],
    tianjiRule: "倪师天纪人际经：独木不成林，百川汇沧海。得道者多助，失道者寡助。敬长者如泰山，待伙伴如手足，远佞人如瘟疫。",
    actionAdvice: "主动融入行业高端智库与校友网络，多结交年龄长于自身5-10岁的实干前辈；合伙经商务必法务先行。",
    riskNotice: "不可因碍于情面而为他人作经济担保，凡遇钱财纠纷以契约为凭。",
  };

  // --- Dimension 4: Career & Ambition (事业职场与权力功名) ---
  const careerScore =
    careerSiHua.quan || careerSiHua.lu || hasAnyStar(careerPalace, ["紫微", "太阳", "天府", "武曲", "七杀"])
      ? 95
      : 88;

  const careerDimension: FateDimensionAnalysis = {
    id: "career",
    title: "事业职场与权力功名",
    subtitle: "官禄宫透视 · 黄金赛道与职场天花板",
    score: careerScore,
    scoreLabel: careerScore >= 90 ? "前程远大" : "职场栋梁",
    tagList: [
      careerStars[0] || "实业兴家",
      careerSiHua.quan ? "执掌重权" : careerSiHua.lu ? "商海弄潮" : "专业立身",
      "高维赛道",
      "管理中枢",
    ],
    icon: "Briefcase",
    summary: `官禄宫坐【${careerPalace.branch}】，坐守星曜为【${careerStars.join("、") || "天相天梁朝拱"}】。事业格局宏大，具备极强之业务统筹与组织赋能能力，在行业中注定拥有一席之地。`,
    details: [
      {
        heading: "最契合之天命行业黄金赛道推荐",
        content: `● 【主赛道一】：${
          careerStars.some((s) => ["紫微", "天府", "天相"].includes(s))
            ? "大型企业集团治理、政务与公共管理、金融投资、跨国组织高管。"
            : careerStars.some((s) => ["天机", "太阴", "文昌", "文曲"].includes(s))
            ? "高端科技研发、AI与数字化转型、智库战略顾问、文化传媒与出版教育。"
            : careerStars.some((s) => ["武曲", "七杀", "破军"].includes(s))
            ? "高端制造与实业、新能源基建、军警安防、自主创业与风险投资。"
            : "商贸物流、涉外法务、现代咨询、大健康与医药康养产业。"
        }\n● 【副赛道延伸】：依托个人专业壁垒开展知识变现、私董会咨询或战略参谋。`,
      },
      {
        heading: "职场角色定位：领军一把手 vs 核心操盘幕僚",
        content: `命造气场${
          lifeStars.some((s) => ["紫微", "七杀", "破军", "太阳", "天府"].includes(s)) || careerSiHua.quan
            ? "极其适合担任组织一把手或独立创业开拓者。天生具备号令诸侯的战略魄力，能带领团队从0到1攻城略地。"
            : "极适合担任首席战略官、二把手操盘手或独立合伙人。以智谋与协调力成为集团运转的中枢大脑，既享丰厚分红又避风头浪尖。"
        }`,
      },
    ],
    tianjiRule: "天纪官禄秘诀：官以正道显，业以实干成。居上位而不骄，在下位而不忧。以天下为己任者，天下必归之。",
    actionAdvice: "锚定自身核心优势赛道深耕五年以上，打造无可替代的专业护城河与个人IP影响力。",
  };

  // --- Dimension 5: Wealth & Assets (财帛资粮与财富资产) ---
  const wealthScore =
    wealthSiHua.lu || propertySiHua.lu || hasAnyStar(wealthPalace, ["武曲", "天府", "禄存", "太阴"])
      ? 96
      : 89;

  const wealthDimension: FateDimensionAnalysis = {
    id: "wealth",
    title: "财帛资粮与财富资产",
    subtitle: "财帛与田宅穿透 · 进财通道与不动产沉淀",
    score: wealthScore,
    scoreLabel: wealthScore >= 90 ? "财源滚滚" : "丰衣足食",
    tagList: [
      wealthStars[0] || "正财稳固",
      propertyStars[0] ? "田宅丰隆" : "置业聚财",
      "硬核资产",
      "财库充盈",
    ],
    icon: "Coins",
    summary: `财帛宫坐【${wealthPalace.branch}】（坐守【${wealthStars.join("、") || "日月朝拱"}】），田宅宫坐【${propertyPalace.branch}】（坐守【${propertyStars.join("、") || "天相天府朝拱"}】）。具备优秀的财富吸纳与资产沉淀能力。`,
    details: [
      {
        heading: "财富进账通道：正财薪资 vs 偏财投资爆发力",
        content: `【进财模式分析】：${
          wealthStars.some((s) => ["武曲", "天府", "太阴"].includes(s)) || wealthSiHua.lu
            ? "属于典型'正财厚重、偏财稳健'之双轮驱动型。既有主营业务的充沛现金流，又善于通过不动产、股权或理财获得资产复利增值。"
            : "以专业技能、智力成果及长线运筹变现为主。财源细水长流，只要守住本业，中年后财富将呈指数级累积。"
        }`,
      },
      {
        heading: "田宅库藏与不动产运势评估",
        content: `田宅宫代表实际蓄水池与家庭资产。命主田宅宫气场${
          propertySiHua.lu || hasAnyStar(propertyPalace, ["天府", "太阴", "紫微", "天梁"])
            ? "极其旺盛！极利购置高价值不动产、核心城市核心地段物业或自建优质宅邸。不动产能成为命主财富的最坚固护城河。"
            : "稳中有进，宜多将浮动盈余转化为黄金、实体房产等硬资产，切忌沉迷于高杠杆投机。"
        }`,
      },
    ],
    tianjiRule: "倪师天纪财道：君子爱财，取之有道，用之有度，聚之有法。散财得人，聚财伤道。多置不动产以固根基，此乃天纪聚富第一法则。",
    actionAdvice: "建立三层资产防御塔：30%高流动性现金储备，50%核心优质不动产与低估值硬资产，20%用于进取型产业投资。",
  };

  // --- Dimension 6: Love, Marriage & Romance (情感婚姻与正缘桃花) ---
  const loveScore =
    marriageSiHua.lu || marriageSiHua.ke || hasAnyStar(marriagePalace, ["天府", "天相", "太阴", "太阳", "天同"])
      ? 91
      : 84;

  const marriageDimension: FateDimensionAnalysis = {
    id: "marriageAndLove",
    title: "情感婚姻与正缘桃花",
    subtitle: "夫妻宫与福德宫互动 · 正缘画像与和睦之道",
    score: loveScore,
    scoreLabel: loveScore >= 90 ? "琴瑟和鸣" : "相敬如宾",
    tagList: [
      marriageStars[0] || "正缘吉顺",
      marriageStars.includes("紫微") || marriageStars.includes("天相") ? "贵气配偶" : "贤德伴侣",
      "相濡以沫",
      "早晚适宜",
    ],
    icon: "Heart",
    summary: `夫妻宫坐【${marriagePalace.branch}】，坐守星曜为【${marriageStars.join("、") || "府相朝拱"}】。婚恋关系与自身心性成熟度高度相关，正缘伴侣具备良好的家教才干与社会声望。`,
    details: [
      {
        heading: "命定正缘【伴侣画像】透视",
        content: `● 【外貌与气质】：${
          marriageStars.some((s) => ["天府", "天相", "紫微"].includes(s))
            ? "相貌端庄大方，仪态尊贵，举止得体，具有较强的管理能力与大家闺秀/青年才俊风范。"
            : marriageStars.some((s) => ["太阴", "天同", "贪狼"].includes(s))
            ? "五官秀丽，性格温润如玉，审美情趣极高，待人柔情似水，富于生活情调。"
            : "相貌清秀，眼神睿智，行事干练利落，在专业领域具备过人才干。"
        }\n● 【家庭与才干】：配偶大多出身良好家境或拥有独立的事业追求，能为家庭提供坚实的精神与物质支持。`,
      },
      {
        heading: "早婚 vs 晚婚适宜度与相处和睦法则",
        content: `《天纪》婚恋断诀：${
          lifeStars.some((s) => ["七杀", "破军", "贪狼", "武曲"].includes(s)) || marriageSiHua.ji
            ? "建议适度晚婚（男28岁后，女26岁后）。待双方心智成熟、事业根基确立后再步入婚姻，能完美化解早年年轻气盛之摩擦，夫妻恩爱白头。"
            : "婚运平稳顺畅，注重夫妻之间的平等沟通与精神共鸣即可家和万事兴。"
        }`,
      },
    ],
    tianjiRule: "天纪婚姻真言：夫妻者，阴阳之合也。乾道成男，坤道成女。相敬如宾，互为表里。家和万事兴，夫贵妻荣。",
    actionAdvice: "在家中西北乾位与西南坤位保持整洁明亮，夫妻多进行深度精神交流，共同设立家庭十年愿景。",
  };

  // --- Dimension 7: Health & Wellness (疾厄身心与五行调养) ---
  const healthScore = healthSiHua.ji || hasAnyStar(healthPalace, ["擎羊", "陀罗", "化忌"]) ? 84 : 92;
  const healthDimension: FateDimensionAnalysis = {
    id: "health",
    title: "疾厄身心与五行调养",
    subtitle: "疾厄宫穿透 · 脏腑易感排查与倪师中医心法",
    score: healthScore,
    scoreLabel: healthScore >= 90 ? "元气充沛" : "谨遵调摄",
    tagList: [
      healthStars[0] || "形神兼备",
      "养护心脾",
      "四时作息",
      "阳气充沛",
    ],
    icon: "Activity",
    summary: `疾厄宫坐【${healthPalace.branch}】，坐守星曜为【${healthStars.join("、") || "吉星拱照"}】。五行运化整体通畅，平时需注意劳逸结合，保持脾胃健运与心气平和。`,
    details: [
      {
        heading: "先天体质五行偏向与脏腑易感排查",
        content: `● 【脏腑排查重点】：${
          healthStars.some((s) => ["太阳", "廉贞"].includes(s))
            ? "五行属火，重点养护心脑血管、视力与睡眠节律，避免长期熬夜与情志过急。"
            : healthStars.some((s) => ["武曲", "七杀"].includes(s))
            ? "五行属金，注意呼吸系统、咽喉与大肠经络疏通，戒烟限酒，多食滋阴润肺之物。"
            : healthStars.some((s) => ["天机", "天梁"].includes(s))
            ? "五行属木，注意肝胆疏泄、筋骨神经与情绪舒展，避免久坐伤筋与思虑过度。"
            : "五行水土交济，重点养护脾胃消化系统与泌尿肾气，饮食宜温热甘淡，忌生冷油腻。"
        }`,
      },
      {
        heading: "倪海厦医师中医养生与起居指导",
        content: `1. 【顺应天时】：春夏养阳，秋冬养阴。早睡早起以顺应四时日光。\n2. 【扶阳固本】：倪师强调'阳气不到即为病'。日常避免贪凉饮冷，多温水足浴，保持身体四肢温暖。\n3. 【情志相胜】：喜伤心、怒伤肝、思伤脾、忧伤肺、恐伤肾。修养易经谦卦，心平气和百病不生。`,
      },
    ],
    tianjiRule: "倪海厦医道真传：正气存内，邪不可干。百病生于气，止于和。调神为上，调形次之。药补不如食补，食补不如神补。",
    actionAdvice: "每日晨起饮温水一杯，每周保持三次有氧运动使微汗出；子时（23点前）务必入眠以养胆气。",
  };

  // --- Dimension 8: Actionable Strategy (天纪经世实战运筹) ---
  const strategyDimension: FateDimensionAnalysis = {
    id: "strategyAndAction",
    title: "天纪经世实战运筹方案",
    subtitle: "以果决行 · 人生战略战术推演",
    score: 96,
    scoreLabel: "胜券在握",
    tagList: ["知进退", "以果决行", "趋吉避凶", "运筹帷幄", "经世致用"],
    icon: "ShieldAlert",
    summary: `结合紫微斗数命盘、易经六十四卦与阳宅风水三才合一，为命主量身定制以果决行之最高战略行动方针。`,
    details: [
      {
        heading: "人生三大【致胜核心王牌】",
        content: `1. 【格局魄力王牌】：${archetype}之天赋底蕴，敢于在关键节点扛起大旗。\n2. 【贵人协同王牌】：善借长辈与实干伙伴之力，借梯登高。\n3. 【资产护城河王牌】：牢牢守住核心资产与实业根基，立于不败之地。`,
      },
      {
        heading: "必须规避的三大【陷阱与盲区】",
        content: `1. 【盲目投机陷阱】：在逢化忌或大运交接年，切忌盲目扩大杠杆或涉足不熟悉领域。\n2. 【人情包袱陷阱】：不可因面子或过往人情答应超出承受能力的求助或担保。\n3. 【健康透支陷阱】：事业再繁忙亦须坚守起居作息底线，身体为万物之本。`,
      },
    ],
    tianjiRule: "天纪终极法则：天命在天，运筹在人。知天命者不怨天，知己身者不尤人。顺势而为，以果决行，无往不利！",
    actionAdvice: "心怀大志而脚踏实地。每年立春与生日前夕复盘全盘运势，遇吉星顺势猛进，遇凶煞稳守蓄力。",
  };

  const executiveSummary = `【天纪·命造全景总纲】：命主【${chart.name}】（${chart.yinYangGender}，${chart.bureau}），命坐【${lifePalace.branch}】宫，身坐【${bodyPalace.branch}】宫。核心命格原型判定为【${archetype}】。全盘气势磅礴，四化动力源【${chart.annualSiHua.lu}化禄、${chart.annualSiHua.quan}化权、${chart.annualSiHua.ke}化科、${chart.annualSiHua.ji}化忌】贯通三才。一生宏图大展，中年遇良机乘风破浪，终成大器。`;

  return {
    chartName: chart.name,
    archetype,
    archetypeDescription,
    coreEnergyTags,
    dimensions: {
      personality: personalityDimension,
      overallFate: overallDimension,
      socialAndNobles: socialAndNoblesDimension,
      career: careerDimension,
      wealth: wealthDimension,
      marriageAndLove: marriageDimension,
      health: healthDimension,
      strategyAndAction: strategyDimension,
    },
    executiveSummary,
    scores: {
      personality: personalityScore,
      career: careerScore,
      wealth: wealthScore,
      love: loveScore,
      nobles: nobleScore,
      health: healthScore,
      resilience: 93,
    },
  };
}
