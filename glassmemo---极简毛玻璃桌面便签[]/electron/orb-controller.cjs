// GlassMemo · View 维度主进程控制器（增量）
// 与 docs/system_design-orb.md §A.3 / class-diagram-orb.mermaid 对齐。
//
// 本模块导出 4 个对象，全部为 cjs：
//   - OrbController   view 状态机（toggle/shrink/expand/getState）
//   - BoundsRepository  userData 下 note/orb/view-state 三个 JSON 文件的读写
//   - DragHandler      悬浮球拖动状态机（start/move/end）
//   - SnappingPolicy   纯函数：clampToWorkArea + 贴边吸附 apply
//
// 注意：view 切换 = bounds + minSize + resizable + 渲染层条件渲染的纯状态机操作，
// 绝不调用 win.destroy / win.close / 重建 BrowserWindow（SK-1）。
const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');

const { screen } = require('electron');

// ---- 默认 bounds（首次启动 / 文件丢失兜底） ----
const DEFAULT_NOTE_BOUNDS = { x: undefined, y: undefined, width: 380, height: 560 };
const DEFAULT_ORB_BOUNDS_FALLBACK = { width: 60, height: 60 };
const NOTE_MIN_SIZE = { width: 200, height: 200 };
const ORB_SIZE = 60; // 与 src/constants/orb.ts ORB_SIZE 对齐（保持单一来源；渲染层另设常量便于纯前端使用）

/** Bounds 是否完整且数字合法（用于从文件加载时校验） */
function isBoundsValid(b) {
  return (
    b &&
    typeof b.x === 'number' && typeof b.y === 'number' &&
    typeof b.width === 'number' && typeof b.height === 'number' &&
    isFinite(b.x) && isFinite(b.y) && isFinite(b.width) && isFinite(b.height)
  );
}

/**
 * 计算居中 60×60 的 orb 兜底位置（基于当前主显示器 workArea）。
 * 用于 orb-bounds.json 丢失 / 损坏时的降级。
 */
function centeredOrbFallbackBounds() {
  const primary = screen.getPrimaryDisplay();
  const wa = primary.workArea;
  const w = DEFAULT_ORB_BOUNDS_FALLBACK.width;
  const h = DEFAULT_ORB_BOUNDS_FALLBACK.height;
  return {
    x: Math.round(wa.x + (wa.width - w) / 2),
    y: Math.round(wa.y + (wa.height - h) / 2),
    width: w,
    height: h,
  };
}

// ============================================================
// BoundsRepository
// 文件级隔离：note-bounds.json / orb-bounds.json / view-state.json 三独立文件。
// 不并发调用同一实例方法（async queue 串行化），与 SK-5 写入纪律一致。
// ============================================================
class BoundsRepository {
  /**
   * @param {string} userDataPath Electron app.getPath('userData')
   */
  constructor(userDataPath) {
    this.userDataPath = userDataPath;
    this.notePath = path.join(userDataPath, 'note-bounds.json');
    this.orbPath = path.join(userDataPath, 'orb-bounds.json');
    this.viewStatePath = path.join(userDataPath, 'view-state.json');
  }

  // ----- 内部：序列化 + 失败不抛 -----
  async _writeJson(p, obj) {
    try {
      await fsp.mkdir(this.userDataPath, { recursive: true });
      await fsp.writeFile(p, JSON.stringify(obj));
    } catch (e) {
      console.error('[bounds-repository] write failed:', p, (e && e.message) || e);
    }
  }

  async _readJson(p) {
    try {
      const raw = await fsp.readFile(p, 'utf8');
      return JSON.parse(raw);
    } catch (e) {
      // 文件不存在或损坏 → 返回 null，由调用方兜底
      return null;
    }
  }

  // ----- note-bounds -----
  saveNote(bounds) {
    return this._writeJson(this.notePath, bounds);
  }
  async loadNote() {
    const b = await this._readJson(this.notePath);
    return isBoundsValid(b) ? b : null;
  }

  // ----- orb-bounds -----
  saveOrb(bounds) {
    return this._writeJson(this.orbPath, bounds);
  }
  async loadOrb() {
    const b = await this._readJson(this.orbPath);
    if (isBoundsValid(b)) return b;
    // 兜底：居中 60×60
    return centeredOrbFallbackBounds();
  }

  // ----- view-state -----
  saveLastView(view) {
    return this._writeJson(this.viewStatePath, { lastView: view });
  }
  async loadLastView() {
    const v = await this._readJson(this.viewStatePath);
    return v && (v.lastView === 'note' || v.lastView === 'orb') ? v.lastView : null;
  }
}

// ============================================================
// SnappingPolicy（纯函数模块，无副作用，便于单测）
// 吸附阈值常量与 src/constants/orb.ts 对齐：
//   SNAP_THRESHOLD = 30（释放时距左/右 ≤ 30px 触发贴边）
//   SNAP_INSET     = 8（贴边后中心距边缘）
//   ORB_SIZE       = 60
// ============================================================
const SnappingPolicy = {
  SNAP_THRESHOLD: 30,
  SNAP_INSET: 8,
  ORB_SIZE: 60,

  /**
   * 把 bounds 限制在 workArea 内（多屏拼接安全）。
   * workArea = { x, y, width, height }
   */
  clampToWorkArea(bounds, workArea) {
    const w = bounds.width || ORB_SIZE;
    const h = bounds.height || ORB_SIZE;
    const minX = workArea.x;
    const minY = workArea.y;
    const maxX = workArea.x + workArea.width - w;
    const maxY = workArea.y + workArea.height - h;
    return {
      x: Math.max(minX, Math.min(bounds.x, maxX)),
      y: Math.max(minY, Math.min(bounds.y, maxY)),
      width: w,
      height: h,
    };
  },

  /**
   * 贴边吸附：距左/右 ≤ SNAP_THRESHOLD → 贴到该边（中心距 SNAP_INSET）。
   * 上/下吸附暂不实现（PRD AC-11 只要求左/右），留作扩展。
   */
  apply(bounds, workArea) {
    const w = bounds.width || ORB_SIZE;
    const h = bounds.height || ORB_SIZE;
    const centerX = bounds.x + w / 2;
    let x = bounds.x;
    let y = bounds.y;

    const distLeft = centerX - (workArea.x + this.SNAP_INSET + w / 2);
    const distRight = (workArea.x + workArea.width - this.SNAP_INSET - w / 2) - centerX;
    if (distLeft <= this.SNAP_THRESHOLD && distLeft >= 0) {
      x = workArea.x + this.SNAP_INSET;
    } else if (distRight <= this.SNAP_THRESHOLD && distRight >= 0) {
      x = workArea.x + workArea.width - this.SNAP_INSET - w;
    }

    // 顺手 clamp 到 workArea（吸附后可能仍越界，例如 workArea 宽度 < orb + 2*inset）
    return this.clampToWorkArea({ x, y, width: w, height: h }, workArea);
  },
};

// ============================================================
// DragHandler（悬浮球拖动状态机）
// 由 IPC view:drag 触发；phase: 'start' | 'move' | 'end'
// 拖动期间不推送 view:change（SK-4），只通过 win.setBounds 跟手；
// phase='end' 时调用 SnappingPolicy.apply + BoundsRepository.saveOrb。
// ============================================================
class DragHandler {
  constructor() {
    this.startBounds = null;
    this.isDragging = false;
  }

  /**
   * @param {{dx:number, dy:number, phase:'start'|'move'|'end'}} payload
   * @param {Electron.BrowserWindow} win
   * @param {SnappingPolicy} snap
   * @param {BoundsRepository} repo
   */
  onDrag(payload, win, snap, repo) {
    if (!win || win.isDestroyed()) return;
    if (!payload || !payload.phase) return;

    if (payload.phase === 'start') {
      this.startBounds = win.getBounds();
      this.isDragging = true;
      return;
    }

    if (payload.phase === 'move') {
      if (!this.startBounds) {
        // 漏掉 start 事件 → 用当前 bounds 当作 start
        this.startBounds = win.getBounds();
        this.isDragging = true;
      }
      const sb = this.startBounds;
      const newBounds = {
        x: sb.x + (payload.dx || 0),
        y: sb.y + (payload.dy || 0),
        width: sb.width || ORB_SIZE,
        height: sb.height || ORB_SIZE,
      };
      // 多屏安全：按窗口中心点选 display
      const centerX = newBounds.x + newBounds.width / 2;
      const centerY = newBounds.y + newBounds.height / 2;
      const display = screen.getDisplayNearestPoint({ x: centerX, y: centerY });
      const clamped = snap.clampToWorkArea(newBounds, display.workArea);
      try {
        win.setBounds(clamped);
      } catch (e) {
        console.error('[drag-handler] setBounds 失败:', (e && e.message) || e);
      }
      return;
    }

    if (payload.phase === 'end') {
      const current = win.getBounds();
      const centerX = current.x + current.width / 2;
      const centerY = current.y + current.height / 2;
      const display = screen.getDisplayNearestPoint({ x: centerX, y: centerY });
      const snapped = snap.apply(current, display.workArea);
      try {
        win.setBounds(snapped);
      } catch (e) {
        console.error('[drag-handler] setBounds (end) 失败:', (e && e.message) || e);
      }
      // 持久化到 orb-bounds.json
      if (repo) repo.saveOrb(snapped).catch(() => {});
      this.startBounds = null;
      this.isDragging = false;
      return;
    }
  }
}

// ============================================================
// OrbController（view 形态状态机）
// toggle / shrink / expand / getState。
// 状态切换顺序：保存当前形态 bounds → saveLastView → setMinimumSize → setResizable
//               → 计算目标 bounds（clamp 到 workArea） → win.setBounds → emit view:change
// ============================================================
class OrbController {
  /**
   * @param {Electron.BrowserWindow} win
   * @param {BoundsRepository} repo
   * @param {object} [opts]
   * @param {object} [opts.dragHandler] 外部注入 DragHandler 实例；不传则内部 new
   * @param {object} [opts.snap]         外部注入 SnappingPolicy；不传则用本模块导出
   * @param {Function} [opts.attachToDesktop]  (handle) => {ok, ...}  ← 桌面挂件模式时让 setBounds 生效（v1.1.1 fix）
   * @param {Function} [opts.detachFromDesktop] (handle) => {ok, ...}
   */
  constructor(win, repo, opts = {}) {
    this.win = win;
    this.repo = repo;
    this.currentView = 'note';
    this.currentBounds = null;
    this.isAnimating = false;
    this.dragHandler = opts.dragHandler || new DragHandler();
    this.snap = opts.snap || SnappingPolicy;
    // v1.1.1: attach/detach 注入（main.cjs 传入）。shrink/expand 时若桌面层嵌入模式，
    // 需要临时 detach 再 setBounds，否则 Electron / Windows 在 SetParent 到 WorkerW 后
    // setBounds 经常失效（与 applyLayer 在 pinned=true 时先 detach 再 setAlwaysOnTop 同理）。
    this.detach = opts.detachFromDesktop;
    this.attach = opts.attachToDesktop;
    // v1.1.1: getPinned 注入（main.cjs 传入 () => pinned）。用于判断是否桌面挂件模式：
    // pinned=false → 桌面挂件（需 detach/attach）；pinned=true → 浮窗置顶（已脱离桌面层，无需处理）。
    this.getPinned = opts.getPinned;
    // v1.1.1: setWindowShape 注入（main.cjs 传入）。shrink/expand 时裁窗口为正圆，
    // 解决 Electron transparent 窗口嵌到 WorkerW 后透明失效、露出圆角矩形的问题。
    this.setWindowShape = opts.setWindowShape;
  }

  /**
   * v1.1.1: 应用窗口形状（正圆 / 矩形）。失败仅 console.error，不抛错。
   * 必须在 setBounds 之后调用（窗口实际尺寸需与 RGN 匹配，否则 RGN 相对位置错乱）。
   */
  _applyShape(mode) {
    if (!this.setWindowShape || !this.win || this.win.isDestroyed()) return;
    try {
      const handle = this.win.getNativeWindowHandle();
      const r = this.setWindowShape(handle, mode);
      if (!r.ok) {
        console.error('[orb-controller] setWindowShape(' + mode + ') 失败:', r.reason);
      }
    } catch (e) {
      console.error('[orb-controller] setWindowShape 抛错:', (e && e.message) || e);
    }
  }

  /**
   * v1.1.1: 桌面挂件安全 setBounds。
   * - 桌面挂件模式（pinned=false，win 被 SetParent 到 WorkerW）：临时脱离桌面层 → setBounds → 重新 attach
   * - 浮窗置顶模式（pinned=true，win 已脱离桌面层）：直接 setBounds
   * 保证 view 切换时 setBounds 一定生效（AC-2/5/6）。
   */
  _detachedSetBounds(bounds) {
    if (!this.win || this.win.isDestroyed()) return;
    const isDesktopWidget = this.getPinned ? !this.getPinned() : false;
    const handle = this.win.getNativeWindowHandle();

    if (!isDesktopWidget) {
      // 浮窗置顶模式：窗口已是普通顶层窗口，setBounds 直接有效
      try {
        this.win.setBounds(bounds);
      } catch (e) {
        console.error('[orb-controller] setBounds 失败:', (e && e.message) || e);
      }
      return;
    }

    // 桌面挂件模式：先 detach，再 setBounds，最后 attach 回桌面层
    let wasAttached = false;
    if (this.detach) {
      try {
        const r = this.detach(handle);
        if (r && r.ok) wasAttached = true;
      } catch (e) {
        console.error('[orb-controller] detach 失败:', (e && e.message) || e);
      }
    }
    try {
      this.win.setBounds(bounds);
    } catch (e) {
      console.error('[orb-controller] setBounds 失败:', (e && e.message) || e);
    }
    if (wasAttached && this.attach) {
      try {
        const r = this.attach(handle);
        if (!(r && r.ok)) {
          console.error('[orb-controller] 重新 attach 失败:', r && r.reason);
        }
      } catch (e) {
        console.error('[orb-controller] attach 抛错:', (e && e.message) || e);
      }
    }
  }

  /** 计算当前 orb 目标 bounds：在 currentBounds 附近，clamp 到 workArea */
  _computeOrbBounds(currentBounds) {
    if (!currentBounds || !isBoundsValid(currentBounds)) {
      return centeredOrbFallbackBounds();
    }
    // 取完整便签右下角附近，orb 中心 = note 中心，size=60×60
    const cx = currentBounds.x + currentBounds.width / 2;
    const cy = currentBounds.y + currentBounds.height / 2;
    const w = ORB_SIZE;
    const h = ORB_SIZE;
    let x = Math.round(cx - w / 2);
    let y = Math.round(cy - h / 2);
    const display = screen.getDisplayNearestPoint({ x: cx, y: cy });
    return this.snap.clampToWorkArea({ x, y, width: w, height: h }, display.workArea);
  }

  /** 推送 view:change 给渲染进程（SK-4：必须在 win.setBounds 之后） */
  _emitChange(from, to, bounds, animating) {
    if (!this.win || this.win.isDestroyed()) return;
    try {
      this.win.webContents.send('view:change', {
        from,
        to,
        bounds,
        isAnimating: animating,
      });
    } catch (e) {
      console.error('[orb-controller] send view:change 失败:', (e && e.message) || e);
    }
  }

  /**
   * IPC view:toggle 入口。from 渲染进程；source 标识触发来源。
   * 返回切换后的 ViewState（不抛错）。
   */
  async toggle(source) {
    if (!this.win || this.win.isDestroyed()) {
      return { view: this.currentView, bounds: this.currentBounds, isAnimating: false };
    }
    if (this.isAnimating) {
      // 防快速点击：直接返回当前态（AC-18）
      return this.getState();
    }
    if (this.currentView === 'note') {
      return this.shrink();
    }
    return this.expand();
  }

  /** note → orb */
  async shrink() {
    if (!this.win || this.win.isDestroyed()) return this.getState();
    if (this.isAnimating) return this.getState();

    const fromView = this.currentView; // 期望 'note'
    const fromBounds = this.win.getBounds();

    // 1. 保存当前 note bounds
    await this.repo.saveNote(fromBounds);
    // 2. 写入 lastView = orb
    await this.repo.saveLastView('orb');

    // 3. 切窗口约束（SK-3：先放宽 / 收紧，再 setBounds）
    try {
      this.win.setMinimumSize(ORB_SIZE, ORB_SIZE);
      this.win.setResizable(false);
    } catch (e) {
      console.error('[orb-controller] setMinimumSize/setResizable 失败:', (e && e.message) || e);
    }

    // 4. 计算 orb 目标 bounds
    const targetBounds = this._computeOrbBounds(fromBounds);

    // 5. setBounds（v1.1.1: 桌面挂件安全 setBounds，先 detach 再 setBounds 再 attach）
    this._detachedSetBounds(targetBounds);
    // v1.1.1: 窗口裁成正圆（必须在 setBounds 之后调用，否则相对位置错乱）
    this._applyShape('orb');

    // 6. 更新内部状态 + 推送
    this.currentView = 'orb';
    this.currentBounds = targetBounds;
    this.isAnimating = true;
    this._emitChange(fromView, 'orb', targetBounds, true);

    return { view: 'orb', bounds: targetBounds, isAnimating: true };
  }

  /** orb → note */
  async expand() {
    if (!this.win || this.win.isDestroyed()) return this.getState();
    if (this.isAnimating) return this.getState();

    const fromView = this.currentView; // 期望 'orb'
    const fromBounds = this.win.getBounds();

    // 1. 保存当前 orb bounds（如果用户拖过，DragHandler.end 也写过；这里再覆盖一次也无害）
    await this.repo.saveOrb(fromBounds);
    // 2. 读回 note-bounds
    let savedNote = await this.repo.loadNote();
    if (!savedNote) {
      // 兜底：用当前 bounds 当作 note bounds（首启动 / 文件丢失）
      savedNote = { ...fromBounds, width: DEFAULT_NOTE_BOUNDS.width, height: DEFAULT_NOTE_BOUNDS.height };
    }
    // 兜底 clamp 到 workArea（防显示器拓扑变了，存档位置越界）
    const primary = screen.getPrimaryDisplay();
    savedNote = this.snap.clampToWorkArea(savedNote, primary.workArea);
    // 3. 写入 lastView = note
    await this.repo.saveLastView('note');

    // 4. 恢复窗口约束
    try {
      this.win.setMinimumSize(NOTE_MIN_SIZE.width, NOTE_MIN_SIZE.height);
      this.win.setResizable(true);
    } catch (e) {
      console.error('[orb-controller] setMinimumSize/setResizable (expand) 失败:', (e && e.message) || e);
    }

    // 5. setBounds（v1.1.1: 桌面挂件安全 setBounds）
    this._detachedSetBounds(savedNote);
    // v1.1.1: 窗口恢复为矩形（先 setBounds 到 note 尺寸，再重置 RGN 为 null）
    this._applyShape('note');

    // 6. 更新内部状态 + 推送
    this.currentView = 'note';
    this.currentBounds = savedNote;
    this.isAnimating = true;
    this._emitChange(fromView, 'note', savedNote, true);

    return { view: 'note', bounds: savedNote, isAnimating: true };
  }

  /** IPC view:get */
  getState() {
    return {
      view: this.currentView,
      bounds: this.currentBounds,
      isAnimating: this.isAnimating,
    };
  }

  /**
   * 启动恢复路径：读取 lastView + 对应 bounds，初始化内部状态，
   * 设置窗口约束 + bounds，可选推送 view:change（不触发动画）。
   * 由 main.cjs 在 win.once('ready-to-show', …) 中调用。
   */
  async restoreOnStartup() {
    if (!this.win || this.win.isDestroyed()) return this.getState();
    const lastView = await this.repo.loadLastView();
    const view = lastView || 'note';

    if (view === 'orb') {
      const orbBounds = await this.repo.loadOrb(); // loadOrb 内部兜底居中
      try {
        this.win.setMinimumSize(ORB_SIZE, ORB_SIZE);
        this.win.setResizable(false);
        // v1.1.1: restore 阶段 applyLayer 还没执行（main.cjs 在 ready-to-show 内调用此方法后才 applyLayer），
        // 此时 win 还在普通顶层窗口状态，直接 setBounds 即可，不需要 detach/attach。
        this.win.setBounds(orbBounds);
        // v1.1.1: 启动时若上次是 orb 模式，裁窗口为正圆
        this._applyShape('orb');
      } catch (e) {
        console.error('[orb-controller] restoreOnStartup orb setBounds 失败:', (e && e.message) || e);
      }
      this.currentView = 'orb';
      this.currentBounds = orbBounds;
      this.isAnimating = false;
      // 启动时同步给渲染进程，isAnimating=false 让 UI 直接落到 orb 形态
      this._emitChange('note', 'orb', orbBounds, false);
    } else {
      // note 模式（含首次启动）
      const noteBounds = await this.repo.loadNote();
      const target = noteBounds || DEFAULT_NOTE_BOUNDS;
      const safeBounds = isBoundsValid(target)
        ? this.snap.clampToWorkArea(target, screen.getPrimaryDisplay().workArea)
        : DEFAULT_NOTE_BOUNDS;
      try {
        this.win.setMinimumSize(NOTE_MIN_SIZE.width, NOTE_MIN_SIZE.height);
        this.win.setResizable(true);
        // x/y 为 undefined 时让 Electron 自动居中
        if (typeof safeBounds.x === 'number' && typeof safeBounds.y === 'number') {
          this.win.setBounds({
            x: safeBounds.x,
            y: safeBounds.y,
            width: safeBounds.width || DEFAULT_NOTE_BOUNDS.width,
            height: safeBounds.height || DEFAULT_NOTE_BOUNDS.height,
          });
        }
        // v1.1.1: note 模式确认是矩形（保险，正常无 RGN 默认就是矩形）
        this._applyShape('note');
      } catch (e) {
        console.error('[orb-controller] restoreOnStartup note setBounds 失败:', (e && e.message) || e);
      }
      this.currentView = 'note';
      this.currentBounds = safeBounds;
      this.isAnimating = false;
      this._emitChange('note', 'note', safeBounds, false);
    }
    console.log('[orb-controller] initialized, view =', this.currentView);
    return this.getState();
  }

  /** 供渲染层 Motion onAnimationComplete 调用，清除动画锁 */
  notifyAnimationDone() {
    this.isAnimating = false;
  }
}

module.exports = {
  OrbController,
  BoundsRepository,
  DragHandler,
  SnappingPolicy,
  // 暴露常量供其他模块 / 测试对齐
  ORB_SIZE,
  NOTE_MIN_SIZE,
  DEFAULT_NOTE_BOUNDS,
};
