// main.cjs 静态审查测试
// 由于沙箱无法启动 Electron 主进程，我们对 main.cjs 做静态扫描，
// 覆盖以下「必须存在」的契约点（不执行，仅源码校验）：
//   1) 应用生命周期：app.whenReady / createWindow / createTray / ready-to-show 后才调 applyLayer
//   2) 关闭按钮 → 隐藏到托盘（不退出）
//   3) ipcMain.handle('pin:toggle') / ipcMain.handle('pin:get') / ipcMain.on('app:hide' / 'app:quit')
//   4) applyLayer 失败 → console.error('[desktop-layer]') + detachFromDesktop 兜底（SK-2）
//   5) refreshTrayTooltip 三种 mode（desktop-widget / pinned-floating / normal-fallback）
//   6) Tray 菜单顺序：显示/隐藏 → 窗口置顶 → 开机自启 → 退出
//   7) 单实例锁 app.requestSingleInstanceLock
//
// 用法：node electron/test/main-static.test.cjs
'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const ROOT = path.join(__dirname, '..', '..');
const mainPath = path.join(ROOT, 'electron', 'main.cjs');
const src = fs.readFileSync(mainPath, 'utf8');

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

console.log('\n=== main.cjs 静态审查 ===\n');

// ---------- 应用生命周期 ----------
test('app.whenReady → createWindow + createTray', () => {
  assert(/app\.whenReady\(\)/.test(src), '缺少 app.whenReady()');
  assert(/createWindow\(\)/.test(src), '缺少 createWindow() 调用');
  assert(/createTray\(\)/.test(src), '缺少 createTray() 调用');
});

test('ready-to-show 事件之后再调 applyLayer', () => {
  const m = src.match(/once\(['"]ready-to-show['"][\s\S]{0,300}applyLayer/);
  assert(m, '必须在 ready-to-show 回调中调用 applyLayer');
});

test('点 X 隐藏到托盘（win.on close + preventDefault + win.hide）', () => {
  assert(/win\.on\(['"]close['"]/.test(src), '缺少 close 事件处理');
  // preventDefault + win.hide
  const closeHandler = src.match(/win\.on\(['"]close['"][\s\S]*?\}\s*\);/);
  assert(closeHandler, '未找到 close handler');
  assert(/e\.preventDefault/.test(closeHandler[0]), 'close handler 必须 e.preventDefault');
  assert(/win\.hide/.test(closeHandler[0]), 'close handler 必须 win.hide()');
});

// ---------- IPC handler 完整性 ----------
test('ipcMain.handle pin:toggle / pin:get 必存在', () => {
  assert(/ipcMain\.handle\(['"]pin:toggle['"]/.test(src), '缺少 pin:toggle handler');
  assert(/ipcMain\.handle\(['"]pin:get['"]/.test(src), '缺少 pin:get handler');
});

test('ipcMain.on app:hide / app:quit 必存在', () => {
  assert(/ipcMain\.on\(['"]app:hide['"]/.test(src), '缺少 app:hide handler');
  assert(/ipcMain\.on\(['"]app:quit['"]/.test(src), '缺少 app:quit handler');
});

// ---------- applyLayer 失败降级（SK-2）----------
test('applyLayer 失败路径 console.error 留痕', () => {
  // 必须有 console.error('[desktop-layer] ...') 至少一次
  assert(/console\.error\(['"]\[desktop-layer\]/.test(src), 'applyLayer 失败路径必须 console.error [desktop-layer]');
});

test('applyLayer 失败时 detachFromDesktop 兜底', () => {
  // 抓 applyLayer 函数体
  const m = src.match(/function\s+applyLayer\s*\(\)[\s\S]*?\n\}/);
  assert(m, '未找到 applyLayer 函数体');
  const body = m[0];
  // 必须包含 detachFromDesktop 调用
  assert(/detachFromDesktop\(/.test(body), 'applyLayer 必须调用 detachFromDesktop');
  // 失败分支中调
  assert(/detachFromDesktop\(handle\)/.test(body), 'applyLayer 失败兜底必须传 handle');
});

// ---------- refreshTrayTooltip 三种 mode ----------
test('refreshTrayTooltip 覆盖三种 mode', () => {
  const m = src.match(/function\s+refreshTrayTooltip\s*\(\)[\s\S]*?\n\}/);
  assert(m, '未找到 refreshTrayTooltip');
  const body = m[0];
  assert(/pinned-floating/.test(body), 'refreshTrayTooltip 必须处理 pinned-floating');
  assert(/normal-fallback/.test(body), 'refreshTrayTooltip 必须处理 normal-fallback');
  // desktop-widget 是 else 兜底分支（lastMode 默认值），源码中可显式或隐式
  // 检查：函数要么显式提到 desktop-widget，要么有 else 分支兜底
  const hasExplicit = /desktop-widget/.test(body);
  const hasElse = /else\s*\{[\s\S]*?桌面挂件/.test(body);
  assert(hasExplicit || hasElse, 'refreshTrayTooltip 必须显式或通过 else 兜底处理 desktop-widget');
});

// ---------- Tray 菜单顺序 ----------
test('Tray 菜单：显示/隐藏 → 窗口置顶 → 开机自启 → 退出', () => {
  // 抓 buildTrayMenu 函数体
  const m = src.match(/function\s+buildTrayMenu[\s\S]*?\n\}/);
  assert(m, '未找到 buildTrayMenu');
  const body = m[0];
  // 抓所有 label 项的出现顺序
  const labels = [...body.matchAll(/label:\s*['"]([^'"]+)['"]/g)].map((m) => m[1]);
  console.log(`    [debug] menu labels: ${JSON.stringify(labels)}`);
  assert(labels.length >= 4, `菜单项不足 4 项，实际 ${labels.length}`);
  // 顺序检查
  const idxShow = labels.findIndex((l) => l.includes('显示'));
  const idxPin = labels.findIndex((l) => l.includes('窗口置顶'));
  const idxAuto = labels.findIndex((l) => l.includes('开机自启'));
  const idxQuit = labels.findIndex((l) => l.includes('退出'));
  assert(idxShow >= 0 && idxPin > idxShow && idxAuto > idxPin && idxQuit > idxAuto,
    `菜单顺序错误：显示=${idxShow} 置顶=${idxPin} 自启=${idxAuto} 退出=${idxQuit}`);
});

// ---------- 窗口置顶是 checkbox ----------
test('窗口置顶菜单项必须是 type:checkbox 且 click 中切换 pinned', () => {
  const pinItemMatch = src.match(/label:\s*['"]窗口置顶['"][\s\S]{0,400}?\},?\s*\}/);
  assert(pinItemMatch, '未找到「窗口置顶」菜单项对象');
  const body = pinItemMatch[0];
  assert(/type:\s*['"]checkbox['"]/.test(body), '窗口置顶菜单项 type 必须为 checkbox');
  assert(/checked:\s*pinned/.test(body), '窗口置顶 checked 必须为 pinned（单一状态源）');
  assert(/pinned\s*=\s*item\.checked/.test(body), '窗口置顶 click 中必须 pinned = item.checked');
});

// ---------- 开机自启 ----------
test('开机自启菜单项写 app.setLoginItemSettings', () => {
  const m = src.match(/label:\s*['"]开机自启['"][\s\S]{0,400}?\},?\s*\}/);
  assert(m, '未找到「开机自启」菜单项对象');
  const body = m[0];
  assert(/app\.setLoginItemSettings/.test(body), '开机自启 click 必须调 app.setLoginItemSettings');
  assert(/openAtLogin:\s*item\.checked/.test(body), '开机自启必须把 checkbox 状态写入 openAtLogin');
});

// ---------- 单实例锁 ----------
test('app.requestSingleInstanceLock 单实例保护', () => {
  assert(/requestSingleInstanceLock/.test(src), '缺少单实例锁');
  assert(/second-instance/.test(src), '缺少 second-instance 处理');
});

// ---------- applyLayer 切换顺序（SK-3）----------
test('浮窗置顶模式：先 detachFromDesktop，再 setAlwaysOnTop(true)', () => {
  // 抓 pinned===true 分支
  const m = src.match(/if\s*\(pinned\)\s*\{[\s\S]*?\}/);
  assert(m, '未找到 pinned=true 分支');
  const body = m[0];
  const detachPos = body.search(/detachFromDesktop\(handle\)/);
  const setPos = body.search(/setAlwaysOnTop\(true/);
  assert(detachPos >= 0, 'pinned=true 分支必须 detachFromDesktop');
  assert(setPos >= 0, 'pinned=true 分支必须 setAlwaysOnTop(true)');
  assert(detachPos < setPos, '必须先 detach 后 setAlwaysOnTop（SK-3）');
});

test('桌面挂件模式：先 setAlwaysOnTop(false)，再 attachToDesktop', () => {
  const m = src.match(/else\s*\{[\s\S]*?(?=function|const togglePin|ipcMain\.handle)/);
  // 用更宽松的策略：抓 else { ... } 到下一个 function / ipcMain
  // 这里直接简单判断两个调用先后
  const aopFalsePos = src.search(/setAlwaysOnTop\(false\)/);
  const attachPos = src.search(/attachToDesktop\(handle\)/);
  assert(aopFalsePos >= 0, '缺少 setAlwaysOnTop(false)');
  assert(attachPos >= 0, '缺少 attachToDesktop(handle)');
  assert(aopFalsePos < attachPos, '必须先 setAlwaysOnTop(false) 再 attachToDesktop（SK-3）');
});

// ---------- pin:toggle 必须走 applyLayer ----------
test('ipcMain.handle("pin:toggle") 必须经过 applyLayer', () => {
  const m = src.match(/ipcMain\.handle\(['"]pin:toggle['"][\s\S]*?\}\s*\);/);
  assert(m, '未找到 pin:toggle handler');
  assert(/applyLayer/.test(m[0]), 'pin:toggle handler 必须调用 applyLayer');
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