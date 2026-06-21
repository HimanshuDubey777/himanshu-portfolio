// Web Audio API Synthesizer to generate mechanical keyboard clicks and interface sounds without audio assets

let audioCtx: AudioContext | null = null;

function getAudioContext() {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioCtx;
}

export function playSynthClick(type: "keypress" | "hover" | "beep" | "chime" | "error" = "keypress") {
  try {
    const ctx = getAudioContext();
    if (!ctx || ctx.state === "suspended") return;

    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    if (type === "keypress") {
      // Keypress simulation: quick, high-frequency white noise pop
      osc.type = "triangle";
      osc.frequency.setValueAtTime(150, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1000, ctx.currentTime + 0.03);

      gainNode.gain.setValueAtTime(0.015, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.03);

      osc.start();
      osc.stop(ctx.currentTime + 0.04);
    } else if (type === "hover") {
      // Subtle interface hover: very quiet click
      osc.type = "sine";
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.015);

      gainNode.gain.setValueAtTime(0.008, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.015);

      osc.start();
      osc.stop(ctx.currentTime + 0.02);
    } else if (type === "beep") {
      // Confirmation beep: pure sine tone
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, ctx.currentTime); // A5 note

      gainNode.gain.setValueAtTime(0.05, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.15);

      osc.start();
      osc.stop(ctx.currentTime + 0.16);
    } else if (type === "chime") {
      // Success chime: dual-tone quick arpeggio
      osc.type = "sine";
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.08); // E5

      gainNode.gain.setValueAtTime(0.06, ctx.currentTime);
      gainNode.gain.setValueAtTime(0.06, ctx.currentTime + 0.08);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.25);

      osc.start();
      osc.stop(ctx.currentTime + 0.26);
    } else if (type === "error") {
      // Warning buzz: low frequency sawtooth/square wave
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(110, ctx.currentTime); // A2 low frequency

      gainNode.gain.setValueAtTime(0.04, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.25);

      osc.start();
      osc.stop(ctx.currentTime + 0.26);
    }
  } catch (e) {
    // Fail silently if audio context is blocked or unsupported
  }
}

// Resume audio context on user interaction (required by modern browsers)
export function initAudioEngine() {
  const ctx = getAudioContext();
  if (ctx && ctx.state === "suspended") {
    ctx.resume().then(() => {
      playSynthClick("beep");
    });
  }
}
