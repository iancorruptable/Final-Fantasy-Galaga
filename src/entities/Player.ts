import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, PLAYER, COLORS, SAFE_AREA } from '../game/config';
import { clamp } from '../utils/math';
import { getAudio } from '../systems/AudioSystem';

export class Player {
  sprite: Phaser.Physics.Arcade.Sprite;
  hp: number;
  maxHp: number;
  shield: number;
  maxShield: number;
  lives: number;
  weaponLevel: number = 0;
  weaponTimer: number = 0;
  speedBoost: boolean = false;
  speedTimer: number = 0;
  specialMeter: number = 1;
  specialCooldownTimer: number = 0;
  isInvincible: boolean = false;
  isDead: boolean = false;
  fireTimer: number = 0;

  private scene: Phaser.Scene;
  private trailEmitter: Phaser.GameObjects.Particles.ParticleEmitter | null = null;
  private shieldGraphic: Phaser.GameObjects.Ellipse | null = null;
  private dragOffsetY: number = -60;
  private isDragging: boolean = false;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.hp = PLAYER.maxHp;
    this.maxHp = PLAYER.maxHp;
    this.shield = PLAYER.maxShield;
    this.maxShield = PLAYER.maxShield;
    this.lives = PLAYER.lives;

    const startX = GAME_WIDTH / 2;
    const startY = GAME_HEIGHT - SAFE_AREA.bottom - 100;

    this.sprite = scene.physics.add.sprite(startX, startY, 'player_ship');
    this.sprite.setCollideWorldBounds(true);
    this.sprite.setCircle(PLAYER.hitboxRadius, PLAYER.shipWidth / 2 - PLAYER.hitboxRadius, PLAYER.shipHeight / 2 - PLAYER.hitboxRadius);
    this.sprite.setDepth(10);
    this.sprite.setData('entity', this);

    // Engine trail
    this.trailEmitter = scene.add.particles(0, 0, 'particle_crystal', {
      follow: this.sprite,
      followOffset: { x: 0, y: 20 },
      speedY: { min: 40, max: 80 },
      speedX: { min: -8, max: 8 },
      scale: { start: 0.15, end: 0 },
      alpha: { start: 0.5, end: 0 },
      lifespan: 400,
      frequency: 30,
      blendMode: Phaser.BlendModes.ADD,
    });
    this.trailEmitter.setDepth(9);

    // Shield visual
    this.shieldGraphic = scene.add.ellipse(startX, startY, 48, 52, COLORS.crystal, 0.15)
      .setStrokeStyle(1.5, COLORS.crystal, 0.3)
      .setDepth(11);

    this.setupInput();
  }

  private setupInput(): void {
    this.scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.isDragging = true;
    });

    this.scene.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (!this.isDragging || this.isDead) return;
      this.moveTo(pointer.x, pointer.y + this.dragOffsetY);
    });

    this.scene.input.on('pointerup', () => {
      this.isDragging = false;
    });
  }

  private moveTo(x: number, y: number): void {
    const playAreaTop = SAFE_AREA.top + 60;
    const playAreaBottom = GAME_HEIGHT - SAFE_AREA.bottom - 20;
    const margin = SAFE_AREA.sides + 16;

    this.sprite.x = clamp(x, margin, GAME_WIDTH - margin);
    this.sprite.y = clamp(y, playAreaTop, playAreaBottom);
  }

  update(time: number, delta: number): void {
    if (this.isDead) return;

    // Weapon upgrade timer
    if (this.weaponLevel > 0 && this.weaponTimer > 0) {
      this.weaponTimer -= delta;
      if (this.weaponTimer <= 0) {
        this.weaponLevel = 0;
      }
    }

    // Speed boost timer
    if (this.speedBoost && this.speedTimer > 0) {
      this.speedTimer -= delta;
      if (this.speedTimer <= 0) {
        this.speedBoost = false;
      }
    }

    // Special cooldown
    if (this.specialMeter < 1) {
      this.specialCooldownTimer -= delta;
      if (this.specialCooldownTimer <= 0) {
        this.specialMeter = 1;
      }
    }

    // Shield visual tracking
    if (this.shieldGraphic) {
      this.shieldGraphic.x = this.sprite.x;
      this.shieldGraphic.y = this.sprite.y;
      this.shieldGraphic.setVisible(this.shield > 0 && !this.isInvincible);
    }

    // Invincibility flash
    if (this.isInvincible) {
      this.sprite.alpha = Math.sin(time * 0.015) > 0 ? 1 : 0.3;
    } else {
      this.sprite.alpha = 1;
    }
  }

  getFireRate(): number {
    const base = PLAYER.fireRate;
    if (this.weaponLevel >= 2) return base * 0.6;
    if (this.weaponLevel >= 1) return base * 0.8;
    return base;
  }

  getDamage(): number {
    return PLAYER.bulletDamage + this.weaponLevel;
  }

  takeDamage(amount: number): boolean {
    if (this.isInvincible || this.isDead) return false;

    const audio = getAudio();

    if (this.shield > 0) {
      this.shield = Math.max(0, this.shield - amount);
      audio.playerHit();
      this.flashDamage();
      this.startInvincibility(500);
      return false;
    }

    this.hp -= amount;
    audio.playerHit();
    this.flashDamage();

    if (this.hp <= 0) {
      return true; // Player dies
    }

    this.startInvincibility(PLAYER.invincibleMs);
    return false;
  }

  private flashDamage(): void {
    this.sprite.setTintFill(0xffffff);
    this.scene.time.delayedCall(80, () => {
      if (!this.isDead) this.sprite.clearTint();
    });
  }

  private startInvincibility(duration: number): void {
    this.isInvincible = true;
    this.scene.time.delayedCall(duration, () => {
      this.isInvincible = false;
      if (!this.isDead) this.sprite.alpha = 1;
    });
  }

  die(): void {
    this.isDead = true;
    this.sprite.setVisible(false);
    this.sprite.body!.enable = false;
    if (this.trailEmitter) this.trailEmitter.stop();
    if (this.shieldGraphic) this.shieldGraphic.setVisible(false);

    getAudio().playerDeath();

    // Death explosion
    this.scene.add.particles(this.sprite.x, this.sprite.y, 'particle_crystal', {
      speed: { min: 50, max: 200 },
      scale: { start: 0.4, end: 0 },
      alpha: { start: 1, end: 0 },
      lifespan: 600,
      quantity: 20,
      blendMode: Phaser.BlendModes.ADD,
      emitting: false,
    }).explode(20, this.sprite.x, this.sprite.y);

    this.scene.add.particles(this.sprite.x, this.sprite.y, 'particle_fire', {
      speed: { min: 30, max: 150 },
      scale: { start: 0.3, end: 0 },
      alpha: { start: 0.8, end: 0 },
      lifespan: 500,
      quantity: 15,
      blendMode: Phaser.BlendModes.ADD,
      emitting: false,
    }).explode(15, this.sprite.x, this.sprite.y);
  }

  respawn(): void {
    this.hp = this.maxHp;
    this.shield = 0;
    this.weaponLevel = 0;
    this.isDead = false;
    this.sprite.setPosition(GAME_WIDTH / 2, GAME_HEIGHT - SAFE_AREA.bottom - 100);
    this.sprite.setVisible(true);
    this.sprite.body!.enable = true;
    if (this.trailEmitter) this.trailEmitter.start();
    this.startInvincibility(2000);
  }

  upgradeWeapon(duration: number): void {
    this.weaponLevel = Math.min(this.weaponLevel + 1, 3);
    this.weaponTimer = duration;
    getAudio().powerUp();
  }

  addShield(): void {
    this.shield = Math.min(this.shield + 1, this.maxShield);
    getAudio().powerUp();
  }

  activateSpeed(duration: number): void {
    this.speedBoost = true;
    this.speedTimer = duration;
    getAudio().powerUp();
  }

  chargeSpecial(): void {
    this.specialMeter = 1;
    getAudio().powerUp();
  }

  canUseSpecial(): boolean {
    return this.specialMeter >= 1 && !this.isDead;
  }

  useSpecial(): void {
    this.specialMeter = 0;
    this.specialCooldownTimer = PLAYER.specialCooldown;
    getAudio().specialAbility();
  }

  destroy(): void {
    this.sprite.destroy();
    if (this.trailEmitter) this.trailEmitter.destroy();
    if (this.shieldGraphic) this.shieldGraphic.destroy();
  }
}
