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

    // Movement
    this.moveTimer += delta;
    const moveSpeed = 80 + this.currentPhase * 20;
    const dx = this.targetX - this.sprite.x;
    if (Math.abs(dx) < 5) {
      this.targetX = randomRange(60, GAME_WIDTH - 60);
    }
    this.sprite.x += Math.sign(dx) * Math.min(Math.abs(dx), moveSpeed * (delta / 1000));
    this.sprite.y = 100 + Math.sin(this.moveTimer * 0.001) * 20;

    // Firing
    this.fireTimer -= delta;
    if (this.fireTimer <= 0) {
      this.fireTimer = phase.fireRate;
      const angle = angleToTarget(this.sprite.x, this.sprite.y, playerX, playerY);

      switch (phase.pattern) {
        case 'spiral':
          this.patternSpiral(bullets, phase.bulletSpeed);
          break;
        case 'spread':
          this.patternSpread(bullets, angle, phase.bulletSpeed);
          break;
        case 'barrage':
          this.patternBarrage(bullets, angle, phase.bulletSpeed);
          break;
      }
    }

    // Check phase transitions
    this.checkPhaseTransition();

    return bullets;
  }

  private patternSpiral(bullets: BulletRequest[], speed: number): void {
    this.phaseTimer++;
    const baseAngle = this.phaseTimer * 0.5;
    for (let i = 0; i < 4; i++) {
      const a = baseAngle + (Math.PI * 2 * i) / 4;
      bullets.push({
        x: this.sprite.x + Math.cos(a) * 20,
        y: this.sprite.y + BOSS.height / 2,
        angle: a + Math.PI / 2,
        speed,
        isBoss: true,
      });
    }
  }

  private patternSpread(bullets: BulletRequest[], angle: number, speed: number): void {
    const count = 7;
    const totalSpread = 1.2;
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

  private patternBarrage(bullets: BulletRequest[], angle: number, speed: number): void {
    // Aimed shots + random spray
    for (let i = -1; i <= 1; i++) {
      bullets.push({
        x: this.sprite.x + i * 25,
        y: this.sprite.y + BOSS.height / 2,
        angle: angle + i * 0.1,
        speed: speed * 1.1,
        isBoss: true,
      });
    }
    // Random spray
    for (let i = 0; i < 3; i++) {
      bullets.push({
        x: this.sprite.x + randomRange(-30, 30),
        y: this.sprite.y + BOSS.height / 2,
        angle: randomRange(Math.PI / 4, Math.PI * 3 / 4),
        speed: speed * randomRange(0.7, 1),
        isBoss: true,
      });
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
    this.sprite.setTintFill(COLORS.magenta);

    // Screen flash
    const flash = this.scene.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, COLORS.magenta, 0.3)
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

    // Multi-explosion defeat sequence
    const explosionCount = 8;
    for (let i = 0; i < explosionCount; i++) {
      this.scene.time.delayedCall(i * 200, () => {
        const ex = this.sprite.x + randomRange(-40, 40);
        const ey = this.sprite.y + randomRange(-30, 30);

        this.scene.add.particles(ex, ey, 'particle_fire', {
          speed: { min: 40, max: 120 },
          scale: { start: 0.5, end: 0 },
          alpha: { start: 1, end: 0 },
          lifespan: 400,
          quantity: 12,
          blendMode: Phaser.BlendModes.ADD,
          emitting: false,
        }).explode(12, ex, ey);

        audio.enemyDestroy();
      });
    }

    // Final explosion
    this.scene.time.delayedCall(explosionCount * 200, () => {
      this.scene.add.particles(this.sprite.x, this.sprite.y, 'particle_gold', {
        speed: { min: 80, max: 250 },
        scale: { start: 0.6, end: 0 },
        alpha: { start: 1, end: 0 },
        lifespan: 800,
        quantity: 40,
        blendMode: Phaser.BlendModes.ADD,
        emitting: false,
      }).explode(40, this.sprite.x, this.sprite.y);

      // Screen flash
      const flash = this.scene.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, COLORS.white, 0.5)
        .setDepth(100);
      this.scene.tweens.add({
        targets: flash,
        alpha: 0,
        duration: 600,
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
