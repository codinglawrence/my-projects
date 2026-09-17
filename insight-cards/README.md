# 照见卡牌 · 抽卡式小程序 — 完整技术方案

> 灵感来源：「照见卡牌」52 张自我觉察体系（《照见自己》——扑克牌=地球日历的古老纸牌系统）。
> 问题素材库经联网检索整理，综合参考：Holstee Reflection Cards、Know Thyself Cards、Ink+Volt 12 主题结构、中文「自我探究」问卷、Newton《人生中不可不想的问题》、Storyworth 52 提示等高质量来源。
> 52 张问题按 **4 花色 × A–K** 组织，正面为花色+编号（图案/编号），背面为引导性问题。

---

## 怎么打开

微信开发者工具 → 导入此目录 → 点「编译」预览（微信小程序，没有命令行）
## 一、技术选型

| 维度 | 选择 | 理由 |
|------|------|------|
| 框架 | **原生微信小程序**（WXML/WXSS/JS） | 本产品仅面向微信生态，无需跨端；原生对 CSS 3D 变换、动画时序控制支持最完整，DevTools 调试体验最佳，包体积最小。 |
| 后端/存储 | **本地缓存为主**（`wx.setStorageSync`） | 需求明确：收藏、笔记、历史全部本地。无账号体系、无云函数，零服务器成本，离线可用。 |
| 动画 | **WXSS transform + transition + keyframes** | 翻卡用 `rotateY` 3D 翻转；洗牌/发卡用位移+旋转 keyframes。无需引入动画库。 |
| 状态 | 页面 `data` + 全局 `app.globalData` | 数据量小，无需 Redux 类方案。 |
| 备选 | uni-app / Taro | 若未来要同时上架支付宝/抖音小程序再迁移，当前不引入，避免复杂度。 |

**结论**：原生小程序 + 本地缓存，是最轻、最稳、最契合「沉浸式思考」单机场景的方案。

---

## 二、架构设计

```
insight-cards/
├── app.js                 # 全局逻辑：启动初始化、globalData
├── app.json               # 全局配置：pages、window、tabBar
├── app.wxss               # 全局样式：色彩变量、通用类
├── project.config.json    # 项目配置（appid 占位）
├── sitemap.json
├── data/
│   └── cards.js           # 52 张卡牌数据（问题库，本地预设）
├── utils/
│   ├── draw.js            # 抽卡核心：Fisher-Yates 洗牌、发牌
│   └── storage.js         # 本地存储：收藏 / 笔记 / 历史 的 CRUD
├── components/
│   └── flip-card/         # 翻卡组件（3D 翻转，slot 注入正反面）
│       ├── flip-card.js / .json / .wxml / .wxss
└── pages/
    ├── index/             # 首页：抽卡台（洗牌+发卡+翻卡+收藏+笔记入口）
    ├── collection/        # 收藏：我喜欢的卡
    └── history/           # 历史：抽卡记录 + 对应笔记
```

**分层**
- **数据层** `data/cards.js`：静态 52 题，构建时即确定。
- **逻辑层** `utils/*`：纯函数，无 UI 依赖，可单测。
- **视图层** `pages/*` + `components/flip-card`：只负责渲染与交互。

---

## 三、数据模型

### 3.1 卡牌（静态，打包内置）
```js
{
  id: 'heart-A',          // 全局唯一
  suit: 'heart',          // heart/diamond/club/spade
  suitName: '红心',
  symbol: '♥',
  color: '#E8707A',
  domain: '情感 · 关系 · 内在',
  rank: 'A',              // A,2..10,J,Q,K
  number: 1,              // 花色内序号 1-13
  globalIndex: 0,         // 全局序号 0-51
  question: '此刻，你心里最想被谁看见？'
}
```

### 3.2 本地存储（key 设计）
| key | 结构 | 说明 |
|-----|------|------|
| `favorites` | `Object<cardId, {favoritedAt:Number}>` | 收藏集合，O(1) 查重 |
| `notes` | `Object<cardId, String>` | 每张卡的思考笔记 |
| `history` | `Array<{cardId, drawnAt:Number, note?:String}>` | 抽卡流水，倒序展示 |

> 用 `wx.setStorageSync` 同步写，体量极小（52 上限），无需异步与分页。

---

## 四、核心逻辑实现

### 4.1 洗牌（Fisher-Yates，无偏）
```js
// utils/draw.js
function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
// 抽卡器：维护剩余牌堆，抽完自动重洗
class DrawDeck {
  constructor(cards) { this.cards = cards; this.reset(); }
  reset() { this.pile = shuffle(this.cards.map(c => c.id)); }
  drawOne() {
    if (this.pile.length === 0) this.reset();   // 抽空自动重洗
    return this.pile.pop();
  }
  drawMany(n) {
    const res = [];
    for (let i = 0; i < n; i++) res.push(this.drawOne());
    return res;
  }
}
module.exports = { shuffle, DrawDeck };
```

### 4.2 翻卡（3D 翻转）
组件用两层绝对定位卡片 + `rotateY(180deg)` + `backface-visibility:hidden`，父级 `preserve-3d` + `perspective`。点击触发 `setData({flipped})`，WXSS `transition: transform .6s` 完成翻转动画。
> 兼容性兜底：若基础库不支持 `backface-visibility`，改用 `scaleX(1)->scaleX(0)` 切换正反面内容，再 `scaleX(0)->scaleX(1)`。

### 4.3 收藏 / 笔记 / 历史（utils/storage.js）
```js
const KEY_FAV = 'favorites', KEY_NOTE = 'notes', KEY_HIS = 'history';
const get = (k, d) => wx.getStorageSync(k) || d;
const set = (k, v) => wx.setStorageSync(k, v);

toggleFavorite(id) {
  const f = get(KEY_FAV, {});
  if (f[id]) delete f[id]; else f[id] = { favoritedAt: Date.now() };
  set(KEY_FAV, f); return !!f[id];
}
isFavorite(id) { return !!get(KEY_FAV, {})[id]; }
saveNote(id, text) { const n = get(KEY_NOTE, {}); n[id] = text; set(KEY_NOTE, n); }
getNote(id) { return get(KEY_NOTE, {})[id] || ''; }
addHistory(id) {
  const h = get(KEY_HIS, []);
  h.unshift({ cardId: id, drawnAt: Date.now() });
  set(KEY_HIS, h.slice(0, 200));   // 最多保留 200 条
}
```

### 4.4 抽卡时序（首页 index.js）
1. 用户点「抽一张」→ `isDrawing=true`，牌堆播 `shuffle` 抖动动画（~600ms）。
2. 动画结束 → `deck.drawOne()` 取牌，`currentCard=card`，`isDrawing=false`，新卡以 `deal` 位移动画飞入中央（从牌堆位置 translate+scale 到中心）。
3. 用户点卡 → `flip-card` 翻转露出问题；翻转完成时 `storage.addHistory(id)`。
4. 露出后可「收藏」(★) 与「写笔记」（弹 `note` 编辑层，保存写入 `notes`）。
5. 「连续抽」模式：按 `drawMany(n)` 依次飞入，带 stagger（每张延迟 120ms），逐张可翻。

---

## 五、交互细节

- **洗牌动效**：牌堆做 `rotate(-6deg)→rotate(6deg)` 来回抖动 + 轻微上下浮动，配 `cubic-bezier` 缓动，传递「正在洗牌」的仪式感。
- **发卡动效**：新卡从牌堆坐标（`bottom/right` 偏移）用 `transform` 过渡到屏幕中央并 `scale(0.8→1)`，模拟「发到你面前」。
- **翻卡动效**：`rotateY` 0→180°，0.6s，正反面内容通过 slot 注入，背面为暖色底 + 问题文字 + 花色水印。
- **收藏**：露出态点 ★，填充金色并轻微 `scale` 弹一下；收藏列表在「收藏」tab 展示。
- **笔记**：点「写笔记」底部滑出半屏编辑层（`textarea` + 保存），保存后卡片角标显示「已记」。
- **历史**：倒序列表，每项显示花色+编号、问题摘要、抽取时间、笔记预览；点开可继续编辑笔记。
- **整体风格**：米白/暖灰背景（`#FBF7F0`），圆角卡片（16rpx），衬线标题字体感，低饱和花色色，留白充足，营造沉浸、不焦虑的思考氛围。

---

## 六、关键文件清单（已生成）

| 文件 | 作用 |
|------|------|
| `data/cards.js` | 52 张问题（4 花色 × A–K，问题经检索整理） |
| `utils/draw.js` | 洗牌 + 抽卡器（抽空自动重洗） |
| `utils/storage.js` | 收藏/笔记/历史本地 CRUD |
| `components/flip-card/*` | 3D 翻卡组件 |
| `pages/index/*` | 抽卡主台（洗牌+发卡+翻卡+收藏+笔记） |
| `pages/collection/*` | 收藏页 |
| `pages/history/*` | 历史页 |

---

## 七、落地步骤

1. 微信开发者工具 → 导入项目 → 选择 `insight-cards/` 目录 → 填测试 appid（或「不校验合法域名」）。
2. 直接编译即可运行；所有数据本地，无需服务器。
3. 后续可加：每日一抽提醒（订阅消息）、卡片分享图（canvas 生成）、云端同步（wx.cloud 可选）。

> 注：本方案代码为可直接编译的原生小程序骨架；动画参数与配色可在 `app.wxss` 与组件样式中微调。
