import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS, SAFE_AREA } from '../game/config';
import { setHighScore, getHighScore } from '../utils/storage';
import { getAudio } from '../systems/AudioSystem';

export class VictoryScene extends Phaser.Scene {
  constructor() {
    super({ key: 'VictoryScene' });
  }

  init(data: { score: number; wave: number }): void {
    this.data.set('score', data.score || 0);
    this.data.set('wave', data.wave || 0);
  }

  create(): void {
    const cx = GAME_WIDTH / 2;
    const score = this.data.get('score') as number;
    const audio = getAudio();

    audio.victory();

    // Background
    this.add.tileSprite(0, 0, GAME_WIDTH, GAME_HEIGHT, 'bg_stars_far').setOrigin(0, 0);

    // Gold shimmer particles
    this.add.particles(0, 0, 'particle_gold', {
      x: { min: 0, max: GAME_WIDTH },
      y: { min: 0, max: GAME_HEIGHT },
      speed: { min: 10, max: 30 },
      scale: { start: 0.15, end: 0 },
      alpha: { start: 0.5, end: 0 },
      lifespan: 2000,
      frequency: 100,
      blendMode: Phaser.BlendModes.ADD,
    });

    // Panel
    this.add.image(cx, GAME_HEIGHT / 2, 'panel_bg').setScale(0.85, 0.65);

    // Crystal decorations
    this.add.text(cx, SAFE_AREA.top + 80, '✦', {
      fontSize: '32px',
      color: '#ffd700',
    }).setOrigin(0.5);

    // Title
    const title = this.add.text(cx, SAFE_AREA.top + 130, 'VICTORY', {
      fontSize: '42px',
      fontFamily: 'Georgia, serif',
      color: '#ffd700',
      align: 'center',
      stroke: '#443300',
      strokeThickness: 3,
    }).setOrigin(0.5);

    this.tweens.add({
      targets: title,
      scaleX: { from: 1, to: 1.05 },
      scaleY: { from: 1, to: 1.05 },
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    this.add.text(cx, SAFE_AREA.top + 175, 'THE ASTRAL DREADNOUGHT IS VANQUISHED', {
      fontSize: '11px',
      fontFamily: 'Arial, sans-serif',
      color: '#ffec80',
      align: 'center',
      letterSpacing: 2,
    }).setOrigin(0.5).setAlpha(0.8);

    // Score
    const statsY = GAME_HEIGHT / 2 - 50;

    this.add.text(cx, statsY, 'FINAL SCORE', {
      fontSize: '12px',
      fontFamily: 'Arial, sans-serif',
      color: '#80f0ff',
    }).setOrigin(0.5);

    this.add.text(cx, statsY + 35, score.toLocaleString(), {
      fontSize: '40px',
      fontFamily: 'Georgia, serif',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // High score
    const isNew = setHighScore(score);
    if (isNew) {
      const newHs = this.add.text(cx, statsY + 80, '★ NEW HIGH SCORE ★', {
        fontSize: '18px',
        fontFamily: 'Georgia, serif',
        color: '#ffd700',
        fontStyle: 'bold',
      }).setOrigin(0.5);

      this.tweens.add({
        targets: newHs,
        alpha: { from: 0.7, to: 1 },
        duration: 500,
        yoyo: true,
        repeat: -1,
      });
    } else {
      this.add.text(cx, statsY + 80, `Best: ${getHighScore().toLocaleString()}`, {
        fontSize: '14px',
        fontFamily: 'Arial, sans-serif',
        color: '#ffd700',
      }).setOrigin(0.5);
    }

    // Buttons
    const btnY = GAME_HEIGHT / 2 + 120;

    this.createButton(cx, btnY, 'PLAY AGAIN', () => {
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
    this.cameras.main.fadeIn(600, 0, 0, 0);
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
