import Phaser from 'phaser';
import { BOSS, GAME_WIDTH, GAME_HEIGHT, COLORS } from '../game/config';
import { angleToTarget, randomRange } from '../utils/math';
import { getAudio } from '../systems/AudioSystem';
import { BulletRequest } from './Enemy';

export class Boss {
  sprite: Phaser.Physics.Arcade.Sprite;
  hp: number;
  maxHp: number;
  score: number;
  currentPhase: number = 0;
  isActive: boolean = false;
  isIntro: boolean = true;
  isDefeated: boolean = false;

  private scene: Phaser.Scene;
  private fireTimer: number = 0;
  private phaseTimer: number = 0;
  private moveTimer: number = 0;
  private introTimer: number = 0;
  private targetX: number;
  private transitionActive: boolean = false;
  private spiralAngle: number = 0;
  private meteorTimer: number = 0;

  constructor(scene: Phaser.Scene, difficultyMod: number = 1) {
    this.scene = scene;
    this.hp = Math.ceil(BOSS.hp * difficultyMod);
    this.maxHp = this.hp;
    this.score = BOSS.score;
    this.targetX = GAME_WIDTH / 2;

    this.sprite = scene.physics.add.sprite(GAME_WIDTH / 2, -80, 'boss_ship');
    this.sprite.setDepth(5);
    this.sprite.setData('entity', this);
    this.sprite.setCircle(40, BOSS.width / 2 - 40, BOSS.height / 2 - 40);

    this.startIntro();
  }

  private startIntro(): void {
    this.isIntro = true;
    this.isActive = false;
    const audio = getAudio();
    audio.bossWarning();

    // Cinematic entry
    this.scene.tweens.add({
      targets: this.sprite,
      y: 100,
      duration: BOSS.introTime,
      ease: 'Sine.easeOut',
      onComplete: () => {
        this.isIntro = false;
        this.isActive = true;
        this.introTimer = 0;
      },
    });
  }

  update(time: number, delta: number, playerX: number, playerY: number): BulletRequest[] {
    if (this.isDefeated) return [];
    if (this.isIntro) {
      this.introTimer += delta;
      return [];
    }
    if (!this.isActive) return [];
    if (this.transitionActive) return [];

    const bullets: BulletRequest[] = [];
    const phase = BOSS.phases[this.currentPhase];

    // Movement - gets more aggressive in later phases
    this.moveTimer += delta;
    const moveSpeed = 80 + this.currentPhase * 30;
    const dx = this.targetX - this.sprite.x;
    if (Math.abs(dx) < 5) {
      this.targetX = randomRange(60, GAME_WIDTH - 60);
    }
    this.sprite.x += Math.sign(dx) * Math.min(Math.abs(dx), moveSpeed * (delta / 1000));
    const bobAmplitude = 20 + this.currentPhase * 8;
    this.sprite.y = 100 + Math.sin(this.moveTimer * 0.001) * bobAmplitude;

    // Firing
    this.fireTimer -= delta;
    if (this.fireTimer <= 0) {
      this.fireTimer = phase.fireRate;
      const angle = angleToTarget(this.sprite.x, this.sprite.y, playerX, playerY);

      switch (phase.pattern) {
        case 'firaga':
          this.patternFiraga(bullets, angle, phase.bulletSpeed);
          break;
        case 'thundaga':
          this.patternThundaga(bullets, playerX, phase.bulletSpeed);
          break;
        case 'blizzaga':
          this.patternBlizzaga(bullets, angle, phase.bulletSpeed);
          break;
        case 'ultima':
          this.patternUltima(bullets, angle, phase.bulletSpeed);
          break;
        case 'meteor':
          this.patternMeteor(bullets, phase.bulletSpeed);
          break;
      }
    }

    // Check phase transitions
    this.checkPhaseTransition();

    return bullets;
  }

  // Phase 1: Firaga - spreading fire waves
  private patternFiraga(bullets: BulletRequest[], angle: number, speed: number): void {
    // 5-bullet aimed spread
    const count = 5;
    const totalSpread = 0.8;
    for (let i = 0; i < count; i++) {
      const a = angle - totalSpread / 2 + (totalSpread * i) / (count - 1);
      bullets.push({
        x: this.sprite.x,
        y: this.sprite.y + BOSS.height / 2,
        angle: a,
        speed,
        isBoss: true,
      });
    }
  }

  // Phase 2: Thundaga - lightning columns raining down
  private patternThundaga(bullets: BulletRequest[], playerX: number, speed: number): void {
    // Vertical columns of bullets targeting player's X position
    const spread = 40;
    for (let i = -2; i <= 2; i++) {
      const x = playerX + i * spread + randomRange(-15, 15);
      bullets.push({
        x: Math.max(20, Math.min(GAME_WIDTH - 20, x)),
        y: this.sprite.y + BOSS.height / 2,
        angle: Math.PI / 2 + randomRange(-0.1, 0.1), // Mostly straight down
        speed: speed * 1.2,
        isBoss: true,
      });
    }
    // Side bolts
    bullets.push({
      x: this.sprite.x - 40,
      y: this.sprite.y,
      angle: Math.PI / 2 + 0.3,
      speed: speed * 0.9,
      isBoss: true,
    });
    bullets.push({
      x: this.sprite.x + 40,
      y: this.sprite.y,
      angle: Math.PI / 2 - 0.3,
      speed: speed * 0.9,
      isBoss: true,
    });
  }

  // Phase 3: Blizzaga - spiraling ice shards
  private patternBlizzaga(bullets: BulletRequest[], angle: number, speed: number): void {
    this.spiralAngle += 0.7;
    // Spiral ring of 6 bullets
    for (let i = 0; i < 6; i++) {
      const a = this.spiralAngle + (Math.PI * 2 * i) / 6;
      bullets.push({
        x: this.sprite.x + Math.cos(a) * 25,
        y: this.sprite.y + BOSS.height / 2,
        angle: a + Math.PI / 2,
        speed,
        isBoss: true,
      });
    }
    // Plus aimed triple shot
    for (let i = -1; i <= 1; i++) {
      bullets.push({
        x: this.sprite.x + i * 20,
        y: this.sprite.y + BOSS.height / 2,
        angle: angle + i * 0.15,
        speed: speed * 1.1,
        isBoss: true,
      });
    }
  }

  // Phase 4: Ultima - everything at once
  private patternUltima(bullets: BulletRequest[], angle: number, speed: number): void {
    this.spiralAngle += 0.5;

    // Outer spiral ring (8 bullets)
    for (let i = 0; i < 8; i++) {
      const a = this.spiralAngle + (Math.PI * 2 * i) / 8;
      bullets.push({
        x: this.sprite.x + Math.cos(a) * 30,
        y: this.sprite.y + BOSS.height / 2,
        angle: a + Math.PI / 2,
        speed: speed * 0.85,
        isBoss: true,
      });
    }

    // Aimed burst (5 shots)
    const spread = 1.0;
    for (let i = 0; i < 5; i++) {
      bullets.push({
        x: this.sprite.x,
        y: this.sprite.y + BOSS.height / 2,
        angle: angle - spread / 2 + (spread * i) / 4,
        speed: speed * 1.15,
        isBoss: true,
      });
    }

    // Random scatter
    for (let i = 0; i < 3; i++) {
      bullets.push({
        x: this.sprite.x + randomRange(-35, 35),
        y: this.sprite.y + BOSS.height / 2,
        angle: randomRange(Math.PI / 6, Math.PI * 5 / 6),
        speed: speed * randomRange(0.6, 1.0),
        isBoss: true,
      });
    }
  }

  // Phase 5: Meteor - absolute chaos, bullet hell
  private patternMeteor(bullets: BulletRequest[], speed: number): void {
    this.spiralAngle += 0.4;
    this.meteorTimer++;

    // Double counter-rotating spirals (5 each)
    for (let i = 0; i < 5; i++) {
      const a1 = this.spiralAngle + (Math.PI * 2 * i) / 5;
      const a2 = -this.spiralAngle + (Math.PI * 2 * i) / 5;
      bullets.push({
        x: this.sprite.x + Math.cos(a1) * 20,
        y: this.sprite.y + BOSS.height / 2,
        angle: a1 + Math.PI / 2,
        speed: speed * 0.8,
        isBoss: true,
      });
      bullets.push({
        x: this.sprite.x + Math.cos(a2) * 20,
        y: this.sprite.y + BOSS.height / 2,
        angle: a2 + Math.PI / 2,
        speed: speed * 0.8,
        isBoss: true,
      });
    }

    // Meteor rain from random positions
    if (this.meteorTimer % 3 === 0) {
      for (let i = 0; i < 4; i++) {
        bullets.push({
          x: randomRange(30, GAME_WIDTH - 30),
          y: this.sprite.y + BOSS.height / 2 - 10,
          angle: Math.PI / 2 + randomRange(-0.2, 0.2),
          speed: speed * 1.3,
          isBoss: true,
        });
      }
    }
  }

  private checkPhaseTransition(): void {
    const hpRatio = this.hp / this.maxHp;
    let newPhase = 0;

    for (let i = BOSS.phases.length - 1; i >= 0; i--) {
      if (hpRatio <= BOSS.phases[i].hpThreshold) {
        newPhase = i;
      }
    }

    if (newPhase > this.currentPhase) {
      this.transitionToPhase(newPhase);
    }
  }

  private transitionToPhase(phase: number): void {
    this.transitionActive = true;
    this.currentPhase = phase;
    const audio = getAudio();
    audio.bossPhaseTransition();

    // Flash effect
    const phaseColors = [COLORS.red, COLORS.gold, COLORS.crystal, COLORS.magenta, COLORS.purple];
    const color = phaseColors[phase] || COLORS.magenta;
    this.sprite.setTintFill(color);

    // Screen flash
    const flash = this.scene.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, color, 0.35)
      .setDepth(100);

    this.scene.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 500,
      onComplete: () => flash.destroy(),
    });

    // Burst particles
    this.scene.add.particles(this.sprite.x, this.sprite.y, 'particle_fire', {
      speed: { min: 60, max: 180 },
      scale: { start: 0.4, end: 0 },
      alpha: { start: 0.8, end: 0 },
      lifespan: 500,
      quantity: 25,
      blendMode: Phaser.BlendModes.ADD,
      emitting: false,
    }).explode(25, this.sprite.x, this.sprite.y);

    this.scene.time.delayedCall(600, () => {
      this.sprite.clearTint();
      this.transitionActive = false;
    });
  }

  takeDamage(amount: number): boolean {
    if (this.isIntro || this.isDefeated) return false;

    this.hp -= amount;

    this.sprite.setTintFill(0xffffff);
    this.scene.time.delayedCall(40, () => {
      if (this.sprite && this.sprite.active && !this.isDefeated) {
        this.sprite.clearTint();
      }
    });

    if (this.hp <= 0) {
      this.defeat();
      return true;
    }

    this.checkPhaseTransition();
    return false;
  }

  private defeat(): void {
    this.isDefeated = true;
    this.isActive = false;
    const audio = getAudio();

    // Multi-explosion defeat sequence - longer and more dramatic
    const explosionCount = 12;
    for (let i = 0; i < explosionCount; i++) {
      this.scene.time.delayedCall(i * 200, () => {
        const ex = this.sprite.x + randomRange(-50, 50);
        const ey = this.sprite.y + randomRange(-40, 40);

        this.scene.add.particles(ex, ey, 'particle_fire', {
          speed: { min: 40, max: 140 },
          scale: { start: 0.5, end: 0 },
          alpha: { start: 1, end: 0 },
          lifespan: 400,
          quantity: 15,
          blendMode: Phaser.BlendModes.ADD,
          emitting: false,
        }).explode(15, ex, ey);

        audio.enemyDestroy();
      });
    }

    // Final massive explosion
    this.scene.time.delayedCall(explosionCount * 200, () => {
      this.scene.add.particles(this.sprite.x, this.sprite.y, 'particle_gold', {
        speed: { min: 100, max: 300 },
        scale: { start: 0.8, end: 0 },
        alpha: { start: 1, end: 0 },
        lifespan: 1000,
        quantity: 60,
        blendMode: Phaser.BlendModes.ADD,
        emitting: false,
      }).explode(60, this.sprite.x, this.sprite.y);

      this.scene.add.particles(this.sprite.x, this.sprite.y, 'particle_crystal', {
        speed: { min: 80, max: 250 },
        scale: { start: 0.6, end: 0 },
        alpha: { start: 1, end: 0 },
        lifespan: 800,
        quantity: 40,
        blendMode: Phaser.BlendModes.ADD,
        emitting: false,
      }).explode(40, this.sprite.x, this.sprite.y);

      // Big white screen flash
      const flash = this.scene.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, COLORS.white, 0.7)
        .setDepth(100);
      this.scene.tweens.add({
        targets: flash,
        alpha: 0,
        duration: 800,
        onComplete: () => flash.destroy(),
      });

      this.sprite.destroy();
    });
  }

  getHpRatio(): number {
    return Math.max(0, this.hp / this.maxHp);
  }

  destroy(): void {
    if (this.sprite && this.sprite.active) {
      this.sprite.destroy();
    }
  }
}
