// data/textures.js
// 程序化箔纹理生成器（技术路线 A：多层 <image> opacity 叠加，不使用 Web 的 background-blend-mode）
//
// 每个函数返回一个 `data:image/svg+xml;base64,...` 的 data URI，由组件注入 <image src>
// （与现有 bg/fg 同机制，真机 100% 兼容；不写进任何 .wxss）。
//
// 微信红线（务必遵守）：
//   - 纹理只存在于 JS 运行时注入的 data URI，**绝不写进任何 .wxss**（否则 minifyWXSS
//     编译异常 → 整页白屏，已踩两次坑）。
//   - <image> 上的 mix-blend-mode / color-dodge 真机不生效，所以所有纹理都按 **normal 混合**
//     设计，自身亮度/对比已足够明亮；color-dodge 只留给 <view> 渐变层作优雅增强
//     （见 flip-card.wxss / drum-carousel.wxss 的 .fc-foil / .dc-foil，且都配 opacity 兜底）。

// —— 纯 JS UTF-8 → base64（无 Buffer，兼容微信小程序）——
// 小程序环境无 Node Buffer，必须用纯 JS 实现；与 cardArt.js 同源，作为唯一真源。
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

// 卡面画布基准尺寸（约 5:7，与卡面 360×504 同比例；纹理会被 <image> 拉伸铺满，故无需逐像素精确）
const TEX_W = 300;
const TEX_H = 420;
const SVG_OPEN = `<svg xmlns="http://www.w3.org/2000/svg" width="${TEX_W}" height="${TEX_H}" viewBox="0 0 ${TEX_W} ${TEX_H}">`;
const SVG_CLOSE = '</svg>';

// SVG → data URI（统一出口，所有纹理函数最终都走这里）
function svgToDataUri(svg) {
  return 'data:image/svg+xml;base64,' + utf8ToBase64(svg);
}

// 可复现的伪随机数发生器（固定种子 → 纹理每次生成一致，体积/外观稳定，避免 Math.random 抖动）
function makeRng(seed) {
  let s = seed >>> 0;
  return function () {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

// ===========================================================
// 8 个程序化纹理（横向光栅 / 星空 / 金属拉丝 / 幻彩膜 / 彩虹渐变 / 金镀 / 十字光栅 / 通用闪粉）
// 设计原则：normal 混合下即足够明亮；用 opacity 控制强度（见 rarity.js 每层 opacity）。
// ===========================================================

// 1) 横向光栅条纹（holo 普通全息）：竖向彩虹渐变 → 水平彩色光栅带。
//    倾斜时整张图随角度上下平移，不同色带扫过中央符号，形成"彩虹带扫描"。
function makeHoloGrating() {
  const hues = ['#ff5d5d', '#ffb35d', '#fff15d', '#7dff5d', '#5ddcff', '#5d7dff', '#c95dff', '#ff5de0'];
  const n = hues.length * 2; // 循环两遍 → 16 条色带
  let stops = '';
  for (let i = 0; i <= n; i++) {
    const off = ((i / n) * 100).toFixed(1);
    stops += `<stop offset="${off}%" stop-color="${hues[i % hues.length]}"/>`;
  }
  const svg =
    SVG_OPEN +
    `<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1">${stops}</linearGradient></defs>` +
    `<rect width="${TEX_W}" height="${TEX_H}" fill="url(#g)"/>` +
    SVG_CLOSE;
  return svgToDataUri(svg);
}

// 2) 星空（galaxy 银河闪）：深空底 + 径向光晕 + 随机星点（符号周围加密）。
//    星点随角度视差位移；光晕中心向外扩散；符号(卡面中心 150,294)附近星点更密更亮。
function makeGalaxyStar() {
  const rng = makeRng(20240802);
  let dots = '';
  for (let i = 0; i < 70; i++) {
    const x = (rng() * TEX_W).toFixed(1);
    const y = (rng() * TEX_H).toFixed(1);
    const r = (0.4 + rng() * 1.6).toFixed(2);
    const o = (0.35 + rng() * 0.6).toFixed(2);
    dots += `<circle cx="${x}" cy="${y}" r="${r}" fill="#ffffff" opacity="${o}"/>`;
  }
  // 符号周围加密：以卡面中心为圆心、半径 70 内多布银白点
  for (let i = 0; i < 30; i++) {
    const a = rng() * Math.PI * 2;
    const d = rng() * 70;
    const x = (150 + Math.cos(a) * d).toFixed(1);
    const y = (294 + Math.sin(a) * d).toFixed(1);
    const r = (0.5 + rng() * 1.4).toFixed(2);
    dots += `<circle cx="${x}" cy="${y}" r="${r}" fill="#dfe8ff" opacity="0.85"/>`;
  }
  const svg =
    SVG_OPEN +
    `<defs><radialGradient id="g" cx="50%" cy="70%" r="65%">` +
    `<stop offset="0%" stop-color="#3a2f6b" stop-opacity="0.95"/>` +
    `<stop offset="100%" stop-color="#0a0820" stop-opacity="0"/></radialGradient></defs>` +
    `<rect width="${TEX_W}" height="${TEX_H}" fill="#0a0820"/>` +
    dots +
    `<rect width="${TEX_W}" height="${TEX_H}" fill="url(#g)"/>` +
    SVG_CLOSE;
  return svgToDataUri(svg);
}

// 3) 金属拉丝（vmax V闪）：45° 细密银白斜线 + 暗红金底。
//    虹彩沿拉丝方向金属流光；拉丝在 normal 下已明亮，opacity 控制强度。
function makeVmaxBrush() {
  const rng = makeRng(99173);
  let lines = '';
  for (let x = -TEX_H; x < TEX_W; x += 5) {
    const o = (0.05 + rng() * 0.12).toFixed(2);
    lines += `<line x1="${x}" y1="0" x2="${x + TEX_H}" y2="${TEX_H}" stroke="#e8e8ef" stroke-width="1" opacity="${o}"/>`;
  }
  const svg =
    SVG_OPEN +
    `<rect width="${TEX_W}" height="${TEX_H}" fill="#16070a"/>` +
    lines +
    SVG_CLOSE;
  return svgToDataUri(svg);
}

// 4) 幻彩膜（alt 异画闪）：极淡、低对比的斜向微结构，整面均匀幻彩。
//    随角度极细腻色相微移；normal 下保持低对比，避免抢戏。
function makeAltIridescent() {
  const rng = makeRng(40411);
  let micro = '';
  const palette = ['#ffd9f0', '#d9e6ff', '#e2ffd9', '#fff4d9', '#f0d9ff'];
  for (let i = 0; i < 60; i++) {
    const x = (rng() * TEX_W).toFixed(1);
    const y = (rng() * TEX_H).toFixed(1);
    const w = (20 + rng() * 40).toFixed(0);
    const c = palette[i % palette.length];
    micro += `<rect x="${x}" y="${y}" width="${w}" height="2" fill="${c}" opacity="0.06" transform="rotate(35 ${x} ${y})"/>`;
  }
  const svg =
    SVG_OPEN +
    `<rect width="${TEX_W}" height="${TEX_H}" fill="#120c04"/>` +
    micro +
    SVG_CLOSE;
  return svgToDataUri(svg);
}

// 5) 彩虹渐变（rainbow 彩虹稀有）：全幅对角线彩虹渐变底。
//    随角度整体平移；视觉最满（配合 grain 作磨砂白蒙层）。
function makeRainbowGradient() {
  const svg =
    SVG_OPEN +
    `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">` +
    `<stop offset="0%" stop-color="#ff5d5d"/>` +
    `<stop offset="18%" stop-color="#ffb35d"/>` +
    `<stop offset="36%" stop-color="#fff15d"/>` +
    `<stop offset="54%" stop-color="#7dff5d"/>` +
    `<stop offset="70%" stop-color="#5ddcff"/>` +
    `<stop offset="85%" stop-color="#c95dff"/>` +
    `<stop offset="100%" stop-color="#ff5de0"/>` +
    `</linearGradient></defs>` +
    `<rect width="${TEX_W}" height="${TEX_H}" fill="url(#g)"/>` +
    SVG_CLOSE;
  return svgToDataUri(svg);
}

// 6) 金镀层（gold 黄金稀有）：金属金渐变（#C9A227→#E8C766→#F2E2A8）。
//    全卡金色，倾斜时金色高光带扫过（配合 bg 金底 + 金边最亮）。
function makeGoldPlating() {
  const svg =
    SVG_OPEN +
    `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">` +
    `<stop offset="0%" stop-color="#C9A227"/>` +
    `<stop offset="30%" stop-color="#E8C766"/>` +
    `<stop offset="50%" stop-color="#F2E2A8"/>` +
    `<stop offset="70%" stop-color="#E8C766"/>` +
    `<stop offset="100%" stop-color="#C9A227"/>` +
    `</linearGradient></defs>` +
    `<rect width="${TEX_W}" height="${TEX_H}" fill="url(#g)"/>` +
    SVG_CLOSE;
  return svgToDataUri(svg);
}

// 7) 十字光栅（shiny 闪光）：高对比十字交叉白光栅 + 中心十字高光。
//    倾斜时十字光栅爆闪（高对比白光 + opacity 强联动）；十字光心锁定卡面中心。
function makeShinyCross() {
  let lines = '';
  for (let x = 0; x <= TEX_W; x += 9) {
    lines += `<line x1="${x}" y1="0" x2="${x}" y2="${TEX_H}" stroke="#ffffff" stroke-width="1" opacity="0.10"/>`;
  }
  for (let y = 0; y <= TEX_H; y += 9) {
    lines += `<line x1="0" y1="${y}" x2="${TEX_W}" y2="${y}" stroke="#ffffff" stroke-width="1" opacity="0.10"/>`;
  }
  // 中心十字高光（卡面中心 150,294）
  lines += `<rect x="148" y="0" width="4" height="${TEX_H}" fill="#ffffff" opacity="0.55"/>`;
  lines += `<rect x="0" y="292" width="${TEX_W}" height="4" fill="#ffffff" opacity="0.55"/>`;
  const svg =
    SVG_OPEN +
    `<rect width="${TEX_W}" height="${TEX_H}" fill="#0a0820"/>` +
    lines +
    SVG_CLOSE;
  return svgToDataUri(svg);
}

// 8) 通用闪粉（grain）：细碎随机白点，作为通用增强层 / 替代被删除的 holo.png。
//    用于各稀有度的"闪粉点缀"或磨砂蒙层；也是删除 holo.png 后的统一兜底纹理。
function makeGrain() {
  const rng = makeRng(777);
  let dots = '';
  for (let i = 0; i < 220; i++) {
    const x = (rng() * TEX_W).toFixed(1);
    const y = (rng() * TEX_H).toFixed(1);
    const r = (0.3 + rng() * 1.0).toFixed(2);
    const o = (0.15 + rng() * 0.5).toFixed(2);
    dots += `<circle cx="${x}" cy="${y}" r="${r}" fill="#ffffff" opacity="${o}"/>`;
  }
  const svg =
    SVG_OPEN +
    `<rect width="${TEX_W}" height="${TEX_H}" fill="#1a1230"/>` +
    dots +
    SVG_CLOSE;
  return svgToDataUri(svg);
}

// —— 纹理构建注册表 + 缓存（同一纹理只生成一次，返回同一 data URI 字符串引用，节省内存）——
const BUILDERS = {
  holoGrating: makeHoloGrating,
  galaxyStar: makeGalaxyStar,
  vmaxBrush: makeVmaxBrush,
  altIridescent: makeAltIridescent,
  rainbowGradient: makeRainbowGradient,
  goldPlating: makeGoldPlating,
  shinyCross: makeShinyCross,
  grain: makeGrain,
};

const _textureCache = new Map();

// 取纹理 data URI（带缓存）。name 不存在时返回空串，调用方需兜底。
function getTexture(name) {
  if (!BUILDERS[name]) return '';
  if (!_textureCache.has(name)) {
    _textureCache.set(name, BUILDERS[name]());
  }
  return _textureCache.get(name);
}

module.exports = {
  utf8ToBase64,
  getTexture,
  TEX_W,
  TEX_H,
  // 导出 8 个纹理名，便于 rarity.js 引用与自检
  TEXTURE_NAMES: Object.keys(BUILDERS),
};
