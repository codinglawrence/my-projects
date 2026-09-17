export interface MemoItem {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
}

export interface DailyNote {
  date: string; // YYYY-MM-DD
  items: MemoItem[];
}

export interface StickySettings {
  opacity: number; // 0.55 to 1.0（深色霓虹底，过低会透出桌面显脏）
}

// 与 docs/class-diagram.mermaid 的 Mode / AttachResult / PinState 对齐
export type LayerMode = 'desktop-widget' | 'pinned-floating' | 'normal-fallback';

export interface AttachResult {
  ok: boolean;
  mode: LayerMode;
  reason?: string;
}

export interface PinState {
  pinned: boolean;
  mode: LayerMode;
}

// ============================================================
// View 维度增量（与 docs/class-diagram-orb.mermaid / system_design-orb.md 对齐）
// ============================================================

export type ViewMode = 'note' | 'orb';

export interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ViewState {
  view: ViewMode;
  bounds: Bounds;
  isAnimating: boolean;
}

// 完整 UI 状态（pin 维度 + view 维度正交组合）
export interface AppState {
  pin: { pinned: boolean; mode: LayerMode };
  view: ViewState;
}

// IPC 推送载荷（主进程 → 渲染进程，view:change）
export interface ViewChangePayload {
  from: ViewMode;
  to: ViewMode;
  bounds: Bounds;
  isAnimating: boolean;
}

// 渲染层拖动 IPC 载荷
export interface OrbDragDelta {
  dx: number;
  dy: number;
  phase: 'start' | 'move' | 'end';
}

// view:toggle 入参 source 字段
export type ViewToggleSource = 'button' | 'orb-click' | 'tray' | 'dblclick';
