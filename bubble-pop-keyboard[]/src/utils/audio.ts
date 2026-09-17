import type { PopSoundConfig } from '../types';

export function createNoiseBuffer(ctx: AudioContext, durationSec: number = 0.15): AudioBuffer {
  const sampleRate: number = ctx.sampleRate;
  const length: number = Math.ceil(sampleRate * durationSec);
  const buffer: AudioBuffer = ctx.createBuffer(1, length, sampleRate);
  const data: Float32Array = buffer.getChannelData(0)!;
  for (let i: number = 0; i < length; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  return buffer;
}

export function playPopSound(ctx: AudioContext, noiseBuffer: AudioBuffer, config: PopSoundConfig): void {
  const { baseFrequency, frequencyVariation, duration, pitchMultiplier } = config;
  const freq: number = baseFrequency * (1 + (Math.random() * 2 - 1) * frequencyVariation) * pitchMultiplier;

  const source: AudioBufferSourceNode = ctx.createBufferSource();
  source.buffer = noiseBuffer;

  const filter: BiquadFilterNode = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = Math.max(2000, Math.min(8000, freq));
  filter.Q.value = 1.5;

  const gain: GainNode = ctx.createGain();
  gain.gain.setValueAtTime(0.6, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration / 1000);

  source.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  source.start(ctx.currentTime);
  source.stop(ctx.currentTime + duration / 1000 + 0.02);
}

export const DEFAULT_POP_CONFIG: PopSoundConfig = {
  baseFrequency: 5000, frequencyVariation: 0.2, duration: 100, pitchMultiplier: 1.0,
};
