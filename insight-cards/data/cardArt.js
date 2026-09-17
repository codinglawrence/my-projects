// data/cardArt.js
// 紫金全息卡 · 深紫黑底 + 紫金金属反光 → 照见卡牌 卡面生成器
// 移植自「鎏金扑克牌」(C:\Users\terri\Desktop\Project\鎏金扑克牌\)：
//   - 30+ 古典矢量徽章 EMBDEF（0 0 100 100 坐标系，紫金描边/填充）
//   - 4 花色路径 SUIT_PATHS
//   - 紫金渐变 gGold（紫→金金属）/ 深紫黑径向面 faceG（#16102A→#070411）
//   - 每花色 13 个独立徽章 EMB + 两行寓意 CAP（与照见卡牌 花色/点数 同构）
// buildCard() 输出 data:image/svg+xml 卡面：
//   showQuestion=false → 谜面（问题区只显示「?」+ 轻触提示）
//   showQuestion=true  → 背面（问题区填入真实引导问题）

// 引入稀有度配置（仅读取 bgTint，不引入循环依赖：rarity.js → textures.js，
// cardArt 不被 rarity 反向依赖）。fg 层完全不改，仅 bg 可按稀有度叠加极淡镀底色。
const { RARITY_CONFIG } = require('./rarity.js');

// —— 52 张卡牌独特金属全息主题色 ——
const CARD_THEMES = [
  { main: "#eb3c3c", light: "#f2a69b", dark: "#701313", glow: "#eb3c3c" },
  { main: "#eb503c", light: "#f2b09b", dark: "#701e13", glow: "#eb503c" },
  { main: "#eb643c", light: "#f2bb9b", dark: "#702913", glow: "#eb643c" },
  { main: "#eb783c", light: "#f2c59b", dark: "#703413", glow: "#eb783c" },
  { main: "#eb8d3c", light: "#f2cf9b", dark: "#703e13", glow: "#eb8d3c" },
  { main: "#eba13c", light: "#f2d99b", dark: "#704913", glow: "#eba13c" },
  { main: "#ebb53c", light: "#f2e39b", dark: "#705413", glow: "#ebb53c" },
  { main: "#ebc93c", light: "#f2ed9b", dark: "#705e13", glow: "#ebc93c" },
  { main: "#ebde3c", light: "#edf29b", dark: "#706913", glow: "#ebde3c" },
  { main: "#e4eb3c", light: "#e3f29b", dark: "#6d7013", glow: "#e4eb3c" },
  { main: "#d0eb3c", light: "#d9f29b", dark: "#627013", glow: "#d0eb3c" },
  { main: "#bceb3c", light: "#cff29b", dark: "#577013", glow: "#bceb3c" },
  { main: "#a8eb3c", light: "#c5f29b", dark: "#4d7013", glow: "#a8eb3c" },
  { main: "#93eb3c", light: "#bbf29b", dark: "#427013", glow: "#93eb3c" },
  { main: "#7feb3c", light: "#b1f29b", dark: "#377013", glow: "#7feb3c" },
  { main: "#6beb3c", light: "#a7f29b", dark: "#2c7013", glow: "#6beb3c" },
  { main: "#57eb3c", light: "#9cf29b", dark: "#227013", glow: "#57eb3c" },
  { main: "#42eb3c", light: "#9bf2a3", dark: "#177013", glow: "#42eb3c" },
  { main: "#3ceb49", light: "#9bf2ad", dark: "#13701b", glow: "#3ceb49" },
  { main: "#3ceb5d", light: "#9bf2b7", dark: "#137025", glow: "#3ceb5d" },
  { main: "#3ceb72", light: "#9bf2c1", dark: "#137030", glow: "#3ceb72" },
  { main: "#3ceb86", light: "#9bf2cb", dark: "#13703b", glow: "#3ceb86" },
  { main: "#3ceb9a", light: "#9bf2d5", dark: "#137045", glow: "#3ceb9a" },
  { main: "#3cebae", light: "#9bf2e0", dark: "#137050", glow: "#3cebae" },
  { main: "#3cebc3", light: "#9bf2ea", dark: "#13705b", glow: "#3cebc3" },
  { main: "#3cebd7", light: "#9bf1f2", dark: "#137065", glow: "#3cebd7" },
  { main: "#3cebeb", light: "#9be6f2", dark: "#137070", glow: "#3cebeb" },
  { main: "#3cd7eb", light: "#9bdcf2", dark: "#136570", glow: "#3cd7eb" },
  { main: "#3cc3eb", light: "#9bd2f2", dark: "#135b70", glow: "#3cc3eb" },
  { main: "#3caeeb", light: "#9bc8f2", dark: "#135070", glow: "#3caeeb" },
  { main: "#3c9aeb", light: "#9bbef2", dark: "#134570", glow: "#3c9aeb" },
  { main: "#3c86eb", light: "#9bb4f2", dark: "#133b70", glow: "#3c86eb" },
  { main: "#3c72eb", light: "#9baaf2", dark: "#133070", glow: "#3c72eb" },
  { main: "#3c5deb", light: "#9ba0f2", dark: "#132570", glow: "#3c5deb" },
  { main: "#3c49eb", light: "#a09bf2", dark: "#131b70", glow: "#3c49eb" },
  { main: "#423ceb", light: "#aa9bf2", dark: "#171370", glow: "#423ceb" },
  { main: "#573ceb", light: "#b49bf2", dark: "#221370", glow: "#573ceb" },
  { main: "#6b3ceb", light: "#be9bf2", dark: "#2c1370", glow: "#6b3ceb" },
  { main: "#7f3ceb", light: "#c89bf2", dark: "#371370", glow: "#7f3ceb" },
  { main: "#933ceb", light: "#d29bf2", dark: "#421370", glow: "#933ceb" },
  { main: "#a83ceb", light: "#dc9bf2", dark: "#4d1370", glow: "#a83ceb" },
  { main: "#bc3ceb", light: "#e69bf2", dark: "#571370", glow: "#bc3ceb" },
  { main: "#d03ceb", light: "#f09bf2", dark: "#621370", glow: "#d03ceb" },
  { main: "#e43ceb", light: "#f29bea", dark: "#6d1370", glow: "#e43ceb" },
  { main: "#eb3cde", light: "#f29be0", dark: "#701369", glow: "#eb3cde" },
  { main: "#eb3cc9", light: "#f29bd6", dark: "#70135e", glow: "#eb3cc9" },
  { main: "#eb3cb5", light: "#f29bcc", dark: "#701354", glow: "#eb3cb5" },
  { main: "#eb3ca1", light: "#f29bc1", dark: "#701349", glow: "#eb3ca1" },
  { main: "#eb3c8d", light: "#f29bb7", dark: "#70133e", glow: "#eb3c8d" },
  { main: "#eb3c78", light: "#f29bad", dark: "#701334", glow: "#eb3c78" },
  { main: "#eb3c64", light: "#f29ba3", dark: "#701329", glow: "#eb3c64" },
  { main: "#eb3c50", light: "#f29c9b", dark: "#70131e", glow: "#eb3c50" },
];

// —— 渐变与光晕定义（按主题色动态生成；保持深紫黑面与紫金结构）——
function buildGDef(theme) {
  // 固定冷调紫金金属渐变：不再随主题色染成彩虹，保证整副牌冷暗紫金统一质感。
  // 主题色仅作极淡点缀（见 bgInner 内细线 / alt 卡 perTheme 镀底），不再污染结构金。
  return (
    '<linearGradient id="gGold" x1="0%" y1="0%" x2="100%" y2="100%">' +
      '<stop offset="0%" stop-color="#b8923f"/>' +
      '<stop offset="30%" stop-color="#efd88a"/>' +
      '<stop offset="55%" stop-color="#b8923f"/>' +
      '<stop offset="80%" stop-color="#efd88a"/>' +
      '<stop offset="100%" stop-color="#b8923f"/>' +
    '</linearGradient>' +
      '<radialGradient id="faceG" cx="50%" cy="32%" r="75%">' +
        '<stop offset="0%" stop-color="#16102A"/>' +
        '<stop offset="62%" stop-color="#0d0820"/>' +
        '<stop offset="100%" stop-color="#070411"/>' +
      '</radialGradient>'
  );
}

// 按稀有度在 bg 底层追加一层镀底色（仅影响底层装饰容器，绝不触碰 fg 文字/符号）。
// 读取 RARITY_CONFIG[rarity].bgTint：
//   null        → 不染（保留紫金，holo/vmax/rainbow/shiny 默认）
//   {color,op}  → 纯色半透明铺满四边内缩区域
//   {perTheme,op}→ 按当前卡主题色(main)满铺，强化全图异画观感
// 返回拼接进 bgInner 的 <rect> 字符串；无需镀底时返回空串（bg 与改动前逐字节一致）。
function buildFoilBg(rarity, theme) {
  const cfg = RARITY_CONFIG[rarity];
  const t = cfg && cfg.bgTint;
  if (!t) return '';
  const op = (typeof t.opacity === 'number') ? t.opacity : 0.18;
  if (t.perTheme) {
    return '<rect x="4" y="4" width="352" height="496" rx="24" fill="' + theme.main + '" fill-opacity="' + op + '"/>';
  }
  return '<rect x="4" y="4" width="352" height="496" rx="24" fill="' + t.color + '" fill-opacity="' + op + '"/>';
}

// —— 4 花色路径（填充古金）——
const SUIT_PATHS = {
  spade:   '<path fill="url(#gGold)" d="M50 6 C50 6 20 36 20 56 C20 69 32 73 41 64 L41 92 L59 92 L59 64 C68 73 80 69 80 56 C80 36 50 6 50 6 Z"/>',
  heart:   '<path fill="url(#gGold)" d="M50 86 C50 86 14 60 14 36 C14 22 26 14 38 14 C46 14 50 20 50 27 C50 20 54 14 62 14 C74 14 86 22 86 36 C86 60 50 86 50 86 Z"/>',
  diamond: '<path fill="url(#gGold)" d="M50 6 L88 50 L50 94 L12 50 Z"/>',
  club:    '<circle cx="34" cy="36" r="17" fill="url(#gGold)"/><circle cx="66" cy="36" r="17" fill="url(#gGold)"/><circle cx="50" cy="60" r="17" fill="url(#gGold)"/><path fill="url(#gGold)" d="M50 60 L43 90 C43 94 57 94 57 90 L50 60 Z"/>',
};

// —— 30+ 古典矢量徽章（古金描边/填充，中心约 50,50）——
const EMBDEF = {
  sun:'<circle cx="50" cy="50" r="16" fill="none" stroke="url(#gGold)" stroke-width="3"/><g stroke="url(#gGold)" stroke-width="3" stroke-linecap="round"><line x1="50" y1="14" x2="50" y2="26"/><line x1="50" y1="74" x2="50" y2="86"/><line x1="14" y1="50" x2="26" y2="50"/><line x1="74" y1="50" x2="86" y2="50"/><line x1="25" y1="25" x2="33" y2="33"/><line x1="75" y1="25" x2="67" y2="33"/><line x1="25" y1="75" x2="33" y2="67"/><line x1="75" y1="75" x2="67" y2="67"/></g><circle cx="50" cy="50" r="6" fill="url(#gGold)"/>',
  moon:'<path d="M62 20 A32 32 0 1 0 62 80 A24 24 0 1 1 62 20 Z" fill="url(#gGold)"/>',
  star:'<path d="M50 14 L56 44 L86 50 L56 56 L50 86 L44 56 L14 50 L44 44 Z" fill="url(#gGold)"/>',
  eye:'<path d="M50 20 L80 64 L20 64 Z" fill="none" stroke="url(#gGold)" stroke-width="3"/><path d="M34 52 Q50 38 66 52 Q50 66 34 52 Z" fill="none" stroke="url(#gGold)" stroke-width="3"/><circle cx="50" cy="52" r="6" fill="url(#gGold)"/>',
  hand:'<g stroke="url(#gGold)" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M50 32 V74"/><path d="M50 40 L36 48"/><path d="M50 40 L64 48"/><path d="M50 46 L30 56"/><path d="M50 46 L70 56"/><path d="M32 76 Q50 86 68 76"/></g>',
  key:'<circle cx="38" cy="38" r="14" fill="none" stroke="url(#gGold)" stroke-width="3"/><circle cx="38" cy="38" r="5" fill="url(#gGold)"/><line x1="48" y1="48" x2="78" y2="78" stroke="url(#gGold)" stroke-width="3"/><line x1="70" y1="70" x2="78" y2="62" stroke="url(#gGold)" stroke-width="3"/><line x1="62" y1="62" x2="70" y2="54" stroke="url(#gGold)" stroke-width="3"/>',
  tree:'<circle cx="50" cy="42" r="22" fill="none" stroke="url(#gGold)" stroke-width="3"/><line x1="50" y1="64" x2="50" y2="82" stroke="url(#gGold)" stroke-width="3"/><line x1="40" y1="86" x2="60" y2="86" stroke="url(#gGold)" stroke-width="3"/>',
  serpent:'<circle cx="50" cy="50" r="26" fill="none" stroke="url(#gGold)" stroke-width="3"/><circle cx="50" cy="24" r="6" fill="url(#gGold)"/><circle cx="47" cy="23" r="1.6" fill="#160C09"/><path d="M50 24 Q66 30 62 44" fill="none" stroke="url(#gGold)" stroke-width="3"/>',
  owl:'<circle cx="50" cy="46" r="22" fill="none" stroke="url(#gGold)" stroke-width="3"/><circle cx="42" cy="42" r="7" fill="none" stroke="url(#gGold)" stroke-width="2.5"/><circle cx="58" cy="42" r="7" fill="none" stroke="url(#gGold)" stroke-width="2.5"/><circle cx="42" cy="42" r="2.5" fill="url(#gGold)"/><circle cx="58" cy="42" r="2.5" fill="url(#gGold)"/><path d="M44 56 Q50 62 56 56" fill="none" stroke="url(#gGold)" stroke-width="2.5"/><path d="M30 64 L50 58 L70 64" fill="none" stroke="url(#gGold)" stroke-width="3"/>',
  lyre:'<path d="M36 78 V34 Q36 22 48 22 Q60 22 60 34 V78" fill="none" stroke="url(#gGold)" stroke-width="3"/><line x1="36" y1="78" x2="60" y2="78" stroke="url(#gGold)" stroke-width="3"/><line x1="38" y1="40" x2="58" y2="40" stroke="url(#gGold)" stroke-width="2"/><line x1="38" y1="50" x2="58" y2="50" stroke="url(#gGold)" stroke-width="2"/><line x1="38" y1="60" x2="58" y2="60" stroke="url(#gGold)" stroke-width="2"/><line x1="48" y1="22" x2="48" y2="14" stroke="url(#gGold)" stroke-width="3"/>',
  laurel:'<path d="M50 80 C26 74 22 46 34 28" fill="none" stroke="url(#gGold)" stroke-width="3"/><path d="M50 80 C74 74 78 46 66 28" fill="none" stroke="url(#gGold)" stroke-width="3"/><path d="M34 30 Q30 38 36 42 M40 34 Q36 42 42 46 M48 36 Q44 44 50 48" stroke="url(#gGold)" stroke-width="2" fill="none"/><path d="M66 30 Q70 38 64 42 M60 34 Q64 42 58 46 M52 36 Q56 44 50 48" stroke="url(#gGold)" stroke-width="2" fill="none"/>',
  compass:'<circle cx="50" cy="50" r="28" fill="none" stroke="url(#gGold)" stroke-width="3"/><circle cx="50" cy="50" r="18" fill="none" stroke="url(#gGold)" stroke-width="2"/><line x1="50" y1="22" x2="50" y2="78" stroke="url(#gGold)" stroke-width="2"/><line x1="22" y1="50" x2="78" y2="50" stroke="url(#gGold)" stroke-width="2"/><path d="M50 30 L56 50 L50 70 L44 50 Z" fill="url(#gGold)"/>',
  anchor:'<circle cx="50" cy="24" r="6" fill="none" stroke="url(#gGold)" stroke-width="3"/><line x1="50" y1="30" x2="50" y2="78" stroke="url(#gGold)" stroke-width="3"/><line x1="36" y1="44" x2="64" y2="44" stroke="url(#gGold)" stroke-width="3"/><path d="M28 60 Q50 82 72 60" fill="none" stroke="url(#gGold)" stroke-width="3"/><line x1="30" y1="56" x2="38" y2="64" stroke="url(#gGold)" stroke-width="3"/><line x1="70" y1="56" x2="62" y2="64" stroke="url(#gGold)" stroke-width="3"/>',
  flame:'<path d="M50 18 C64 36 70 48 60 64 C56 70 52 72 52 78 C52 84 48 86 44 84 C36 80 34 70 38 62 C30 58 28 44 40 34 C44 30 48 24 50 18 Z" fill="url(#gGold)"/><path d="M50 44 C56 52 56 60 50 68 C46 64 46 56 50 44 Z" fill="#160C09" opacity="0.45"/>',
  crown:'<path d="M24 66 L18 34 L38 50 L50 26 L62 50 L82 34 L76 66 Z" fill="none" stroke="url(#gGold)" stroke-width="3"/><line x1="24" y1="70" x2="76" y2="70" stroke="url(#gGold)" stroke-width="3"/><circle cx="18" cy="32" r="4" fill="url(#gGold)"/><circle cx="50" cy="24" r="4" fill="url(#gGold)"/><circle cx="82" cy="32" r="4" fill="url(#gGold)"/>',
  scales:'<line x1="50" y1="20" x2="50" y2="74" stroke="url(#gGold)" stroke-width="3"/><line x1="24" y1="38" x2="76" y2="38" stroke="url(#gGold)" stroke-width="3"/><path d="M24 38 L14 38 L19 56 L29 56 Z" fill="none" stroke="url(#gGold)" stroke-width="2.5"/><path d="M76 38 L66 38 L71 56 L81 56 Z" fill="none" stroke="url(#gGold)" stroke-width="2.5"/><line x1="42" y1="74" x2="58" y2="74" stroke="url(#gGold)" stroke-width="3"/>',
  book:'<path d="M50 30 C40 24 26 24 18 30 L18 72 C26 66 40 66 50 72 C60 66 74 66 82 72 L82 30 C74 24 60 24 50 30 Z" fill="none" stroke="url(#gGold)" stroke-width="3"/><line x1="50" y1="30" x2="50" y2="72" stroke="url(#gGold)" stroke-width="2.5"/><line x1="26" y1="40" x2="44" y2="44" stroke="url(#gGold)" stroke-width="1.5"/><line x1="56" y1="44" x2="74" y2="40" stroke="url(#gGold)" stroke-width="1.5"/>',
  rose:'<circle cx="50" cy="50" r="10" fill="none" stroke="url(#gGold)" stroke-width="2.5"/><path d="M50 40 Q60 40 60 50 Q60 60 50 60 Q40 60 40 50 Q40 40 50 40" fill="none" stroke="url(#gGold)" stroke-width="2"/><path d="M50 30 Q66 32 68 50 Q66 68 50 70 Q34 68 32 50 Q34 32 50 30" fill="none" stroke="url(#gGold)" stroke-width="2"/><path d="M50 70 L50 82 M50 82 Q44 78 42 72 M50 82 Q56 78 58 72" stroke="url(#gGold)" stroke-width="2" fill="none"/>',
  phoenix:'<path d="M50 78 C44 64 44 52 50 44 C56 52 56 64 50 78 Z" fill="url(#gGold)"/><path d="M50 50 Q30 44 18 30 Q36 38 50 46" fill="none" stroke="url(#gGold)" stroke-width="3"/><path d="M50 50 Q70 44 82 30 Q64 38 50 46" fill="none" stroke="url(#gGold)" stroke-width="3"/><path d="M50 46 Q44 30 50 18 Q56 30 50 46" fill="none" stroke="url(#gGold)" stroke-width="3"/><path d="M40 70 Q30 78 22 76 M60 70 Q70 78 78 76" stroke="url(#gGold)" stroke-width="2.5" fill="none"/>',
  wheel:'<circle cx="50" cy="50" r="28" fill="none" stroke="url(#gGold)" stroke-width="3"/><circle cx="50" cy="50" r="8" fill="none" stroke="url(#gGold)" stroke-width="2.5"/><line x1="50" y1="22" x2="50" y2="78" stroke="url(#gGold)" stroke-width="2"/><line x1="22" y1="50" x2="78" y2="50" stroke="url(#gGold)" stroke-width="2"/><line x1="30" y1="30" x2="70" y2="70" stroke="url(#gGold)" stroke-width="2"/><line x1="70" y1="30" x2="30" y2="70" stroke="url(#gGold)" stroke-width="2"/>',
  tower:'<rect x="38" y="34" width="24" height="44" fill="none" stroke="url(#gGold)" stroke-width="3"/><path d="M34 34 L50 22 L66 34 Z" fill="none" stroke="url(#gGold)" stroke-width="3"/><rect x="44" y="54" width="12" height="24" fill="none" stroke="url(#gGold)" stroke-width="2.5"/><line x1="38" y1="46" x2="62" y2="46" stroke="url(#gGold)" stroke-width="2"/>',
  mask:'<path d="M34 28 Q50 20 66 28 Q72 44 66 60 Q60 74 50 74 Q40 74 34 60 Q28 44 34 28 Z" fill="none" stroke="url(#gGold)" stroke-width="3"/><path d="M40 42 Q44 46 40 50 M60 42 Q56 46 60 50" stroke="url(#gGold)" stroke-width="2.5" fill="none"/><path d="M42 60 Q50 66 58 60" stroke="url(#gGold)" stroke-width="2.5" fill="none"/>',
  torch:'<line x1="50" y1="40" x2="50" y2="82" stroke="url(#gGold)" stroke-width="3"/><path d="M50 16 C62 30 64 40 56 50 C52 54 48 54 48 50 C40 42 42 30 50 16 Z" fill="url(#gGold)"/><path d="M50 30 C56 38 54 46 50 50 C46 46 48 38 50 30 Z" fill="#160C09" opacity="0.45"/><line x1="42" y1="82" x2="58" y2="82" stroke="url(#gGold)" stroke-width="3"/>',
  shell:'<path d="M50 74 C30 74 18 56 18 44 C30 50 38 50 50 44 C62 50 70 50 82 44 C82 56 70 74 50 74 Z" fill="none" stroke="url(#gGold)" stroke-width="3"/><line x1="50" y1="44" x2="50" y2="74" stroke="url(#gGold)" stroke-width="2"/><line x1="38" y1="47" x2="34" y2="72" stroke="url(#gGold)" stroke-width="2"/><line x1="62" y1="47" x2="66" y2="72" stroke="url(#gGold)" stroke-width="2"/><line x1="28" y1="50" x2="24" y2="68" stroke="url(#gGold)" stroke-width="2"/><line x1="72" y1="50" x2="76" y2="68" stroke="url(#gGold)" stroke-width="2"/>',
  peacock:'<path d="M50 78 C40 70 36 56 40 44" fill="none" stroke="url(#gGold)" stroke-width="3"/><path d="M50 78 C60 70 64 56 60 44" fill="none" stroke="url(#gGold)" stroke-width="3"/><circle cx="50" cy="40" r="6" fill="none" stroke="url(#gGold)" stroke-width="2.5"/><g stroke="url(#gGold)" stroke-width="2" fill="none"><line x1="50" y1="46" x2="34" y2="30"/><line x1="50" y1="46" x2="66" y2="30"/><line x1="50" y1="46" x2="44" y2="24"/><line x1="50" y1="46" x2="56" y2="24"/><line x1="50" y1="46" x2="50" y2="20"/></g><circle cx="34" cy="30" r="3" fill="url(#gGold)"/><circle cx="66" cy="30" r="3" fill="url(#gGold)"/><circle cx="44" cy="24" r="3" fill="url(#gGold)"/><circle cx="56" cy="24" r="3" fill="url(#gGold)"/><circle cx="50" cy="20" r="3" fill="url(#gGold)"/>',
  sphinx:'<path d="M22 70 L22 58 Q22 50 30 50 L40 50 L44 38 Q46 32 50 38 L54 50 L70 50 Q78 50 78 58 L78 70 Z" fill="none" stroke="url(#gGold)" stroke-width="3"/><path d="M44 38 Q40 30 48 28 Q54 30 52 38" fill="none" stroke="url(#gGold)" stroke-width="2.5"/><line x1="22" y1="70" x2="78" y2="70" stroke="url(#gGold)" stroke-width="3"/><path d="M78 58 Q86 56 84 64" stroke="url(#gGold)" stroke-width="2.5" fill="none"/>',
  cornucopia:'<path d="M28 46 Q20 56 30 72 Q44 80 60 70" fill="none" stroke="url(#gGold)" stroke-width="3"/><path d="M30 44 L62 30 M34 50 L66 38 M40 56 L70 46" stroke="url(#gGold)" stroke-width="2" fill="none"/><circle cx="64" cy="28" r="4" fill="url(#gGold)"/><circle cx="68" cy="36" r="4" fill="url(#gGold)"/><circle cx="72" cy="44" r="4" fill="url(#gGold)"/>',
  caduceus:'<line x1="50" y1="20" x2="50" y2="80" stroke="url(#gGold)" stroke-width="3"/><path d="M40 26 Q50 20 60 26 Q50 32 40 26" fill="url(#gGold)"/><path d="M50 40 Q38 48 46 58 Q54 66 46 74" fill="none" stroke="url(#gGold)" stroke-width="2.5"/><path d="M50 40 Q62 48 54 58 Q46 66 54 74" fill="none" stroke="url(#gGold)" stroke-width="2.5"/>',
  amphora:'<path d="M40 26 Q40 22 50 22 Q60 22 60 26 L58 34 Q70 44 70 58 Q70 74 50 78 Q30 74 30 58 Q30 44 42 34 Z" fill="none" stroke="url(#gGold)" stroke-width="3"/><path d="M40 28 Q30 34 36 44 M60 28 Q70 34 64 44" stroke="url(#gGold)" stroke-width="2.5" fill="none"/><line x1="44" y1="22" x2="56" y2="22" stroke="url(#gGold)" stroke-width="3"/>',
  trident:'<line x1="50" y1="22" x2="50" y2="78" stroke="url(#gGold)" stroke-width="3"/><path d="M36 30 Q36 22 44 24 M64 30 Q64 22 56 24" fill="none" stroke="url(#gGold)" stroke-width="3"/><path d="M50 22 Q50 14 50 14 M40 24 Q44 18 50 20 M60 24 Q56 18 50 20" stroke="url(#gGold)" stroke-width="3" fill="none"/><path d="M34 34 Q34 28 40 30 M66 34 Q66 28 60 30" fill="none" stroke="url(#gGold)" stroke-width="2.5"/>',
  heart:'<path d="M50 78 C50 78 22 58 22 38 C22 26 32 20 42 20 C48 20 50 26 50 30 C50 26 52 20 58 20 C68 20 78 26 78 38 C78 58 50 78 50 78 Z" fill="url(#gGold)"/>',
};

// —— 每花色 13 个独立徽章（同花色内不重复）——
const EMB = {
  spade:   ['tree','sun','star','key','book','compass','flame','tower','laurel','eye','phoenix','crown','anchor'],
  heart:   ['rose','heart','lyre','shell','torch','peacock','moon','owl','hand','scales','amphora','mask','crown'],
  diamond: ['scales','key','compass','wheel','trident','caduceus','book','sun','star','anchor','cornucopia','mask','eye'],
  club:    ['owl','serpent','sphinx','moon','star','flame','peacock','lyre','torch','tree','shell','anchor','phoenix'],
};

// —— 每花色 13 组两行寓意（均为 7 字，行一−行二=0，满足字数规则）——
const CAP = {
  spade:[
    ['生根方能向上','静默里积蓄力量'],['光终会落你肩','暖意不期而至'],['暗夜指引方向','微光亦可燃途'],
    ['心门钥匙在你','开启便见天地'],['读过的都成骨','文字塑你脊梁'],['迷失时信罗盘','方向本在心中'],
    ['热爱不可熄灭','燃尽方知炽烈'],['登高才见远方','孤峰亦立苍穹'],['荣耀赠予坚持','桂冠不负苦行'],
    ['看透虚妄表象','明辨方得自在'],['焚尽而后重生','涅槃始见真我'],['王座源于担当','君临先修己身'],
    ['风浪中持稳心','停泊处有归途'],
  ],
  heart:[
    ['爱如带刺玫瑰','靠近需懂分寸'],['真心无需声张','静水流深更长'],['弦动处是心事','乐声替你诉说'],
    ['听见海的眷恋','温柔藏于耳边'],['为你执灯前行','暖光不惧长夜'],['骄傲也需观众','绽放才被看见'],
    ['思念如月盈亏','圆缺皆是情书'],['知己如夜之眼','沉默里最懂你'],['牵手便不孤单','掌温足以御寒'],
    ['情贵在衡轻重','付出要对得起'],['盛满温柔岁月','点滴酿成甘醇'],['笑面藏真性情','卸妆才见本心'],
    ['爱是温柔加冕','被爱方知尊贵'],
  ],
  diamond:[
    ['权衡方知取舍','轻重自有答案'],['选择由你掌握','开门只需一念'],['路口信直觉走','方向自己选定'],
    ['命运轮转不息','起落皆是风景'],['执权亦承其重','掌控先懂敬畏'],['契机两相缠结','对立中见统一'],
    ['翻页才见新章','抉择书写命运'],['明朗时做决定','光亮照清前路'],['心动处即信号','追随不悔选择'],
    ['止步亦是一种','停泊也是决心'],['丰盛源于知足','拥有已是非凡'],['伪装还是坦诚','面具下的抉择'],
    ['看清再落棋子','洞察免于后悔'],
  ],
  club:[
    ['夜行者的智慧','未知里找答案'],['循环往复之间','蜕变换来新生'],['谜题等你去解','思辨方见真相'],
    ['想象借夜生长','幻梦照亮现实'],['奇想如星散落','随手可摘一颗'],['灵感一闪即逝','抓住那点火花'],
    ['张扬你的独特','绚烂无需理由'],['脑中自有乐章','想法谱成旋律'],['点亮他人未见','微光引路向前'],
    ['思绪开枝散叶','丛生方成森林'],['听见远方的海','想象没有边界'],['狂想需有落点','扎根才飞得远'],
    ['破局而后飞升','重构点燃可能'],
  ],
};

// —— 工具 ——
function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// 纯 JS UTF-8 → base64（兼容微信小程序，无 Buffer）
function utf8ToBase64(str) {
  const bytes = [];
  for (let i = 0; i < str.length; i++) {
    let code = str.charCodeAt(i);
    if (code < 0x80) {
      bytes.push(code);
    } else if (code < 0x800) {
      bytes.push(0xc0 | (code >> 6), 0x80 | (code & 0x3f));
    } else if (code < 0xd800 || code >= 0xe000) {
      bytes.push(0xe0 | (code >> 12), 0x80 | ((code >> 6) & 0x3f), 0x80 | (code & 0x3f));
    } else {
      i++;
      const code2 = str.charCodeAt(i);
      const cp = 0x10000 + (((code & 0x3ff) << 10) | (code2 & 0x3ff));
      bytes.push(0xf0 | (cp >> 18), 0x80 | ((cp >> 12) & 0x3f), 0x80 | ((cp >> 6) & 0x3f), 0x80 | (cp & 0x3f));
    }
  }
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let out = '';
  let i = 0;
  while (i < bytes.length) {
    const b1 = bytes[i++];
    const b2 = i < bytes.length ? bytes[i++] : -1;
    const b3 = i < bytes.length ? bytes[i++] : -1;
    const e1 = b1 >> 2;
    const e2 = ((b1 & 3) << 4) | (b2 === -1 ? 0 : (b2 >> 4));
    const e3 = b2 === -1 ? 64 : (((b2 & 15) << 2) | (b3 === -1 ? 0 : (b3 >> 6)));
    const e4 = b3 === -1 ? 64 : (b3 & 63);
    out += chars.charAt(e1) + chars.charAt(e2) + chars.charAt(e3) + chars.charAt(e4);
  }
  return out;
}

// 中文按固定字数断行（最多 3 行，超出截断）
function wrapZh(text, per) {
  const t = String(text || '');
  const lines = [];
  for (let i = 0; i < t.length; i += per) lines.push(t.slice(i, i + per));
  return lines.slice(0, 3);
}

// 单张卡面 SVG → data URI
function buildCard(o) {
  const opt = o || {};
  const suit = opt.suit || 'spade';
  const rank = opt.rank != null ? opt.rank : 'A';
  const suitName = opt.suitName || '';
  const emblem = EMBDEF[opt.emblem] ? opt.emblem : 'star';
  const E = EMBDEF[emblem];
  const c1 = opt.c1 || '';
  const c2 = opt.c2 || '';
  const showQuestion = !!opt.showQuestion;
  const question = opt.question || '';

  // 主题色：未提供或为 undefined → 默认 index 0（越界同样回落到 0）
  const tiRaw = opt.themeIndex;
  const ti = (tiRaw == null || tiRaw < 0 || tiRaw > CARD_THEMES.length - 1) ? 0 : tiRaw;
  const theme = CARD_THEMES[ti] || CARD_THEMES[0];
  const main = theme.main, light = theme.light, glow = theme.glow;

  // 问题区内容：谜面显示「?」，背面显示真实问题
  let qArea;
  if (showQuestion) {
    const lines = wrapZh(question, 12);
    const startY = 146 - (lines.length - 1) * 15;
    qArea = lines.map((ln, i) =>
      `<text x="180" y="${startY + i * 30}" text-anchor="middle" font-family="'Noto Serif SC',serif" font-size="20" fill="#EDE3C8" letter-spacing="1">${esc(ln)}</text>`
    ).join('');
  } else {
    qArea =
      '<text x="180" y="156" text-anchor="middle" font-family="Cinzel,serif" font-size="56" fill="url(#gGold)">?</text>' +
      '<text x="180" y="186" text-anchor="middle" font-family="\'Noto Serif SC\',serif" font-size="12" fill="#d9bd7a" letter-spacing="2">轻触翻牌 · 见今日之问</text>';
  }

  const sid = suit[0] + suit[1]; // sp / he / di / cl

  const suitPath = SUIT_PATHS[suit] || SUIT_PATHS.spade;

  // svg 头部 / 尾部（bg 与 fg 各自带完整 <defs>，互不直接依赖对方 defs）
  const svgOpen = '<svg xmlns="http://www.w3.org/2000/svg" width="360" height="504" viewBox="0 0 360 504">';
  const svgClose = '</svg>';
  const defs = '<defs>' + buildGDef(theme) + '</defs>';

  // —— 底层 bg：纯装饰容器（不透明，被箔纹镀膜反而更金属），不含任何可读文字/符号 ——
  // 金边框 + 深紫面 + 双层金细线 + 徽章外圈虚线(gGold 0.6) + 同花色水印
  const bgInner =
    '<rect x="0" y="0" width="360" height="504" rx="28" fill="url(#gGold)"/>' +
    '<rect x="4" y="4" width="352" height="496" rx="24" fill="url(#faceG)"/>' +
    '<rect x="13" y="13" width="334" height="478" rx="16" fill="none" stroke="' + main + '" stroke-opacity="0.22" stroke-width="1"/>' +
    '<rect x="17" y="17" width="326" height="470" rx="12" fill="none" stroke="' + light + '" stroke-opacity="0.10" stroke-width="1"/>' +
      '<g transform="translate(180,350)">' +
        '<circle cx="0" cy="0" r="84" fill="none" stroke="url(#gGold)" stroke-width="2" opacity="0.6"/>' +
      '<g transform="translate(-40,-40) scale(0.8)" opacity="0.06">' + suitPath + '</g>' +
    '</g>';

  // —— 顶层 fg：透明底，只含可读文字/符号，浮在最上 ——
  // 四角花色+点数（左上 + 右下旋转180） + 顶部 QUESTION 虚线框 + 标签 + 谜面/问题(qArea) + 中部徽章符号 E
  const fgInner =
    '<g font-family="Cinzel,Georgia,serif" font-weight="900" font-size="34" fill="url(#gGold)">' +
      '<text x="28" y="56">' + esc(rank) + '</text><g transform="translate(28,62) scale(0.26)">' + suitPath + '</g>' +
      '<g transform="rotate(180 180 252)"><text x="28" y="56">' + esc(rank) + '</text><g transform="translate(28,62) scale(0.26)">' + suitPath + '</g></g>' +
    '</g>' +
    '<rect x="52" y="72" width="256" height="118" rx="10" fill="none" stroke="#b8923f" stroke-opacity="0.42" stroke-dasharray="5 4"/>' +
    '<text x="180" y="96" text-anchor="middle" font-family="Cinzel,serif" letter-spacing="3" font-size="13" fill="#d9bd7a">QUESTION · ' + esc(suitName) + '</text>' +
    qArea +
    '<g transform="translate(180,350)">' +
      '<g transform="translate(-67.5,-67.5) scale(1.35)">' + E + '</g>' +
    '</g>';

  // 按稀有度在 bg 底层追加极淡镀底色（fg 完全不动 → 文字/符号最高层不变）
  const foilTint = opt.rarity ? buildFoilBg(opt.rarity, theme) : '';
  const svgBg = svgOpen + defs + bgInner + foilTint + svgClose;
  const svgFg = svgOpen + defs + fgInner + svgClose;
  // 兼容完整单图：bg + fg 顺序拼接，等价于原单一 SVG（旧引用仍可当整图用）
  const svgFull = svgOpen + defs + bgInner + fgInner + svgClose;

  // opt.split 为真 → 返回 { bg, fg } 两层 data URI；否则返回完整单图字符串（兼容旧引用）
  if (opt.split) {
    return {
      bg: 'data:image/svg+xml;base64,' + utf8ToBase64(svgBg),
      fg: 'data:image/svg+xml;base64,' + utf8ToBase64(svgFg),
    };
  }
  return 'data:image/svg+xml;base64,' + utf8ToBase64(svgFull);
}

module.exports = { CARD_THEMES, EMBDEF, SUIT_PATHS, EMB, CAP, buildCard, utf8ToBase64, buildFoilBg };
