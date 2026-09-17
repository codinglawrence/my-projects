import { useEffect, useRef, useCallback } from 'react';
import type { KeyConfig } from '../types';
import { CODE_TO_KEY, MODIFIER_CODES } from '../config/keyboard';

interface UseKeyboardMapOptions {
  onKeyPop: (keyConfig: KeyConfig) => void;
}

export function useKeyboardMap({ onKeyPop }: UseKeyboardMapOptions): void {
  const activeKeysRef = useRef<Set<string>>(new Set());

  const handleKeyDown = useCallback((event: KeyboardEvent): void => {
    const { code, repeat } = event;
    if (MODIFIER_CODES.has(code)) return;
    if (activeKeysRef.current.has(code)) return;
    if (repeat) return;
    const keyConfig: KeyConfig | undefined = CODE_TO_KEY[code];
    if (!keyConfig) return;
    activeKeysRef.current.add(code);
    onKeyPop(keyConfig);
  }, [onKeyPop]);

  const handleKeyUp = useCallback((event: KeyboardEvent): void => {
    activeKeysRef.current.delete(event.code);
  }, []);

  useEffect((): (() => void) => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return (): void => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);
}
