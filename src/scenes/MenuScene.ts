import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS, SAFE_AREA } from '../game/config';
import { getHighScore } from '../utils/storage';
import { getAudio } from '../systems/AudioSystem';

export class MenuScene extends Phaser.Scene {
  private stars: Phaser.GameObjects.TileSprite[] = [];

  constructor() {
    super({ key: 'MenuScene' });
  }

  create(): void {
    const cx = GAME_WIDTH / 2;
    const audio = getAudio();

    // Scrolling star background
    this.stars = [
      this.add.tileSprite(0, 0, GAME_WIDTH, GAME_HEIGHT, 'bg_stars_far').setOrigin(0, 0),
      this.add.tileSprite(0, 0, GAME_WIDTH, GAME_HEIGHT, 'bg_stars_mid').setOrigin(0, 0).setAlpha(0.6),
    ];

    // Decorative crystal particles
    const emitter = this.add.particles(0, 0, 'particle_crystal', {
      x: { min: 0, max: GAME_WIDTH },
      y: -10,
      speedY: { min: 20, max: 60 },
      speedX: { min: -10, max: 10 },
      scale: { start: 0.15, end: 0 },
      alpha: { start: 0.3, end: 0 },
      lifespan: { min: 4000, max: 8000 },
      frequency: 300,
      blendMode: Phaser.BlendModes.ADD,
    });

    // Title
    const titleY = SAFE_AREA.top + 140;

    this.add.text(cx, titleY - 40, '✦', {
      fontSize: '28px',
      color: '#00e5ff',
    }).setOrigin(0.5).setAlpha(0.6);

    const title = this.add.text(cx, titleY, 'CRYSTAL\nVANGUARD', {
      fontSize: '42px',
      fontFamily: 'Georgia, "Times New Roman", serif',
      color: '#ffffff',
      align: 'center',
      lineSpacing: 8,
      stroke: '#003366',
      strokeThickness: 2,
    }).setOrigin(0.5);

    // Title glow animation
    this.tweens.add({
      targets: title,
      alpha: { from: 0.85, to: 1 },
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Subtitle
    this.add.text(cx, titleY + 70, 'CELESTIAL ASSAULT', {
      fontSize: '14px',
      fontFamily: 'Arial, sans-serif',
      color: '#80f0ff',
      letterSpacing: 6,
    }).setOrigin(0.5).setAlpha(0.7);

    // Ship preview
    const ship = this.add.image(cx, titleY + 140, 'player_ship').setScale(2.5);
    this.tweens.add({
      targets: ship,
      y: ship.y - 8,
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Engine trail for ship
    this.add.particles(cx, ship.y + 20, 'particle_crystal', {
      speedY: { min: 30, max: 60 },
      speedX: { min: -5, max: 5 },
      scale: { start: 0.2, end: 0 },
      alpha: { start: 0.5, end: 0 },
      lifespan: 600,
      frequency: 50,
      blendMode: Phaser.BlendModes.ADD,
    });

    // Buttons
    const buttonStartY = GAME_HEIGHT / 2 + 120;
    const buttonGap = 64;

    this.createButton(cx, buttonStartY, 'START GAME', () => {
      audio.menuSelect();
      this.cameras.main.fadeOut(400, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('GameScene');
      });
    });

    this.createButton(cx, buttonStartY + buttonGap, 'SETTINGS', () => {
      audio.menuSelect();
      this.scene.start('SettingsScene');
    });

    // High score
    const highScore = getHighScore();
    if (highScore > 0) {
      this.add.text(cx, GAME_HEIGHT - SAFE_AREA.bottom - 80, `HIGH SCORE: ${highScore.toLocaleString()}`, {
        fontSize: '16px',
        fontFamily: 'Arial, sans-serif',
        color: '#ffd700',
        align: 'center',
      }).setOrigin(0.5);
    }

    // Version
    this.add.text(cx, GAME_HEIGHT - SAFE_AREA.bottom - 20, 'v1.0', {
      fontSize: '10px',
      fontFamily: 'Arial, sans-serif',
      color: '#444466',
    }).setOrigin(0.5);

    // Fade in
    this.cameras.main.fadeIn(400, 0, 0, 0);
  }

  update(): void {
    if (this.stars.length > 0) {
      this.stars[0].tilePositionY -= 0.3;
      this.stars[1].tilePositionY -= 0.6;
    }
  }

  private createButton(x: number, y: number, text: string, callback: () => void): void {
    const bg = this.add.image(x, y, 'btn_bg').setInteractive({ useHandCursor: true });

    const label = this.add.text(x, y, text, {
      fontSize: '18px',
      fontFamily: 'Arial, sans-serif',
      color: '#ffffff',
      align: 'center',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    bg.on('pointerover', () => {
      bg.setTint(0x3355bb);
      label.setColor('#80f0ff');
    });

    bg.on('pointerout', () => {
      bg.clearTint();
      label.setColor('#ffffff');
    });

    bg.on('pointerdown', () => {
      bg.setScale(0.95);
    });

    bg.on('pointerup', () => {
      bg.setScale(1);
      callback();
    });
  }
}
