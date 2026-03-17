import { getSettings } from '../utils/storage';

// Lightweight audio system using Web Audio API tone generation
// No external audio files needed - all sounds are synthesized

export class AudioSystem {
  private ctx: AudioContext | null = null;
  private sfxVolume = 0.7;
  private musicVolume = 0.5;
  private musicPlaying = false;
  private musicNodes: { oscs: OscillatorNode[]; gains: GainNode[]; master: GainNode } | null = null;
  private musicInterval: ReturnType<typeof setInterval> | null = null;
  private bossMusic = false;

  constructor() {
    const settings = getSettings();
    this.sfxVolume = settings.sfxVolume;
    this.musicVolume = settings.musicVolume;
  }

  private getContext(): AudioContext | null {
    if (!this.ctx) {
      try {
        this.ctx = new AudioContext();
      } catch {
        return null;
      }
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  updateVolumes(sfx: number, music: number): void {
    this.sfxVolume = sfx;
    this.musicVolume = music;
    if (this.musicNodes) {
      this.musicNodes.master.gain.setValueAtTime(this.musicVolume * 0.18, this.ctx!.currentTime);
    }
  }

  private playTone(freq: number, duration: number, volume: number, type: OscillatorType = 'sine', fadeOut = true): void {
    const ctx = this.getContext();
    if (!ctx) return;
    const vol = volume * this.sfxVolume;
    if (vol <= 0) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(vol * 0.3, ctx.currentTime);
    if (fadeOut) {
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    }
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  }

  private playNoise(duration: number, volume: number): void {
    const ctx = this.getContext();
    if (!ctx) return;
    const vol = volume * this.sfxVolume;
    if (vol <= 0) return;

    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2);
    }
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(vol * 0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    source.connect(gain);
    gain.connect(ctx.destination);
    source.start();
  }

  // --- Background Music ---

  startMusic(): void {
    if (this.musicPlaying) return;
    this.bossMusic = false;
    this.musicPlaying = true;
    this.playMusicLoop();
  }

  startBossMusic(): void {
    this.stopMusic();
    this.bossMusic = true;
    this.musicPlaying = true;
    this.playBossMusicLoop();
  }

  stopMusic(): void {
    this.musicPlaying = false;
    if (this.musicInterval) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
    if (this.musicNodes) {
      const now = this.ctx?.currentTime ?? 0;
      try {
        this.musicNodes.master.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      } catch { /* ignore */ }
      const nodes = this.musicNodes;
      setTimeout(() => {
        nodes.oscs.forEach(o => { try { o.stop(); } catch { /* */ } });
      }, 600);
      this.musicNodes = null;
    }
  }

  private playMusicLoop(): void {
    const ctx = this.getContext();
    if (!ctx) return;

    // Epic fantasy arpeggio pattern - D minor / F major progression
    // Evokes Final Fantasy crystal theme vibes
    const sequences = [
      // D minor: D4 F4 A4 D5
      [293.66, 349.23, 440.00, 587.33],
      // Bb major: Bb3 D4 F4 Bb4
      [233.08, 293.66, 349.23, 466.16],
      // C major: C4 E4 G4 C5
      [261.63, 329.63, 392.00, 523.25],
      // A minor: A3 C4 E4 A4
      [220.00, 261.63, 329.63, 440.00],
      // F major: F4 A4 C5 F5
      [349.23, 440.00, 523.25, 698.46],
      // G minor: G3 Bb3 D4 G4
      [196.00, 233.08, 293.66, 392.00],
      // Dm: D4 F4 A4 D5 (repeat with variation)
      [293.66, 349.23, 440.00, 587.33],
      // Am -> resolve: A3 E4 A4 C5
      [220.00, 329.63, 440.00, 523.25],
    ];

    let seqIndex = 0;
    const noteTime = 220; // ms per note
    const seqTime = noteTime * 4 + 120; // 4 notes + pause

    // Pad drone for atmosphere
    const master = ctx.createGain();
    master.gain.setValueAtTime(this.musicVolume * 0.18, ctx.currentTime);
    master.connect(ctx.destination);

    // Low drone on D2
    const drone = ctx.createOscillator();
    drone.type = 'sine';
    drone.frequency.setValueAtTime(73.42, ctx.currentTime); // D2
    const droneGain = ctx.createGain();
    droneGain.gain.setValueAtTime(0.35, ctx.currentTime);
    drone.connect(droneGain);
    droneGain.connect(master);
    drone.start();

    // Fifth drone on A2
    const drone2 = ctx.createOscillator();
    drone2.type = 'sine';
    drone2.frequency.setValueAtTime(110.00, ctx.currentTime); // A2
    const droneGain2 = ctx.createGain();
    droneGain2.gain.setValueAtTime(0.2, ctx.currentTime);
    drone2.connect(droneGain2);
    droneGain2.connect(master);
    drone2.start();

    this.musicNodes = { oscs: [drone, drone2], gains: [droneGain, droneGain2], master };

    const playSequence = () => {
      if (!this.musicPlaying || this.bossMusic) return;
      const seq = sequences[seqIndex % sequences.length];
      seqIndex++;

      seq.forEach((freq, i) => {
        setTimeout(() => {
          if (!this.musicPlaying || this.bossMusic) return;
          // Harp-like arpeggio note
          this.playMusicNote(freq, 0.45, 'sine', 0.5);
          // Gentle triangle octave shimmer
          this.playMusicNote(freq * 2, 0.3, 'triangle', 0.15);
        }, i * noteTime);
      });
    };

    playSequence();
    this.musicInterval = setInterval(playSequence, seqTime);
  }

  private playBossMusicLoop(): void {
    const ctx = this.getContext();
    if (!ctx) return;

    // Intense boss theme - aggressive minor key, faster tempo
    // Inspired by FF boss battle themes
    const sequences = [
      // Dm power: D4 D4 F4 A4
      [293.66, 293.66, 349.23, 440.00],
      // Ebm tension: Eb4 Gb4 Bb4 Eb5
      [311.13, 369.99, 466.16, 622.25],
      // Dm descend: A4 F4 D4 A3
      [440.00, 349.23, 293.66, 220.00],
      // Chromatic rise: Bb3 B3 C4 Db4
      [233.08, 246.94, 261.63, 277.18],
      // Power hit: D4 D5 A4 F4
      [293.66, 587.33, 440.00, 349.23],
      // Dark resolve: G3 Bb3 D4 F4
      [196.00, 233.08, 293.66, 349.23],
      // Urgency: E4 E4 G4 B4
      [329.63, 329.63, 392.00, 493.88],
      // Crash down: D5 A4 F4 D4
      [587.33, 440.00, 349.23, 293.66],
    ];

    let seqIndex = 0;
    const noteTime = 150; // Faster for boss
    const seqTime = noteTime * 4 + 80;

    const master = ctx.createGain();
    master.gain.setValueAtTime(this.musicVolume * 0.22, ctx.currentTime);
    master.connect(ctx.destination);

    // Aggressive low drone on D2 with sawtooth
    const drone = ctx.createOscillator();
    drone.type = 'sawtooth';
    drone.frequency.setValueAtTime(73.42, ctx.currentTime);
    const droneGain = ctx.createGain();
    droneGain.gain.setValueAtTime(0.25, ctx.currentTime);
    drone.connect(droneGain);
    droneGain.connect(master);
    drone.start();

    // Pulsing bass on D3
    const bass = ctx.createOscillator();
    bass.type = 'square';
    bass.frequency.setValueAtTime(146.83, ctx.currentTime);
    const bassGain = ctx.createGain();
    bassGain.gain.setValueAtTime(0.15, ctx.currentTime);
    bass.connect(bassGain);
    bassGain.connect(master);
    bass.start();

    // LFO for pulsing effect
    const lfo = ctx.createOscillator();
    lfo.frequency.setValueAtTime(4, ctx.currentTime); // 4Hz pulse
    const lfoGain = ctx.createGain();
    lfoGain.gain.setValueAtTime(0.1, ctx.currentTime);
    lfo.connect(lfoGain);
    lfoGain.connect(bassGain.gain);
    lfo.start();

    this.musicNodes = { oscs: [drone, bass, lfo], gains: [droneGain, bassGain], master };

    const playSequence = () => {
      if (!this.musicPlaying || !this.bossMusic) return;
      const seq = sequences[seqIndex % sequences.length];
      seqIndex++;

      seq.forEach((freq, i) => {
        setTimeout(() => {
          if (!this.musicPlaying || !this.bossMusic) return;
          // Sharper attack notes for boss
          this.playMusicNote(freq, 0.3, 'sawtooth', 0.4);
          this.playMusicNote(freq * 0.5, 0.2, 'triangle', 0.2);
        }, i * noteTime);
      });
    };

    playSequence();
    this.musicInterval = setInterval(playSequence, seqTime);
  }

  private playMusicNote(freq: number, duration: number, type: OscillatorType, volume: number): void {
    const ctx = this.getContext();
    if (!ctx) return;
    const vol = volume * this.musicVolume;
    if (vol <= 0) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(vol * 0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  }

  // --- SFX ---

  menuSelect(): void {
    this.playTone(800, 0.08, 0.5, 'sine');
    setTimeout(() => this.playTone(1200, 0.06, 0.4, 'sine'), 40);
  }

  playerFire(): void {
    // Softer, less harsh laser - gentle pew
    this.playTone(900, 0.04, 0.1, 'triangle');
  }

  playerFireUpgraded(): void {
    // Slightly fuller but still gentle
    this.playTone(1000, 0.05, 0.12, 'triangle');
    this.playTone(700, 0.03, 0.06, 'sine');
  }

  enemyHit(): void {
    this.playTone(300, 0.06, 0.3, 'square');
    this.playNoise(0.04, 0.2);
  }

  enemyDestroy(): void {
    this.playNoise(0.15, 0.5);
    this.playTone(200, 0.12, 0.3, 'sawtooth');
    this.playTone(100, 0.2, 0.2, 'sine');
  }

  playerHit(): void {
    this.playTone(150, 0.2, 0.5, 'sawtooth');
    this.playNoise(0.1, 0.4);
  }

  playerDeath(): void {
    this.playNoise(0.4, 0.6);
    this.playTone(200, 0.3, 0.4, 'sawtooth');
    setTimeout(() => this.playTone(100, 0.4, 0.3, 'sawtooth'), 150);
    setTimeout(() => this.playTone(60, 0.5, 0.2, 'sine'), 300);
  }

  powerUp(): void {
    this.playTone(600, 0.08, 0.4, 'sine');
    setTimeout(() => this.playTone(800, 0.08, 0.35, 'sine'), 60);
    setTimeout(() => this.playTone(1200, 0.1, 0.3, 'sine'), 120);
  }

  specialAbility(): void {
    this.playTone(400, 0.15, 0.5, 'sawtooth');
    this.playTone(800, 0.2, 0.4, 'sine');
    this.playNoise(0.2, 0.3);
  }

  bossWarning(): void {
    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        this.playTone(200, 0.2, 0.5, 'square');
        this.playTone(250, 0.2, 0.3, 'sine');
      }, i * 300);
    }
  }

  bossPhaseTransition(): void {
    this.playNoise(0.3, 0.4);
    this.playTone(100, 0.4, 0.4, 'sawtooth');
    setTimeout(() => this.playTone(300, 0.3, 0.5, 'sine'), 200);
    setTimeout(() => this.playTone(500, 0.2, 0.4, 'sine'), 350);
  }

  victory(): void {
    // FF victory fanfare style
    const notes = [523, 523, 523, 698, 880, 784, 880, 1047];
    notes.forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 0.25, 0.5, 'sine'), i * 140);
    });
  }

  defeat(): void {
    const notes = [400, 350, 300, 200];
    notes.forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 0.25, 0.3, 'sine'), i * 150);
    });
  }

  comboUp(): void {
    this.playTone(1000 + Math.random() * 400, 0.05, 0.3, 'sine');
  }
}

// Singleton
let instance: AudioSystem | null = null;

export function getAudio(): AudioSystem {
  if (!instance) {
    instance = new AudioSystem();
  }
  return instance;
}
