export type KeyPhase = "idle" | "popping" | "respawning";

export interface KeyConfig {
  id: string;
  code: string;
  row: number;
  col: number;
  width: number;
  color: string;
}

export interface Particle {
  id: number;
  dx: number;
  dy: number;
  size: number;
  color: string;
  duration: number;
  shape: "circle" | "square";
  sparkleType?: "sparkle" | "dot" | "bubble";
}

export interface ParticleBurstConfig {
  keyId: string;
  x: number;
  y: number;
  color: string;
  count: number;
}

export interface PopSoundConfig {
  baseFrequency: number;
  frequencyVariation: number;
  duration: number;
  pitchMultiplier: number;
}

export interface KeyboardLayout {
  rows: KeyConfig[][];
  codeToKey: Record<string, KeyConfig>;
}
