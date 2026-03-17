import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS, PLAYER, POWERUPS, SCORING, WAVES, SAFE_AREA } from '../game/config';
import { Player } from '../entities/Player';
import { Enemy, EnemyType, BulletRequest } from '../entities/Enemy';
import { Boss } from '../entities/Boss';
import { BulletPool } from '../entities/Bullet';
import { PowerUpPool, PowerUpType } from '../entities/PowerUp';
import { WaveSystem } from '../systems/WaveSystem';
import { getAudio } from '../systems/AudioSystem';
import { getSettings } from '../utils/storage';
import { randomRange } from '../utils/math';

export class GameScene extends Phaser.Scene {
  private player!: Player;
  private enemies: Enemy[] = [];
  private boss: Boss | null = null;
  private playerBullets!: BulletPool;
  private enemyBullets!: BulletPool;
  private powerups!: PowerUpPool;
  private waveSystem!: WaveSystem;

  // State
  private score: number = 0;
  private combo: number = 0;
  private multiplier: number = 1;
  private comboTimer: number = 0;
  private isPaused: boolean = false;
  private isGameOver: boolean = false;
  private isVictory: boolean = false;
  private waveTimer: number = 0;
  private wavePending: boolean = true;
  private bossActive: boolean = false;
  private fireAccumulator: number = 0;

  // Background
  private bgFar!: Phaser.GameObjects.TileSprite;
  private bgMid!: Phaser.GameObjects.TileSprite;
  private bgNear!: Phaser.GameObjects.TileSprite;

  constructor() {
    super({ key: 'GameScene' });
  }

  create(): void {
    this.resetState();

    // Backgrounds
    this.bgFar = this.add.tileSprite(0, 0, GAME_WIDTH, GAME_HEIGHT, 'bg_stars_far').setOrigin(0, 0).setDepth(0);
    this.bgMid = this.add.tileSprite(0, 0, GAME_WIDTH, GAME_HEIGHT, 'bg_stars_mid').setOrigin(0, 0).setDepth(0).setAlpha(0.5);
    this.bgNear = this.add.tileSprite(0, 0, GAME_WIDTH, GAME_HEIGHT, 'bg_stars_near').setOrigin(0, 0).setDepth(0).setAlpha(0.4);

    // Player
    this.player = new Player(this);

    // Bullet pools
    this.playerBullets = new BulletPool(this, 'player_bullet', 80);
    this.enemyBullets = new BulletPool(this, 'enemy_bullet', 120);

    // Power-up pool
    this.powerups = new PowerUpPool(this);

    // Wave system
    this.waveSystem = new WaveSystem();

    // Collisions
    this.setupCollisions();

    // Launch HUD
    this.scene.launch('HudScene', { gameScene: this });

    // Fade in
    this.cameras.main.fadeIn(300, 0, 0, 0);

    // Start first wave after brief delay
    this.waveTimer = 1500;
    this.wavePending = true;
  }

  private resetState(): void {
    this.score = 0;
    this.combo = 0;
    this.multiplier = 1;
    this.comboTimer = 0;
    this.isPaused = false;
    this.isGameOver = false;
    this.isVictory = false;
    this.waveTimer = 0;
    this.wavePending = true;
    this.bossActive = false;
    this.fireAccumulator = 0;
    this.enemies = [];
    this.boss = null;
  }

  private setupCollisions(): void {
    // Collisions are checked manually in checkCollisions() for flexibility
  }

  update(time: number, delta: number): void {
    if (this.isPaused || this.isGameOver || this.isVictory) return;

    // Background scroll
    this.bgFar.tilePositionY -= 0.5;
    this.bgMid.tilePositionY -= 1;
    this.bgNear.tilePositionY -= 1.8;

    // Update player
    this.player.update(time, delta);

    // Auto-fire
    if (!this.player.isDead) {
      this.fireAccumulator += delta;
      const rate = this.player.getFireRate();
      while (this.fireAccumulator >= rate) {
        this.fireAccumulator -= rate;
        this.firePlayerBullet();
      }
    }

    // Update bullets
    this.playerBullets.update();
    this.enemyBullets.update();

    // Update power-ups
    this.powerups.update();

    // Update enemies
    this.updateEnemies(time, delta);

    // Update boss
    if (this.boss && !this.boss.isDefeated) {
      const bullets = this.boss.update(time, delta, this.player.sprite.x, this.player.sprite.y);
      for (const b of bullets) {
        this.enemyBullets.fireAngled(b.x, b.y, b.angle, b.speed, 1, 'boss_bullet');
      }
    }

    // Check collisions manually
    this.checkCollisions();

    // Wave management
    this.updateWaves(delta);

    // Combo timer
    if (this.combo > 0) {
      this.comboTimer -= delta;
      if (this.comboTimer <= 0) {
        this.combo = 0;
        this.multiplier = 1;
      }
    }
  }

  private firePlayerBullet(): void {
    const px = this.player.sprite.x;
    const py = this.player.sprite.y;
    const damage = this.player.getDamage();
    const texture = this.player.weaponLevel > 0 ? 'player_bullet_up' : 'player_bullet';

    if (this.player.weaponLevel >= 3) {
      // Triple shot + side shots
      this.playerBullets.fire(px, py - 10, 0, -PLAYER.bulletSpeed, damage, texture);
      this.playerBullets.fire(px - 12, py - 5, -40, -PLAYER.bulletSpeed, damage, texture);
      this.playerBullets.fire(px + 12, py - 5, 40, -PLAYER.bulletSpeed, damage, texture);
      this.playerBullets.fire(px - 24, py, -80, -PLAYER.bulletSpeed * 0.9, damage, texture);
      this.playerBullets.fire(px + 24, py, 80, -PLAYER.bulletSpeed * 0.9, damage, texture);
    } else if (this.player.weaponLevel >= 2) {
      // Triple shot
      this.playerBullets.fire(px, py - 10, 0, -PLAYER.bulletSpeed, damage, texture);
      this.playerBullets.fire(px - 10, py - 5, -30, -PLAYER.bulletSpeed, damage, texture);
      this.playerBullets.fire(px + 10, py - 5, 30, -PLAYER.bulletSpeed, damage, texture);
    } else if (this.player.weaponLevel >= 1) {
      // Dual shot
      this.playerBullets.fire(px - 6, py - 8, 0, -PLAYER.bulletSpeed, damage, texture);
      this.playerBullets.fire(px + 6, py - 8, 0, -PLAYER.bulletSpeed, damage, texture);
    } else {
      // Single shot
      this.playerBullets.fire(px, py - 10, 0, -PLAYER.bulletSpeed, damage, texture);
    }

    getAudio()[this.player.weaponLevel > 0 ? 'playerFireUpgraded' : 'playerFire']();
  }

  private updateEnemies(time: number, delta: number): void {
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      if (!enemy.isActive) {
        enemy.destroy();
        this.enemies.splice(i, 1);
        continue;
      }

      const result = enemy.update(time, delta, this.player.sprite.x, this.player.sprite.y);
      if (result.shouldFire) {
        for (const b of result.bullets) {
          this.enemyBullets.fireAngled(b.x, b.y, b.angle, b.speed, 1, b.isBoss ? 'boss_bullet' : 'enemy_bullet');
        }
      }
    }
  }

  private checkCollisions(): void {
    if (this.player.isDead) return;

    const playerBullets = this.playerBullets.group.getChildren() as Phaser.Physics.Arcade.Sprite[];
    const enemyBullets = this.enemyBullets.group.getChildren() as Phaser.Physics.Arcade.Sprite[];
    const powerupSprites = this.powerups.group.getChildren() as Phaser.Physics.Arcade.Sprite[];

    // Player bullets vs enemies
    for (const bullet of playerBullets) {
      if (!bullet.active) continue;

      for (const enemy of this.enemies) {
        if (!enemy.isActive || !enemy.sprite.active) continue;
        if (this.checkOverlap(bullet, enemy.sprite)) {
          const damage = bullet.getData('damage') || 1;
          const killed = enemy.takeDamage(damage);
          this.playerBullets.kill(bullet);
          getAudio().enemyHit();

          if (killed) {
            this.onEnemyKilled(enemy);
          }
          break;
        }
      }

      // Player bullets vs boss
      if (this.boss && this.boss.isActive && !this.boss.isDefeated && bullet.active) {
        if (this.checkOverlap(bullet, this.boss.sprite)) {
          const damage = bullet.getData('damage') || 1;
          const killed = this.boss.takeDamage(damage);
          this.playerBullets.kill(bullet);
          getAudio().enemyHit();

          if (killed) {
            this.onBossDefeated();
          }
        }
      }
    }

    // Enemy bullets vs player
    for (const bullet of enemyBullets) {
      if (!bullet.active) continue;
      if (this.checkOverlap(bullet, this.player.sprite)) {
        this.enemyBullets.kill(bullet);
        this.onPlayerHit();
        break;
      }
    }

    // Enemy bodies vs player
    for (const enemy of this.enemies) {
      if (!enemy.isActive || !enemy.sprite.active) continue;
      if (this.checkOverlap(this.player.sprite, enemy.sprite)) {
        this.onPlayerHit();
        enemy.takeDamage(999);
        this.onEnemyKilled(enemy);
        break;
      }
    }

    // Power-ups vs player
    for (const p of powerupSprites) {
      if (!p.active) continue;
      if (this.checkOverlap(this.player.sprite, p, 30)) {
        this.collectPowerUp(p);
      }
    }
  }

  private checkOverlap(a: Phaser.GameObjects.Sprite, b: Phaser.GameObjects.Sprite, extraRange: number = 0): boolean {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const ra = Math.max(a.width, a.height) * 0.35;
    const rb = Math.max(b.width, b.height) * 0.35;
    return dist < ra + rb + extraRange;
  }

  private onEnemyKilled(enemy: Enemy): void {
    // Score
    this.combo++;
    this.comboTimer = SCORING.comboWindow;
    this.multiplier = Math.min(1 + Math.floor(this.combo / 3), SCORING.maxMultiplier);
    this.score += enemy.score * this.multiplier;
    getAudio().enemyDestroy();
    if (this.combo > 1) getAudio().comboUp();

    // Explosion
    this.spawnExplosion(enemy.sprite.x, enemy.sprite.y, enemy.type === 'elite' ? 1.5 : 1);

    // Screen shake
    const settings = getSettings();
    if (settings.screenShake) {
      const intensity = enemy.type === 'elite' ? 4 : 2;
      this.cameras.main.shake(100, intensity / 1000);
    }

    // Power-up drop
    if (Math.random() < POWERUPS.dropChance || enemy.type === 'elite') {
      this.powerups.spawn(enemy.sprite.x, enemy.sprite.y);
    }

    enemy.isActive = false;
    this.emitHudUpdate();
  }

  private onBossDefeated(): void {
    this.score += this.boss!.score * this.multiplier;
    this.bossActive = false;

    const settings = getSettings();
    if (settings.screenShake) {
      this.cameras.main.shake(500, 8 / 1000);
    }

    this.emitHudUpdate();

    // Victory after boss defeat sequence
    this.time.delayedCall(2500, () => {
      this.isVictory = true;
      this.scene.stop('HudScene');
      this.scene.start('VictoryScene', {
        score: this.score,
        wave: this.waveSystem.currentWave,
      });
    });
  }

  private onPlayerHit(): void {
    const died = this.player.takeDamage(1);

    const settings = getSettings();
    if (settings.screenShake) {
      this.cameras.main.shake(150, 4 / 1000);
    }

    // Reset combo on hit
    this.combo = 0;
    this.multiplier = 1;

    if (died) {
      this.player.lives--;
      this.player.die();

      if (this.player.lives <= 0) {
        this.time.delayedCall(1500, () => {
          this.isGameOver = true;
          this.scene.stop('HudScene');
          this.scene.start('GameOverScene', {
            score: this.score,
            wave: this.waveSystem.currentWave,
          });
        });
      } else {
        this.time.delayedCall(PLAYER.respawnDelay, () => {
          if (!this.isGameOver) {
            this.player.respawn();
            this.enemyBullets.killAll();
          }
        });
      }
    }

    this.emitHudUpdate();
  }

  private collectPowerUp(sprite: Phaser.Physics.Arcade.Sprite): void {
    const type = sprite.getData('type') as PowerUpType;
    this.powerups.kill(sprite);

    // Pickup particle burst
    this.add.particles(sprite.x, sprite.y, 'particle_gold', {
      speed: { min: 30, max: 80 },
      scale: { start: 0.2, end: 0 },
      alpha: { start: 0.8, end: 0 },
      lifespan: 300,
      quantity: 8,
      blendMode: Phaser.BlendModes.ADD,
      emitting: false,
    }).explode(8, sprite.x, sprite.y);

    switch (type) {
      case 'weapon_up':
        this.player.upgradeWeapon(POWERUPS.duration.weapon_up);
        break;
      case 'shield':
        this.player.addShield();
        break;
      case 'speed':
        this.player.activateSpeed(POWERUPS.duration.speed);
        break;
      case 'special_charge':
        this.player.chargeSpecial();
        break;
      case 'score_gem':
        this.score += SCORING.gemValue * this.multiplier;
        break;
    }

    this.emitHudUpdate();
  }

  private updateWaves(delta: number): void {
    if (this.bossActive || this.isGameOver || this.isVictory) return;

    // Check if current wave is clear
    if (!this.wavePending && this.enemies.length === 0 && !this.bossActive) {
      this.wavePending = true;
      this.waveTimer = WAVES.wavePause;
    }

    if (this.wavePending) {
      this.waveTimer -= delta;
      if (this.waveTimer <= 0) {
        this.wavePending = false;
        this.spawnNextWave();
      }
    }
  }

  private spawnNextWave(): void {
    const wave = this.waveSystem.getNextWave();
    if (!wave) {
      // All waves cleared without boss (shouldn't happen normally)
      this.isVictory = true;
      this.scene.stop('HudScene');
      this.scene.start('VictoryScene', { score: this.score, wave: this.waveSystem.currentWave });
      return;
    }

    if (wave.isBoss) {
      this.spawnBoss();
      return;
    }

    // Show wave indicator
    this.emitWaveAnnounce(wave.isElite);

    const diffMod = this.waveSystem.getDifficultyMod();

    for (const spawn of wave.spawns) {
      this.time.delayedCall(spawn.delay, () => {
        if (this.isGameOver || this.isVictory) return;
        const enemy = new Enemy(this, spawn.type, spawn.x, spawn.y, diffMod);
        this.enemies.push(enemy);
      });
    }

    this.emitHudUpdate();
  }

  private spawnBoss(): void {
    this.bossActive = true;
    const diffMod = this.waveSystem.getDifficultyMod();
    this.boss = new Boss(this, diffMod);

    this.emitWaveAnnounce(false, true);
    this.emitHudUpdate();
  }

  private spawnExplosion(x: number, y: number, scale: number = 1): void {
    const count = Math.floor(12 * scale);
    this.add.particles(x, y, 'particle_fire', {
      speed: { min: 30 * scale, max: 100 * scale },
      scale: { start: 0.3 * scale, end: 0 },
      alpha: { start: 0.9, end: 0 },
      lifespan: 350,
      quantity: count,
      blendMode: Phaser.BlendModes.ADD,
      emitting: false,
    }).explode(count, x, y);

    this.add.particles(x, y, 'particle_white', {
      speed: { min: 20 * scale, max: 60 * scale },
      scale: { start: 0.2 * scale, end: 0 },
      alpha: { start: 0.6, end: 0 },
      lifespan: 250,
      quantity: Math.floor(6 * scale),
      blendMode: Phaser.BlendModes.ADD,
      emitting: false,
    }).explode(Math.floor(6 * scale), x, y);
  }

  // Special ability (crystal burst)
  useSpecialAbility(): void {
    if (!this.player.canUseSpecial()) return;
    this.player.useSpecial();

    // Damage all enemies on screen
    const damage = PLAYER.specialDamage;
    for (const enemy of this.enemies) {
      if (!enemy.isActive) continue;
      const killed = enemy.takeDamage(damage);
      if (killed) {
        this.onEnemyKilled(enemy);
      }
    }

    if (this.boss && this.boss.isActive) {
      this.boss.takeDamage(damage);
    }

    // Clear enemy bullets
    this.enemyBullets.killAll();

    // Big crystal burst effect
    this.add.particles(this.player.sprite.x, this.player.sprite.y, 'particle_crystal', {
      speed: { min: 100, max: 350 },
      scale: { start: 0.5, end: 0 },
      alpha: { start: 0.8, end: 0 },
      lifespan: 600,
      quantity: 30,
      blendMode: Phaser.BlendModes.ADD,
      emitting: false,
    }).explode(30, this.player.sprite.x, this.player.sprite.y);

    // Screen flash
    const flash = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, COLORS.crystal, 0.25).setDepth(100);
    this.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 400,
      onComplete: () => flash.destroy(),
    });

    const settings = getSettings();
    if (settings.screenShake) {
      this.cameras.main.shake(200, 6 / 1000);
    }

    this.emitHudUpdate();
  }

  pauseGame(): void {
    this.isPaused = true;
    this.physics.pause();
    this.scene.launch('PauseScene', { gameScene: this });
  }

  resumeGame(): void {
    this.isPaused = false;
    this.physics.resume();
  }

  // HUD data access
  getHudData() {
    return {
      score: this.score,
      combo: this.combo,
      multiplier: this.multiplier,
      hp: this.player?.hp ?? 0,
      maxHp: this.player?.maxHp ?? PLAYER.maxHp,
      shield: this.player?.shield ?? 0,
      maxShield: this.player?.maxShield ?? PLAYER.maxShield,
      lives: this.player?.lives ?? 0,
      specialMeter: this.player?.specialMeter ?? 0,
      weaponLevel: this.player?.weaponLevel ?? 0,
      wave: this.waveSystem?.currentWave ?? 0,
      totalWaves: this.waveSystem?.totalWaves ?? WAVES.totalWaves,
      bossHp: this.boss && !this.boss.isDefeated ? this.boss.getHpRatio() : -1,
      bossPhase: this.boss?.currentPhase ?? 0,
    };
  }

  private emitHudUpdate(): void {
    this.events.emit('hud-update');
  }

  private emitWaveAnnounce(isElite: boolean, isBoss: boolean = false): void {
    this.events.emit('wave-announce', {
      wave: this.waveSystem.currentWave,
      isElite,
      isBoss,
    });
  }

  shutdown(): void {
    this.player?.destroy();
    this.enemies.forEach(e => e.destroy());
    this.boss?.destroy();
    this.scene.stop('HudScene');
  }
}
