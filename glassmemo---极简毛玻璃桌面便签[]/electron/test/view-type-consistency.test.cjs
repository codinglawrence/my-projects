// View 维度类型契约一致性测试
// 对照 src/types.ts（单一来源），检查 main.cjs / preload.cjs / StickyNote.tsx / Orb.tsx / useViewMode.ts
// 中关于 view 维度的字段名 / 通道名 / IPC 名是否一致。
//
// 用法：node electron/test/view-type-consistency.test.cjs
'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const ROOT = path.join(__dirname, '..', '..');
const TYPES = path.join(ROOT, 'src', 'types.ts');
const MAIN = path.join(ROOT, 'electron', 'main.cjs');
const PRELOAD = path.join(ROOT, 'electron', 'preload.cjs');
const STICKY = path.join(ROOT, 'src', 'components', 'StickyNote.tsx');
const ORB = path.join(ROOT, 'src', 'components', 'Orb.tsx');
const HOOK = path.join(ROOT, 'src', 'hooks', 'useViewMode.ts');
const ORBC = path.join(ROOT, 'electron', 'orb-controller.cjs');
const ORBCONST = path.join(ROOT, 'src', 'constants', 'orb.ts');

const typesSrc = fs.readFileSync(TYPES, 'utf8');
const mainSrc = fs.readFileSync(MAIN, 'utf8');
const preloadSrc = fs.readFileSync(PRELOAD, 'utf8');
const stickySrc = fs.readFileSync(STICKY, 'utf8');
const orbSrc = fs.readFileSync(ORB, 'utf8');
const hookSrc = fs.readFileSync(HOOK, 'utf8');
const orbcSrc = fs.readFileSync(ORBC, 'utf8');
const constSrc = fs.readFileSync(ORBCONST, 'utf8');

let passed = 0;
let failed = 0;
const failures = [];

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  \u2713 ${name}`);
  } catch (e) {
    failed++;
    failures.push({ name, error: e });
    console.log(`  \u2717 ${name}`);
    console.log(`    ${e.message}`);
  }
}

function assertHas(src, re, msg) {
  if (!re.test(src)) throw new Error(msg);
}

console.log('\n=== View 维度类型一致性 ===\n');

// ---------- src/types.ts（单一来源）----------
test('types.ts: ViewMode = "note" | "orb"', () => {
  const m = typesSrc.match(/export type ViewMode\s*=\s*([^;]+);/);
  assert.ok(m, '缺少 ViewMode 声明');
  assert.ok(m[1].includes("'note'") && m[1].includes("'orb'"), `ViewMode 必须含 'note' 和 'orb'：${m[1]}`);
});

test('types.ts: Bounds 字段 = x / y / width / height（全 number）', () => {
  const m = typesSrc.match(/export interface Bounds\s*\{([^}]+)\}/);
  assert.ok(m, '缺少 Bounds');
  const body = m[1];
  for (const f of ['x:', 'y:', 'width:', 'height:']) {
    assert.ok(body.includes(f), `Bounds 缺字段 ${f}：${body}`);
  }
});

test('types.ts: ViewState 字段 = view / bounds / isAnimating', () => {
  const m = typesSrc.match(/export interface ViewState\s*\{([^}]+)\}/);
  assert.ok(m, '缺少 ViewState');
  for (const f of ['view:', 'bounds:', 'isAnimating:']) {
    assert.ok(m[1].includes(f), `ViewState 缺字段 ${f}：${m[1]}`);
  }
});

test('types.ts: ViewChangePayload 字段 = from / to / bounds / isAnimating', () => {
  const m = typesSrc.match(/export interface ViewChangePayload\s*\{([^}]+)\}/);
  assert.ok(m, '缺少 ViewChangePayload');
  for (const f of ['from:', 'to:', 'bounds:', 'isAnimating:']) {
    assert.ok(m[1].includes(f), `ViewChangePayload 缺字段 ${f}：${m[1]}`);
  }
});

test('types.ts: OrbDragDelta 字段 = dx / dy / phase', () => {
  const m = typesSrc.match(/export interface OrbDragDelta\s*\{([^}]+)\}/);
  assert.ok(m, '缺少 OrbDragDelta');
  const body = m[1];
  for (const f of ['dx:', 'dy:']) {
    assert.ok(body.includes(f), `OrbDragDelta 缺字段 ${f}：${body}`);
  }
  assert.ok(/phase:\s*['"]start['"]\s*\|\s*['"]move['"]\s*\|\s*['"]end['"]/.test(body), `OrbDragDelta.phase 必须是 'start' | 'move' | 'end'：${body}`);
});

test('types.ts: ViewToggleSource = button / orb-click / tray / dblclick', () => {
  const m = typesSrc.match(/export type ViewToggleSource\s*=\s*([^;]+);/);
  assert.ok(m, '缺少 ViewToggleSource');
  for (const v of ['button', 'orb-click', 'tray', 'dblclick']) {
    assert.ok(m[1].includes(`'${v}'`), `ViewToggleSource 必须含 '${v}'：${m[1]}`);
  }
});

// ---------- electron/preload.cjs（contextBridge 暴露）----------
test('preload.cjs: view.toggle / view.get / view.onChange / view.drag 必须存在', () => {
  assertHas(preloadSrc, /view:\s*\{/, 'preload 缺 view:{}');
  assertHas(preloadSrc, /toggle:\s*\([^)]*\)\s*=>\s*ipcRenderer\.invoke\(['"]view:toggle['"]/, 'preload toggle 缺');
  assertHas(preloadSrc, /get:\s*\(\)\s*=>\s*ipcRenderer\.invoke\(['"]view:get['"]/, 'preload get 缺');
  assertHas(preloadSrc, /onChange:\s*\(cb/, 'preload onChange 缺');
  assertHas(preloadSrc, /ipcRenderer\.on\(['"]view:change['"]/, 'preload 订阅 view:change 缺');
  // v1.1.2: drag 改 send（单向 fire-and-forget），不再用 invoke（避免高频拖动往返延迟）
  assertHas(preloadSrc, /drag:\s*\(delta\)\s*=>\s*ipcRenderer\.send\(['"]view:drag['"]/, 'preload drag 缺');
  assertHas(preloadSrc, /notifyAnimDone:\s*\(\)\s*=>\s*ipcRenderer\.send\(['"]view:anim-done['"]/, 'preload notifyAnimDone 缺');
});

// ---------- electron/main.cjs（IPC handler）----------
test('main.cjs: ipcMain.handle("view:toggle") / ("view:get") 必须存在', () => {
  assertHas(mainSrc, /ipcMain\.handle\(['"]view:toggle['"]/, '缺 view:toggle handler');
  assertHas(mainSrc, /ipcMain\.handle\(['"]view:get['"]/, '缺 view:get handler');
  // v1.1.2: view:drag 改 ipcMain.on（配合 preload 的 send），handle 的返回值回传会放大拖动延迟
  assertHas(mainSrc, /ipcMain\.on\(['"]view:drag['"]/, '缺 view:drag handler');
  assertHas(mainSrc, /ipcMain\.on\(['"]view:anim-done['"]/, '缺 view:anim-done handler');
});

test('main.cjs: view:change 推送只由 OrbController 触发（main 不直接 send）', () => {
  // SK-4：view:change 应在 setBounds 之后由 OrbController._emitChange 统一推送
  assert.ok(!/webContents\.send\(['"]view:change['"]/.test(mainSrc), 'main.cjs 不应直接 send view:change（避免双推送）');
  assertHas(orbcSrc, /view:change/, 'orb-controller.cjs 必须引用 view:change 通道');
  assertHas(orbcSrc, /from/, 'orb-controller.cjs _emitChange 必须含 from');
  assertHas(orbcSrc, /to:.*payload|to,/m, 'orb-controller.cjs _emitChange 必须含 to');
});

test('main.cjs: view:toggle 转发到 OrbController.toggle', () => {
  const m = mainSrc.match(/ipcMain\.handle\(['"]view:toggle['"][\s\S]*?\}\s*\);/);
  assert.ok(m, '未找到 view:toggle handler');
  assert.ok(/orbController\.toggle\(/.test(m[0]), 'view:toggle 必须调用 orbController.toggle');
});

test('main.cjs: ready-to-show → 调 OrbController.restoreOnStartup', () => {
  const m = mainSrc.match(/once\(['"]ready-to-show['"][\s\S]{0,500}restoreOnStartup/);
  assert.ok(m, '必须 ready-to-show → restoreOnStartup');
});

// ---------- orb-controller.cjs（实际推送 schema）----------
test('orb-controller.cjs: _emitChange 推送 {from, to, bounds, isAnimating}', () => {
  const m = orbcSrc.match(/_emitChange\(from, to, bounds, animating\)\s*\{[\s\S]*?\}\s*$/m);
  assert.ok(m, '未找到 _emitChange 函数');
  const body = m[0];
  for (const f of ['from', 'to', 'bounds', 'isAnimating']) {
    assert.ok(body.includes(f), `_emitChange 缺字段 ${f}：${body}`);
  }
});

test('orb-controller.cjs: 状态字段 = currentView / currentBounds / isAnimating', () => {
  assertHas(orbcSrc, /this\.currentView\s*=\s*['"]note['"]/, 'currentView 初始化为 note');
  assertHas(orbcSrc, /this\.currentBounds\s*=/, 'currentBounds 字段缺');
  assertHas(orbcSrc, /this\.isAnimating\s*=\s*false/, 'isAnimating 字段缺');
});

// ---------- src/components/StickyNote.tsx ----------
test('StickyNote.tsx: declare global 含 window.glassmemo.view 接口', () => {
  assertHas(stickySrc, /window\.glassmemo\?/, '缺 window.glassmemo?');
  assertHas(stickySrc, /view:\s*\{/, '缺 view:{}');
  assertHas(stickySrc, /toggle:\s*\(source\?\s*:\s*ViewToggleSource\)/, 'view.toggle 签名缺 ViewToggleSource');
  assertHas(stickySrc, /Promise<import\(['"]\.\.\/types['"]\)\.ViewState>/, 'view.toggle 返回值类型缺');
  assertHas(stickySrc, /onChange:\s*\(cb:\s*\(payload:\s*import\(['"]\.\.\/types['"]\)\.ViewChangePayload\)/, 'view.onChange 签名缺 ViewChangePayload');
  assertHas(stickySrc, /drag:\s*\(delta:\s*import\(['"]\.\.\/types['"]\)\.OrbDragDelta\)/, 'view.drag 签名缺 OrbDragDelta');
});

test('StickyNote.tsx: 「缩小」按钮位于「窗口置顶」与「关闭到托盘」之间（PRD §3.2）', () => {
  // 用 handle 函数名作为位置锚点（title 是 JSX 表达式，正则匹配麻烦）
  const pinBtnPos = stickySrc.search(/handleTogglePin/);
  const shrinkBtnPos = stickySrc.search(/handleShrinkClick/);
  const hideBtnPos = stickySrc.search(/window\.glassmemo\?\.hideApp\(\)/);
  assert.ok(pinBtnPos > 0, '未找到「窗口置顶」按钮（handleTogglePin）');
  assert.ok(shrinkBtnPos > 0, '未找到「缩小」按钮（handleShrinkClick）');
  assert.ok(hideBtnPos > 0, '未找到「隐藏到托盘」按钮（hideApp 调用）');
  assert.ok(pinBtnPos < shrinkBtnPos && shrinkBtnPos < hideBtnPos, `按钮顺序错：pinBtn=${pinBtnPos} < shrinkBtn=${shrinkBtnPos} < hideBtn=${hideBtnPos}`);
});

test('StickyNote.tsx: AnimatePresence + view 条件渲染 view === "orb" 渲染 <Orb />', () => {
  assertHas(stickySrc, /AnimatePresence/, '缺 AnimatePresence');
  assertHas(stickySrc, /isOrb/, '缺 isOrb 标志');
  assertHas(stickySrc, /isOrb\s*\?\s*\(/, '缺三元条件 {isOrb ? ... : ...}');
  assertHas(stickySrc, /<Orb/, '缺 <Orb />');
});

test('StickyNote.tsx: useViewMode 调用 → {state, toggle, notifyAnimationDone}', () => {
  assertHas(stickySrc, /useViewMode\(\)/, '缺 useViewMode() 调用');
  const destructMatch = stickySrc.match(/const\s*\{\s*state:\s*viewState,\s*toggle:\s*toggleView,\s*notifyAnimationDone\s*\}\s*=\s*useViewMode\(\)/);
  assert.ok(destructMatch, '缺正确的解构 {state, toggle, notifyAnimationDone}');
});

// ---------- src/components/Orb.tsx ----------
test('Orb.tsx: 引用 ORB_SIZE / ANIMATION_DURATION_MS / DRAG_CLICK_THRESHOLD_PX 常量', () => {
  for (const cnst of ['ORB_SIZE', 'ANIMATION_DURATION_MS', 'DRAG_CLICK_THRESHOLD_PX']) {
    assertHas(orbSrc, new RegExp(`\\b${cnst}\\b`), `Orb.tsx 未引用常量 ${cnst}`);
  }
});

test('Orb.tsx: onExpand 形参 source 类型 = "orb-click" | "dblclick"', () => {
  // 兼容 "" 与 ''，避免字符串字面冲突
  const re = /\(source:\s*['"]orb-click['"]\s*\|\s*['"]dblclick['"]/;
  assertHas(orbSrc, re, 'onExpand 签名错');
});

test('Orb.tsx: 拖动 phase 调用 drag({...,phase:"start|move|end"})', () => {
  assertHas(orbSrc, /phase:\s*['"]start['"]/, '缺 phase=start 调用');
  assertHas(orbSrc, /phase:\s*['"]move['"]/, '缺 phase=move 调用');
  assertHas(orbSrc, /phase:\s*['"]end['"]/, '缺 phase=end 调用');
});

// ---------- src/hooks/useViewMode.ts ----------
test('useViewMode.ts: 订阅 viewApi.onChange + setState 以 payload.to/bounds/isAnimating 更新', () => {
  assertHas(hookSrc, /viewApi\.onChange\(/, '缺 onChange 订阅');
  const m = hookSrc.match(/setState\(\{[\s\S]*?\}\)/);
  assert.ok(m, '缺 setState');
  assert.ok(m[0].includes('payload.to') || m[0].includes('to'), 'setState 缺 to');
  assert.ok(m[0].includes('payload.bounds') || m[0].includes('bounds'), 'setState 缺 bounds');
  assert.ok(m[0].includes('payload.isAnimating') || m[0].includes('isAnimating'), 'setState 缺 isAnimating');
});

test('useViewMode.ts: notifyAnimationDone → IPC notifyAnimDone + 本地 setState', () => {
  assertHas(hookSrc, /notifyAnimDone/, '缺 notifyAnimDone');
});

// ---------- src/constants/orb.ts vs orb-controller.cjs 常量一致性 ----------
test('常量 ORB_SIZE 跨层一致性：渲染层 60 = 主进程 60', () => {
  const r1 = constSrc.match(/export const ORB_SIZE\s*=\s*(\d+)/);
  const m1 = orbcSrc.match(/const ORB_SIZE\s*=\s*(\d+)/);
  assert.ok(r1, '渲染层 ORB_SIZE 缺');
  assert.ok(m1, '主进程 ORB_SIZE 缺');
  assert.strictEqual(r1[1], m1[1], `ORB_SIZE 不一致：渲染=${r1[1]} 主进程=${m1[1]}`);
});

test('常量 SNAP_THRESHOLD 跨层一致性：渲染层 30 = 主进程 30', () => {
  const r1 = constSrc.match(/export const SNAP_THRESHOLD\s*=\s*(\d+)/);
  const m1 = orbcSrc.match(/SNAP_THRESHOLD:\s*(\d+)/);
  assert.ok(r1, '渲染层 SNAP_THRESHOLD 缺');
  assert.ok(m1, '主进程 SNAP_THRESHOLD 缺');
  assert.strictEqual(r1[1], m1[1], `SNAP_THRESHOLD 不一致：渲染=${r1[1]} 主进程=${m1[1]}`);
});

test('常量 SNAP_INSET 跨层一致性：渲染层 8 = 主进程 8', () => {
  const r1 = constSrc.match(/export const SNAP_INSET\s*=\s*(\d+)/);
  const m1 = orbcSrc.match(/SNAP_INSET:\s*(\d+)/);
  assert.ok(r1, '渲染层 SNAP_INSET 缺');
  assert.ok(m1, '主进程 SNAP_INSET 缺');
  assert.strictEqual(r1[1], m1[1], `SNAP_INSET 不一致：渲染=${r1[1]} 主进程=${m1[1]}`);
});

// ---------- 总结 ----------
console.log(`\n=== 结果: ${passed} passed, ${failed} failed ===\n`);
if (failed > 0) {
  console.log('失败详情：');
  failures.forEach((f) => {
    console.log(`  - ${f.name}`);
    console.log(`    ${f.error.stack || f.error.message}`);
  });
  process.exitCode = 1;
}
