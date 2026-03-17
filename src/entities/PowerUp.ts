import Phaser from 'phaser';
import { POWERUPS, GAME_WIDTH, GAME_HEIGHT } from '../game/config';
import { randomRange } from '../utils/math';

export type PowerUpType = typeof POWERUPS.types[number];

const TEXTURE_MAP: Record<PowerUpType, string> = {
  weapon_up: 'powerup_weapon',
  shield: 'powerup_shield',
  speed: 'powerup_speed',
  bomb: 'powerup_special',
  score_gem: 'powerup_gem',
};

export class PowerUpPool {
  private scene: Phaser.Scene;
  group: Phaser.Physics.Arcade.Group;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.group = scene.physics.add.group({
      maxSize: 20,
      classType: Phaser.Physics.Arcade.Sprite,
      runChildUpdate: false,
    });
  }

  spawn(x: number, y: number, type?: PowerUpType): void {
    if (!type) {
      const roll = Math.random();
      if (roll < 0.25) type = 'score_gem';
      else if (roll < 0.45) type = 'weapon_up';
      else if (roll < 0.60) type = 'shield';
      else if (roll < 0.75) type = 'speed';
      else type = 'bomb';
    }

    const texture = TEXTURE_MAP[type];
    const powerup = this.group.get(x, y, texture) as Phaser.Physics.Arcade.Sprite;
    if (!powerup) return;

    powerup.setActive(true);
    powerup.setVisible(true);
    powerup.setPosition(x, y);
    (powerup.body as Phaser.Physics.Arcade.Body).enable = true;
    powerup.setVelocity(randomRange(-20, 20), POWERUPS.fallSpeed);
    powerup.setData('type', type);
    powerup.setDepth(7);
    powerup.setCircle(10, 0, 0);

    // Glow pulse
    this.scene.tweens.add({
      targets: powerup,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 400,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  update(): void {
    const children = this.group.getChildren() as Phaser.Physics.Arcade.Sprite[];
    for (const p of children) {
      if (!p.active) continue;
      if (p.y > GAME_HEIGHT + 30) {
        this.kill(p);
      }
    }
  }

  kill(sprite: Phaser.Physics.Arcade.Sprite): void {
    sprite.setActive(false);
    sprite.setVisible(false);
    (sprite.body as Phaser.Physics.Arcade.Body).enable = false;
    sprite.setVelocity(0, 0);
    this.scene.tweens.killTweensOf(sprite);
    sprite.setScale(1);
  }

  killAll(): void {
    const children = this.group.getChildren() as Phaser.Physics.Arcade.Sprite[];
    for (const p of children) {
      if (p.active) this.kill(p);
    }
  }
}
