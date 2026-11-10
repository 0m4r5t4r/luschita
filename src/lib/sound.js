import { SOUND_KEY } from '../data/constants';

// Efectos de "gotas" generados con Web Audio (sin archivos externos).
let audioCtx = null;
let enabled = true;
try { enabled = localStorage.getItem(SOUND_KEY) !== '0'; } catch { /* noop */ }

function initAudio() {
  if (!audioCtx) {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    audioCtx = new Ctx();
  }
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

function playDrop(baseFreq = 600, volume = 0.35, decay = 0.18) {
  if (!enabled) return;
  try {
    const ctx = initAudio();
    if (!ctx) return;
    const now = ctx.currentTime;
    const master = ctx.createGain();
    master.gain.setValueAtTime(volume, now);
    master.connect(ctx.destination);

    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(baseFreq * 1.2, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.35, now + decay * 0.8);
    oscGain.gain.setValueAtTime(0, now);
    oscGain.gain.linearRampToValueAtTime(1, now + 0.004);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + decay);
    osc.connect(oscGain); oscGain.connect(master);
    osc.start(now); osc.stop(now + decay + 0.02);

    const size = Math.floor(ctx.sampleRate * 0.12);
    const buffer = ctx.createBuffer(1, size, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < size; i++) data[i] = Math.random() * 2 - 1;
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(baseFreq * 2, now);
    filter.Q.value = 1.2;
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0, now);
    noiseGain.gain.linearRampToValueAtTime(0.6, now + 0.008);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    noise.connect(filter); filter.connect(noiseGain); noiseGain.connect(master);
    noise.start(now); noise.stop(now + 0.12);

    const echo = ctx.createOscillator();
    const echoGain = ctx.createGain();
    echo.type = 'sine';
    echo.frequency.setValueAtTime(baseFreq * 2.5, now + 0.03);
    echo.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, now + 0.1);
    echoGain.gain.setValueAtTime(0, now + 0.03);
    echoGain.gain.linearRampToValueAtTime(0.25, now + 0.04);
    echoGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    echo.connect(echoGain); echoGain.connect(master);
    echo.start(now + 0.03); echo.stop(now + 0.14);
  } catch { /* el audio nunca debe romper la app */ }
}

export const sounds = {
  click: () => playDrop(650, 0.28, 0.14),
  success: () => { playDrop(550, 0.35, 0.16); setTimeout(() => playDrop(750, 0.28, 0.18), 80); },
  error: () => { playDrop(280, 0.4, 0.25); setTimeout(() => playDrop(220, 0.3, 0.22), 90); },
  hover: () => playDrop(900, 0.08, 0.1),
  navigate: () => playDrop(680, 0.22, 0.15),
  splash: () => {
    playDrop(420, 0.4, 0.2);
    setTimeout(() => playDrop(620, 0.25, 0.15), 60);
    setTimeout(() => playDrop(800, 0.2, 0.12), 120);
  },
};

export const isSoundEnabled = () => enabled;
export function setSoundEnabled(value) {
  enabled = value;
  try { localStorage.setItem(SOUND_KEY, value ? '1' : '0'); } catch { /* noop */ }
  if (value) playDrop(700, 0.25, 0.15);
}
