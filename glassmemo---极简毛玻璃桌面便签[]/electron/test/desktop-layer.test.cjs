// desktop-layer.cjs 单元测试
// 目标：
//   1) 不依赖真实 Progman / WorkerW，纯 Node 进程跑断言
//   2) 覆盖 validateHwndBuffer 的合法/非法 Buffer 分支
//   3) 覆盖 attachToDesktop / detachFromDesktop 的返回结构（{ok, mode, reason} 字段）
//   4) 模式枚举必须严格匹配 src/types.ts 的 LayerMode
//
// 用法：node electron/test/desktop-layer.test.cjs
'use strict';

const path = require('path');
const assert = require('assert');

const dl = require(path.join(__dirname, '..', 'desktop-layer.cjs'));
const { attachToDesktop, detachFromDesktop, findDesktopWorkerW } = dl;

// 与 src/types.ts 严格对齐的枚举
const LAYER_MODES = ['desktop-widget', 'pinned-floating', 'normal-fallback'];

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

console.log('\n=== desktop-layer.cjs 单元测试 ===\n');

// ---------- validateHwndBuffer 通过 attachToDesktop 间接断言 ----------
// 该函数是私有；但可由 attachToDesktop(null) / attachToDesktop(非 Buffer) / attachToBuffer(超界 Buffer) 触发

test('attachToDesktop(null) → {ok:false, mode:"normal-fallback", reason 含 InvalidHwndBuffer}', () => {
  const r = attachToDesktop(null);
  assert.strictEqual(r.ok, false, 'ok 必须为 false');
  assert.strictEqual(r.mode, 'normal-fallback', 'mode 必须为 normal-fallback');
  assert.ok(typeof r.reason === 'string' && r.reason.length > 0, 'reason 必须是非空字符串');
  assert.ok(/InvalidHwndBuffer/.test(r.reason), `reason 应包含 InvalidHwndBuffer，实际: ${r.reason}`);
});

test('attachToDesktop(undefined) → 同上', () => {
  const r = attachToDesktop(undefined);
  assert.strictEqual(r.ok, false);
  assert.strictEqual(r.mode, 'normal-fallback');
  assert.ok(/InvalidHwndBuffer/.test(r.reason), `reason 应包含 InvalidHwndBuffer，实际: ${r.reason}`);
});

test('attachToDesktop(非 Buffer，如字符串) → normal-fallback + InvalidHwndBuffer', () => {
  const r = attachToDesktop('not-a-buffer');
  assert.strictEqual(r.ok, false);
  assert.strictEqual(r.mode, 'normal-fallback');
  assert.ok(/InvalidHwndBuffer/.test(r.reason));
});

test('attachToDesktop(Buffer.length=0) → InvalidHwndBuffer: length 0 not in [4,8]', () => {
  const r = attachToDesktop(Buffer.alloc(0));
  assert.strictEqual(r.ok, false);
  assert.strictEqual(r.mode, 'normal-fallback');
  assert.ok(/length 0 not in/.test(r.reason), `reason 应包含 length 0 not in，实际: ${r.reason}`);
});

test('attachToDesktop(Buffer.length=2) → InvalidHwndBuffer: length 2 not in [4,8]', () => {
  const r = attachToDesktop(Buffer.alloc(2));
  assert.strictEqual(r.ok, false);
  assert.strictEqual(r.mode, 'normal-fallback');
  assert.ok(/length 2 not in/.test(r.reason));
});

test('attachToDesktop(Buffer.length=16) → InvalidHwndBuffer: length 16 not in [4,8]', () => {
  const r = attachToDesktop(Buffer.alloc(16));
  assert.strictEqual(r.ok, false);
  assert.strictEqual(r.mode, 'normal-fallback');
  assert.ok(/length 16 not in/.test(r.reason));
});

// ---------- 合法 Buffer 长度（4 / 8），走真实 koffi 路径 ----------
// 在没有 Progman 的测试环境（CI / 沙箱）下，FindWindowW 会返回 null → 触发 normal-fallback

test('attachToDesktop(Buffer.length=4, 模拟 hwnd) → 结构合法（可能 ok 或 fallback）', () => {
  const r = attachToDesktop(Buffer.from([0x00, 0x00, 0x00, 0x00]));
  assert.strictEqual(typeof r.ok, 'boolean');
  assert.ok(LAYER_MODES.includes(r.mode), `mode 必须是 LayerMode 之一，实际: ${r.mode}`);
  if (r.ok) {
    assert.strictEqual(r.mode, 'desktop-widget', '成功路径 mode 必须为 desktop-widget');
  } else {
    assert.strictEqual(r.mode, 'normal-fallback', '失败路径 mode 必须为 normal-fallback');
    assert.ok(typeof r.reason === 'string', '失败时必须有 reason');
  }
});

test('attachToDesktop(Buffer.length=8, 模拟 64 位 hwnd) → 结构合法', () => {
  const r = attachToDesktop(Buffer.from([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]));
  assert.strictEqual(typeof r.ok, 'boolean');
  assert.ok(LAYER_MODES.includes(r.mode));
});

// ---------- detachFromDesktop 行为 ----------

test('detachFromDesktop(null) → {ok:true, mode:"pinned-floating"}（不调 SetParent，短路成功）', () => {
  const r = detachFromDesktop(null);
  assert.strictEqual(r.ok, true);
  assert.strictEqual(r.mode, 'pinned-floating');
});

test('detachFromDesktop(undefined) → ok:true, mode:"pinned-floating"', () => {
  const r = detachFromDesktop(undefined);
  assert.strictEqual(r.ok, true);
  assert.strictEqual(r.mode, 'pinned-floating');
});

test('detachFromDesktop(非 Buffer) → 走 validateHwndBuffer 抛错 → normal-fallback + reason', () => {
  const r = detachFromDesktop('not-buffer');
  assert.strictEqual(r.ok, false);
  assert.strictEqual(r.mode, 'normal-fallback');
  assert.ok(/InvalidHwndBuffer/.test(r.reason));
});

test('detachFromDesktop(Buffer.length=0) → InvalidHwndBuffer + normal-fallback', () => {
  const r = detachFromDesktop(Buffer.alloc(0));
  assert.strictEqual(r.ok, false);
  assert.strictEqual(r.mode, 'normal-fallback');
  assert.ok(/length 0 not in/.test(r.reason));
});

test('detachFromDesktop(Buffer.length=4, hwnd=0) → 走 koffi SetParent(null)，结构合法', () => {
  const r = detachFromDesktop(Buffer.from([0x00, 0x00, 0x00, 0x00]));
  // 这里 SetParent(hwnd, null) 在沙箱中通常会失败（无真实窗口），结构必须正常返回
  assert.strictEqual(typeof r.ok, 'boolean');
  assert.ok(LAYER_MODES.includes(r.mode));
  if (!r.ok) {
    assert.strictEqual(r.mode, 'normal-fallback');
    assert.ok(typeof r.reason === 'string');
  }
});

// ---------- 模块导出契约 ----------

test('模块导出必须含 attachToDesktop / detachFromDesktop / findDesktopWorkerW', () => {
  assert.strictEqual(typeof dl.attachToDesktop, 'function');
  assert.strictEqual(typeof dl.detachFromDesktop, 'function');
  assert.strictEqual(typeof dl.findDesktopWorkerW, 'function');
});

test('findDesktopWorkerW() 返回 HWND（bigint/object/number/null 之一）', () => {
  const w = findDesktopWorkerW();
  // 在沙箱中通常为 null（无 Progman），但在 Windows 下是非空指针
  assert.ok(w === null || typeof w === 'bigint' || typeof w === 'number' || typeof w === 'object');
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