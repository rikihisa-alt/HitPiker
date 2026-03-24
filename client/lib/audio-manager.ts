// Synthesized sound effects using Web Audio API (no external files)
// All sounds are short and low-volume to avoid being intrusive

import { loadSettings } from './settings-store';

const GAIN = 0.15;

let audioCtx: AudioContext | null = null;

// All-in BGM state
let allInDroneOsc: OscillatorNode | null = null;
let allInDroneGain: GainNode | null = null;
let allInPulseOsc: OscillatorNode | null = null;
let allInPulseGain: GainNode | null = null;
let allInTremoloOsc: OscillatorNode | null = null;
let allInBGMActive = false;

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

// --- Feature 1: Voice Announcements ---

export function speakAction(action: string): void {
  if (!isSoundEnabled()) return;
  if (typeof window === 'undefined') return;
  if (!window.speechSynthesis) return;

  // Cancel any ongoing speech to avoid overlap
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(action);
  utterance.lang = 'en-US';
  utterance.volume = 0.6;

  // All-in gets a dramatic, slightly slower delivery
  if (action.toLowerCase() === 'all in') {
    utterance.rate = 0.8;
    utterance.pitch = 0.8;
  } else {
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
  }

  window.speechSynthesis.speak(utterance);
}

// --- Feature 2: All-in BGM (tense drone) ---

export function startAllInBGM(): void {
  if (!isSoundEnabled()) return;
  if (allInBGMActive) return;

  const ctx = getCtx();
  allInBGMActive = true;

  // Low drone: 60Hz sine wave
  allInDroneOsc = ctx.createOscillator();
  allInDroneGain = ctx.createGain();
  allInDroneOsc.type = 'sine';
  allInDroneOsc.frequency.setValueAtTime(60, ctx.currentTime);
  allInDroneGain.gain.setValueAtTime(0.03, ctx.currentTime);
  allInDroneOsc.connect(allInDroneGain);
  allInDroneGain.connect(ctx.destination);
  allInDroneOsc.start(ctx.currentTime);

  // Subtle pulsing: 120Hz triangle wave with tremolo
  allInPulseOsc = ctx.createOscillator();
  allInPulseGain = ctx.createGain();
  allInPulseOsc.type = 'triangle';
  allInPulseOsc.frequency.setValueAtTime(120, ctx.currentTime);
  allInPulseGain.gain.setValueAtTime(0.02, ctx.currentTime);
  allInPulseOsc.connect(allInPulseGain);
  allInPulseGain.connect(ctx.destination);
  allInPulseOsc.start(ctx.currentTime);

  // Tremolo LFO: slow volume oscillation on the pulse
  allInTremoloOsc = ctx.createOscillator();
  allInTremoloOsc.type = 'sine';
  allInTremoloOsc.frequency.setValueAtTime(0.5, ctx.currentTime); // 0.5 Hz = slow pulse
  const tremoloGain = ctx.createGain();
  tremoloGain.gain.setValueAtTime(0.015, ctx.currentTime);
  allInTremoloOsc.connect(tremoloGain);
  tremoloGain.connect(allInPulseGain.gain);
  allInTremoloOsc.start(ctx.currentTime);
}

export function stopAllInBGM(): void {
  if (!allInBGMActive) return;

  const ctx = getCtx();
  const fadeTime = 0.3; // 300ms fade-out
  const stopTime = ctx.currentTime + fadeTime;

  // Fade out drone
  if (allInDroneGain) {
    allInDroneGain.gain.setValueAtTime(allInDroneGain.gain.value, ctx.currentTime);
    allInDroneGain.gain.linearRampToValueAtTime(0, stopTime);
  }
  if (allInDroneOsc) {
    allInDroneOsc.stop(stopTime);
    allInDroneOsc = null;
  }
  allInDroneGain = null;

  // Fade out pulse
  if (allInPulseGain) {
    allInPulseGain.gain.setValueAtTime(allInPulseGain.gain.value, ctx.currentTime);
    allInPulseGain.gain.linearRampToValueAtTime(0, stopTime);
  }
  if (allInPulseOsc) {
    allInPulseOsc.stop(stopTime);
    allInPulseOsc = null;
  }
  allInPulseGain = null;

  // Stop tremolo
  if (allInTremoloOsc) {
    allInTremoloOsc.stop(stopTime);
    allInTremoloOsc = null;
  }

  allInBGMActive = false;
}

// --- Feature 3: Pot Collection Sound ---

export function playPotWin(): void {
  if (!isSoundEnabled()) return;

  const ctx = getCtx();
  const clickCount = 5 + Math.floor(Math.random() * 4); // 5-8 clicks
  const totalDuration = 0.4; // 400ms total

  for (let i = 0; i < clickCount; i++) {
    // Stagger timing with slight randomization
    const baseDelay = (i / clickCount) * totalDuration;
    const jitter = (Math.random() - 0.5) * 0.02; // +/- 10ms
    const delay = Math.max(0, baseDelay + jitter);
    const startTime = ctx.currentTime + delay;

    // Random pitch between 200-600Hz
    const freq = 200 + Math.random() * 400;

    const osc = ctx.createOscillator();
    const vol = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, startTime);

    const clickGain = GAIN * (0.6 + Math.random() * 0.4); // slight volume variation
    vol.gain.setValueAtTime(clickGain, startTime);
    vol.gain.exponentialRampToValueAtTime(0.001, startTime + 0.02); // 20ms each click

    osc.connect(vol);
    vol.connect(ctx.destination);
    osc.start(startTime);
    osc.stop(startTime + 0.02);
  }
}
