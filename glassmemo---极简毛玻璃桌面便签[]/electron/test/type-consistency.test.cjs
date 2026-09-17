// 类型契约测试：检查 main.cjs / desktop-layer.cjs / preload.cjs 的运行时返回值结构
// 与 src/types.ts 中声明的 LayerMode / AttachResult / PinState 是否严格一致。
//
// 思路：
//   1) 静态读 main.cjs / desktop-layer.cjs / preload.cjs 的源代码
//   2) 用正则/源码扫描捕获返回对象字面量
//   3) 与类型签名对比字段名（不依赖 TypeScript 编译，更适合 cjs + 沙箱环境）
//
// 用法：node electron/test/type-consistency.test.cjs
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');

const typesPath = path.join(ROOT, 'src', 'types.ts');
const mainPath = path.join(ROOT, 'electron', 'main.cjs');
const desktopLayerPath = path.join(ROOT, 'electron', 'desktop-layer.cjs');
const preloadPath = path.join(ROOT, 'electron', 'preload.cjs');

let passed = 0;
let failed = 0;
const failures = [];

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (e) {
    failed++;
    failures.push({ name, error: e });
    console.log(`  ✗ ${name}`);
    console.log(`    ${e.message}`);
  }
}

console.log('\n=== 类型契约一致性测试 ===\n');

const typesSrc = fs.readFileSync(typesPath, 'utf8');
const mainSrc = fs.readFileSync(mainPath, 'utf8');
const dlSrc = fs.readFileSync(desktopLayerPath, 'utf8');
const preloadSrc = fs.readFileSync(preloadPath, 'utf8');

// ---------- LayerMode 枚举 ----------
test('src/types.ts 声明 LayerMode 包含 3 个值：desktop-widget / pinned-floating / normal-fallback', () => {
  const m = typesSrc.match(/export type LayerMode\s*=\s*([^;]+);/);
  assert(m, '未找到 LayerMode 声明');
  const union = m[1];
  for (const v of ['desktop-widget', 'pinned-floating', 'normal-fallback']) {
    assert(union.includes(`'${v}'`), `LayerMode 必须包含 '${v}'，实际: ${union}`);
  }
});

// ---------- AttachResult ----------
test('src/types.ts 声明 AttachResult 含字段 ok / mode / reason?', () => {
  const m = typesSrc.match(/export interface AttachResult\s*\{([^}]+)\}/);
  assert(m, '未找到 AttachResult 声明');
  const body = m[1];
  assert(/ok\s*:/.test(body), 'AttachResult 必须含 ok 字段');
  assert(/mode\s*:\s*LayerMode/.test(body), 'AttachResult 必须含 mode:LayerMode');
  assert(/reason\s*\?/.test(body), 'AttachResult 必须含 reason?: string');
});

// ---------- PinState ----------
test('src/types.ts 声明 PinState 含字段 pinned / mode', () => {
  const m = typesSrc.match(/export interface PinState\s*\{([^}]+)\}/);
  assert(m, '未找到 PinState 声明');
  const body = m[1];
  assert(/pinned\s*:/.test(body), 'PinState 必须含 pinned 字段');
  assert(/mode\s*:\s*LayerMode/.test(body), 'PinState 必须含 mode:LayerMode');
});

// ---------- desktop-layer.cjs 返回值结构 ----------
test('desktop-layer.cjs attachToDesktop 返回 {ok, mode, reason} 形态', () => {
  // 抓所有 return { ... } 语句
  const returns = dlSrc.match(/return\s*\{[^}]+\}/g) || [];
  assert(returns.length >= 3, `期望至少 3 个 return 对象（attach + detach + 失败分支），实际 ${returns.length}`);
  // 必须出现 ok:true、ok:false、mode:'pinned-floating'、mode:'desktop-widget'、mode:'normal-fallback'
  const all = returns.join('\n');
  assert(/ok:\s*true/.test(all), '应有 ok:true 返回');
  assert(/ok:\s*false/.test(all), '应有 ok:false 返回');
  assert(/mode:\s*['"]desktop-widget['"]/.test(all), '应有 mode:desktop-widget');
  assert(/mode:\s*['"]pinned-floating['"]/.test(all), '应有 mode:pinned-floating');
  assert(/mode:\s*['"]normal-fallback['"]/.test(all), '应有 mode:normal-fallback');
});

test('desktop-layer.cjs detachFromDesktop 包含 pinned-floating / normal-fallback 两种 mode', () => {
  // detachFromDesktop 函数体
  const m = dlSrc.match(/function\s+detachFromDesktop[\s\S]*?\n\}/);
  assert(m, '未找到 detachFromDesktop 函数体');
  const body = m[0];
  assert(/mode:\s*['"]pinned-floating['"]/.test(body), 'detachFromDesktop 成功路径必须 mode:pinned-floating');
  assert(/mode:\s*['"]normal-fallback['"]/.test(body), 'detachFromDesktop 失败路径必须 mode:normal-fallback');
});

// ---------- main.cjs IPC handler 返回值结构 ----------
test('main.cjs ipcMain.handle("pin:toggle") 返回 {pinned, mode}', () => {
  const m = mainSrc.match(/ipcMain\.handle\(['"]pin:toggle['"][\s\S]*?\}\s*\);/);
  assert(m, '未找到 pin:toggle handler');
  const handler = m[0];
  assert(/return\s*\{\s*pinned/.test(handler), 'pin:toggle 必须返回 {pinned,...}');
  assert(/mode:/.test(handler), 'pin:toggle 必须包含 mode 字段');
});

test('main.cjs ipcMain.handle("pin:get") 返回 {pinned, mode}', () => {
  const m = mainSrc.match(/ipcMain\.handle\(['"]pin:get['"][\s\S]*?\)\s*;/);
  assert(m, '未找到 pin:get handler');
  const handler = m[0];
  assert(/\bpinned\b/.test(handler) && /\bmode\b/.test(handler), `pin:get 必须含 pinned 和 mode 字段，实际: ${handler}`);
});

test('main.cjs broadcastPinState 推送 {pinned, mode}', () => {
  const m = mainSrc.match(/function\s+broadcastPinState[\s\S]*?\n\}/);
  assert(m, '未找到 broadcastPinState');
  const body = m[0];
  assert(/pin:change/.test(body), '广播通道必须为 pin:change');
  assert(/pinned/.test(body) && /mode/.test(body), '广播 payload 必须包含 pinned 和 mode');
});

// ---------- preload.cjs 暴露契约 ----------
test('preload.cjs 暴露 togglePin / getPin / onPinChange 三个 pin 方法', () => {
  assert(/togglePin\s*:/.test(preloadSrc), 'preload 必须暴露 togglePin');
  assert(/getPin\s*:/.test(preloadSrc), 'preload 必须暴露 getPin');
  assert(/onPinChange\s*:/.test(preloadSrc), 'preload 必须暴露 onPinChange');
  assert(/pin:toggle/.test(preloadSrc), 'preload 必须 invoke pin:toggle');
  assert(/pin:get/.test(preloadSrc), 'preload 必须 invoke pin:get');
  assert(/pin:change/.test(preloadSrc), 'preload 必须订阅 pin:change');
});

// ---------- StickyNote.tsx 消费契约 ----------
test('src/components/StickyNote.tsx 中 window.glassmemo 类型与 PinState 兼容', () => {
  const stickyPath = path.join(ROOT, 'src', 'components', 'StickyNote.tsx');
  const stickySrc = fs.readFileSync(stickyPath, 'utf8');
  assert(/interface Window[\s\S]*?glassmemo/.test(stickySrc), 'StickyNote 必须声明 window.glassmemo');
  assert(/togglePin\s*:\s*\(\)\s*=>\s*Promise<PinState>/.test(stickySrc), 'togglePin 返回值必须是 Promise<PinState>');
  assert(/getPin\s*:\s*\(\)\s*=>\s*Promise<PinState>/.test(stickySrc), 'getPin 返回值必须是 Promise<PinState>');
  assert(/onPinChange\s*:\s*\(cb:\s*\(state:\s*PinState\)\s*=>\s*void\)/.test(stickySrc), 'onPinChange 回调参数必须是 PinState');
});

// ---------- 模式字段一致性：main.cjs 的 mode 字面量必须 ⊆ LayerMode ----------
test('main.cjs 所有 mode 字面量都属于 LayerMode 枚举', () => {
  const allowed = ['desktop-widget', 'pinned-floating', 'normal-fallback'];
  const found = [...mainSrc.matchAll(/mode\s*[:=]\s*['"]([^'"]+)['"]/g)].map((m) => m[1]);
  const uniq = [...new Set(found)];
  uniq.forEach((v) => {
    assert(allowed.includes(v), `main.cjs 出现未在 LayerMode 声明的 mode: '${v}'`);
  });
  // 必须至少出现 desktop-widget（默认值）
  assert(uniq.includes('desktop-widget'), `main.cjs 至少应出现 desktop-widget，实际: ${uniq}`);
});

test('desktop-layer.cjs 所有 mode 字面量都属于 LayerMode 枚举', () => {
  const allowed = ['desktop-widget', 'pinned-floating', 'normal-fallback'];
  const found = [...dlSrc.matchAll(/mode\s*[:=]\s*['"]([^'"]+)['"]/g)].map((m) => m[1]);
  const uniq = [...new Set(found)];
  uniq.forEach((v) => {
    assert(allowed.includes(v), `desktop-layer.cjs 出现未在 LayerMode 声明的 mode: '${v}'`);
  });
});

// ---------- 总结 ----------
console.log(`\n=== 结果: ${passed} passed, ${failed} failed ===\n`);
if (failed > 0) {
  console.log('失败详情：');
  failures.forEach((f) => {
    console.log(`  - ${f.name}`);
    console.log(`    ${f.error.stack || f.error.message}`);
  });
  process.exit(1);
}
process.exit(0);

function assert(cond, msg) {
  if (!cond) throw new Error(msg || 'assertion failed');
}