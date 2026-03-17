import Phaser from 'phaser';
import { getSettings } from '../utils/storage';

// Lightweight audio system using Web Audio API tone generation
// No external audio files needed - all sounds are synthesized

export class AudioSystem {
  private ctx: AudioContext | null = null;
  private sfxVolume = 0.7;
  private musicVolume = 0.5;

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

  menuSelect(): void {
    this.playTone(800, 0.08, 0.5, 'sine');
    setTimeout(() => this.playTone(1200, 0.06, 0.4, 'sine'), 40);
  }

  playerFire(): void {
    this.playTone(1400, 0.05, 0.25, 'square');
    this.playTone(1800, 0.03, 0.15, 'sine');
  }

  playerFireUpgraded(): void {
    this.playTone(1600, 0.06, 0.3, 'square');
    this.playTone(2200, 0.04, 0.2, 'sine');
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
    const notes = [523, 659, 784, 1047];
    notes.forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 0.2, 0.4, 'sine'), i * 120);
    });
    setTimeout(() => this.playTone(1047, 0.5, 0.5, 'sine'), 500);
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
