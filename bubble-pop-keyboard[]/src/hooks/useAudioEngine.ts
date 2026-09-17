import { useRef, useCallback, useState } from 'react';
import { createNoiseBuffer, playPopSound, DEFAULT_POP_CONFIG } from '../utils/audio';
import type { PopSoundConfig } from '../types';

export interface AudioEngineAPI {
  playPop: (config?: Partial<PopSoundConfig>) => void;
  initialize: () => void;
  isReady: boolean;
}

const COMBO_WINDOW_MS: number = 300;
const MAX_PITCH_MULTIPLIER: number = 1.3;
const PITCH_STEP: number = 0.04;

export function useAudioEngine(): AudioEngineAPI {
  const ctxRef = useRef<AudioContext | null>(null);
  const noiseBufferRef = useRef<AudioBuffer | null>(null);
  const comboCountRef = useRef<number>(0);
  const lastPopTimeRef = useRef<number>(0);
  const [isReady, setIsReady] = useState<boolean>(false);

  const initialize = useCallback((): void => {
    if (ctxRef.current && ctxRef.current.state !== 'closed') return;
    const ctx: AudioContext = new AudioContext();
    ctxRef.current = ctx;
    noiseBufferRef.current = createNoiseBuffer(ctx, 0.15);
    setIsReady(true);
  }, []);

  const playPop = useCallback((configOverride?: Partial<PopSoundConfig>): void => {
    const ctx: AudioContext | null = ctxRef.current;
    const noiseBuffer: AudioBuffer | null = noiseBufferRef.current;

    if (!ctx || !noiseBuffer) { initialize(); return; }

    const now: number = performance.now();
    if (now - lastPopTimeRef.current < COMBO_WINDOW_MS) {
      comboCountRef.current++;
    } else {
      comboCountRef.current = 0;
    }
    lastPopTimeRef.current = now;

    const pitchMultiplier: number = Math.min(MAX_PITCH_MULTIPLIER, 1.0 + comboCountRef.current * PITCH_STEP);
    const mergedConfig: PopSoundConfig = { ...DEFAULT_POP_CONFIG, ...configOverride, pitchMultiplier };

    if (ctx.state === 'suspended') { ctx.resume().catch(console.error); }
    playPopSound(ctx, noiseBuffer, mergedConfig);
  }, [initialize]);

  return { playPop, initialize, isReady };
}
