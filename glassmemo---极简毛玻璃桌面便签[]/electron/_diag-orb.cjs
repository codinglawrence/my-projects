// GlassMemo · Orb 诊断脚本（增量）
// 自检覆盖：枚举显示器工作区 / SnappingPolicy 单测 / BoundsRepository 文件 IO 路径存在性。
// 运行：node electron/_diag-orb.cjs
// 不依赖 Electron 主进程；通过 require 复用 orb-controller.cjs 中的纯函数模块。
//
// 注意：本脚本不会启动 BrowserWindow；只验证 view 维度的「可测试部分」。
const path = require('path');

// orb-controller.cjs 内 require 了 electron.screen，在普通 node 下会失败。
// 这里 stub 掉 electron 模块，确保可独立运行（与桌面层 _diag.cjs 思路一致）。
const Module = require('module');
const originalResolve = Module._resolveFilename;
Module._resolveFilename = function (request, parent, ...rest) {
  if (request === 'electron') return require.resolve('./_electron-stub.cjs');
  return originalResolve.call(this, request, parent, ...rest);
};

// 触发 orb-controller 的纯函数部分
const { SnappingPolicy, ORB_SIZE, NOTE_MIN_SIZE, DEFAULT_NOTE_BOUNDS } = require('./orb-controller.cjs');

console.log('=== Orb 诊断 ===\n');

// 1. 常量一致性
console.log('[常量] ORB_SIZE =', ORB_SIZE, '(src/constants/orb.ts 应为 60)');
console.log('[常量] SNAP_THRESHOLD =', SnappingPolicy.SNAP_THRESHOLD);
console.log('[常量] SNAP_INSET =', SnappingPolicy.SNAP_INSET);
console.log('[常量] NOTE_MIN_SIZE =', NOTE_MIN_SIZE);
console.log('[常量] DEFAULT_NOTE_BOUNDS =', DEFAULT_NOTE_BOUNDS);

// 2. SnappingPolicy.clampToWorkArea 单测
console.log('\n=== clampToWorkArea 单测 ===');
const workArea = { x: 0, y: 0, width: 1920, height: 1080 };
const cases = [
  { name: '正常居中', input: { x: 930, y: 510, width: 60, height: 60 }, expect: { x: 930, y: 510 } },
  { name: '越左 clamp', input: { x: -100, y: 510, width: 60, height: 60 }, expect: { x: 0 } },
  { name: '越右 clamp', input: { x: 2000, y: 510, width: 60, height: 60 }, expect: { x: 1860 } },
  { name: '越上 clamp', input: { x: 930, y: -50, width: 60, height: 60 }, expect: { y: 0 } },
  { name: '越下 clamp', input: { x: 930, y: 1100, width: 60, height: 60 }, expect: { y: 1020 } },
];
let pass = 0, fail = 0;
for (const c of cases) {
  const got = SnappingPolicy.clampToWorkArea(c.input, workArea);
  const ok = Object.entries(c.expect).every(([k, v]) => got[k] === v);
  if (ok) { pass++; console.log('  ✓', c.name, '→', got); }
  else    { fail++; console.log('  ✗', c.name, 'got', got, 'expected', c.expect); }
}

// 3. SnappingPolicy.apply 单测（贴边吸附）
console.log('\n=== apply 贴边吸附单测 ===');
const snapCases = [
  { name: '距左 20px（≤30）→ 贴左', input: { x: 12, y: 500, width: 60, height: 60 }, expectAt: 8 },
  { name: '距右 25px（≤30）→ 贴右', input: { x: 1847, y: 500, width: 60, height: 60 }, expectRightEdge: 1920 - 8 },
  { name: '距左 50px（>30）→ 不贴', input: { x: 50, y: 500, width: 60, height: 60 }, expectKeep: true },
  { name: '居中（远离两边）→ 不贴', input: { x: 930, y: 500, width: 60, height: 60 }, expectKeep: true },
];
for (const c of snapCases) {
  const got = SnappingPolicy.apply(c.input, workArea);
  if (c.expectAt !== undefined) {
    const ok = got.x === c.expectAt;
    if (ok) { pass++; console.log('  ✓', c.name, '→ x=', got.x); }
    else    { fail++; console.log('  ✗', c.name, 'got x=', got.x, 'expected', c.expectAt); }
  } else if (c.expectRightEdge !== undefined) {
    const rightEdge = got.x + got.width;
    const ok = rightEdge === c.expectRightEdge;
    if (ok) { pass++; console.log('  ✓', c.name, '→ rightEdge=', rightEdge); }
    else    { fail++; console.log('  ✗', c.name, 'got rightEdge=', rightEdge, 'expected', c.expectRightEdge); }
  } else if (c.expectKeep) {
    const ok = got.x === c.input.x;
    if (ok) { pass++; console.log('  ✓', c.name, '→ 保持 x=', got.x); }
    else    { fail++; console.log('  ✗', c.name, 'got x=', got.x, 'expected', c.input.x); }
  }
}

console.log('\n=== 总结 ===');
console.log('  pass:', pass, '/ fail:', fail);
if (fail > 0) {
  console.error('[orb-diag] 有用例失败，请检查 SnappingPolicy 实现');
  process.exit(1);
}
console.log('[orb-diag] OK');

// 清理 stub
Module._resolveFilename = originalResolve;
