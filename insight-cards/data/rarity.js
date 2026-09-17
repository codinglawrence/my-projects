// data/rarity.js
// 7 种稀有度（宝可梦 TCG 风格）配置 + 52 张确定性分配 + 箔层解析。
//
// 这是「稀有度视觉」的单一事实源（single source of truth）：
//   - RARITY_CONFIG  的 key 即稀有度枚举（kebab-case 小写），组件/WXML 禁止硬编码稀有度字符串。
//   - RARITY_ORDER   稀有度顺序（后端/排序用）。
//   - assignRarity   52 张确定性分配（花色 × 点数映射表，主理人拍板）。
//   - buildFoilLayers 把配置解析成 WXML 可直接 wx:for 的渲染层（gradient view + texture image）。
//   - decorateCardsWithFoil 给页面列表批量挂 foilLayers。
//
// 微信红线（务必遵守）：
//   - 纹理只经 <image src="{{dataUri}}"> 注入，dataUri 来自 data/textures.js 的 getTexture；
//     绝不写进任何 .wxss（否则 minifyWXSS 编译异常 → 整页白屏，已踩两次坑）。
//   - <image> 绝不挂 mix-blend-mode（真机不生效）；color-dodge 仅允许在 <view> 渐变层作优雅增强，
//     且必须配 opacity 兜底。
//   - 箔层 z-index 约定：bg=1 / 箔=1..3 / fg=4 / actions=5（fg 永远最高，箔绝不遮文字/符号/点数）。

const { getTexture } = require('./textures.js');

// ===========================================================
// 7 种稀有度配置（前端视觉唯一入口）
//   - bgTint : 镀底色。null=不染（保留紫金）；{color,opacity}=纯色；{perTheme:true,opacity}=按卡主题色满铺。
//   - clip   : 'full'=铺满整卡；'frame'=只镀四边金框（中央镂空，留白给文字/符号）。
//   - moveScale: 视差幅度 {foil, holo}（沿用 flip-card 现有映射，可选）。
//   - layers : 渲染层。
//       kind:'gradient' → <view> 渐变层，可 color-dodge（仅 view 允许），背景位置由 JS/动画驱动。
//       kind:'texture'  → <image> 纹理层，强制 normal 混合（真机 <image> 的 mix-blend 失效），靠 opacity 叠加。
//
// 纹理名严格对齐 data/textures.js 的 BUILDERS key：
//   holoGrating / galaxyStar / vmaxBrush / altIridescent / rainbowGradient / goldPlating / shinyCross / grain
// ===========================================================
// 降饱和提质感（2026-08-03 方向 B：保留紫金冷暗框架，箔层从荧光彩虹改为冷调金属/珠光雾彩）。
// 7 套稀有度结构不变，仅调色 + 降透明度；z-index / 混合模式红线不变。
const RARITY_CONFIG = {
  holo: {
    label: '普通全息', order: 0,
    bgTint: null,
    clip: 'full',
    moveScale: { foil: 60, holo: 16 },
    layers: [
      { kind: 'gradient', angle: 115, colors: ['transparent', '#9d8fd6', 'transparent', '#d8c489', 'transparent'],
        opacity: 0.14, blend: 'color-dodge', anim: 'idleFoil' },
      { kind: 'texture', texture: 'holoGrating', opacity: 0.34, blend: 'normal', anim: 'flow' },
    ],
  },
  galaxy: {
    label: '银河', order: 1,
    bgTint: { color: '#15102b', opacity: 0.28 },
    clip: 'full',
    moveScale: { foil: 70, holo: 22 },
    layers: [
      { kind: 'gradient', angle: 120, colors: ['#241a3d', '#4a3a78', '#6a5a9e'], opacity: 0.20, blend: 'normal', anim: 'idleFoil' },
      { kind: 'texture', texture: 'galaxyStar', opacity: 0.45, blend: 'normal', anim: 'twinkle' },
    ],
  },
  vmax: {
    label: 'VMAX', order: 2,
    bgTint: null,
    clip: 'full',
    moveScale: { foil: 80, holo: 24 },
    layers: [
      { kind: 'gradient', angle: 135, colors: ['transparent', '#6f9fc4', 'transparent', '#c9b27a'], opacity: 0.22, blend: 'color-dodge', anim: 'idleFoil' },
      { kind: 'texture', texture: 'vmaxBrush', opacity: 0.45, blend: 'normal', anim: 'flow' },
    ],
  },
  alt: {
    label: '全图异画', order: 3,
    bgTint: { perTheme: true, opacity: 0.16 },
    clip: 'full',
    moveScale: { foil: 65, holo: 18 },
    layers: [
      { kind: 'gradient', angle: 110, colors: ['transparent', '#b89bb0', 'transparent', '#b8a98f'], opacity: 0.18, blend: 'normal', anim: 'idleFoil' },
      { kind: 'texture', texture: 'altIridescent', opacity: 0.40, blend: 'normal', anim: 'flow' },
    ],
  },
  rainbow: {
    label: '彩虹', order: 4,
    bgTint: null,
    clip: 'full',
    moveScale: { foil: 90, holo: 28 },
    layers: [
      { kind: 'gradient', angle: 90, colors: ['#d99a9a', '#e0c98f', '#a9c4a4', '#9ab8c9', '#b6a6c9'], opacity: 0.22, blend: 'color-dodge', anim: 'idleFoil' },
      { kind: 'texture', texture: 'rainbowGradient', opacity: 0.42, blend: 'normal', anim: 'flow' },
    ],
  },
  gold: {
    label: '黄金', order: 5,
    bgTint: { color: '#C9A227', opacity: 0.30 },
    clip: 'frame',
    moveScale: { foil: 60, holo: 14 },
    layers: [
      { kind: 'gradient', angle: 120, colors: ['transparent', '#F4D27A', 'transparent', '#C9A227'], opacity: 0.36, blend: 'color-dodge', anim: 'idleFoil' },
      { kind: 'texture', texture: 'goldPlating', opacity: 0.52, blend: 'normal', anim: 'flow' },
    ],
  },
  shiny: {
    label: '闪光', order: 6,
    bgTint: null,
    clip: 'full',
    moveScale: { foil: 50, holo: 12 },
    layers: [
      { kind: 'gradient', angle: 115, colors: ['transparent', '#e8eef5', 'transparent', '#f2eef5'], opacity: 0.16, blend: 'normal', anim: 'idleFoil' },
      { kind: 'texture', texture: 'shinyCross', opacity: 0.40, blend: 'normal', anim: 'twinkle' },
    ],
  },
};

// 稀有度顺序（后端/排序用）
const RARITY_ORDER = ['holo', 'galaxy', 'vmax', 'alt', 'rainbow', 'gold', 'shiny'];

// ===========================================================
// 52 张确定性分配（主理人拍板的「花色 × 点数」映射表，已校验合计 = 52）
//   花色签名：♠=galaxy(银河)  ♥=gold(金属)  ♦=alt(幻彩)  ♣=rainbow(彩虹)
//   A 封顶：A♠=shiny / A♥=gold / A♦=gold / A♣=rainbow
//   （架构师 system_design.md 3.3 的默认「按点数 tier」分配已作废，以本表为准）
//   合计：holo 19 / galaxy 8 / vmax 8 / alt 6 / rainbow 5 / gold 3 / shiny 3 = 52
// ===========================================================
const RARITY_MAP = {
  spade:   { A:'shiny',  K:'galaxy', Q:'galaxy', J:'galaxy', '10':'galaxy', '9':'galaxy', '8':'galaxy', '7':'galaxy', '6':'galaxy', '5':'holo', '4':'holo', '3':'holo', '2':'holo' },
  heart:   { A:'gold',   K:'gold',   Q:'vmax',   J:'vmax',   '10':'vmax',   '9':'vmax',   '8':'vmax',   '7':'vmax',   '6':'vmax',   '5':'vmax',   '4':'holo', '3':'holo', '2':'holo' },
  diamond: { A:'gold',   K:'alt',    Q:'alt',    J:'alt',    '10':'alt',    '9':'alt',    '8':'alt',    '7':'holo',   '6':'holo',   '5':'holo',   '4':'holo', '3':'holo', '2':'holo' },
  club:    { A:'rainbow',K:'rainbow',Q:'rainbow',J:'rainbow','10':'rainbow','9':'shiny',  '8':'shiny',  '7':'holo',   '6':'holo',   '5':'holo',   '4':'holo', '3':'holo', '2':'holo' },
};

// 52 张默认分配：按（花色, 点数）确定性查表。suit/rank 与 data/cards.js 完全一致。
// globalIndex 保留参数位（当前分配不依赖它，但保留以便将来按序号微调）。
function assignRarity({ suit, rank, globalIndex }) {
  const m = RARITY_MAP[suit] || RARITY_MAP.spade;
  return m[rank] || 'holo';
}

// 把单个稀有度配置解析成 WXML 可直接 wx:for 的渲染层数组。
// 每层字段：
//   isImage : 是否 <image> 纹理层（true）还是 <view> 渐变层（false）
//   src     : 纹理 data URI（仅 texture 层有值）
//   gradient: css linear-gradient 字符串（仅 gradient 层有值）
//   opacity : 透明度
//   blend   : 混合模式（texture 层强制 normal；gradient 层允许 color-dodge 等）
//   anim    : 动画类名（idleFoil / flow / twinkle），由 wxss 定义
//   z       : 箔层 z-index（1..3），fg 永远 z4 最高
function buildFoilLayers(rarity) {
  const cfg = RARITY_CONFIG[rarity] || RARITY_CONFIG.holo;
  return cfg.layers.map((l, i) => {
    const isImage = l.kind === 'texture';
    return {
      isImage,
      src: isImage ? getTexture(l.texture) : '',
      gradient: !isImage
        ? `linear-gradient(${l.angle}deg, ${l.colors.join(',')})`
        : '',
      opacity: typeof l.opacity === 'number' ? l.opacity : 0.2,
      // 红线：<image> 绝不挂 mix-blend-mode → 纹理层强制 normal；渐变层(=view)可 color-dodge
      blend: isImage ? 'normal' : (l.blend || 'normal'),
      anim: l.anim || '',
      z: 1 + i,
    };
  });
}

// 给页面/组件列表批量挂 foilLayers（基于每张卡的 card.rarity）。
// 返回新数组，不修改入参；每项追加 foilLayers 字段。
function decorateCardsWithFoil(cards) {
  return (cards || []).map((c) => {
    const card = (c && typeof c === 'object') ? c : {};
    return Object.assign({}, card, { foilLayers: buildFoilLayers(card.rarity) });
  });
}

module.exports = {
  RARITY_CONFIG,
  RARITY_ORDER,
  RARITY_MAP,
  assignRarity,
  buildFoilLayers,
  decorateCardsWithFoil,
};
