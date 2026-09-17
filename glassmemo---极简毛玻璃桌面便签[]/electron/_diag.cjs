// 诊断：枚举当前 Windows 桌面窗口树（只读，不修改）
const koffi = require('koffi');
const user32 = koffi.load('user32.dll');
const FindWindowW = user32.func('void *FindWindowW(const char16_t *lpClassName, const char16_t *lpWindowName)');
const FindWindowExW = user32.func('void *FindWindowExW(void *hWndParent, void *hWndChildAfter, const char16_t *lpszClass, const char16_t *lpszWindow)');
const GetClassNameW = user32.func('int GetClassNameW(void *hWnd, _Out_ char16_t *lpClassName, int nMaxCount)');
const EnumWindowsProc = koffi.proto('bool EnumWindowsProc(void *hwnd, intptr_t lParam)');
const EnumWindows = user32.func('bool EnumWindows(EnumWindowsProc *lpEnumFunc, intptr_t lParam)');

function className(hwnd) {
  const b = Buffer.alloc(512);
  const n = GetClassNameW(hwnd, b, 256);
  return n ? b.toString('utf16le', 0, n * 2) : '';
}

console.log('=== 顶层 WorkerW / Progman（含 DefView 检查） ===');
const cb = koffi.register((hwnd) => {
  const cn = className(hwnd);
  if (cn === 'WorkerW' || cn === 'Progman') {
    const def = FindWindowExW(hwnd, null, 'SHELLDLL_DefView', null);
    console.log(cn, '| hasDefView:', !!def);
  }
  return true;
}, koffi.pointer(EnumWindowsProc));
EnumWindows(cb, 0);
koffi.unregister(cb);

console.log('\n=== Progman 子树 ===');
function walk(parent, depth) {
  let child = FindWindowExW(parent, null, null, null);
  while (child) {
    console.log('  '.repeat(depth) + className(child));
    walk(child, depth + 1);
    child = FindWindowExW(parent, child, null, null);
  }
}
const progman = FindWindowW('Progman', null);
walk(progman, 0);
