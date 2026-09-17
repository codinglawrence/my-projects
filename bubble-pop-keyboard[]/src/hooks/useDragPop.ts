import { useEffect, useRef, useCallback } from 'react';

interface UseDragPopOptions {
  containerRef: React.RefObject<HTMLDivElement | null>;
  onPopKeyId: (keyId: string) => void;
}

export function useDragPop({ containerRef, onPopKeyId }: UseDragPopOptions): void {
  const isDraggingRef = useRef(false);
  const poppedThisDragRef = useRef<Set<string>>(new Set());
  const rafIdRef = useRef(0);
  const onPopKeyIdRef = useRef(onPopKeyId);
  onPopKeyIdRef.current = onPopKeyId;

  const checkCollisionAndPop = useCallback((clientX: number, clientY: number): void => {
    const el = document.elementFromPoint(clientX, clientY);
    if (!el) return;
    const keyEl = el.closest('[data-key-id]');
    if (!keyEl) return;
    const keyId = keyEl.getAttribute('data-key-id');
    if (!keyId) return;
    if (poppedThisDragRef.current.has(keyId)) return;
    poppedThisDragRef.current.add(keyId);
    onPopKeyIdRef.current(keyId);
  }, []);

  const handleMouseMove = useCallback((event: MouseEvent): void => {
    if (!isDraggingRef.current) return;
    if (rafIdRef.current) { cancelAnimationFrame(rafIdRef.current); }
    rafIdRef.current = requestAnimationFrame(() => {
      checkCollisionAndPop(event.clientX, event.clientY);
    });
  }, [checkCollisionAndPop]);

  const handleMouseUp = useCallback((): void => {
    isDraggingRef.current = false;
    poppedThisDragRef.current.clear();
    if (rafIdRef.current) { cancelAnimationFrame(rafIdRef.current); rafIdRef.current = 0; }
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  }, [handleMouseMove]);

  const handleMouseDown = useCallback((event: MouseEvent): void => {
    const container = containerRef.current;
    if (!container) return;
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const keyEl = target.closest('[data-key-id]');
    if (!keyEl) return;
    const keyId = keyEl.getAttribute('data-key-id');
    if (!keyId) return;
    isDraggingRef.current = true;
    poppedThisDragRef.current.clear();
    poppedThisDragRef.current.add(keyId);
    onPopKeyIdRef.current(keyId);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [containerRef, handleMouseMove, handleMouseUp]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.addEventListener('mousedown', handleMouseDown);
    return () => {
      container.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      if (rafIdRef.current) { cancelAnimationFrame(rafIdRef.current); }
    };
  }, [containerRef, handleMouseDown, handleMouseMove, handleMouseUp]);
}
