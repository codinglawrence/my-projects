// GlassMemo preload：向渲染进程暴露最小桌面能力
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('glassmemo', {
  // ===== Pin 维度（基线，沿用）=====
  togglePin: () => ipcRenderer.invoke('pin:toggle'),
  getPin: () => ipcRenderer.invoke('pin:get'),
  onPinChange: (cb) => {
    const listener = (_evt, state) => cb(state);
    ipcRenderer.on('pin:change', listener);
    return () => ipcRenderer.removeListener('pin:change', listener);
  },
  hideApp: () => ipcRenderer.send('app:hide'),
  quitApp: () => ipcRenderer.send('app:quit'),

  // ===== View 维度（增量，对应 docs/system_design-orb.md §A.3 ViewApi）=====
  view: {
    /** 切换形态：note → orb 或 orb → note。source 标识触发来源（按钮/悬浮球/托盘）。 */
    toggle: (source) => ipcRenderer.invoke('view:toggle', source),
    /** 拉取当前 view 形态 + bounds（渲染进程初始化时拉一次）。 */
    get: () => ipcRenderer.invoke('view:get'),
    /** 订阅 view:change 主进程推送；返回取消订阅函数。 */
    onChange: (cb) => {
      const listener = (_evt, payload) => cb(payload);
      ipcRenderer.on('view:change', listener);
      return () => ipcRenderer.removeListener('view:change', listener);
    },
    /** 悬浮球拖动事件（mousedown→start / mousemove→move / mouseup→end）。
     *  v1.1.2: 改用 send（单向 fire-and-forget）代替 invoke——拖动是高频事件，
     *  invoke 每次都要等主进程 Promise resolve，累积延迟会让拖动「粘滞」。
     *  渲染层再叠 rAF 节流，双管齐下保证跟手。 */
    drag: (delta) => ipcRenderer.send('view:drag', delta),
    /** 通知主进程动画结束（清除 isAnimating 锁，允许下一轮 toggle）。 */
    notifyAnimDone: () => ipcRenderer.send('view:anim-done'),
  },
});
