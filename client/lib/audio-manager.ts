// Synthesized sound effects using Web Audio API (no external files)
// All sounds are short and low-volume to avoid being intrusive

import { loadSettings } from './settings-store';

const GAIN = 0.15;

let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  // Resume if suspended (browser autoplay policy)
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

function isSoundEnabled(): boolean {
  return loadSettings().soundEnabled;
}

// Helper: play a simple tone
function tone(
  freq: number,
  duration: number,
  type: OscillatorType = 'sine',
  gain = GAIN,
): void {
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const vol = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime);
  vol.gain.setValueAtTime(gain, ctx.currentTime);
  // Fade out to avoid click
  vol.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  osc.connect(vol);
  vol.connect(ctx.destination);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + duration);
}

// Helper: play a frequency sweep
function sweep(
  startFreq: number,
  endFreq: number,
  duration: number,
  type: OscillatorType = 'sine',
  gain = GAIN,
): void {
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const vol = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(startFreq, ctx.currentTime);
  osc.frequency.linearRampToValueAtTime(endFreq, ctx.currentTime + duration);
  vol.gain.setValueAtTime(gain, ctx.currentTime);
  vol.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  osc.connect(vol);
  vol.connect(ctx.destination);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + duration);
}

// Helper: noise burst (for card-like sounds)
function noiseBurst(duration: number, gain = GAIN): void {
  const ctx = getCtx();
  const bufferSize = Math.ceil(ctx.sampleRate * duration);
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize); // fade
  }
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const vol = ctx.createGain();
  vol.gain.setValueAtTime(gain, ctx.currentTime);
  // Bandpass to make it sound like a card flick
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(3000, ctx.currentTime);
  filter.Q.setValueAtTime(1.5, ctx.currentTime);
  source.connect(filter);
  filter.connect(vol);
  vol.connect(ctx.destination);
  source.start(ctx.currentTime);
  source.stop(ctx.currentTime + duration);
}

// Short soft click
export function playCheck(): void {
  if (!isSoundEnabled()) return;
  tone(200, 0.05, 'sine', GAIN * 0.7);
}

// Chip toss: rising pitch
export function playBet(): void {
  if (!isSoundEnabled()) return;
  sweep(300, 500, 0.1, 'triangle');
}

// Low swoosh: falling pitch
export function playFold(): void {
  if (!isSoundEnabled()) return;
  sweep(150, 80, 0.1, 'sine', GAIN * 0.6);
}

// Pleasant C major chord
export function playWin(): void {
  if (!isSoundEnabled()) return;
  const g = GAIN * 0.5;
  tone(262, 0.3, 'sine', g); // C4
  tone(330, 0.3, 'sine', g); // E4
  tone(392, 0.3, 'sine', g); // G4
}

// Dramatic low tone sequence
export function playAllIn(): void {
  if (!isSoundEnabled()) return;
  const ctx = getCtx();

  // First tone
  const osc1 = ctx.createOscillator();
  const vol1 = ctx.createGain();
  osc1.type = 'sine';
  osc1.frequency.setValueAtTime(100, ctx.currentTime);
  vol1.gain.setValueAtTime(GAIN, ctx.currentTime);
  vol1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
  osc1.connect(vol1);
  vol1.connect(ctx.destination);
  osc1.start(ctx.currentTime);
  osc1.stop(ctx.currentTime + 0.2);

  // Second tone (higher, delayed)
  const osc2 = ctx.createOscillator();
  const vol2 = ctx.createGain();
  osc2.type = 'sine';
  osc2.frequency.setValueAtTime(200, ctx.currentTime + 0.2);
  vol2.gain.setValueAtTime(0.001, ctx.currentTime);
  vol2.gain.setValueAtTime(GAIN, ctx.currentTime + 0.2);
  vol2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
  osc2.connect(vol2);
  vol2.connect(ctx.destination);
  osc2.start(ctx.currentTime + 0.2);
  osc2.stop(ctx.currentTime + 0.4);
}

// Notification ping
export function playTurn(): void {
  if (!isSoundEnabled()) return;
  tone(880, 0.08, 'sine', GAIN * 0.6);
}

// Card flick noise burst
export function playDeal(): void {
  if (!isSoundEnabled()) return;
  noiseBurst(0.03, GAIN * 0.4);
}
