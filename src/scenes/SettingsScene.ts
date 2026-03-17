import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS, SAFE_AREA } from '../game/config';
import { getSettings, saveSettings } from '../utils/storage';
import { getAudio } from '../systems/AudioSystem';

export class SettingsScene extends Phaser.Scene {
  constructor() {
    super({ key: 'SettingsScene' });
  }

  create(): void {
    const cx = GAME_WIDTH / 2;
    const settings = getSettings();
    const audio = getAudio();

    // Background
    this.add.tileSprite(0, 0, GAME_WIDTH, GAME_HEIGHT, 'bg_stars_far').setOrigin(0, 0);

    // Panel
    const panelY = GAME_HEIGHT / 2;
    this.add.image(cx, panelY, 'panel_bg').setScale(1, 0.7);

    // Title
    this.add.text(cx, SAFE_AREA.top + 60, 'SETTINGS', {
      fontSize: '28px',
      fontFamily: 'Georgia, serif',
      color: '#ffffff',
      align: 'center',
    }).setOrigin(0.5);

    let y = SAFE_AREA.top + 140;
    const rowGap = 80;

    // SFX Volume
    this.createSlider(cx, y, 'SFX VOLUME', settings.sfxVolume, (val) => {
      saveSettings({ sfxVolume: val });
      audio.updateVolumes(val, settings.musicVolume);
    });

    y += rowGap;

    // Music Volume
    this.createSlider(cx, y, 'MUSIC VOLUME', settings.musicVolume, (val) => {
      saveSettings({ musicVolume: val });
      audio.updateVolumes(settings.sfxVolume, val);
    });

    y += rowGap;

    // Screen Shake toggle
    this.createToggle(cx, y, 'SCREEN SHAKE', settings.screenShake, (val) => {
      saveSettings({ screenShake: val });
    });

    y += rowGap;

    // Particles toggle
    this.createToggle(cx, y, 'HIGH PARTICLES', settings.particles === 'high', (val) => {
      saveSettings({ particles: val ? 'high' : 'low' });
    });

    // Back button
    this.createButton(cx, GAME_HEIGHT - SAFE_AREA.bottom - 80, 'BACK', () => {
      audio.menuSelect();
      this.scene.start('MenuScene');
    });
  }

  private createSlider(x: number, y: number, label: string, value: number, onChange: (val: number) => void): void {
    this.add.text(x, y - 16, label, {
      fontSize: '13px',
      fontFamily: 'Arial, sans-serif',
      color: '#80f0ff',
      align: 'center',
    }).setOrigin(0.5);

    const trackWidth = 200;
    const trackX = x - trackWidth / 2;

    // Track
    this.add.rectangle(x, y + 14, trackWidth, 6, 0x222244).setStrokeStyle(1, COLORS.uiPanelBorder, 0.5);

    // Fill
    const fill = this.add.rectangle(trackX, y + 14, trackWidth * value, 6, COLORS.crystal, 0.7).setOrigin(0, 0.5);

    // Handle
    const handle = this.add.circle(trackX + trackWidth * value, y + 14, 10, COLORS.crystal)
      .setStrokeStyle(2, COLORS.white, 0.5)
      .setInteractive({ draggable: true, useHandCursor: true });

    // Value text
    const valText = this.add.text(x + trackWidth / 2 + 30, y + 14, `${Math.round(value * 100)}%`, {
      fontSize: '12px',
      fontFamily: 'Arial, sans-serif',
      color: '#ffffff',
    }).setOrigin(0.5);

    handle.on('drag', (_: Phaser.Input.Pointer, dragX: number) => {
      const clamped = Phaser.Math.Clamp(dragX, trackX, trackX + trackWidth);
      handle.x = clamped;
      const newVal = (clamped - trackX) / trackWidth;
      fill.width = trackWidth * newVal;
      valText.setText(`${Math.round(newVal * 100)}%`);
      onChange(newVal);
    });
  }

  private createToggle(x: number, y: number, label: string, value: boolean, onChange: (val: boolean) => void): void {
    this.add.text(x - 40, y, label, {
      fontSize: '13px',
      fontFamily: 'Arial, sans-serif',
      color: '#80f0ff',
      align: 'right',
    }).setOrigin(1, 0.5);

    const toggleBg = this.add.rectangle(x + 40, y, 50, 26, value ? COLORS.crystal : 0x333355, 0.8)
      .setStrokeStyle(1, COLORS.uiPanelBorder, 0.5)
      .setInteractive({ useHandCursor: true });

    const toggleKnob = this.add.circle(value ? x + 57 : x + 23, y, 10, COLORS.white, 0.9);

    const statusText = this.add.text(x + 80, y, value ? 'ON' : 'OFF', {
      fontSize: '12px',
      fontFamily: 'Arial, sans-serif',
      color: value ? '#44ff88' : '#888888',
    }).setOrigin(0, 0.5);

    let current = value;
    toggleBg.on('pointerup', () => {
      current = !current;
      toggleBg.fillColor = current ? COLORS.crystal : 0x333355;
      this.tweens.add({
        targets: toggleKnob,
        x: current ? x + 57 : x + 23,
        duration: 150,
        ease: 'Sine.easeOut',
      });
      statusText.setText(current ? 'ON' : 'OFF');
      statusText.setColor(current ? '#44ff88' : '#888888');
      onChange(current);
    });
  }

  private createButton(x: number, y: number, text: string, callback: () => void): void {
    const bg = this.add.image(x, y, 'btn_bg').setInteractive({ useHandCursor: true });
    const label = this.add.text(x, y, text, {
      fontSize: '18px',
      fontFamily: 'Arial, sans-serif',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    bg.on('pointerup', () => callback());
    bg.on('pointerover', () => label.setColor('#80f0ff'));
    bg.on('pointerout', () => label.setColor('#ffffff'));
  }
}
