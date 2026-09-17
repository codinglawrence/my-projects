// GlassMemo · Orb 模式常量（与 electron/orb-controller.cjs 中常量对齐）
// 单一来源策略：渲染层常量独立维护便于纯前端使用（不在渲染进程 import 主进程模块）；
// 与主进程 ORB_SIZE / NOTE_MIN_SIZE / SnappingPolicy.{SNAP_THRESHOLD,SNAP_INSET} 保持一致。
// 修改任一处时同步另一处。

export const ORB_SIZE = 60;                 // 悬浮球直径（px）
export const SNAP_THRESHOLD = 30;           // 释放时距左/右 ≤ 30px 触发贴边（PRD AC-11）
export const SNAP_INSET = 8;                // 贴边后中心距边缘
export const ANIMATION_DURATION_MS = 250;   // 收缩/展开动画时长（PRD P2）
export const DRAG_CLICK_THRESHOLD_PX = 4;   // mousedown→mouseup 位移阈值（<4px 视为点击，否则视为拖动）
