// data/cards.js
// 52 张引导性问题卡牌数据
// 灵感：照见卡牌（52 张自我觉察体系）/ Holstee Reflection Cards / Know Thyself Cards
//       / Ink+Volt 12 主题 / 中文「自我探究」问卷 / Newton《人生中不可不想的问题》
// 结构：4 花色 × A–K（每个花色 13 张），正面花色+编号，背面引导性问题。
// 卡面视觉取自「鎏金扑克牌」：每张牌位挂接独立徽章(EMB) + 两行寓意(CAP)，
// 并由 cardArt.buildCard 预生成 artFront(谜面) / artBack(问题) 两个 gilded 卡面 data URI。

const { EMB, CAP, buildCard } = require('./cardArt.js');
const { assignRarity } = require('./rarity.js');

const SUITS = {
  heart:   { key: 'heart',   name: '红心', symbol: '♥', color: '#E8707A', domain: '情感 · 关系 · 内在' },
  diamond: { key: 'diamond', name: '方块', symbol: '♦', color: '#E0A55A', domain: '现实 · 金钱 · 行动' },
  club:    { key: 'club',    name: '梅花', symbol: '♣', color: '#5B9B7B', domain: '成长 · 学习 · 行动力' },
  spade:   { key: 'spade',   name: '黑桃', symbol: '♠', color: '#6B7280', domain: '挑战 · 转化 · 自我觉察' },
};

const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

// 52 条引导性问题，顺序：红心(1-13) → 方块(14-26) → 梅花(27-39) → 黑桃(40-52)
const QUESTIONS = [
  // ♥ 红心 — 情感 / 关系 / 内在满足
  '此刻，你心里最想被谁看见？',
  '最近一段让你感到「被爱着」的瞬间，是什么？',
  '你是否在某段关系里，藏着没说出口的犹豫？',
  '如果今天可以毫无负担地拥抱一个人，你会选谁？',
  '你害怕失去的，究竟是那个人，还是「被需要」的感觉？',
  '上一次你真心感谢某个人，是什么时候？',
  '你有没有把「讨好」误当成了「温柔」？',
  '谁的出现，让你重新相信了人与人的连接？',
  '你最想对五年前的自己，说一句什么关于爱的话？',
  '你是否在等一个，永远不会先开口的人？',
  '你身边那个总让你笑的人，你认真珍惜过吗？',
  '你从生命中重要的女性身上继承了哪种温柔，又想放下哪种？',
  '你理想中「被爱」的样子，是不是你从未对自己做过的？',

  // ♦ 方块 — 现实 / 金钱 / 工作 / 行动
  '如果有一笔钱能让你停下三个月，你会用来做什么？',
  '你现在的工作，是在靠近理想，还是在逃离焦虑？',
  '你为「稳定」悄悄放弃了哪些可能？',
  '有没有一件事，你其实早已负担得起，却一直没做？',
  '你赚钱的动力里，有多少是「想拥有」，多少是「怕落后」？',
  '你最近一次为喜欢的东西痛快花钱，是什么？',
  '如果不必考虑收入，你会怎样度过平凡的一天？',
  '你是否在用忙碌，回避某个不敢面对的问题？',
  '你定义的「够了吗」，是谁帮你在心里画的那条线？',
  '如果明天账户归零，你最舍不得的是哪一部分生活？',
  '有没有人的生活，你羡慕却从没说出口？',
  '你擅长在社交里扮演的那个人，是真实的你吗？',
  '如果有影响力，你最想改变的一件现实的事是什么？',

  // ♣ 梅花 — 成长 / 学习 / 行动力
  '如果今年只能养成一个习惯，你会选什么？',
  '有什么事，你一直想学却总在「等准备好」？',
  '你上一次因为「做到了」而真心为自己骄傲，是什么时候？',
  '你是否在用「计划」代替「行动」？',
  '你最近主动连结的一个新朋友或新想法，是什么？',
  '有没有人，曾在你低谷时悄悄拉了你一把？',
  '你害怕「成功」吗？它在你心里长什么样？',
  '你在谁的期待里活着，却以为那是自己的野心？',
  '你最被低估的一个能力，是什么？',
  '如果可以做一件「注定会失败但很想做」的事，会是什么？',
  '那个你欣赏的年轻人，身上有你想成为的样子吗？',
  '你自信时，眼里看见的是机会还是风险？',
  '你愿意为哪个「还看不到回报」的事持续投入？',

  // ♠ 黑桃 — 挑战 / 转化 / 自我觉察
  '有什么，是时候让它结束、好让新的开始进来？',
  '你正在逃避的那个关键问题，如果现在面对，第一步是什么？',
  '你心里有没有一道一直没补好的裂痕？',
  '如果今天允许自己「什么都不做」，你会不会反而慌？',
  '最近一次让你成长的「坏事」，回头看教会了你什么？',
  '你是否在某个低谷里，悄悄长出了一点力量？',
  '有没有一个决定，你拖了太久其实早已知道答案？',
  '哪个「诱惑」在悄悄把你带离真正想要的生活？',
  '你最不想被别人看见的脆弱，是什么？',
  '你独自硬扛的事里，有没有一件其实可以求援？',
  '你冲动做过的某个决定，现在看是勇敢还是逃避？',
  '如果「完美的你」并不存在，你能和此刻的自己和解吗？',
  '回望这一年，哪件事让你真正成了「更完整的自己」？',
];

const cards = [];
let i = 0;
for (const suitKey of ['heart', 'diamond', 'club', 'spade']) {
  const suit = SUITS[suitKey];
  RANKS.forEach((rank, idx) => {
    const emblem = EMB[suitKey][idx];
    const cap = CAP[suitKey][idx];
    // 主理人拍板的「花色 × 点数」确定性稀有度分配
    const rarity = assignRarity({ suit: suitKey, rank, globalIndex: i });
    const frontArt = buildCard({   // 谜面：问题区显示「?」
      suit: suitKey, rank, suitName: suit.name, rarity,
      emblem, c1: cap[0], c2: cap[1], showQuestion: false, themeIndex: i, split: true,
    });
    const backArt = buildCard({    // 背面：填入真实引导问题
      suit: suitKey, rank, suitName: suit.name, rarity,
      emblem, c1: cap[0], c2: cap[1], question: QUESTIONS[i], showQuestion: true, themeIndex: i, split: true,
    });
    cards.push({
      id: `${suitKey}-${rank}`,
      suit: suitKey,
      suitName: suit.name,
      symbol: suit.symbol,
      color: suit.color,
      domain: suit.domain,
      rank,
      number: idx + 1,
      globalIndex: i,
      question: QUESTIONS[i],
      // —— 稀有度（新增一行，四字段结构与兼容字段完全不动）——
      rarity,
      // —— 鎏金扑克牌视觉挂接 ——
      emblem,                 // 中部独立徽章
      c1: cap[0],             // 底部寓意 · 行一
      c2: cap[1],             // 底部寓意 · 行二
      // —— 鎏金扑克牌视觉挂接：split 拆成 底层 bg + 顶层 fg（透明底只含文字/符号）——
      // 组件里 bg 在下、箔纹夹中间、fg 浮最上 → 金属箔纹不再遮挡文字/徽章/点数。
      artFrontBg: frontArt.bg, artFrontFg: frontArt.fg,
      artBackBg:  backArt.bg,  artBackFg:  backArt.fg,
      // 兼容：保留完整单图（以 bg 作兼容完整图，避免遗漏旧引用 break）
      artFront: frontArt.bg,
      artBack:  backArt.bg,
    });
    i++;
  });
}

module.exports = { SUITS, RANKS, cards };
