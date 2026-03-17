import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS, SAFE_AREA } from '../game/config';
import { GameScene } from './GameScene';
import { getAudio } from '../systems/AudioSystem';

export class PauseScene extends Phaser.Scene {
  private gameScene!: GameScene;

  constructor() {
    super({ key: 'PauseScene' });
  }

  init(data: { gameScene: GameScene }): void {
    this.gameScene = data.gameScene;
  }

  create(): void {
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;
    const audio = getAudio();

    // Dim overlay
    this.add.rectangle(cx, cy, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.6).setDepth(50);

    // Panel
    this.add.image(cx, cy, 'panel_bg').setScale(0.6, 0.5).setDepth(51);

    // Title
    this.add.text(cx, cy - 100, 'PAUSED', {
      fontSize: '32px',
      fontFamily: 'Georgia, serif',
      color: '#ffffff',
      align: 'center',
    }).setOrigin(0.5).setDepth(52);

    // Resume button
    this.createButton(cx, cy - 20, 'RESUME', () => {
      audio.menuSelect();
      this.scene.stop();
      this.gameScene.resumeGame();
    });

    // Restart button
    this.createButton(cx, cy + 50, 'RESTART', () => {
      audio.menuSelect();
      this.scene.stop();
      this.gameScene.scene.stop('HudScene');
      this.gameScene.scene.restart();
    });

    // Quit button
    this.createButton(cx, cy + 120, 'QUIT TO MENU', () => {
      audio.menuSelect();
      this.scene.stop();
      this.gameScene.scene.stop('HudScene');
      this.gameScene.scene.stop();
      this.scene.start('MenuScene');
    });
  }

  private createButton(x: number, y: number, text: string, callback: () => void): void {
    const bg = this.add.image(x, y, 'btn_bg').setInteractive({ useHandCursor: true }).setDepth(52);
    const label = this.add.text(x, y, text, {
      fontSize: '16px',
      fontFamily: 'Arial, sans-serif',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(53);

    bg.on('pointerup', () => callback());
    bg.on('pointerover', () => label.setColor('#80f0ff'));
    bg.on('pointerout', () => label.setColor('#ffffff'));
  }
}
