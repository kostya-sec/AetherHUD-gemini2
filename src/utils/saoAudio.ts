/**
 * SAO-Style Web Audio Synthesizer & Custom Audio Loader
 * Supports custom uploaded audio files for each action,
 * with synthesized retro-pixel SAO tones as default fallback.
 */

export type SoundAction = 'summon' | 'select' | 'hover' | 'ingest' | 'dismiss' | 'success';

let audioCtx: AudioContext | null = null;
let isMuted = false;
let masterVolume = 0.8;

// Cache of custom audio data URLs
const customSounds: Record<string, string> = {};

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

function playCustomOrFallback(action: SoundAction, fallbackSynth: () => void) {
  if (isMuted || masterVolume <= 0) return;

  const customSrc = customSounds[action];
  if (customSrc) {
    try {
      const audio = new Audio(customSrc);
      audio.volume = masterVolume;
      audio.play().catch(() => fallbackSynth());
      return;
    } catch {
      fallbackSynth();
      return;
    }
  }
  fallbackSynth();
}

export const saoAudio = {
  isMuted: () => isMuted,
  setMuted: (muted: boolean) => {
    isMuted = muted;
    try {
      localStorage.setItem('sao_audio_muted', muted ? 'true' : 'false');
    } catch {}
  },
  getVolume: () => masterVolume,
  setVolume: (vol: number) => {
    masterVolume = Math.max(0, Math.min(1, vol));
    try {
      localStorage.setItem('sao_audio_volume', masterVolume.toString());
    } catch {}
  },
  init: () => {
    try {
      isMuted = localStorage.getItem('sao_audio_muted') === 'true';
      const savedVol = localStorage.getItem('sao_audio_volume');
      if (savedVol !== null) {
        masterVolume = parseFloat(savedVol);
      }
      const actions: SoundAction[] = ['summon', 'select', 'hover', 'ingest', 'dismiss', 'success'];
      actions.forEach(act => {
        const custom = localStorage.getItem(`sao_custom_sound_${act}`);
        if (custom) {
          customSounds[act] = custom;
        }
      });
    } catch {}
  },

  // Custom sound handlers
  setCustomSound: (action: SoundAction, dataUrl: string) => {
    customSounds[action] = dataUrl;
    try {
      localStorage.setItem(`sao_custom_sound_${action}`, dataUrl);
    } catch {}
  },

  removeCustomSound: (action: SoundAction) => {
    delete customSounds[action];
    try {
      localStorage.removeItem(`sao_custom_sound_${action}`);
    } catch {}
  },

  hasCustomSound: (action: SoundAction) => {
    return Boolean(customSounds[action]);
  },

  resetAllCustomSounds: () => {
    const actions: SoundAction[] = ['summon', 'select', 'hover', 'ingest', 'dismiss', 'success'];
    actions.forEach(act => {
      delete customSounds[act];
      try {
        localStorage.removeItem(`sao_custom_sound_${act}`);
      } catch {}
    });
  },

  // Hover tick: soft crystal blip
  playHover: () => {
    playCustomOrFallback('hover', () => {
      const ctx = getAudioContext();
      if (!ctx) return;
      try {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square'; // Pixel-friendly chiptune click
        osc.frequency.setValueAtTime(1200, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1600, ctx.currentTime + 0.03);

        const targetGain = 0.03 * masterVolume;
        gain.gain.setValueAtTime(targetGain, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.035);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.04);
      } catch {}
    });
  },

  // Click/Select: crisp retro SAO action
  playSelect: () => {
    playCustomOrFallback('select', () => {
      const ctx = getAudioContext();
      if (!ctx) return;
      try {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(987.77, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1318.5, ctx.currentTime + 0.06);

        const targetGain = 0.07 * masterVolume;
        gain.gain.setValueAtTime(targetGain, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.07);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.08);
      } catch {}
    });
  },

  // Menu summon: iconic SAO cascading chime
  playSummon: () => {
    playCustomOrFallback('summon', () => {
      const ctx = getAudioContext();
      if (!ctx) return;
      try {
        const now = ctx.currentTime;
        const notes = [587.33, 880, 1174.66]; // D5, A5, D6 (warm earth tone triad)
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + idx * 0.04);

          gain.gain.setValueAtTime(0, now + idx * 0.04);
          gain.gain.linearRampToValueAtTime(0.08 * masterVolume, now + idx * 0.04 + 0.01);
          gain.gain.exponentialRampToValueAtTime(0.0005, now + idx * 0.04 + 0.15);

          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + idx * 0.04);
          osc.stop(now + idx * 0.04 + 0.16);
        });
      } catch {}
    });
  },

  // Dismiss / Close
  playDismiss: () => {
    playCustomOrFallback('dismiss', () => {
      const ctx = getAudioContext();
      if (!ctx) return;
      try {
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.exponentialRampToValueAtTime(440, now + 0.09);

        gain.gain.setValueAtTime(0.05 * masterVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.1);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.11);
      } catch {}
    });
  },

  // Play Success Tone
  playSuccess: () => {
    playCustomOrFallback('success', () => {
      const ctx = getAudioContext();
      if (!ctx) return;
      try {
        const now = ctx.currentTime;
        const notes = [659.25, 987.77];
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + idx * 0.05);

          gain.gain.setValueAtTime(0.07 * masterVolume, now + idx * 0.05);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.14);

          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + idx * 0.05);
          osc.stop(now + idx * 0.05 + 0.15);
        });
      } catch {}
    });
  },

  // Ingest Success: confirmation harmonic
  playIngest: () => {
    playCustomOrFallback('ingest', () => {
      const ctx = getAudioContext();
      if (!ctx) return;
      try {
        const now = ctx.currentTime;
        const notes = [440, 554.37, 659.25, 880]; // Warm A major chord
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + idx * 0.03);

          gain.gain.setValueAtTime(0.07 * masterVolume, now + idx * 0.03);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.03 + 0.2);

          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + idx * 0.03);
          osc.stop(now + idx * 0.03 + 0.22);
        });
      } catch {}
    });
  }
};
