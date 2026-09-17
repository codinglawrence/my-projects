import { useRef, useMemo, useCallback } from 'react';
import type { KeyConfig, KeyPhase } from '../types';

interface BubbleKeyProps {
  config: KeyConfig;
  phase: KeyPhase;
  onPop: (keyConfig: KeyConfig) => void;
}

export default function BubbleKey({ config, phase, onPop }: BubbleKeyProps): React.ReactElement {
  const ref = useRef<HTMLDivElement>(null);
  const bounceDelay: number = useMemo(() => Math.random() * 2000, []);
  const bounceDuration: number = useMemo(() => 2000 + Math.random() * 1500, []);

  const handleMouseDown = useCallback((e: React.MouseEvent): void => {
    e.preventDefault();
    if (phase !== "idle") return;
    onPop(config);
  }, [phase, config, onPop]);

  const isSpace: boolean = config.id === "Space";

  const floatStyle: React.CSSProperties | undefined =
    phase === "idle"
      ? { animation: `keyDrift ${bounceDuration}ms ease-in-out ${-bounceDelay}ms infinite` }
      : undefined;

  return (
    <div
      ref={ref}
      data-key-id={config.id}
      className="bubble-key"
      style={{
        ...floatStyle,
        position: "relative",
        flex: isSpace ? `0 0 ${6 * 56 + 5 * 6}px` : "0 0 46px",
        height: "46px", margin: "3px", borderRadius: "12px",
        background: `radial-gradient(circle at 35% 25%, rgba(255,255,255,0.25) 0%, ${config.color}22 40%, ${config.color}0d 100%)`,
        border: `1px solid ${config.color}33`,
        boxShadow: phase === "idle" ? `0 0 12px ${config.color}40, 0 0 24px ${config.color}20, inset 0 1px 0 rgba(255,255,255,0.1)` : "none",
        cursor: phase === "idle" ? "pointer" : "default",
        transition: "box-shadow 0.2s ease",
        willChange: phase === "idle" ? "transform" : "auto",
        pointerEvents: phase === "idle" ? "auto" : "none",
      }}
      onMouseDown={handleMouseDown}
      title=""
    >
      <div style={{ position: "absolute", top: "4px", left: "6px", right: "6px", height: "40%", borderRadius: "10px 10px 50% 50%", background: "radial-gradient(ellipse at 50% 0%, rgba(255,255,255,0.3) 0%, transparent 70%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: "2px", left: "8px", right: "8px", height: "20%", borderRadius: "50%", background: `radial-gradient(ellipse at 50% 100%, ${config.color}44 0%, transparent 70%)`, pointerEvents: "none" }} />
    </div>
  );
}
