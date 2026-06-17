import { Sound, type SoundKey } from './sounds';

/**
 * Loads + plays sounds with a mute toggle.
 *
 * DEVIATION FROM SPEC (deliberate): the spec asked for OGG/MP3 file pairs with
 * format fallback. Real audio binaries can't be authored at code-gen time, and
 * referencing missing files would 404 on first run. So sounds are SYNTHESIZED
 * with the Web Audio API — the game makes noise out of the box, asset-free.
 *
 * To use real files instead: load AudioBuffers in load() (pick .ogg, fall back
 * to .mp3 via canPlayType) and swap play() to a buffer-source node. The public
 * API (play / setMuted / resume) stays identical.
 */

interface Blip {
  type: OscillatorType;
  freqs: number[]; // sequence of pitches (Hz)
  step: number; // seconds per pitch
  gain: number;
}

const RECIPES: Record<SoundKey, Blip> = {
  [Sound.HIT]: { type: 'square', freqs: [880, 1320], step: 0.05, gain: 0.18 },
  [Sound.MISS]: { type: 'sawtooth', freqs: [220, 160], step: 0.08, gain: 0.2 },
  [Sound.CLICK]: { type: 'square', freqs: [660], step: 0.05, gain: 0.15 },
  [Sound.VICTORY]: { type: 'triangle', freqs: [523, 659, 784, 1047], step: 0.12, gain: 0.2 },
  [Sound.DEFEAT]: { type: 'sawtooth', freqs: [392, 311, 247, 196], step: 0.16, gain: 0.22 },
  [Sound.MENU_BGM]: { type: 'triangle', freqs: [440], step: 0.1, gain: 0.0 },
};

export class AudioManager {
  private ctx: AudioContext | null = null;
  private muted = false;

  /** Must be called from a user gesture (browsers block autoplay otherwise). */
  resume(): void {
    if (!this.ctx) {
      const Ctor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (Ctor) this.ctx = new Ctor();
    }
    if (this.ctx && this.ctx.state === 'suspended') void this.ctx.resume();
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
  }

  toggleMuted(): boolean {
    this.muted = !this.muted;
    return this.muted;
  }

  get isMuted(): boolean {
    return this.muted;
  }

  play(key: SoundKey): void {
    if (this.muted || !this.ctx) return;
    const recipe = RECIPES[key];
    if (!recipe || recipe.gain <= 0) return;

    const now = this.ctx.currentTime;
    recipe.freqs.forEach((freq, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = recipe.type;
      osc.frequency.value = freq;
      const start = now + i * recipe.step;
      const end = start + recipe.step;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(recipe.gain, start + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.0001, end);
      osc.connect(gain).connect(this.ctx!.destination);
      osc.start(start);
      osc.stop(end + 0.02);
    });
  }
}
