import { useState, useRef, useCallback, useMemo } from "react";
import type { KeyConfig, KeyPhase, ParticleBurstConfig } from "../types";
import { KEYBOARD_ROWS, ROW_OFFSETS, CODE_TO_KEY, MAX_COLS } from "../config/keyboard";
import { useKeyboardMap } from "../hooks/useKeyboardMap";
import { useDragPop } from "../hooks/useDragPop";
import type { AudioEngineAPI } from "../hooks/useAudioEngine";
import BubbleKey from "./BubbleKey";
import ParticleBurst from "./ParticleBurst";

const KEY_UNIT = 52;
interface BubbleKeyboardProps {
  audioEngine: AudioEngineAPI;
  onPopCountChange: (delta: number) => void;
}

export default function BubbleKeyboard({ audioEngine, onPopCountChange }: BubbleKeyboardProps): React.ReactElement {
  const [phaseRecord, setPhaseRecord] = useState<Record<string, KeyPhase>>({});
  const [particleBursts, setParticleBursts] = useState<ParticleBurstConfig[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const containerRectRef = useRef<DOMRect | null>(null);
  const poppedRef = useRef<Set<string>>(new Set());

  const handlePop = useCallback((keyConfig: KeyConfig): void => {
    const keyId = keyConfig.id;
    if (poppedRef.current.has(keyId)) return;
    poppedRef.current.add(keyId);

    setPhaseRecord((prev) => {
      if (prev[keyId] && prev[keyId] !== "idle") return prev;
      return { ...prev, [keyId]: "popping" };
    });
    audioEngine.playPop();
    onPopCountChange(1);

    setTimeout(() => { setPhaseRecord((prev) => ({ ...prev, [keyId]: "respawning" })); }, 50);
    setTimeout(() => {
      setPhaseRecord((prev) => ({ ...prev, [keyId]: "idle" }));
      poppedRef.current.delete(keyId);
    }, 200);

    setTimeout(() => {
      const container = containerRef.current;
      if (!container) return;
      const el = container.querySelector(`[data-key-id="${CSS.escape(keyId)}"]`) as HTMLDivElement | null;
      if (!el) return;
      const keyRect = el.getBoundingClientRect();
      containerRectRef.current = container.getBoundingClientRect();
      const burstConfig: ParticleBurstConfig = {
        keyId, x: keyRect.left + keyRect.width / 2, y: keyRect.top + keyRect.height / 2,
        color: keyConfig.color, count: 16,
      };
      setParticleBursts((prev) => [...prev, burstConfig]);
    }, 0);
  }, [audioEngine, onPopCountChange]);

  const handleParticleComplete = useCallback((keyId: string): void => {
    setParticleBursts((prev) => prev.filter((b) => b.keyId !== keyId));
  }, []);

  useKeyboardMap({
    onKeyPop: useCallback((keyConfig: KeyConfig): void => {
      if (!audioEngine.isReady) { audioEngine.initialize(); }
      handlePop(keyConfig);
    }, [audioEngine, handlePop]),
  });

  useDragPop({
    containerRef,
    onPopKeyId: useCallback((keyId: string): void => {
      const keyConfig = CODE_TO_KEY[keyId];
      if (!keyConfig) return;
      if (!audioEngine.isReady) { audioEngine.initialize(); }
      handlePop(keyConfig);
    }, [audioEngine, handlePop]),
  });

  const getPhase = useCallback((keyId: string): KeyPhase => {
    return phaseRecord[keyId] ?? "idle";
  }, [phaseRecord]);

  const rowOffsetPx = useMemo(() => ROW_OFFSETS.map((offset) => offset * KEY_UNIT), []);
  const maxRowWidth = MAX_COLS * KEY_UNIT;

  return (
    <div ref={containerRef} style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "6px", width: `${maxRowWidth}px`, minWidth: `${maxRowWidth}px`, userSelect: "none" }}>
      {KEYBOARD_ROWS.map((row, rowIndex) => (
        <div key={`row-${rowIndex}`} style={{ display: "flex", flexDirection: "row", gap: "6px", paddingLeft: `${rowOffsetPx[rowIndex] ?? 0}px`, width: "100%" }}>
          {row.map((keyConfig) => (
            <BubbleKey key={keyConfig.id} config={keyConfig} phase={getPhase(keyConfig.id)} onPop={handlePop} />
          ))}
        </div>
      ))}
      {particleBursts.map((burstConfig) => {
        const containerRect = containerRectRef.current;
        if (!containerRect) return null;
        return <ParticleBurst key={`sparkle-${burstConfig.keyId}`} config={burstConfig} containerRect={containerRect} onComplete={handleParticleComplete} />;
      })}
    </div>
  );
}
