// utils/draw.js
// 抽卡核心：Fisher-Yates 无偏洗牌 + 抽卡器（抽空自动重洗）

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// 抽卡器：维护剩余牌堆 pile，抽完自动重洗，保证永不抽空
class DrawDeck {
  constructor(cards) {
    this.cards = cards;
    this.reset();
  }
  reset() {
    this.pile = shuffle(this.cards.map((c) => c.id));
  }
  // 抽一张，返回 cardId
  drawOne() {
    if (this.pile.length === 0) this.reset();
    return this.pile.pop();
  }
  // 连续抽 n 张（不重复，直到需要重洗）
  drawMany(n) {
    const res = [];
    for (let i = 0; i < n; i++) res.push(this.drawOne());
    return res;
  }
  remaining() {
    return this.pile.length;
  }
}

module.exports = { shuffle, DrawDeck };
