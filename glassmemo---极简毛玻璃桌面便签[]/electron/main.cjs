// GlassMemo Electron 主进程
// 无边框透明窗口 = 桌面毛玻璃便签（桌面插件 / Desktop Widget）
// 默认嵌入 Windows 桌面层（Progman → WorkerW）：与壁纸/图标同层，打开其他程序会被盖住；
// 托盘「窗口置顶」可切换为浮在最前。系统托盘常驻，点 X 隐藏而非退出。
//
// View 维度增量（v1.1.0，对应 docs/system_design-orb.md）：
//   - OrbController 管理 note ↔ orb 形态切换
//   - BoundsRepository 持久化 note-bounds / orb-bounds / view-state 三份 JSON
//   - DragHandler 处理悬浮球拖动（主进程侧 win.setBounds 跟手 + 贴边吸附）
// pin 维度（applyLayer）与 view 维度（OrbController）正交，互不重写。
const { app, BrowserWindow, ipcMain, screen, Tray, Menu, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');
const { attachToDesktop, detachFromDesktop, setWindowShape } = require('./desktop-layer.cjs');
const { OrbController, BoundsRepository } = require('./orb-controller.cjs');

let win = null;
let tray = null;
let pinned = false; // 默认桌面挂件模式（嵌入桌面层，不置顶）；true = 浮于其他窗口之上
let lastMode = 'desktop-widget'; // 单一权威 mode：与 SK-5 「单一状态源」对齐
let isQuitting = false; // 区分「隐藏到托盘」与「真正退出」

// View 维度（v1.1.0 新增）
let orbController = null; // 在 createWindow / ready-to-show 中初始化

/**
 * 同步当前状态到渲染进程（StickyNote 用 onPinChange 订阅 → UI 高亮 / 置顶按钮）
 * 与 sequence-diagram 场景 1 末尾 / 场景 2 末尾一致。
 */
function broadcastPinState() {
  if (win && !win.isDestroyed()) {
    win.webContents.send('pin:change', { pinned, mode: lastMode });
  }
}

function refreshTrayTooltip() {
  if (!tray) return;
  const viewSuffix = orbController && orbController.currentView === 'orb' ? ' · 悬浮球' : '';
  if (lastMode === 'pinned-floating') {
    tray.setToolTip('GlassMemo · 浮窗置顶' + viewSuffix);
  } else if (lastMode === 'normal-fallback') {
    tray.setToolTip('GlassMemo · 桌面挂件不可用' + viewSuffix);
  } else {
    tray.setToolTip('GlassMemo · 桌面挂件' + viewSuffix);
  }
}

const BOUNDS_FILE = () => path.join(app.getPath('userData'), 'window-bounds.json');

function loadSavedBounds() {
  try {
    const raw = fs.readFileSync(BOUNDS_FILE(), 'utf8');
    const b = JSON.parse(raw);
    if (
      typeof b.x === 'number' && typeof b.y === 'number' &&
      typeof b.width === 'number' && typeof b.height === 'number'
    ) {
      return b;
    }
  } catch {}
  return null;
}

function saveBounds() {
  if (!win) return;
  try {
    const b = win.getBounds();
    // 保证窗口不出屏幕（显示器切换后坐标可能失效）
    const displays = screen.getAllDisplays();
    const visible = displays.some((d) => {
      const a = d.workArea;
      return b.x >= a.x - 40 && b.x < a.x + a.width && b.y >= a.y - 40 && b.y < a.y + a.height;
    });
    if (!visible) return;
    fs.writeFileSync(BOUNDS_FILE(), JSON.stringify(b));
  } catch {}
}

function toggleWindow() {
  if (!win) return;
  if (win.isVisible()) {
    win.hide();
  } else {
    win.show();
    win.focus();
  }
}

// 应用窗口层级：
//  pinned=false → 嵌入桌面层（挂件，被其他窗口盖住）
//  pinned=true  → 脱离桌面层并置顶（浮在所有窗口之上）
// 任何 Win32 调用失败都降级为「普通可拖拽窗口」，console.error 留痕，不退出进程（AC-9/10）。
function applyLayer() {
  if (!win) return { ok: false, mode: 'normal-fallback', reason: 'window not ready' };
  const handle = win.getNativeWindowHandle();
  let result;

  if (pinned) {
    // 浮窗置顶模式：先脱离桌面层，再 setAlwaysOnTop（SK-3 顺序）
    const r = detachFromDesktop(handle);
    try {
      win.setAlwaysOnTop(true, 'screen-saver');
      win.show();
      win.focus();
    } catch (e) {
      console.error('[desktop-layer] setAlwaysOnTop 失败:', (e && e.message) || e);
    }
    result = r.ok
      ? { ok: true, mode: 'pinned-floating' }
      : { ok: false, mode: 'normal-fallback', reason: r.reason };
  } else {
    // 桌面挂件模式：先 close alwaysOnTop，再尝试 attach
    try {
      win.setAlwaysOnTop(false);
    } catch (e) {
      console.error('[desktop-layer] setAlwaysOnTop(false) 失败:', (e && e.message) || e);
    }
    const r = attachToDesktop(handle);
    if (r.ok) {
      result = { ok: true, mode: 'desktop-widget' };
    } else {
      console.error('[desktop-layer] 嵌入失败，降级为普通窗口：', r.reason);
      // 兜底：确保没有任何残留 SetParent 状态（SK-2）
      try { detachFromDesktop(handle); } catch {}
      result = { ok: false, mode: 'normal-fallback', reason: r.reason };
    }
  }

  lastMode = result.mode;
  refreshTrayTooltip();
  broadcastPinState();
  return result;
}

// 托盘菜单：随置顶 / 开机自启状态动态重建，保证 checkbox 同步
// v1.1.0 增量：新增「折叠为悬浮球 / 展开为便签」入口（等价于渲染层 IPC view:toggle('tray')）
function buildTrayMenu() {
  const inOrb = orbController && orbController.currentView === 'orb';
  return Menu.buildFromTemplate([
    { label: '显示 / 隐藏便签', click: () => toggleWindow() },
    {
      label: inOrb ? '展开为便签' : '折叠为悬浮球',
      click: async () => {
        if (!orbController) return;
        await orbController.toggle('tray');
        // 切换后同步托盘菜单（label 会改变）
        if (tray) tray.setContextMenu(buildTrayMenu());
      },
    },
    { type: 'separator' },
    {
      label: '窗口置顶',
      type: 'checkbox',
      checked: pinned,
      click: (item) => {
        pinned = item.checked;
        applyLayer();
        tray.setContextMenu(buildTrayMenu());
      },
    },
    {
      label: '开机自启',
      type: 'checkbox',
      checked: app.getLoginItemSettings().openAtLogin,
      click: (item) => {
        app.setLoginItemSettings({ openAtLogin: item.checked });
        tray.setContextMenu(buildTrayMenu());
      },
    },
    { type: 'separator' },
    { label: '退出', click: () => { isQuitting = true; app.quit(); } },
  ]);
}

function createTray() {
  const trayIcon = nativeImage.createFromPath(path.join(__dirname, 'tray.png'));
  tray = new Tray(trayIcon);
  refreshTrayTooltip();
  tray.setContextMenu(buildTrayMenu());
  // 单击托盘图标切换显示/隐藏
  tray.on('click', () => toggleWindow());
}

function createWindow() {
  const saved = loadSavedBounds();

  win = new BrowserWindow({
    width: 380,
    height: 560,
    x: saved ? saved.x : undefined,
    y: saved ? saved.y : undefined,
    frame: false,
    transparent: true,
    resizable: false,
    alwaysOnTop: false, // 默认桌面挂件，不置顶；层级由 applyLayer 在就绪后设置
    skipTaskbar: false,
    show: false,
    backgroundColor: '#00000000',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (app.isPackaged) {
    win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  } else {
    win.loadURL('http://localhost:3000');
  }

  // v1.1.0：初始化 OrbController（view 维度控制器）
  // 注意：必须在 ready-to-show 之前 new，因为 IPC handler 启动恢复时会用到 win。
  // repo 用 app.getPath('userData') 作为 userData 目录基址。
  // v1.1.1: 注入 attach/detach，让 OrbController 在 shrink/expand 时能临时脱离桌面层
  // 再 setBounds，避免 Electron / Windows 在 SetParent 到 WorkerW 后 setBounds 失效。
  const repo = new BoundsRepository(app.getPath('userData'));
  orbController = new OrbController(win, repo, {
    attachToDesktop,
    detachFromDesktop,
    // v1.1.1: 传入查询当前置顶状态的闭包（读 main.cjs 的 pinned 变量）。
    // OrbController 据此判断是否桌面挂件模式：pinned=false → 需要 detach/attach；pinned=true → 直接 setBounds。
    getPinned: () => pinned,
    // v1.1.1: 注入 setWindowShape，shrink/expand 时把窗口裁成正圆/矩形
    setWindowShape,
  });

  // 注册 view 维度 IPC（T01 占位 → T02 真实接线）
  ipcMain.handle('view:toggle', async (_evt, source) => {
    if (!orbController) return { view: 'note', bounds: null, isAnimating: false };
    return orbController.toggle(source);
  });
  ipcMain.handle('view:get', () => {
    if (!orbController) return { view: 'note', bounds: null, isAnimating: false };
    return orbController.getState();
  });
  // T04：view:drag IPC 接到 DragHandler.onDrag
  // v1.1.2: 改用 ipcMain.on（配合 preload 的 send 单向投递）。
  // handle 需要构造返回值并回传，高频拖动下往返开销会放大延迟；on 直接处理不回传，更跟手。
  ipcMain.on('view:drag', (_evt, payload) => {
    if (!orbController || !win || win.isDestroyed()) return;
    const { SnappingPolicy } = require('./orb-controller.cjs');
    // dragHandler / snap 由 OrbController 内部持有；调用其 onDrag 即可
    orbController.dragHandler.onDrag(payload, win, SnappingPolicy, orbController.repo);
  });
  // 渲染层动画结束回调：清除动画锁（防快速点击拦截持续到下一帧）
  ipcMain.on('view:anim-done', () => {
    if (orbController) orbController.notifyAnimationDone();
  });

  win.once('ready-to-show', async () => {
    win.show();
    // T05：启动恢复路径。必须先做 view 恢复（设置 minSize/resizable/bounds），
    // 再 applyLayer（桌面层嵌入与 view 正交，互不干扰）。
    if (orbController) {
      await orbController.restoreOnStartup();
      // view 恢复后刷新托盘（tooltip label 会根据 orb/note 切换）
      refreshTrayTooltip();
      if (tray) tray.setContextMenu(buildTrayMenu());
    }
    applyLayer(); // 嵌入桌面层（挂件模式）或置顶（pinned=true 时）
  });
  win.on('moved', saveBounds);
  win.on('resized', saveBounds);

  // 点 X 不退出，隐藏到托盘常驻（仅真正退出时才关闭）
  win.on('close', (e) => {
    if (!isQuitting) {
      e.preventDefault();
      win.hide();
    }
  });

  win.on('closed', () => {
    win = null;
    orbController = null;
  });
}

// 切换置顶（渲染进程按钮）→ applyLayer → 内部已 broadcastPinState
ipcMain.handle('pin:toggle', () => {
  pinned = !pinned;
  const r = applyLayer();
  if (tray) tray.setContextMenu(buildTrayMenu());
  return { pinned, mode: r.mode };
});

// 查询置顶状态（渲染进程初始化拉一次）
ipcMain.handle('pin:get', () => ({ pinned, mode: lastMode }));

// 隐藏到托盘（X 按钮）
ipcMain.on('app:hide', () => {
  if (win) win.hide();
});

// 真正退出（预留）
ipcMain.on('app:quit', () => {
  isQuitting = true;
  app.quit();
});

// 单实例：二次启动时聚焦已有窗口
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (win) {
      if (win.isMinimized()) win.restore();
      win.show();
      win.focus();
    }
  });

  app.whenReady().then(() => {
    createWindow();
    createTray();
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });
}

app.on('window-all-closed', () => {
  app.quit();
});
