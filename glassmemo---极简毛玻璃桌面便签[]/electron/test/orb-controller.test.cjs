// OrbController 状态机测试
// 目标：
//   1) 不依赖真实 Electron 主进程 / 浏览器窗口 / 文件系统副作用
//   2) mock BrowserWindow + screen，覆盖 OrbController.toggle / shrink / expand / restoreOnStartup / DragHandler
//   3) 边界：isAnimating 防快速点击、win.destroyed 异常路径、BoundsRepository 文件 IO
//
// 用法：node electron/test/orb-controller.test.cjs
'use strict';

const path = require('path');
const fs = require('fs');
const os = require('os');
const assert = require('assert');

// ---- stub Electron 模块（与 _diag-orb.cjs 思路一致）----
const Module = require('module');
const originalResolve = Module._resolveFilename;
Module._resolveFilename = function (request, parent, ...rest) {
  if (request === 'electron') return require.resolve(path.join(__dirname, '..', '_electron-stub.cjs'));
  return originalResolve.call(this, request, parent, ...rest);
};

const {
  OrbController,
  BoundsRepository,
  DragHandler,
  SnappingPolicy,
  ORB_SIZE,
  NOTE_MIN_SIZE,
  DEFAULT_NOTE_BOUNDS,
} = require(path.join(__dirname, '..', 'orb-controller.cjs'));

// ---- 测试用 mock BrowserWindow ----
function createMockWin(initialBounds = { x: 100, y: 100, width: 380, height: 560 }) {
  let destroyed = false;
  let bounds = { ...initialBounds };
  const calls = {
    setMinimumSize: [],
    setResizable: [],
    setBounds: [],
    send: [],
  };
  const win = {
    isDestroyed: () => destroyed,
    destroy: () => { destroyed = true; },
    getBounds: () => ({ ...bounds }),
    setBounds: (b) => {
      if (destroyed) throw new Error('win destroyed');
      calls.setBounds.push({ ...b });
      bounds = { ...b };
    },
    setMinimumSize: (w, h) => { calls.setMinimumSize.push({ w, h }); },
    setResizable: (r) => { calls.setResizable.push(r); },
    webContents: {
      send: (channel, payload) => { calls.send.push({ channel, payload }); },
    },
    __destroy: () => { destroyed = true; },
    __calls: calls,
  };
  return win;
}

// ---- 测试全局状态 ----
let passed = 0;
let failed = 0;
const failures = [];

function test(name, fn) {
  return Promise.resolve()
    .then(() => fn())
    .then(() => {
      passed++;
      console.log(`  \u2713 ${name}`);
    })
    .catch((e) => {
      failed++;
      failures.push({ name, error: e });
      console.log(`  \u2717 ${name}`);
      console.log(`    ${e.message}`);
    });
}

function assertEq(a, b, msg) {
  if (JSON.stringify(a) !== JSON.stringify(b)) {
    throw new Error(`${msg || 'assertEq failed'} — expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`);
  }
}

const tmpUserData = fs.mkdtempSync(path.join(os.tmpdir(), 'glassmemo-qa-orb-'));

async function run() {
  // ============================================================
  // 套件 1：SnappingPolicy 纯函数边界
  // ============================================================
  console.log('\n=== 套件 1 — SnappingPolicy 边界 ===\n');

  const WA = { x: 0, y: 0, width: 1920, height: 1080 };

  await test('clampToWorkArea: bounds.width 缺失 → 兜底 60', () => {
    const r = SnappingPolicy.clampToWorkArea({ x: 0, y: 0 }, WA);
    assert.strictEqual(r.width, ORB_SIZE);
    assert.strictEqual(r.height, ORB_SIZE);
  });

  await test('apply: workArea 宽度过小 → 不越界', () => {
    const tiny = { x: 0, y: 0, width: 80, height: 80 };
    const r = SnappingPolicy.apply({ x: 5, y: 5, width: 60, height: 60 }, tiny);
    assert.ok(r.x >= tiny.x && r.x + r.width <= tiny.x + tiny.width, `clamp 异常: ${JSON.stringify(r)}`);
  });

  await test('apply: 正中央 → x 不变', () => {
    const r = SnappingPolicy.apply({ x: 930, y: 500, width: 60, height: 60 }, WA);
    assert.strictEqual(r.x, 930);
  });

  await test('apply: distLeft=0 边界 → 贴左 x=8', () => {
    const r = SnappingPolicy.apply({ x: 8, y: 500, width: 60, height: 60 }, WA);
    assert.strictEqual(r.x, 8);
  });

  // ============================================================
  // 套件 2：BoundsRepository 文件 IO
  // ============================================================
  console.log('\n=== 套件 2 — BoundsRepository 文件 IO ===\n');

  await test('saveNote + loadNote → 数据一致', async () => {
    const repo = new BoundsRepository(tmpUserData);
    const b = { x: 100, y: 200, width: 380, height: 560 };
    await repo.saveNote(b);
    const got = await repo.loadNote();
    assertEq(got, b, 'loadNote 不等于保存内容');
  });

  await test('saveOrb + loadOrb → 数据一致', async () => {
    const repo = new BoundsRepository(tmpUserData);
    const b = { x: 1500, y: 50, width: 60, height: 60 };
    await repo.saveOrb(b);
    const got = await repo.loadOrb();
    assertEq(got, b, 'loadOrb 不等于保存内容');
  });

  await test('saveLastView + loadLastView → 字符串往返', async () => {
    const repo = new BoundsRepository(tmpUserData);
    await repo.saveLastView('orb');
    const v = await repo.loadLastView();
    assert.strictEqual(v, 'orb');
    await repo.saveLastView('note');
    const v2 = await repo.loadLastView();
    assert.strictEqual(v2, 'note');
  });

  await test('loadNote: 文件不存在 → null', async () => {
    const sub = fs.mkdtempSync(path.join(os.tmpdir(), 'glassmemo-qa-orb-'));
    const repo = new BoundsRepository(path.join(sub, 'empty-subdir'));
    const r = await repo.loadNote();
    assert.strictEqual(r, null);
  });

  await test('loadLastView: 文件不存在 → null', async () => {
    const sub = fs.mkdtempSync(path.join(os.tmpdir(), 'glassmemo-qa-orb-'));
    const repo = new BoundsRepository(path.join(sub, 'empty-subdir2'));
    const r = await repo.loadLastView();
    assert.strictEqual(r, null);
  });

  await test('loadNote: JSON 损坏 → null', async () => {
    const sub = fs.mkdtempSync(path.join(os.tmpdir(), 'glassmemo-qa-orb-'));
    fs.writeFileSync(path.join(sub, 'note-bounds.json'), '{not json');
    const repo = new BoundsRepository(sub);
    const r = await repo.loadNote();
    assert.strictEqual(r, null);
  });

  await test('loadLastView: 非法 lastView 值 → null', async () => {
    const sub = fs.mkdtempSync(path.join(os.tmpdir(), 'glassmemo-qa-orb-'));
    fs.writeFileSync(path.join(sub, 'view-state.json'), JSON.stringify({ lastView: 'invalid' }));
    const repo = new BoundsRepository(sub);
    const r = await repo.loadLastView();
    assert.strictEqual(r, null);
  });

  await test('loadOrb: 文件不存在 → 兜底居中 60×60', async () => {
    const sub = fs.mkdtempSync(path.join(os.tmpdir(), 'glassmemo-qa-orb-'));
    const repo = new BoundsRepository(sub);
    const r = await repo.loadOrb();
    assert.strictEqual(r.width, 60);
    assert.strictEqual(r.height, 60);
    assert.strictEqual(r.x, 930);
    assert.strictEqual(r.y, 510);
  });

  // ============================================================
  // 套件 3：OrbController 状态机
  // ============================================================
  console.log('\n=== 套件 3 — OrbController 状态机 ===\n');

  await test('shrink: note → orb，写 note-bounds / view-state，setBounds 推 orb 尺寸', async () => {
    const sub = fs.mkdtempSync(path.join(os.tmpdir(), 'glassmemo-qa-orb-'));
    const repo = new BoundsRepository(sub);
    const win = createMockWin({ x: 200, y: 200, width: 380, height: 560 });
    const ctrl = new OrbController(win, repo);

    const r = await ctrl.shrink();
    assert.strictEqual(r.view, 'orb');
    assert.strictEqual(r.isAnimating, true);
    assert.strictEqual(ctrl.currentView, 'orb');
    assert.strictEqual(ctrl.isAnimating, true);

    const lastMin = win.__calls.setMinimumSize[win.__calls.setMinimumSize.length - 1];
    assertEq(lastMin, { w: ORB_SIZE, h: ORB_SIZE }, 'minSize 应为 60×60');
    assert.strictEqual(win.__calls.setResizable[win.__calls.setResizable.length - 1], false);

    const lastBounds = win.__calls.setBounds[win.__calls.setBounds.length - 1];
    assert.strictEqual(lastBounds.width, ORB_SIZE);
    assert.strictEqual(lastBounds.height, ORB_SIZE);

    const emitted = win.__calls.send.find((s) => s.channel === 'view:change');
    assert.ok(emitted, '应发出 view:change');
    assert.strictEqual(emitted.payload.from, 'note');
    assert.strictEqual(emitted.payload.to, 'orb');
    assert.strictEqual(emitted.payload.isAnimating, true);

    const savedNote = await repo.loadNote();
    assertEq(savedNote, { x: 200, y: 200, width: 380, height: 560 }, 'note-bounds 应保存');
    const lastView = await repo.loadLastView();
    assert.strictEqual(lastView, 'orb');
  });

  await test('expand: orb → note，读回 note-bounds，写 view-state=note', async () => {
    const sub = fs.mkdtempSync(path.join(os.tmpdir(), 'glassmemo-qa-orb-'));
    const repo = new BoundsRepository(sub);
    await repo.saveNote({ x: 200, y: 200, width: 380, height: 560 });
    await repo.saveLastView('orb');
    const win = createMockWin({ x: 930, y: 510, width: 60, height: 60 });
    const ctrl = new OrbController(win, repo);
    ctrl.currentView = 'orb';

    const r = await ctrl.expand();
    assert.strictEqual(r.view, 'note');
    assert.strictEqual(ctrl.currentView, 'note');

    const lastMin = win.__calls.setMinimumSize[win.__calls.setMinimumSize.length - 1];
    // mock 记录形状为 {w, h}
    assertEq(lastMin, { w: NOTE_MIN_SIZE.width, h: NOTE_MIN_SIZE.height }, 'minSize 应恢复为 note');
    assert.strictEqual(win.__calls.setResizable[win.__calls.setResizable.length - 1], true);

    const lastBounds = win.__calls.setBounds[win.__calls.setBounds.length - 1];
    assertEq(lastBounds, { x: 200, y: 200, width: 380, height: 560 }, 'setBounds 应=note 存档');

    const emitted = win.__calls.send.find((s) => s.channel === 'view:change');
    assert.ok(emitted);
    assert.strictEqual(emitted.payload.to, 'note');

    const lastView = await repo.loadLastView();
    assert.strictEqual(lastView, 'note');
  });

  await test('expand: note-bounds 丢失 → 用 DEFAULT_NOTE_BOUNDS 兜底', async () => {
    const sub = fs.mkdtempSync(path.join(os.tmpdir(), 'glassmemo-qa-orb-'));
    const repo = new BoundsRepository(sub);
    const win = createMockWin({ x: 930, y: 510, width: 60, height: 60 });
    const ctrl = new OrbController(win, repo);
    ctrl.currentView = 'orb';

    const r = await ctrl.expand();
    assert.strictEqual(r.view, 'note');
    const lastBounds = win.__calls.setBounds[win.__calls.setBounds.length - 1];
    assert.strictEqual(lastBounds.width, DEFAULT_NOTE_BOUNDS.width);
    assert.strictEqual(lastBounds.height, DEFAULT_NOTE_BOUNDS.height);
  });

  await test('toggle: note 起始 → shrink', async () => {
    const sub = fs.mkdtempSync(path.join(os.tmpdir(), 'glassmemo-qa-orb-'));
    const repo = new BoundsRepository(sub);
    const win = createMockWin({ x: 200, y: 200, width: 380, height: 560 });
    const ctrl = new OrbController(win, repo);
    const r = await ctrl.toggle('button');
    assert.strictEqual(r.view, 'orb');
  });

  await test('toggle: isAnimating 期间再次触发 → 返回当前态（AC-18 防快速点击）', async () => {
    const sub = fs.mkdtempSync(path.join(os.tmpdir(), 'glassmemo-qa-orb-'));
    const repo = new BoundsRepository(sub);
    const win = createMockWin({ x: 200, y: 200, width: 380, height: 560 });
    const ctrl = new OrbController(win, repo);
    await ctrl.toggle('button');
    const r = await ctrl.toggle('orb-click');
    assert.strictEqual(r.view, 'orb', '防快速点击应保持当前态');
  });

  await test('toggle: win 已 destroy → 不抛错', async () => {
    const sub = fs.mkdtempSync(path.join(os.tmpdir(), 'glassmemo-qa-orb-'));
    const repo = new BoundsRepository(sub);
    const win = createMockWin({ x: 200, y: 200, width: 380, height: 560 });
    const ctrl = new OrbController(win, repo);

    // 1. 正常路径先 shrink，验证 view 状态
    const r1 = await ctrl.toggle();
    assert.strictEqual(r1.view, 'orb');

    // 2. destroy 后调 toggle，不抛错即可
    win.__destroy();
    const r2 = await ctrl.toggle();
    // destroy 后 toggle 短路返回 currentView（即 'orb'）
    assert.strictEqual(r2.view, 'orb');
    assert.ok(r2.bounds !== undefined, 'bounds 字段应存在');
  });

  await test('notifyAnimationDone: 清 isAnimating 锁', async () => {
    const sub = fs.mkdtempSync(path.join(os.tmpdir(), 'glassmemo-qa-orb-'));
    const repo = new BoundsRepository(sub);
    const win = createMockWin();
    const ctrl = new OrbController(win, repo);
    ctrl.isAnimating = true;
    ctrl.notifyAnimationDone();
    assert.strictEqual(ctrl.isAnimating, false);
  });

  await test('restoreOnStartup: lastView=orb → currentView=orb, isAnimating=false', async () => {
    const sub = fs.mkdtempSync(path.join(os.tmpdir(), 'glassmemo-qa-orb-'));
    const repo = new BoundsRepository(sub);
    await repo.saveLastView('orb');
    await repo.saveOrb({ x: 100, y: 50, width: 60, height: 60 });
    const win = createMockWin();
    const ctrl = new OrbController(win, repo);

    const r = await ctrl.restoreOnStartup();
    assert.strictEqual(r.view, 'orb');
    assert.strictEqual(ctrl.isAnimating, false);
    const emitted = win.__calls.send.find((s) => s.channel === 'view:change');
    assert.ok(emitted);
    assert.strictEqual(emitted.payload.from, 'note');
    assert.strictEqual(emitted.payload.to, 'orb');
    assert.strictEqual(emitted.payload.isAnimating, false);
    assert.strictEqual(win.__calls.setMinimumSize[win.__calls.setMinimumSize.length - 1].w, ORB_SIZE);
    assert.strictEqual(win.__calls.setResizable[win.__calls.setResizable.length - 1], false);
  });

  await test('restoreOnStartup: lastView=note → currentView=note, minSize=200×200, resizable=true', async () => {
    const sub = fs.mkdtempSync(path.join(os.tmpdir(), 'glassmemo-qa-orb-'));
    const repo = new BoundsRepository(sub);
    await repo.saveNote({ x: 100, y: 100, width: 380, height: 560 });
    const win = createMockWin();
    const ctrl = new OrbController(win, repo);

    const r = await ctrl.restoreOnStartup();
    assert.strictEqual(r.view, 'note');
    const emitted = win.__calls.send.find((s) => s.channel === 'view:change');
    assert.ok(emitted);
    assert.strictEqual(emitted.payload.from, 'note');
    assert.strictEqual(emitted.payload.to, 'note');
    assert.strictEqual(win.__calls.setMinimumSize[win.__calls.setMinimumSize.length - 1].w, NOTE_MIN_SIZE.width);
    assert.strictEqual(win.__calls.setResizable[win.__calls.setResizable.length - 1], true);
  });

  await test('restoreOnStartup: 首次启动（无任何文件） → 默认 note', async () => {
    const sub = fs.mkdtempSync(path.join(os.tmpdir(), 'glassmemo-qa-orb-'));
    const repo = new BoundsRepository(sub);
    const win = createMockWin();
    const ctrl = new OrbController(win, repo);
    const r = await ctrl.restoreOnStartup();
    assert.strictEqual(r.view, 'note');
  });

  // ============================================================
  // 套件 4：DragHandler
  // ============================================================
  console.log('\n=== 套件 4 — DragHandler ===\n');

  await test('onDrag(start): 记录 startBounds', () => {
    const win = createMockWin({ x: 100, y: 100, width: 60, height: 60 });
    const dh = new DragHandler();
    dh.onDrag({ phase: 'start' }, win, SnappingPolicy, null);
    assert.deepStrictEqual(dh.startBounds, { x: 100, y: 100, width: 60, height: 60 });
    assert.strictEqual(dh.isDragging, true);
  });

  await test('onDrag(move): dx/dy 累加推进，clamp 到 workArea', () => {
    const win = createMockWin({ x: 100, y: 100, width: 60, height: 60 });
    const dh = new DragHandler();
    dh.onDrag({ phase: 'start' }, win, SnappingPolicy, null);
    dh.onDrag({ dx: 50, dy: 50, phase: 'move' }, win, SnappingPolicy, null);
    const last = win.__calls.setBounds[win.__calls.setBounds.length - 1];
    assert.strictEqual(last.x, 150);
    assert.strictEqual(last.y, 150);
  });

  await test('onDrag(move): 越屏幕右侧 clamp', () => {
    const win = createMockWin({ x: 1800, y: 500, width: 60, height: 60 });
    const dh = new DragHandler();
    dh.onDrag({ phase: 'start' }, win, SnappingPolicy, null);
    dh.onDrag({ dx: 200, dy: 0, phase: 'move' }, win, SnappingPolicy, null);
    const last = win.__calls.setBounds[win.__calls.setBounds.length - 1];
    assert.strictEqual(last.x, 1860, `期望 x=1860，实际 ${last.x}`);
  });

  await test('onDrag(end): 贴边 → 写 orb-bounds.json', async () => {
    const sub = fs.mkdtempSync(path.join(os.tmpdir(), 'glassmemo-qa-orb-'));
    const repo = new BoundsRepository(sub);
    const win = createMockWin({ x: 12, y: 500, width: 60, height: 60 });
    const dh = new DragHandler();
    dh.onDrag({ phase: 'end' }, win, SnappingPolicy, repo);
    await new Promise((r) => setTimeout(r, 50));
    const saved = await repo.loadOrb();
    assert.strictEqual(saved.x, 8, `期望贴左 x=8，实际 ${saved.x}`);
    assert.strictEqual(dh.startBounds, null);
  });

  await test('onDrag(end): win.destroyed → 短路', () => {
    const win = createMockWin();
    win.__destroy();
    const dh = new DragHandler();
    dh.onDrag({ phase: 'end' }, win, SnappingPolicy, null);
  });

  await test('onDrag: 缺 phase → return 不抛错', () => {
    const win = createMockWin();
    const dh = new DragHandler();
    dh.onDrag({}, win, SnappingPolicy, null);
    dh.onDrag(null, win, SnappingPolicy, null);
  });

  // ============================================================
  // 套件 5：顺序合约
  // ============================================================
  console.log('\n=== 套件 5 — 顺序合约 ===\n');

  await test('shrink: setMinimumSize + setResizable + setBounds 都执行', async () => {
    const sub = fs.mkdtempSync(path.join(os.tmpdir(), 'glassmemo-qa-orb-'));
    const repo = new BoundsRepository(sub);
    const win = createMockWin({ x: 200, y: 200, width: 380, height: 560 });
    const ctrl = new OrbController(win, repo);
    await ctrl.shrink();
    assert.ok(win.__calls.setMinimumSize.length >= 1, 'shrink 必须调 setMinimumSize');
    assert.ok(win.__calls.setResizable.length >= 1, 'shrink 必须调 setResizable');
    assert.ok(win.__calls.setBounds.length >= 1, 'shrink 必须调 setBounds');
  });

  await test('expand: setBounds + view:change 都触发', async () => {
    const sub = fs.mkdtempSync(path.join(os.tmpdir(), 'glassmemo-qa-orb-'));
    const repo = new BoundsRepository(sub);
    await repo.saveNote({ x: 100, y: 100, width: 380, height: 560 });
    const win = createMockWin({ x: 930, y: 510, width: 60, height: 60 });
    const ctrl = new OrbController(win, repo);
    ctrl.currentView = 'orb';
    await ctrl.expand();
    assert.ok(win.__calls.setBounds.length >= 1, 'expand 必须调 setBounds');
    assert.ok(win.__calls.send.some((s) => s.channel === 'view:change'), 'expand 必须推送 view:change');
  });

  // ============================================================
  // 收尾
  // ============================================================
  console.log(`\n=== 结果: ${passed} passed, ${failed} failed ===\n`);
  if (failed > 0) {
    console.log('失败详情：');
    failures.forEach((f) => {
      console.log(`  - ${f.name}`);
      console.log(`    ${f.error.stack || f.error.message}`);
    });
    process.exitCode = 1;
  }
}

run()
  .catch((e) => {
    console.error('FATAL:', e);
    process.exitCode = 1;
  })
  .finally(() => {
    Module._resolveFilename = originalResolve;
    try { fs.rmSync(tmpUserData, { recursive: true, force: true }); } catch {}
  });
