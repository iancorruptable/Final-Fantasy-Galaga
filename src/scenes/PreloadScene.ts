import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from '../game/config';
import { generateAllAssets } from '../systems/AssetGenerator';

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PreloadScene' });
  }

  create(): void {
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;

    // Loading bar
    const barWidth = 240;
    const barHeight = 6;

    this.add.rectangle(cx, cy, barWidth + 4, barHeight + 4, COLORS.uiPanelBorder, 0.5)
      .setStrokeStyle(1, COLORS.crystal, 0.3);

    const bar = this.add.rectangle(cx - barWidth / 2, cy, 0, barHeight, COLORS.crystal, 0.8)
      .setOrigin(0, 0.5);

    const loadText = this.add.text(cx, cy + 30, 'Generating assets...', {
      fontSize: '12px',
      fontFamily: 'Arial, sans-serif',
      color: '#80f0ff',
      align: 'center',
    }).setOrigin(0.5).setAlpha(0.7);

    // Animate loading bar while generating
    this.tweens.add({
      targets: bar,
      width: barWidth * 0.6,
      duration: 300,
      ease: 'Sine.easeOut',
      onComplete: () => {
        generateAllAssets(this);

        this.tweens.add({
          targets: bar,
          width: barWidth,
          duration: 200,
          ease: 'Sine.easeOut',
          onComplete: () => {
            loadText.setText('Ready');
            this.time.delayedCall(200, () => {
              this.scene.start('MenuScene');
            });
          },
        });
      },
    });
  }
}
