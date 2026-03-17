import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS, SAFE_AREA, PLAYER } from '../game/config';
import { GameScene } from './GameScene';

export class HudScene extends Phaser.Scene {
  private gameScene!: GameScene;

  // HUD elements
  private scoreText!: Phaser.GameObjects.Text;
  private comboText!: Phaser.GameObjects.Text;
  private waveText!: Phaser.GameObjects.Text;
  private hpPips: Phaser.GameObjects.Image[] = [];
  private shieldPips: Phaser.GameObjects.Image[] = [];
  private livesDots: Phaser.GameObjects.Ellipse[] = [];
  private bombText!: Phaser.GameObjects.Text;
  private bossBarBg!: Phaser.GameObjects.Rectangle;
  private bossBar!: Phaser.GameObjects.Rectangle;
  private bossLabel!: Phaser.GameObjects.Text;
  private bossBarContainer!: Phaser.GameObjects.Container;
  private pauseBtn!: Phaser.GameObjects.Text;
  private specialBtn!: Phaser.GameObjects.Container;
  private waveAnnounce!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'HudScene' });
  }

  init(data: { gameScene: GameScene }): void {
    this.gameScene = data.gameScene;
  }

  create(): void {
    const hudTop = SAFE_AREA.top + 8;
    const hudLeft = SAFE_AREA.sides + 8;
    const hudRight = GAME_WIDTH - SAFE_AREA.sides - 8;

    // Score
    this.scoreText = this.add.text(hudLeft, hudTop, '0', {
      fontSize: '22px',
      fontFamily: 'Georgia, serif',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setDepth(20);

    // Combo/multiplier
    this.comboText = this.add.text(hudLeft, hudTop + 28, '', {
      fontSize: '14px',
      fontFamily: 'Arial, sans-serif',
      color: '#ffd700',
      fontStyle: 'bold',
    }).setDepth(20);

    // Wave indicator
    this.waveText = this.add.text(GAME_WIDTH / 2, hudTop, '', {
      fontSize: '12px',
      fontFamily: 'Arial, sans-serif',
      color: '#80f0ff',
      align: 'center',
    }).setOrigin(0.5, 0).setDepth(20).setAlpha(0.7);

    // HP pips (bottom left)
    const hpY = GAME_HEIGHT - SAFE_AREA.bottom - 38;
    for (let i = 0; i < PLAYER.maxHp; i++) {
      const pip = this.add.image(hudLeft + i * 20, hpY, 'hp_pip').setOrigin(0, 0.5).setDepth(20);
      this.hpPips.push(pip);
    }

    // Shield pips
    const shieldY = hpY - 20;
    for (let i = 0; i < PLAYER.maxShield; i++) {
      const pip = this.add.image(hudLeft + i * 20, shieldY, 'shield_pip').setOrigin(0, 0.5).setDepth(20);
      this.shieldPips.push(pip);
    }

    // Lives dots
    const livesY = hpY + 18;
    this.add.text(hudLeft, livesY, 'LIVES', {
      fontSize: '8px',
      fontFamily: 'Arial, sans-serif',
      color: '#666688',
    }).setOrigin(0, 0.5).setDepth(20);

    for (let i = 0; i < PLAYER.lives; i++) {
      const dot = this.add.ellipse(hudLeft + 40 + i * 14, livesY, 8, 8, COLORS.crystal, 0.7)
        .setDepth(20);
      this.livesDots.push(dot);
    }

    // Bomb button (bottom right)
    const specY = GAME_HEIGHT - SAFE_AREA.bottom - 34;
    this.specialBtn = this.add.container(hudRight - 28, specY);
    const btnBg = this.add.ellipse(0, 0, 44, 44, COLORS.red, 0.3)
      .setStrokeStyle(2, COLORS.red, 0.6)
      .setInteractive({ useHandCursor: true });
    const btnIcon = this.add.text(0, 0, '💣', {
      fontSize: '18px',
    }).setOrigin(0.5);
    this.specialBtn.add([btnBg, btnIcon]);
    this.specialBtn.setDepth(20);

    // Bomb count label
    this.bombText = this.add.text(hudRight - 74, specY, '×3', {
      fontSize: '16px',
      fontFamily: 'Arial, sans-serif',
      color: '#ff6644',
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(20);

    btnBg.on('pointerup', () => {
      this.gameScene.useSpecialAbility();
    });

    // Pause button (top right)
    this.pauseBtn = this.add.text(hudRight, hudTop, '❚❚', {
      fontSize: '22px',
      color: '#ffffff',
      padding: { x: 8, y: 4 },
    }).setOrigin(1, 0).setDepth(20).setInteractive({ useHandCursor: true });

    this.pauseBtn.on('pointerup', () => {
      this.gameScene.pauseGame();
    });

    // Boss health bar (hidden initially)
    const bossBarWidth = GAME_WIDTH - 80;
    this.bossBarContainer = this.add.container(GAME_WIDTH / 2, hudTop + 50);
    this.bossLabel = this.add.text(0, -14, 'CHAOS BAHAMUT', {
      fontSize: '11px',
      fontFamily: 'Arial, sans-serif',
      color: '#ff4466',
      align: 'center',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    this.bossBarBg = this.add.rectangle(0, 0, bossBarWidth, 10, 0x221122, 0.8)
      .setStrokeStyle(1, 0x663333, 0.6);
    this.bossBar = this.add.rectangle(-bossBarWidth / 2, 0, bossBarWidth, 10, COLORS.bossHp, 0.9)
      .setOrigin(0, 0.5);
    this.bossBarContainer.add([this.bossLabel, this.bossBarBg, this.bossBar]);
    this.bossBarContainer.setDepth(20);
    this.bossBarContainer.setVisible(false);

    // Wave announce text
    this.waveAnnounce = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 60, '', {
      fontSize: '24px',
      fontFamily: 'Georgia, serif',
      color: '#ffffff',
      align: 'center',
      stroke: '#001133',
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(25).setAlpha(0);

    // Listen for events
    this.gameScene.events.on('hud-update', this.refresh, this);
    this.gameScene.events.on('wave-announce', this.showWaveAnnounce, this);

    this.refresh();
  }

  private refresh(): void {
    const data = this.gameScene.getHudData();

    this.scoreText.setText(data.score.toLocaleString());

    if (data.multiplier > 1) {
      this.comboText.setText(`×${data.multiplier} COMBO ${data.combo}`);
      this.comboText.setAlpha(1);
    } else {
      this.comboText.setAlpha(0);
    }

    this.waveText.setText(`WAVE ${data.wave}/${data.totalWaves}`);

    // HP pips
    for (let i = 0; i < this.hpPips.length; i++) {
      this.hpPips[i].setTexture(i < data.hp ? 'hp_pip' : 'hp_pip_empty');
    }

    // Shield pips
    for (let i = 0; i < this.shieldPips.length; i++) {
      this.shieldPips[i].setTexture(i < data.shield ? 'shield_pip' : 'shield_pip_empty');
    }

    // Lives
    for (let i = 0; i < this.livesDots.length; i++) {
      this.livesDots[i].setAlpha(i < data.lives ? 0.7 : 0.15);
    }

    // Bomb count
    this.bombText.setText(`×${data.bombs}`);
    const canUse = data.bombs > 0;
    (this.specialBtn.first as Phaser.GameObjects.Ellipse).setAlpha(canUse ? 1 : 0.3);

    // Boss bar
    if (data.bossHp >= 0) {
      this.bossBarContainer.setVisible(true);
      const bossBarWidth = GAME_WIDTH - 80;
      this.bossBar.width = bossBarWidth * data.bossHp;

      // Color shift by phase
      const colors = [COLORS.bossHp, COLORS.magenta, COLORS.gold];
      this.bossBar.fillColor = colors[data.bossPhase] || COLORS.bossHp;
    } else {
      this.bossBarContainer.setVisible(false);
    }
  }

  private showWaveAnnounce(data: { wave: number; isElite: boolean; isBoss: boolean }): void {
    let text = `WAVE ${data.wave}`;
    let color = '#ffffff';

    if (data.isBoss) {
      text = 'WARNING\nCHAOS BAHAMUT\nAPPROACHING';
      color = '#ff3344';
    } else if (data.isElite) {
      text = `WAVE ${data.wave}\nELITE INCOMING`;
      color = '#ffd700';
    }

    this.waveAnnounce.setText(text);
    this.waveAnnounce.setColor(color);

    this.tweens.add({
      targets: this.waveAnnounce,
      alpha: { from: 0, to: 1 },
      y: { from: GAME_HEIGHT / 2 - 40, to: GAME_HEIGHT / 2 - 60 },
      duration: 500,
      ease: 'Sine.easeOut',
      yoyo: true,
      hold: data.isBoss ? 2000 : 1000,
      onComplete: () => {
        this.waveAnnounce.setAlpha(0);
      },
    });

    this.refresh();
  }

  update(): void {
    // Continuous refresh for smooth animations
    this.refresh();
  }
}
