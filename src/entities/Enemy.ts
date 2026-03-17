import Phaser from 'phaser';
import { ENEMIES, GAME_WIDTH, GAME_HEIGHT, COLORS } from '../game/config';
import { randomRange, angleToTarget } from '../utils/math';

export type EnemyType = 'scout' | 'diver' | 'tank' | 'spreader' | 'summoner' | 'elite';

interface EnemyConfig {
  hp: number;
  speed: number;
  score: number;
  fireRate: number;
  bulletSpeed: number;
  width: number;
  height: number;
}

export class Enemy {
  sprite: Phaser.Physics.Arcade.Sprite;
  type: EnemyType;
  hp: number;
  maxHp: number;
  score: number;
  fireRate: number;
  bulletSpeed: number;
  speed: number;
  fireTimer: number = 0;
  isActive: boolean = true;

  private scene: Phaser.Scene;
  private config: EnemyConfig;
  private behaviorTimer: number = 0;
  private movePhase: number = 0;
  private entryComplete: boolean = false;
  private targetY: number = 0;

  constructor(scene: Phaser.Scene, type: EnemyType, x: number, y: number, difficultyMod: number = 1) {
    this.scene = scene;
    this.type = type;
    this.config = ENEMIES[type];

    this.hp = Math.ceil(this.config.hp * difficultyMod);
    this.maxHp = this.hp;
    this.score = this.config.score;
    this.speed = this.config.speed;
    this.fireRate = Math.max(400, this.config.fireRate / difficultyMod);
    this.bulletSpeed = this.config.bulletSpeed * difficultyMod;
    this.fireTimer = randomRange(500, this.fireRate);

    const textureKey = `enemy_${type}`;
    this.sprite = scene.physics.add.sprite(x, y, textureKey);
    this.sprite.setDepth(5);
    this.sprite.setData('entity', this);

    // Set hitbox
    const hw = this.config.width * 0.4;
    const hh = this.config.height * 0.4;
    this.sprite.setCircle(Math.max(hw, hh), this.config.width / 2 - Math.max(hw, hh), this.config.height / 2 - Math.max(hw, hh));

    this.targetY = randomRange(60, GAME_HEIGHT * 0.35);
  }

  update(time: number, delta: number, playerX: number, playerY: number): { shouldFire: boolean; bullets: BulletRequest[] } {
    if (!this.isActive) return { shouldFire: false, bullets: [] };

    const bullets: BulletRequest[] = [];

    switch (this.type) {
      case 'scout':
        this.behaviorScout(delta);
        break;
      case 'diver':
        this.behaviorDiver(delta, playerX, playerY);
        break;
      case 'tank':
        this.behaviorTank(delta);
        break;
      case 'spreader':
        this.behaviorSpreader(delta);
        break;
      case 'summoner':
        this.behaviorSummoner(delta);
        break;
      case 'elite':
        this.behaviorElite(delta, playerX);
        break;
    }

    // Firing
    if (this.fireRate > 0 && this.entryComplete) {
      this.fireTimer -= delta;
      if (this.fireTimer <= 0) {
        this.fireTimer = this.fireRate;
        const angle = angleToTarget(this.sprite.x, this.sprite.y, playerX, playerY);

        if (this.type === 'spreader') {
          const spread = 0.3;
          for (let i = -1; i <= 1; i++) {
            bullets.push({
              x: this.sprite.x,
              y: this.sprite.y + this.config.height / 2,
              angle: angle + i * spread,
              speed: this.bulletSpeed,
              isBoss: false,
            });
          }
        } else if (this.type === 'elite') {
          const spread = 0.2;
          for (let i = -2; i <= 2; i++) {
            bullets.push({
              x: this.sprite.x,
              y: this.sprite.y + this.config.height / 2,
              angle: angle + i * spread,
              speed: this.bulletSpeed,
              isBoss: false,
            });
          }
        } else {
          bullets.push({
            x: this.sprite.x,
            y: this.sprite.y + this.config.height / 2,
            angle: angle,
            speed: this.bulletSpeed,
            isBoss: false,
          });
        }
      }
    }

    // Off-screen removal
    if (this.sprite.y > GAME_HEIGHT + 50 || this.sprite.y < -100 ||
        this.sprite.x < -50 || this.sprite.x > GAME_WIDTH + 50) {
      if (this.entryComplete) {
        this.isActive = false;
      }
    }

    return { shouldFire: bullets.length > 0, bullets };
  }

  private behaviorScout(delta: number): void {
    if (!this.entryComplete) {
      this.sprite.y += this.speed * (delta / 1000);
      if (this.sprite.y >= this.targetY) {
        this.entryComplete = true;
      }
      return;
    }

    this.behaviorTimer += delta;
    this.sprite.x += Math.sin(this.behaviorTimer * 0.003) * 1.5;
    this.sprite.y += 0.2;
  }

  private behaviorDiver(delta: number, playerX: number, playerY: number): void {
    if (!this.entryComplete) {
      this.sprite.y += this.speed * 0.6 * (delta / 1000);
      if (this.sprite.y >= this.targetY) {
        this.entryComplete = true;
        this.behaviorTimer = 0;
      }
      return;
    }

    this.behaviorTimer += delta;

    if (this.behaviorTimer > 1200) {
      // Dive toward player
      const angle = angleToTarget(this.sprite.x, this.sprite.y, playerX, playerY + 60);
      this.sprite.x += Math.cos(angle) * this.speed * (delta / 1000);
      this.sprite.y += Math.sin(angle) * this.speed * (delta / 1000);
    } else {
      // Hover and weave
      this.sprite.x += Math.sin(this.behaviorTimer * 0.005) * 2;
    }
  }

  private behaviorTank(delta: number): void {
    if (!this.entryComplete) {
      this.sprite.y += this.speed * (delta / 1000);
      if (this.sprite.y >= this.targetY) {
        this.entryComplete = true;
      }
      return;
    }

    this.behaviorTimer += delta;
    this.sprite.x += Math.sin(this.behaviorTimer * 0.001) * 0.8;
    this.sprite.y += 0.1;
  }

  private behaviorSpreader(delta: number): void {
    if (!this.entryComplete) {
      this.sprite.y += this.speed * (delta / 1000);
      if (this.sprite.y >= this.targetY) {
        this.entryComplete = true;
      }
      return;
    }

    this.behaviorTimer += delta;
    this.sprite.x += Math.sin(this.behaviorTimer * 0.002) * 1.2;
    this.sprite.y += 0.15;
  }

  private behaviorSummoner(delta: number): void {
    if (!this.entryComplete) {
      this.sprite.y += this.speed * (delta / 1000);
      if (this.sprite.y >= this.targetY) {
        this.entryComplete = true;
      }
      return;
    }

    this.behaviorTimer += delta;
    this.sprite.x += Math.sin(this.behaviorTimer * 0.0015) * 1;
  }

  private behaviorElite(delta: number, playerX: number): void {
    if (!this.entryComplete) {
      this.sprite.y += this.speed * (delta / 1000);
      if (this.sprite.y >= this.targetY) {
        this.entryComplete = true;
      }
      return;
    }

    this.behaviorTimer += delta;
    // Slowly track player X
    const dx = playerX - this.sprite.x;
    this.sprite.x += Math.sign(dx) * Math.min(Math.abs(dx), this.speed * 0.5 * (delta / 1000));
    this.sprite.y += Math.sin(this.behaviorTimer * 0.001) * 0.3;
  }

  takeDamage(amount: number): boolean {
    this.hp -= amount;

    // Flash white
    this.sprite.setTintFill(0xffffff);
    this.scene.time.delayedCall(50, () => {
      if (this.sprite && this.sprite.active) {
        this.sprite.clearTint();
      }
    });

    return this.hp <= 0;
  }

  destroy(): void {
    this.isActive = false;
    this.sprite.destroy();
  }
}

export interface BulletRequest {
  x: number;
  y: number;
  angle: number;
  speed: number;
  isBoss: boolean;
}
