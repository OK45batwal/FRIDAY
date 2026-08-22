/**
 * Futuristic Web Audio synthesizer chime for Wake Word activation.
 * Zero external audio assets required.
 */
export const playWakeChime = () => {
  if (typeof window === 'undefined') return;
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    const now = ctx.currentTime;
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc1.type = 'sine';
    osc2.type = 'triangle';

    // Futuristic two-tone chime (F#5 -> C#6)
    osc1.frequency.setValueAtTime(739.99, now);
    osc1.frequency.exponentialRampToValueAtTime(1108.73, now + 0.12);

    osc2.frequency.setValueAtTime(739.99 * 2, now);
    osc2.frequency.exponentialRampToValueAtTime(1108.73 * 2, now + 0.12);

    gainNode.gain.setValueAtTime(0.15, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);

    osc1.stop(now + 0.35);
    osc2.stop(now + 0.35);
  } catch (e) {
    console.error("Failed to play wake chime:", e);
  }
};
