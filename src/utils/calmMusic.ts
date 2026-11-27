// Peaceful, meditative ambient Nativity music synthesizer using Web Audio API.
// Works offline with zero external audio files and soft fade-in / fade-out transitions.

interface ChordStep {
  padFreqs: number[];
  melodyNotes: number[];
}

// Gentle Cmaj7 -> Am7 -> Fmaj7 -> G6 contemplative progression (warm low register)
const PROGRESSION: ChordStep[] = [
  { padFreqs: [130.81, 196.0, 246.94, 329.63], melodyNotes: [392.0, 440.0, 392.0, 329.63] },
  { padFreqs: [110.0, 164.81, 220.0, 261.63], melodyNotes: [329.63, 392.0, 440.0, 329.63] },
  { padFreqs: [87.31, 174.61, 220.0, 329.63], melodyNotes: [523.25, 440.0, 392.0, 329.63] },
  { padFreqs: [98.0, 196.0, 246.94, 293.66], melodyNotes: [392.0, 329.63, 293.66, 392.0] },
];

class CalmMusicEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private padFilter: BiquadFilterNode | null = null;
  private melodyBus: GainNode | null = null;
  private stepTimer: number | null = null;
  private playing = false;
  private stepIndex = 0;

  private ensureGraph(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return null;

    if (!this.ctx) {
      const ctx = new AudioCtx();
      const master = ctx.createGain();
      master.gain.setValueAtTime(0.0001, ctx.currentTime);
      master.connect(ctx.destination);

      // Warm lowpass filter for sustained chord pads
      const padFilter = ctx.createBiquadFilter();
      padFilter.type = 'lowpass';
      padFilter.frequency.setValueAtTime(640, ctx.currentTime);
      padFilter.Q.setValueAtTime(0.6, ctx.currentTime);
      padFilter.connect(master);

      // Gentle echo delay bus for soft harp/celesta melody notes
      const melodyBus = ctx.createGain();
      melodyBus.gain.setValueAtTime(0.85, ctx.currentTime);

      const delay = ctx.createDelay(1.0);
      delay.delayTime.setValueAtTime(0.48, ctx.currentTime);

      const feedback = ctx.createGain();
      feedback.gain.setValueAtTime(0.28, ctx.currentTime);

      const delayTone = ctx.createBiquadFilter();
      delayTone.type = 'lowpass';
      delayTone.frequency.setValueAtTime(1050, ctx.currentTime);

      melodyBus.connect(master);
      melodyBus.connect(delay);
      delay.connect(delayTone);
      delayTone.connect(feedback);
      feedback.connect(delay);
      delayTone.connect(master);

      this.ctx = ctx;
      this.masterGain = master;
      this.padFilter = padFilter;
      this.melodyBus = melodyBus;
    }

    return this.ctx;
  }

  private playPadChord(freqs: number[], durationSec: number) {
    if (!this.ctx || !this.padFilter || !this.playing) return;
    const now = this.ctx.currentTime;

    freqs.forEach((freq) => {
      if (!this.ctx || !this.padFilter) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(0.022, now + 1.6);
      gain.gain.setValueAtTime(0.022, now + durationSec - 1.8);
      gain.gain.linearRampToValueAtTime(0.0001, now + durationSec);

      osc.connect(gain);
      gain.connect(this.padFilter);

      osc.start(now);
      osc.stop(now + durationSec + 0.1);
    });
  }

  private playSoftNote(freq: number, delayOffsetSec: number) {
    if (!this.ctx || !this.melodyBus || !this.playing) return;
    const startAt = this.ctx.currentTime + delayOffsetSec;

    const osc = this.ctx.createOscillator();
    const overtone = this.ctx.createOscillator();
    const noteFilter = this.ctx.createBiquadFilter();
    const noteGain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, startAt);

    overtone.type = 'sine';
    overtone.frequency.setValueAtTime(freq * 2, startAt);

    const overtoneGain = this.ctx.createGain();
    overtoneGain.gain.setValueAtTime(0.14, startAt);

    noteFilter.type = 'lowpass';
    noteFilter.frequency.setValueAtTime(1850, startAt);

    noteGain.gain.setValueAtTime(0.0001, startAt);
    noteGain.gain.linearRampToValueAtTime(0.055, startAt + 0.08);
    noteGain.gain.exponentialRampToValueAtTime(0.0008, startAt + 2.6);

    osc.connect(noteFilter);
    overtone.connect(overtoneGain);
    overtoneGain.connect(noteFilter);
    noteFilter.connect(noteGain);
    noteGain.connect(this.melodyBus);

    osc.start(startAt);
    overtone.start(startAt);
    osc.stop(startAt + 2.8);
    overtone.stop(startAt + 2.8);
  }

  private scheduleBar = () => {
    if (!this.playing) return;
    const barDurationSec = 6.4;
    const chord = PROGRESSION[this.stepIndex % PROGRESSION.length];
    this.stepIndex += 1;

    this.playPadChord(chord.padFreqs, barDurationSec);
    chord.melodyNotes.forEach((note, idx) => {
      this.playSoftNote(note, idx * 1.55 + 0.15);
    });

    this.stepTimer = window.setTimeout(this.scheduleBar, barDurationSec * 1000 - 150);
  };

  async start(): Promise<boolean> {
    const ctx = this.ensureGraph();
    if (!ctx || !this.masterGain) return false;

    if (ctx.state === 'suspended') {
      try {
        await ctx.resume();
      } catch {
        return false;
      }
    }

    if (this.playing) return true;
    this.playing = true;

    const now = ctx.currentTime;
    this.masterGain.gain.cancelScheduledValues(now);
    this.masterGain.gain.setValueAtTime(Math.max(0.0001, this.masterGain.gain.value), now);
    this.masterGain.gain.linearRampToValueAtTime(0.55, now + 1.2);

    this.scheduleBar();
    return true;
  }

  stop(): void {
    this.playing = false;
    if (this.stepTimer !== null) {
      window.clearTimeout(this.stepTimer);
      this.stepTimer = null;
    }
    if (this.ctx && this.masterGain) {
      const now = this.ctx.currentTime;
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.setValueAtTime(Math.max(0.0001, this.masterGain.gain.value), now);
      this.masterGain.gain.linearRampToValueAtTime(0.0001, now + 0.45);
    }
  }

  isPlaying(): boolean {
    return this.playing;
  }
}

export const calmMusicEngine = new CalmMusicEngine();
