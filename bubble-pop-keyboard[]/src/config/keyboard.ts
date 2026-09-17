import type { KeyConfig } from "../types";

// 迪士尼魔法色系
const DISNEY_COLORS: string[] = [
  "#FDB750", "#F2A7B3", "#A8D8EA", "#C3AED6",
  "#FFD1A9", "#F8C8DC", "#B8E0D2", "#FFE5B4",
  "#D4A5D7", "#FAE3C6",
];

function pickColor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  return DISNEY_COLORS[Math.abs(hash) % DISNEY_COLORS.length]!;
}

function key(id: string, code: string, row: number, col: number, width: number = 1): KeyConfig {
  const color = pickColor(id);
  return { id, code, row, col, width, color };
}

const row0: KeyConfig[] = [
  key("Backquote", "Backquote", 0, 0), key("Digit1", "Digit1", 0, 1),
  key("Digit2", "Digit2", 0, 2), key("Digit3", "Digit3", 0, 3),
  key("Digit4", "Digit4", 0, 4), key("Digit5", "Digit5", 0, 5),
  key("Digit6", "Digit6", 0, 6), key("Digit7", "Digit7", 0, 7),
  key("Digit8", "Digit8", 0, 8), key("Digit9", "Digit9", 0, 9),
  key("Digit0", "Digit0", 0, 10), key("Minus", "Minus", 0, 11),
  key("Equal", "Equal", 0, 12),
];

const row1: KeyConfig[] = [
  key("KeyQ", "KeyQ", 1, 1), key("KeyW", "KeyW", 1, 2),
  key("KeyE", "KeyE", 1, 3), key("KeyR", "KeyR", 1, 4),
  key("KeyT", "KeyT", 1, 5), key("KeyY", "KeyY", 1, 6),
  key("KeyU", "KeyU", 1, 7), key("KeyI", "KeyI", 1, 8),
  key("KeyO", "KeyO", 1, 9), key("KeyP", "KeyP", 1, 10),
  key("BracketLeft", "BracketLeft", 1, 11), key("BracketRight", "BracketRight", 1, 12),
  key("Backslash", "Backslash", 1, 13),
];

const row2: KeyConfig[] = [
  key("KeyA", "KeyA", 2, 2), key("KeyS", "KeyS", 2, 3),
  key("KeyD", "KeyD", 2, 4), key("KeyF", "KeyF", 2, 5),
  key("KeyG", "KeyG", 2, 6), key("KeyH", "KeyH", 2, 7),
  key("KeyJ", "KeyJ", 2, 8), key("KeyK", "KeyK", 2, 9),
  key("KeyL", "KeyL", 2, 10), key("Semicolon", "Semicolon", 2, 11),
  key("Quote", "Quote", 2, 12),
];

const row3: KeyConfig[] = [
  key("KeyZ", "KeyZ", 3, 3), key("KeyX", "KeyX", 3, 4),
  key("KeyC", "KeyC", 3, 5), key("KeyV", "KeyV", 3, 6),
  key("KeyB", "KeyB", 3, 7), key("KeyN", "KeyN", 3, 8),
  key("KeyM", "KeyM", 3, 9), key("Comma", "Comma", 3, 10),
  key("Period", "Period", 3, 11), key("Slash", "Slash", 3, 12),
];

const row4: KeyConfig[] = [key("Space", "Space", 4, 4, 6)];

export const KEYBOARD_ROWS: KeyConfig[][] = [row0, row1, row2, row3, row4];

export const CODE_TO_KEY: Record<string, KeyConfig> = {};
for (const row of KEYBOARD_ROWS) {
  for (const k of row) {
    CODE_TO_KEY[k.code] = k;
  }
}

export const MODIFIER_CODES: ReadonlySet<string> = new Set([
  "ShiftLeft", "ShiftRight", "ControlLeft", "ControlRight",
  "AltLeft", "AltRight", "MetaLeft", "MetaRight", "CapsLock", "Tab",
]);

export const ROW_OFFSETS: readonly number[] = [0, 1, 1.5, 2, 3] as const;
export const MAX_COLS = 14;
