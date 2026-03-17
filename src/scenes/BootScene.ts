import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from '../game/config';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  create(): void {
    // Simple loading indicator while PreloadScene generates assets
    this.cameras.main.setBackgroundColor(COLORS.bg);

    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;

    this.add.text(cx, cy - 20, 'CRYSTAL VANGUARD', {
      fontSize: '18px',
      fontFamily: 'Georgia, serif',
      color: '#00e5ff',
      align: 'center',
    }).setOrigin(0.5);

    this.add.text(cx, cy + 20, 'Loading...', {
      fontSize: '14px',
      fontFamily: 'Arial, sans-serif',
      color: '#ffffff',
      align: 'center',
      alpha: 0.6,
    } as Phaser.Types.GameObjects.Text.TextStyle).setOrigin(0.5);

    this.time.delayedCall(100, () => {
      this.scene.start('PreloadScene');
    });
  }
}
