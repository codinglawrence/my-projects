/**
 * Electron 主进程
 * 职责：生命周期管理、spawn 后端（backend.exe / python）、IPC 桥接、退出清理。
 * 安全：前端/Electron 永不明文持有 key；key 仅在后端进程内解析。
 */
const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { launchBackend, waitForReady } = require('./backend-launcher');

let mainWindow = null;
let backendChild = null;
// 本地一次性令牌（修复 H2）：启动时生成并持久化到 userData，注入后端与渲染进程
let localToken = null;
// 开发态：加载 vite dev server（localhost:3000）；也可通过环境变量 BILI_DEV=1 开启
const isDev = process.argv.includes('--dev') || !!process.env.BILI_DEV;

/**
 * 获取（或创建）本地一次性令牌。持久化到 userData/.local_token，供后端鉴权与
 * 渲染进程请求头使用。本机 Electron 持有，任意 file:// 页面无法获取。
 */
function ensureLocalToken() {
  if (localToken) return localToken;
  const tokenPath = path.join(app.getPath('userData'), '.local_token');
  try {
    localToken = fs.readFileSync(tokenPath, 'utf8').trim();
  } catch (e) {
    localToken = null;
  }
  if (!localToken) {
    localToken = crypto.randomBytes(24).toString('hex');
    try {
      fs.writeFileSync(tokenPath, localToken, { mode: 0o600 });
    } catch (e) { /* 忽略写入失败，仅内存使用 */ }
  }
  return localToken;
}

/** 创建主窗口（后端就绪后再显示，避免白屏/假进度） */
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 900,
    minHeight: 600,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true, // 隔离上下文，preload 仅暴露白名单 API
      nodeIntegration: false,
      sandbox: false,
    },
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
  } else {
    // 生产态：加载打包进 resources 的 React 生产构建（file://）
    mainWindow.loadFile(path.join(process.resourcesPath, 'dist', 'index.html'));
  }

  mainWindow.once('ready-to-show', () => mainWindow.show());
  mainWindow.on('closed', () => { mainWindow = null; });
}

// IPC：保存对话框（导出文件）与目录选择（设置保存路径）
ipcMain.handle('dialog:showSaveDialog', async (_e, opts) => {
  if (!mainWindow) return { canceled: true };
  return dialog.showSaveDialog(mainWindow, opts || {});
});
ipcMain.handle('dialog:showOpenDialog', async (_e, opts) => {
  if (!mainWindow) return { canceled: true, filePaths: [] };
  return dialog.showOpenDialog(mainWindow, opts || {});
});
// IPC：向渲染进程提供本地令牌（修复 H2），仅本机 Electron 可获取
ipcMain.handle('get-local-token', () => ensureLocalToken());

// 退出清理：确保后端随桌面壳退出
function killBackend() {
  if (backendChild) {
    try { backendChild.kill('SIGTERM'); } catch (e) { /* ignore */ }
    backendChild = null;
  }
}
app.on('before-quit', killBackend);
app.on('will-quit', killBackend);

app.whenReady().then(async () => {
  // 启动后端子进程（日志透传到渲染进程），注入本地令牌用于鉴权
  const token = ensureLocalToken();
  backendChild = launchBackend(isDev, (line) => {
    if (mainWindow) mainWindow.webContents.send('backend:log', line);
  }, token);

  try {
    await waitForReady(30000);
  } catch (e) {
    dialog.showErrorBox('后端启动失败', String((e && e.message) || e));
    killBackend();
    app.quit();
    return;
  }

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});
