import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS, SAFE_AREA } from '../game/config';
import { setHighScore, getHighScore } from '../utils/storage';
import { getAudio } from '../systems/AudioSystem';

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameOverScene' });
  }

  init(data: { score: number; wave: number }): void {
    this.data.set('score', data.score || 0);
    this.data.set('wave', data.wave || 0);
  }

  create(): void {
    const cx = GAME_WIDTH / 2;
    const score = this.data.get('score') as number;
    const wave = this.data.get('wave') as number;
    const audio = getAudio();

    audio.defeat();

    // Background
    this.add.tileSprite(0, 0, GAME_WIDTH, GAME_HEIGHT, 'bg_stars_far').setOrigin(0, 0);

    // Dark overlay
    this.add.rectangle(cx, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.5);

    // Panel
    this.add.image(cx, GAME_HEIGHT / 2, 'panel_bg').setScale(0.85, 0.65);

    // Title
    this.add.text(cx, SAFE_AREA.top + 120, 'DEFEATED', {
      fontSize: '36px',
      fontFamily: 'Georgia, serif',
      color: '#ff3344',
      align: 'center',
      stroke: '#220011',
      strokeThickness: 3,
    }).setOrigin(0.5);

    // Crystal shatter decoration
    this.add.text(cx, SAFE_AREA.top + 170, '✦  ✦  ✦', {
      fontSize: '16px',
      color: '#ff3344',
    }).setOrigin(0.5).setAlpha(0.4);

    // Stats
    const statsY = GAME_HEIGHT / 2 - 60;

    this.add.text(cx, statsY, 'FINAL SCORE', {
      fontSize: '12px',
      fontFamily: 'Arial, sans-serif',
      color: '#80f0ff',
    }).setOrigin(0.5);

    this.add.text(cx, statsY + 30, score.toLocaleString(), {
      fontSize: '36px',
      fontFamily: 'Georgia, serif',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(cx, statsY + 70, `Reached Wave ${wave}`, {
      fontSize: '14px',
      fontFamily: 'Arial, sans-serif',
      color: '#aaaacc',
    }).setOrigin(0.5);

    // High score check
    const isNew = setHighScore(score);
    if (isNew) {
      const newHs = this.add.text(cx, statsY + 100, '★ NEW HIGH SCORE ★', {
        fontSize: '18px',
        fontFamily: 'Georgia, serif',
        color: '#ffd700',
        fontStyle: 'bold',
      }).setOrigin(0.5);

      this.tweens.add({
        targets: newHs,
        scaleX: { from: 1, to: 1.1 },
        scaleY: { from: 1, to: 1.1 },
        duration: 600,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    } else {
      this.add.text(cx, statsY + 100, `Best: ${getHighScore().toLocaleString()}`, {
        fontSize: '14px',
        fontFamily: 'Arial, sans-serif',
        color: '#ffd700',
      }).setOrigin(0.5);
    }

    // Buttons
    const btnY = GAME_HEIGHT / 2 + 120;

    this.createButton(cx, btnY, 'RETRY', () => {
      audio.menuSelect();
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('GameScene');
      });
    });

    this.createButton(cx, btnY + 64, 'MAIN MENU', () => {
      audio.menuSelect();
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('MenuScene');
      });
    });

    // Fade in
    this.cameras.main.fadeIn(500, 0, 0, 0);
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
