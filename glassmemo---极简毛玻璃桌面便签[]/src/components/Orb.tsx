// GlassMemo · Orb 悬浮球组件（v1.1.0 增量）
// 与 docs/prd-orb.md §3.2 "悬浮球" 视觉规范对齐：60×60 圆 + 居中便签 SVG + hover scale 1.05。
// 拖动 = mousedown→move→up，4px 阈值判定点击/拖动（system_design A.1 难点 3）。
// 不引入 react-draggable 等第三方库，沿用 motion + React 原生事件。
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { StickyNote as NoteIcon } from 'lucide-react';
import { ORB_SIZE, ANIMATION_DURATION_MS, DRAG_CLICK_THRESHOLD_PX } from '../constants/orb';
import { useViewMode } from '../hooks/useViewMode';

interface OrbProps {
  /** 由 StickyNote 注入的 onExpand 回调（点击 / 双击触发） */
  onExpand?: (source: 'orb-click' | 'dblclick') => void;
}

/**
 * 悬浮球组件。
 * - 点击（位移 < 4px）：触发 onExpand('orb-click')
 * - 双击：触发 onExpand('dblclick')
 * - 拖动（位移 ≥ 4px）：通过 IPC view:drag 推送给主进程 DragHandler 处理
 *
 * 注意：不要在外层包 `-webkit-app-region: drag`，否则会吞掉 click 事件
 * （与 system_design A.1 难点 3 对齐）。
 */
export const Orb: React.FC<OrbProps> = ({ onExpand }) => {
  const { notifyAnimationDone, drag } = useViewMode();
  const [hover, setHover] = useState(false);
  // 拖动状态机：start 时的 mousedown 坐标 + 是否进入拖动模式
  const downRef = useRef<{ x: number; y: number; t: number } | null>(null);
  const draggingRef = useRef(false);
  const lastClickTimeRef = useRef(0);
  // v1.1.2: rAF 节流——mousemove 触发频率远高于屏幕刷新率，
  // 不节流会把 IPC 队列刷爆导致主进程 setBounds 排队 → 拖动「粘滞」不跟手。
  const rafRef = useRef<number | null>(null);
  const pendingDeltaRef = useRef<{ dx: number; dy: number } | null>(null);

  // 取消挂起的 rAF（拖动结束 / 组件卸载时调用，避免最后一帧延迟 + 内存泄漏）
  const cancelPendingFrame = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    pendingDeltaRef.current = null;
  }, []);

  // 鼠标离开窗口时若处于拖动态，强制 end（防丢事件导致 orb 残留中间位置）
  useEffect(() => {
    const onUp = () => {
      if (draggingRef.current) {
        drag({ dx: 0, dy: 0, phase: 'end' });
        draggingRef.current = false;
      }
      downRef.current = null;
    };
    window.addEventListener('mouseup', onUp);
    return () => window.removeEventListener('mouseup', onUp);
  }, [drag]);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    // 仅左键触发
    if (e.button !== 0) return;
    downRef.current = { x: e.clientX, y: e.clientY, t: Date.now() };
    draggingRef.current = false;
  }, []);

  const onMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const down = downRef.current;
      if (!down) return;
      const dx = e.clientX - down.x;
      const dy = e.clientY - down.y;
      const dist = Math.hypot(dx, dy);

      // 第一次越过阈值：发送 start 事件，记录起始 bounds（主进程从 win.getBounds 拿）
      if (!draggingRef.current && dist >= DRAG_CLICK_THRESHOLD_PX) {
        draggingRef.current = true;
        drag({ dx: 0, dy: 0, phase: 'start' });
      }
      if (!draggingRef.current) return;

      // v1.1.2: rAF 节流——只记录最新位移，每帧最多发一次 move IPC。
      // 中间帧的位移会被覆盖（窗口最终位置以最后一帧为准），视觉上完全跟手。
      pendingDeltaRef.current = { dx, dy };
      if (rafRef.current !== null) return; // 已排帧，等下一帧统一发
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        const p = pendingDeltaRef.current;
        if (p) drag({ dx: p.dx, dy: p.dy, phase: 'move' });
      });
    },
    [drag]
  );

  const onMouseUp = useCallback(
    (e: React.MouseEvent) => {
      const down = downRef.current;
      if (!down) return;
      const dx = e.clientX - down.x;
      const dy = e.clientY - down.y;
      const dist = Math.hypot(dx, dy);

      if (draggingRef.current) {
        // v1.1.2: 先取消挂起的 move 帧，避免 end 之后还补发一次 move 造成回跳
        cancelPendingFrame();
        // 拖动结束 → 主进程贴边 + 持久化
        drag({ dx: 0, dy: 0, phase: 'end' });
        draggingRef.current = false;
      } else if (dist < DRAG_CLICK_THRESHOLD_PX) {
        // 判定为点击（PRD AC-5）
        const now = Date.now();
        // 双击检测（PRD AC-8）：两次点击间隔 < 300ms 视为双击
        if (now - lastClickTimeRef.current < 300 && onExpand) {
          onExpand('dblclick');
          lastClickTimeRef.current = 0;
        } else {
          lastClickTimeRef.current = now;
          if (onExpand) onExpand('orb-click');
        }
      }
      downRef.current = null;
    },
    [drag, onExpand, cancelPendingFrame]
  );

  // 组件卸载时取消挂起的 rAF，避免内存泄漏
  useEffect(() => cancelPendingFrame, [cancelPendingFrame]);

  // 防止拖动时文本选中
  const onDragStart = (e: React.DragEvent) => e.preventDefault();

  return (
    <motion.div
      initial={{ scale: 0.4, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.4, opacity: 0 }}
      transition={{ duration: ANIMATION_DURATION_MS / 1000, ease: [0.4, 0, 0.2, 1] }}
      onAnimationComplete={notifyAnimationDone}
      className="w-full h-full flex items-center justify-center select-none"
    >
      <motion.div
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onDragStart={onDragStart}
        animate={{ scale: hover && !draggingRef.current ? 1.05 : 1 }}
        transition={{ duration: 0.23, ease: [0.4, 0, 0.2, 1] }}
        style={{
          width: ORB_SIZE,
          height: ORB_SIZE,
          borderRadius: '50%',
          position: 'relative',
          // v1.1.1: 背景改为不透明深色渐变，去掉 radial 到 transparent 的 alpha，
          // 避免窗口透明失效时露出矩形窗口底色导致"看起来很浅"。
          background: 'linear-gradient(165deg, #1A2150 0%, #0A0E27 100%)',
          // v1.1.1: boxShadow 全部用 inset（玻璃高光 + 底部暗影），外发光收进圆内避免被 SetWindowRgn 裁掉
          boxShadow: hover
            ? 'inset 0 1px 1px rgba(255,255,255,0.28), inset 0 -2px 4px rgba(0,0,0,0.45), 0 0 14px rgba(91,139,239,0.55), 0 0 28px rgba(162,107,250,0.35)'
            : 'inset 0 1px 1px rgba(255,255,255,0.22), inset 0 -2px 4px rgba(0,0,0,0.4), 0 2px 10px rgba(91,139,239,0.35)',
          cursor: draggingRef.current ? 'grabbing' : 'grab',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
        title="点击 / 双击展开 · 拖动移动位置"
      >
        {/* 顶部玻璃高光：顶部弧形渐变，制造"玻璃球"质感 */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            top: 4,
            left: 10,
            right: 10,
            height: 14,
            borderRadius: '50%',
            background:
              'linear-gradient(180deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.04) 60%, rgba(255,255,255,0) 100%)',
            pointerEvents: 'none',
          }}
        />
        {/* 内描边强化：在圆周内 1px 内描边增强精致感 */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            boxShadow: hover
              ? 'inset 0 0 0 1px rgba(255,255,255,0.22)'
              : 'inset 0 0 0 1px rgba(255,255,255,0.14)',
            pointerEvents: 'none',
          }}
        />
        {/* 居中发光便签图标（lucide-react StickyNote，strokeWidth 1.5 更精致） */}
        <motion.div
          animate={{ opacity: hover ? 1 : 0.88 }}
          transition={{ duration: 0.2 }}
          style={{
            filter: hover
              ? 'drop-shadow(0 0 6px rgba(91,139,239,0.95)) drop-shadow(0 0 12px rgba(61,221,252,0.6))'
              : 'drop-shadow(0 0 3px rgba(91,139,239,0.7))',
          }}
        >
          <NoteIcon
            size={26}
            strokeWidth={1.5}
            color="#E8ECFF"
          />
        </motion.div>
      </motion.div>
    </motion.div>
  );
};
