// 仅供 _diag-orb.cjs 自检使用，stub Electron 模块的最小 API。
// 主进程 / 渲染进程不会加载本文件。
const workArea = { x: 0, y: 0, width: 1920, height: 1080 };
module.exports = {
  screen: {
    getPrimaryDisplay: () => ({ workArea, bounds: workArea, id: 0 }),
    getAllDisplays: () => [{ workArea, bounds: workArea, id: 0 }],
    getDisplayNearestPoint: (_p) => ({ workArea, bounds: workArea, id: 0 }),
  },
};
