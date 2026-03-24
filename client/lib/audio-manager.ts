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

// Cached female English voice
let cachedVoice: SpeechSynthesisVoice | null = null;
let voiceSearched = false;

function getCtx(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

function isSoundEnabled(): boolean {
  return loadSettings().soundEnabled;
}

// --- Voice Selection ---

const FEMALE_INDICATORS = [
  'samantha', 'victoria', 'karen', 'fiona', 'moira', 'tessa',
  'allison', 'ava', 'susan', 'zira', 'hazel', 'linda',
  'google uk english female', 'google us english female',
  'microsoft zira', 'female',
];

function findFemaleEnglishVoice(): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !window.speechSynthesis) return null;

  const voices = window.speechSynthesis.getVoices();
  if (voices.length === 0) return null;

  const englishVoices = voices.filter((v) => v.lang.startsWith('en'));
  if (englishVoices.length === 0) return null;

  // First pass: look for a voice whose name contains a female indicator
  for (const voice of englishVoices) {
    const nameLower = voice.name.toLowerCase();
    if (FEMALE_INDICATORS.some((indicator) => nameLower.includes(indicator))) {
      return voice;
    }
  }

  // Fallback: any English voice
  return englishVoices[0];
}

function getFemaleVoice(): SpeechSynthesisVoice | null {
  if (cachedVoice) return cachedVoice;
  if (voiceSearched) return cachedVoice; // already tried, nothing found

  cachedVoice = findFemaleEnglishVoice();
  voiceSearched = true;
  return cachedVoice;
}

// Voices load asynchronously in some browsers; listen for the event
if (typeof window !== 'undefined' && window.speechSynthesis) {
  window.speechSynthesis.onvoiceschanged = () => {
    voiceSearched = false;
    cachedVoice = null;
  };
}

// --- Helpers ---

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
  vol.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  osc.connect(vol);
  vol.connect(ctx.destination);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + duration);
}

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

// Filtered noise burst helper
function filteredNoise(
  duration: number,
  filterFreq: number,
  filterQ: number,
  filterType: BiquadFilterType,
  gain: number,
  startTime?: number,
): void {
  const ctx = getCtx();
  const t = startTime ?? ctx.currentTime;
  const bufferSize = Math.ceil(ctx.sampleRate * duration);
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
  }
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = filterType;
  filter.frequency.setValueAtTime(filterFreq, t);
  filter.Q.setValueAtTime(filterQ, t);
  const vol = ctx.createGain();
  vol.gain.setValueAtTime(gain, t);
  vol.gain.exponentialRampToValueAtTime(0.001, t + duration);
  source.connect(filter);
  filter.connect(vol);
  vol.connect(ctx.destination);
  source.start(t);
  source.stop(t + duration);
}

// --- Sound Effects ---

// Soft tap on felt
export function playCheck(): void {
  if (!isSoundEnabled()) return;
  const ctx = getCtx();
  const t = ctx.currentTime;

  // Muted thump: very short low sine
  const osc = ctx.createOscillator();
  const vol = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(120, t);
  vol.gain.setValueAtTime(0.08, t);
  vol.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
  osc.connect(vol);
  vol.connect(ctx.destination);
  osc.start(t);
  osc.stop(t + 0.04);

  // Tiny felt noise on top
  filteredNoise(0.025, 1500, 0.8, 'lowpass', 0.04);
}

// Chip toss with pitch variety
export function playBet(): void {
  if (!isSoundEnabled()) return;
  const ctx = getCtx();
  const t = ctx.currentTime;

  // 2-3 rapid chip clicks at varied pitches
  const clicks = 2 + Math.floor(Math.random() * 2);
  for (let i = 0; i < clicks; i++) {
    const delay = i * 0.035;
    const freq = 1200 + Math.random() * 1800; // 1200-3000Hz metallic
    const st = t + delay;

    // Sine click
    const osc = ctx.createOscillator();
    const vol = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, st);
    const g = GAIN * (0.5 + Math.random() * 0.5);
    vol.gain.setValueAtTime(g, st);
    vol.gain.exponentialRampToValueAtTime(0.001, st + 0.015);
    osc.connect(vol);
    vol.connect(ctx.destination);
    osc.start(st);
    osc.stop(st + 0.015);

    // Square harmonic for metallic edge
    const osc2 = ctx.createOscillator();
    const vol2 = ctx.createGain();
    osc2.type = 'square';
    osc2.frequency.setValueAtTime(freq * 1.5, st);
    vol2.gain.setValueAtTime(g * 0.15, st);
    vol2.gain.exponentialRampToValueAtTime(0.001, st + 0.01);
    osc2.connect(vol2);
    vol2.connect(ctx.destination);
    osc2.start(st);
    osc2.stop(st + 0.01);
  }
}

// Card slide sound: filtered noise sweep
export function playFold(): void {
  if (!isSoundEnabled()) return;
  const ctx = getCtx();
  const t = ctx.currentTime;
  const duration = 0.15;
  const bufferSize = Math.ceil(ctx.sampleRate * duration);
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    // Noise with linear fade
    data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
  }
  const source = ctx.createBufferSource();
  source.buffer = buffer;

  // Highpass filter that sweeps up (card sliding away)
  const filter = ctx.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.setValueAtTime(400, t);
  filter.frequency.linearRampToValueAtTime(2000, t + duration);
  filter.Q.setValueAtTime(1.0, t);

  const vol = ctx.createGain();
  vol.gain.setValueAtTime(GAIN * 0.5, t);
  vol.gain.exponentialRampToValueAtTime(0.001, t + duration);

  source.connect(filter);
  filter.connect(vol);
  vol.connect(ctx.destination);
  source.start(t);
  source.stop(t + duration);
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

// Card deal: sharper snap
export function playDeal(): void {
  if (!isSoundEnabled()) return;
  const ctx = getCtx();
  const t = ctx.currentTime;

  // Sharp high-frequency noise snap
  const snapLen = 0.018;
  const bufferSize = Math.ceil(ctx.sampleRate * snapLen);
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    // Exponential decay for sharp attack
    const env = Math.exp(-i / (bufferSize * 0.15));
    data[i] = (Math.random() * 2 - 1) * env;
  }
  const source = ctx.createBufferSource();
  source.buffer = buffer;

  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(4000, t);
  filter.Q.setValueAtTime(2.0, t);

  const vol = ctx.createGain();
  vol.gain.setValueAtTime(GAIN * 0.6, t);

  source.connect(filter);
  filter.connect(vol);
  vol.connect(ctx.destination);
  source.start(t);
  source.stop(t + snapLen);
}

// --- Voice Announcements ---

export function speakAction(action: string): void {
  if (!isSoundEnabled()) return;
  if (typeof window === 'undefined') return;
  if (!window.speechSynthesis) return;

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(action);
  utterance.lang = 'en-US';

  // Select female English voice
  const voice = getFemaleVoice();
  if (voice) {
    utterance.voice = voice;
  }

  const isAllIn = action.toLowerCase() === 'all in';

  if (isAllIn) {
    // Dramatic contrast for all-in
    utterance.volume = 0.7;
    utterance.rate = 0.85;
    utterance.pitch = 0.9;
  } else {
    utterance.volume = 0.7;
    utterance.rate = 1.0;
    utterance.pitch = 1.1; // slightly higher = more feminine
  }

  window.speechSynthesis.speak(utterance);
}

// --- All-in BGM (tense drone) ---

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

  // Tremolo LFO
  allInTremoloOsc = ctx.createOscillator();
  allInTremoloOsc.type = 'sine';
  allInTremoloOsc.frequency.setValueAtTime(0.5, ctx.currentTime);
  const tremoloGain = ctx.createGain();
  tremoloGain.gain.setValueAtTime(0.015, ctx.currentTime);
  allInTremoloOsc.connect(tremoloGain);
  tremoloGain.connect(allInPulseGain.gain);
  allInTremoloOsc.start(ctx.currentTime);
}

export function stopAllInBGM(): void {
  if (!allInBGMActive) return;

  const ctx = getCtx();
  const fadeTime = 0.3;
  const stopTime = ctx.currentTime + fadeTime;

  if (allInDroneGain) {
    allInDroneGain.gain.setValueAtTime(allInDroneGain.gain.value, ctx.currentTime);
    allInDroneGain.gain.linearRampToValueAtTime(0, stopTime);
  }
  if (allInDroneOsc) {
    allInDroneOsc.stop(stopTime);
    allInDroneOsc = null;
  }
  allInDroneGain = null;

  if (allInPulseGain) {
    allInPulseGain.gain.setValueAtTime(allInPulseGain.gain.value, ctx.currentTime);
    allInPulseGain.gain.linearRampToValueAtTime(0, stopTime);
  }
  if (allInPulseOsc) {
    allInPulseOsc.stop(stopTime);
    allInPulseOsc = null;
  }
  allInPulseGain = null;

  if (allInTremoloOsc) {
    allInTremoloOsc.stop(stopTime);
    allInTremoloOsc = null;
  }

  allInBGMActive = false;
}

// --- Pot Win: Chip Cascade ---

export function playPotWin(): void {
  if (!isSoundEnabled()) return;

  const ctx = getCtx();
  const t = ctx.currentTime;
  const clickCount = 12 + Math.floor(Math.random() * 5); // 12-16 clicks
  const totalDuration = 0.6; // 600ms total

  // Low swoosh underneath (filtered noise, 200ms)
  const swooshLen = 0.2;
  const swooshBufSize = Math.ceil(ctx.sampleRate * swooshLen);
  const swooshBuf = ctx.createBuffer(1, swooshBufSize, ctx.sampleRate);
  const swooshData = swooshBuf.getChannelData(0);
  for (let i = 0; i < swooshBufSize; i++) {
    swooshData[i] = (Math.random() * 2 - 1);
  }
  const swooshSource = ctx.createBufferSource();
  swooshSource.buffer = swooshBuf;
  const swooshFilter = ctx.createBiquadFilter();
  swooshFilter.type = 'lowpass';
  swooshFilter.frequency.setValueAtTime(300, t);
  swooshFilter.frequency.linearRampToValueAtTime(150, t + swooshLen);
  swooshFilter.Q.setValueAtTime(1.0, t);
  const swooshVol = ctx.createGain();
  swooshVol.gain.setValueAtTime(GAIN * 0.4, t);
  swooshVol.gain.exponentialRampToValueAtTime(0.001, t + swooshLen);
  swooshSource.connect(swooshFilter);
  swooshFilter.connect(swooshVol);
  swooshVol.connect(ctx.destination);
  swooshSource.start(t);
  swooshSource.stop(t + swooshLen);

  // Rapid metallic clicks
  for (let i = 0; i < clickCount; i++) {
    const baseDelay = (i / clickCount) * totalDuration;
    const jitter = (Math.random() - 0.5) * 0.015;
    const delay = Math.max(0, baseDelay + jitter);
    const st = t + delay;

    // Metallic frequency: 800-3000Hz
    const freq = 800 + Math.random() * 2200;
    const clickLen = 0.01 + Math.random() * 0.005; // 10-15ms

    // Primary sine click
    const osc = ctx.createOscillator();
    const vol = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, st);
    const clickGain = GAIN * (0.5 + Math.random() * 0.5);
    vol.gain.setValueAtTime(clickGain, st);
    // Envelope with slight tail for reverb feel
    vol.gain.setTargetAtTime(0.001, st + clickLen * 0.3, clickLen * 0.4);
    osc.connect(vol);
    vol.connect(ctx.destination);
    osc.start(st);
    osc.stop(st + clickLen + 0.02); // extra tail

    // Square harmonic for metallic bite
    const osc2 = ctx.createOscillator();
    const vol2 = ctx.createGain();
    osc2.type = 'square';
    osc2.frequency.setValueAtTime(freq * 1.5, st);
    vol2.gain.setValueAtTime(clickGain * 0.12, st);
    vol2.gain.setTargetAtTime(0.001, st + clickLen * 0.2, clickLen * 0.3);
    osc2.connect(vol2);
    vol2.connect(ctx.destination);
    osc2.start(st);
    osc2.stop(st + clickLen + 0.015);
  }
}
