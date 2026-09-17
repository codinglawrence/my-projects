// GlassMemo · 桌面层嵌入（Desktop Widget）
// 把 Electron 无边框窗口 SetParent 到 Windows 桌面层（Progman → WorkerW），
// 让便签与壁纸 / 桌面图标同层：打开其他程序会被盖住，按 Win+D 回桌面时仍然可见。
// 这正是「桌面插件」与「悬浮窗」的本质区别。
const koffi = require('koffi');

const SMTO_NORMAL = 0x0000;
const WM_SPAWN_WORKERW = 0x052c; // 未公开消息：促使 Progman 生成 WorkerW 分层

const user32 = koffi.load('user32.dll');

const FindWindowW = user32.func(
  'void *FindWindowW(const char16_t *lpClassName, const char16_t *lpWindowName)'
);
const FindWindowExW = user32.func(
  'void *FindWindowExW(void *hWndParent, void *hWndChildAfter, const char16_t *lpszClass, const char16_t *lpszWindow)'
);
const SendMessageTimeoutW = user32.func(
  'intptr_t SendMessageTimeoutW(void *hWnd, uint32_t Msg, uintptr_t wParam, intptr_t lParam, uint32_t fuFlags, uint32_t uTimeout, _Out_ uintptr_t *lpdwResult)'
);
const SetParent = user32.func('void *SetParent(void *hWndChild, void *hWndNewParent)');
const GetClassNameW = user32.func(
  'int GetClassNameW(void *hWnd, _Out_ char16_t *lpClassName, int nMaxCount)'
);
// v1.1.1: 不规则窗口区域（用于悬浮球正圆显示）。
// SetWindowRgn 是 user32 的，但 CreateEllipticRgn 来自 gdi32。
const SetWindowRgn = user32.func('int SetWindowRgn(void *hWnd, void *hRgn, int bRedraw)');
const gdi32 = koffi.load('gdi32.dll');
const CreateEllipticRgn = gdi32.func(
  'void *CreateEllipticRgn(int x1, int y1, int x2, int y2)'
);
// v1.1.2: 用 GetWindowRect 拿窗口「实际像素」尺寸（SetWindowRgn 的坐标是物理像素，
// 硬编码 60 会在 DPI≠100% 时比窗口小 → 露出角）。
const RECT = koffi.struct('RECT', {
  left: 'long',
  top: 'long',
  right: 'long',
  bottom: 'long',
});
const GetWindowRect = user32.func('int GetWindowRect(void *hWnd, _Out_ RECT *lpRect)');
// v1.1.2: 关掉 Windows 11 的 DWM 强制窗口圆角（DWMWCP_DONOTROUND）。
// Win11 即使设了 RGN，DWM 仍可能给窗口描圆角 → 边角残留。
const dwmapi = koffi.load('dwmapi.dll');
const DwmSetWindowAttribute = dwmapi.func(
  'int DwmSetWindowAttribute(void *hwnd, uint32_t dwAttribute, _In_ void *pvAttribute, uint32_t cbAttribute)'
);
const DWMWA_WINDOW_CORNER_PREFERENCE = 33;
const DWMWCP_DONOTROUND = 1;

// 读取窗口类名（UTF-16）
function getClassName(hwnd) {
  const buf = Buffer.alloc(512);
  const len = GetClassNameW(hwnd, buf, 256);
  if (!len) return '';
  return buf.toString('utf16le', 0, len * 2);
}

// SK-1 / 设计 A.1 难点 2：Electron 33 在 Windows 下 getNativeWindowHandle() 返回 Buffer，
// 长度可能是 4 字节（HWND 32 位视图）或 8 字节（64 位）。不在 4~8 之间视为无效指针。
function validateHwndBuffer(h) {
  if (!Buffer.isBuffer(h)) {
    throw new Error('InvalidHwndBuffer: expected Buffer');
  }
  if (h.length < 4 || h.length > 8) {
    throw new Error(`InvalidHwndBuffer: length ${h.length} not in [4,8]`);
  }
}

// 桌面承载层：Progman 的直接子窗口 WorkerW（空的那个）。
// 实测当前 Windows 桌面树：Progman → { SHELLDLL_DefView(图标), WorkerW(空) }。
// 找不到 WorkerW 时回退到 Progman 本身。
function findDesktopWorkerW() {
  const progman = FindWindowW('Progman', null);
  if (!progman) return null;
  let child = FindWindowExW(progman, null, null, null);
  while (child) {
    if (getClassName(child) === 'WorkerW') return child;
    child = FindWindowExW(progman, child, null, null);
  }
  return progman; // 兜底
}

/**
 * 把窗口挂到桌面层
 * @param {Buffer} hwndBuffer BrowserWindow.getNativeWindowHandle() 的返回值
 * @returns {{ok: boolean, mode: 'desktop-widget'|'normal-fallback', reason?: string, layer?: string}}
 */
function attachToDesktop(hwndBuffer) {
  try {
    validateHwndBuffer(hwndBuffer);
  } catch (e) {
    return { ok: false, mode: 'normal-fallback', reason: String((e && e.message) || e) };
  }
  try {
    const progman = FindWindowW('Progman', null);
    if (!progman) return { ok: false, mode: 'normal-fallback', reason: '未找到 Progman（Program Manager）窗口' };

    // 促使 Progman 生成 WorkerW 分层（幂等，已存在则无副作用）
    const out = Buffer.alloc(8);
    SendMessageTimeoutW(progman, WM_SPAWN_WORKERW, 0, 0, SMTO_NORMAL, 1000, out);

    const workerw = findDesktopWorkerW();
    if (!workerw) return { ok: false, mode: 'normal-fallback', reason: '未找到桌面承载层' };

    SetParent(hwndBuffer, workerw);
    return {
      ok: true,
      mode: 'desktop-widget',
      layer: getClassName(workerw) === 'WorkerW' ? 'WorkerW' : 'Progman',
    };
  } catch (e) {
    return { ok: false, mode: 'normal-fallback', reason: String((e && e.message) || e) };
  }
}

// 脱离桌面层，恢复为普通顶层窗口（SetParent 至 NULL）。
// 语义上「detach 成功 + 调用方紧接着 setAlwaysOnTop(true, 'screen-saver')」= 进入浮窗置顶。
function detachFromDesktop(hwndBuffer) {
  try {
    if (hwndBuffer) {
      validateHwndBuffer(hwndBuffer);
      SetParent(hwndBuffer, null);
    }
    return { ok: true, mode: 'pinned-floating' };
  } catch (e) {
    return { ok: false, mode: 'normal-fallback', reason: String((e && e.message) || e) };
  }
}

/**
 * v1.1.1: 把窗口裁成不规则区域（用于悬浮球正圆显示）。
 *
 * 解决「悬浮球方形痕迹」：Electron transparent 窗口嵌到 WorkerW（SetParent）后，
 * Windows 不允许 child window 真正透明，窗口会露出不透明矩形背景，
 * 且 Windows 11 自动给窗口加圆角 → 出现「圆角矩形 + 透明失效」。
 *
 * 方案：用 SetWindowRgn 把窗口区域裁成正圆，圆外完全不可见也不可点击，
 * 彻底绕开透明失效问题。
 *
 * - mode='orb'   → 椭圆正圆（diameter=60，与 ORB_SIZE 对齐）
 * - mode='note'  → 恢复默认矩形（SetWindowRgn(hwnd, null, true)）
 *
 * 注意：调用时窗口必须已 show，否则 SetWindowRgn 会失败。
 */
function setWindowShape(hwndBuffer, mode) {
  try {
    validateHwndBuffer(hwndBuffer);
    if (mode === 'orb') {
      // v1.1.2: 先关掉 Win11 DWM 强制圆角，避免 DWM 给窗口描角
      try {
        const pref = Buffer.alloc(4);
        pref.writeInt32LE(DWMWCP_DONOTROUND, 0);
        DwmSetWindowAttribute(hwndBuffer, DWMWA_WINDOW_CORNER_PREFERENCE, pref, 4);
      } catch (e) {
        // DWM 不可用（非 Win11）时忽略，不影响 RGN 裁圆
      }
      // v1.1.2: 用窗口的实际像素尺寸裁圆（DPI 安全），不再硬编码 60 逻辑单位
      const rect = { left: 0, top: 0, right: 0, bottom: 0 };
      GetWindowRect(hwndBuffer, rect);
      let w = rect.right - rect.left;
      let h = rect.bottom - rect.top;
      // 兜底：拿不到时用 60（与 ORB_SIZE 对齐）
      if (!w || !h || w <= 0 || h <= 0) {
        w = 60;
        h = 60;
      }
      const rgn = CreateEllipticRgn(0, 0, w, h);
      const ret = SetWindowRgn(hwndBuffer, rgn, 1);
      return ret !== 0
        ? { ok: true, mode: 'orb-round', size: { w, h } }
        : { ok: false, mode: 'normal-fallback', reason: 'SetWindowRgn(orb) 返回 0' };
    } else if (mode === 'note') {
      // 重置为默认矩形（参数 2 = null region）
      const ret = SetWindowRgn(hwndBuffer, null, 1);
      return ret !== 0
        ? { ok: true, mode: 'rect' }
        : { ok: false, mode: 'normal-fallback', reason: 'SetWindowRgn(note reset) 返回 0' };
    }
    return { ok: false, mode: 'normal-fallback', reason: 'unknown shape mode: ' + mode };
  } catch (e) {
    return { ok: false, mode: 'normal-fallback', reason: String((e && e.message) || e) };
  }
}

module.exports = { attachToDesktop, detachFromDesktop, findDesktopWorkerW, setWindowShape };

// 自检：node electron/desktop-layer.cjs
if (require.main === module) {
  console.log('koffi:', typeof koffi.version === 'function' ? koffi.version() : koffi.version);
  const progman = FindWindowW('Progman', null);
  console.log('Progman 句柄:', progman ? '找到' : '未找到');
  if (progman) {
    const out = Buffer.alloc(8);
    SendMessageTimeoutW(progman, WM_SPAWN_WORKERW, 0, 0, SMTO_NORMAL, 1000, out);
    const workerw = findDesktopWorkerW();
    console.log('桌面承载层:', workerw ? '找到 (' + getClassName(workerw) + ')' : '未找到');
  }
}
