import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../game/config';

export class BulletPool {
  private scene: Phaser.Scene;
  group: Phaser.Physics.Arcade.Group;
  private textureKey: string;

  constructor(scene: Phaser.Scene, textureKey: string, maxSize: number = 100) {
    this.scene = scene;
    this.textureKey = textureKey;
    this.group = scene.physics.add.group({
      maxSize,
      classType: Phaser.Physics.Arcade.Sprite,
      runChildUpdate: false,
    });
  }

  fire(x: number, y: number, vx: number, vy: number, damage: number = 1, texture?: string): Phaser.Physics.Arcade.Sprite | null {
    const bullet = this.group.get(x, y, texture || this.textureKey) as Phaser.Physics.Arcade.Sprite;
    if (!bullet) return null;

    bullet.setActive(true);
    bullet.setVisible(true);
    bullet.setPosition(x, y);
    (bullet.body as Phaser.Physics.Arcade.Body).enable = true;
    bullet.setVelocity(vx, vy);
    bullet.setData('damage', damage);
    bullet.setDepth(8);

    // Set small hitbox
    bullet.setCircle(4, bullet.width / 2 - 4, bullet.height / 2 - 4);

    return bullet;
  }

  fireAngled(x: number, y: number, angle: number, speed: number, damage: number = 1, texture?: string): Phaser.Physics.Arcade.Sprite | null {
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed;
    return this.fire(x, y, vx, vy, damage, texture);
  }

  update(): void {
    const children = this.group.getChildren() as Phaser.Physics.Arcade.Sprite[];
    for (const bullet of children) {
      if (!bullet.active) continue;
      if (bullet.y < -20 || bullet.y > GAME_HEIGHT + 20 ||
          bullet.x < -20 || bullet.x > GAME_WIDTH + 20) {
        this.kill(bullet);
      }
    }
  }

  kill(bullet: Phaser.Physics.Arcade.Sprite): void {
    bullet.setActive(false);
    bullet.setVisible(false);
    (bullet.body as Phaser.Physics.Arcade.Body).enable = false;
    bullet.setVelocity(0, 0);
  }

  killAll(): void {
    const children = this.group.getChildren() as Phaser.Physics.Arcade.Sprite[];
    for (const bullet of children) {
      if (bullet.active) this.kill(bullet);
    }
  }
}
