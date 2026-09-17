// GlassMemo · useViewMode hook（v1.1.0 增量）
// 订阅主进程 view:change 推送；与基线 usePin 风格对齐。
// 返回当前 ViewState；提供 toggle / get 帮助函数封装 IPC。
//
// 类型契约：window.glassmemo 的完整声明由 src/components/StickyNote.tsx 维护（单一来源），
// 本文件不重复 declare global，避免 TS2717 "Subsequent property declarations" 错误。
import { useEffect, useRef, useState, useCallback } from 'react';
import type { ViewState, ViewChangePayload, ViewToggleSource, OrbDragDelta } from '../types';

const DEFAULT_STATE: ViewState = {
  view: 'note',
  bounds: { x: 0, y: 0, width: 380, height: 560 },
  isAnimating: false,
};

/**
 * 订阅主进程 view:change；返回当前 { view, bounds, isAnimating } + toggle 助手。
 * 初始化时主动 get 一次，避免依赖首条推送（启动恢复路径由主进程推送 isAnimating=false）。
 */
export function useViewMode() {
  const [state, setState] = useState<ViewState>(DEFAULT_STATE);
  // 防止 setState 在卸载后调用（与基线 StickyNote 的 cancelled 模式一致）
  const cancelledRef = useRef(false);

  // window.glassmemo.view 的运行时访问；类型由 StickyNote.tsx declare global 保证
  const viewApi = (typeof window !== 'undefined' && window.glassmemo?.view) || undefined;

  useEffect(() => {
    cancelledRef.current = false;
    if (!viewApi) return;

    // 1. 主动拉一次当前状态
    viewApi.get()
      .then((s) => { if (!cancelledRef.current && s) setState(s); })
      .catch(() => {});

    // 2. 订阅 view:change 推送
    const off = viewApi.onChange((payload) => {
      if (cancelledRef.current || !payload) return;
      setState({
        view: payload.to,
        bounds: payload.bounds,
        isAnimating: payload.isAnimating,
      });
    });

    return () => {
      cancelledRef.current = true;
      off && off();
    };
    // viewApi 引用稳定（window.glassmemo 在 Electron 启动后不变），省略 deps 以避免误重订
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * 切换形态。乐观更新：先本地 setState 防止动画卡顿，失败时回滚。
   * 实际 bounds 由主进程推送回填。
   */
  const toggle = useCallback(async (source: ViewToggleSource = 'button') => {
    if (!viewApi) return state;
    try {
      const next = await viewApi.toggle(source);
      if (!cancelledRef.current && next) setState(next);
      return next;
    } catch {
      return state;
    }
  }, [state, viewApi]);

  /**
   * 通知主进程 + 本地 view 状态动画结束（清除 isAnimating 锁，允许下一轮切换）。
   * 调用时机：Motion onAnimationComplete。
   * 双管齐下：
   *   1. 本地 setState({ isAnimating: false })  → UI 立即解锁
   *   2. IPC send 'view:anim-done' → OrbController.notifyAnimationDone 清主进程锁
   */
  const notifyAnimationDone = useCallback(() => {
    setState((prev) => (prev.isAnimating ? { ...prev, isAnimating: false } : prev));
    if (viewApi && typeof viewApi.notifyAnimDone === 'function') {
      try { viewApi.notifyAnimDone(); } catch {}
    }
  }, [viewApi]);

  /** 拖动 IPC 转发 */
  const drag = useCallback((delta: OrbDragDelta) => {
    if (!viewApi) return Promise.resolve();
    return viewApi.drag(delta);
  }, [viewApi]);

  return { state, toggle, notifyAnimationDone, drag };
}
