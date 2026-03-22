// Generates a short notification chime using the Web Audio API
// No external sound files needed

const AudioCtx = typeof window !== "undefined" ? (window.AudioContext || (window as any).webkitAudioContext) : null;

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (!AudioCtx) return null;
  if (!ctx || ctx.state === "closed") {
    ctx = new AudioCtx();
  }
  return ctx;
}

export function playSuccessChime() {
  const c = getCtx();
  if (!c) return;
  // Resume if suspended (autoplay policy)
  if (c.state === "suspended") c.resume();

  const now = c.currentTime;

  // Two-tone ascending chime
  [523.25, 659.25].forEach((freq, i) => {
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, now + i * 0.12);
    gain.gain.linearRampToValueAtTime(0.18, now + i * 0.12 + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.35);
    osc.connect(gain).connect(c.destination);
    osc.start(now + i * 0.12);
    osc.stop(now + i * 0.12 + 0.4);
  });
}

export function playAlertChime() {
  const c = getCtx();
  if (!c) return;
  if (c.state === "suspended") c.resume();

  const now = c.currentTime;

  // Single attention tone
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = "triangle";
  osc.frequency.value = 440;
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.2, now + 0.03);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
  osc.connect(gain).connect(c.destination);
  osc.start(now);
  osc.stop(now + 0.55);
}
