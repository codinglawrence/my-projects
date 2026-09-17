/**
 * 预加载脚本（contextBridge）
 * 仅暴露最小白名单 API 给渲染进程：
 * - dialog.showSaveDialog / showOpenDialog：原生文件对话框（导出/选择路径）
 * - onBackendLog：订阅后端日志（便于排错面板）
 * 不暴露任何 key / 文件系统写权限，满足“前端永不明文持有 key”的红线。
 */
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  dialog: {
    showSaveDialog: (opts) => ipcRenderer.invoke('dialog:showSaveDialog', opts),
    showOpenDialog: (opts) => ipcRenderer.invoke('dialog:showOpenDialog', opts),
  },
  onBackendLog: (callback) => {
    ipcRenderer.on('backend:log', (_event, line) => callback(line));
  },
  // 本地令牌（修复 H2）：供渲染进程向后端请求注入 Authorization 头，任意 file:// 页面无法获取
  getLocalToken: () => ipcRenderer.invoke('get-local-token'),
});
