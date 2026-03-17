import Phaser from 'phaser';
import { COLORS, GAME_WIDTH, GAME_HEIGHT } from '../game/config';

// Generates all game textures procedurally for a cohesive crystal-fantasy look

export function generateAllAssets(scene: Phaser.Scene): void {
  generatePlayerShip(scene);
  generatePlayerBullet(scene);
  generateEnemyBullet(scene);
  generateEnemies(scene);
  generateBoss(scene);
  generatePowerups(scene);
  generateParticles(scene);
  generateUIElements(scene);
  generateBackground(scene);
}

function generatePlayerShip(scene: Phaser.Scene): void {
  const g = scene.add.graphics().setVisible(false);
  const w = 36, h = 44;

  // Engine glow
  g.fillStyle(0x00aaff, 0.3);
  g.fillEllipse(w / 2, h - 4, 20, 12);

  // Main hull
  g.fillStyle(0x2244aa);
  g.fillTriangle(w / 2, 0, 4, h - 8, w - 4, h - 8);

  // Inner crystal body
  g.fillStyle(0x3366cc);
  g.fillTriangle(w / 2, 4, 10, h - 12, w - 10, h - 12);

  // Crystal core
  g.fillStyle(COLORS.crystal);
  g.fillEllipse(w / 2, h / 2 - 2, 8, 10);

  // Core highlight
  g.fillStyle(COLORS.crystalLight, 0.8);
  g.fillEllipse(w / 2, h / 2 - 5, 4, 5);

  // Wing tips
  g.fillStyle(0x4488ff);
  g.fillTriangle(0, h - 10, 8, h - 20, 8, h - 6);
  g.fillTriangle(w, h - 10, w - 8, h - 20, w - 8, h - 6);

  // Wing crystals
  g.fillStyle(COLORS.crystal, 0.6);
  g.fillCircle(5, h - 12, 2);
  g.fillCircle(w - 5, h - 12, 2);

  // Outline glow
  g.lineStyle(1, COLORS.crystal, 0.4);
  g.strokeTriangle(w / 2, 0, 4, h - 8, w - 4, h - 8);

  g.generateTexture('player_ship', w, h);
  g.destroy();
}

function generatePlayerBullet(scene: Phaser.Scene): void {
  const g = scene.add.graphics().setVisible(false);
  const w = 6, h = 16;

  g.fillStyle(COLORS.crystalLight, 0.3);
  g.fillEllipse(w / 2, h / 2, w, h);

  g.fillStyle(COLORS.crystal);
  g.fillEllipse(w / 2, h / 2, w - 2, h - 4);

  g.fillStyle(COLORS.white, 0.8);
  g.fillEllipse(w / 2, h / 2, 2, h - 8);

  g.generateTexture('player_bullet', w, h);
  g.destroy();

  // Upgraded bullet
  const g2 = scene.add.graphics().setVisible(false);
  const w2 = 10, h2 = 20;

  g2.fillStyle(COLORS.goldLight, 0.3);
  g2.fillEllipse(w2 / 2, h2 / 2, w2, h2);

  g2.fillStyle(COLORS.gold);
  g2.fillEllipse(w2 / 2, h2 / 2, w2 - 2, h2 - 4);

  g2.fillStyle(COLORS.white, 0.9);
  g2.fillEllipse(w2 / 2, h2 / 2, 3, h2 - 8);

  g2.generateTexture('player_bullet_up', w2, h2);
  g2.destroy();
}

function generateEnemyBullet(scene: Phaser.Scene): void {
  const g = scene.add.graphics().setVisible(false);
  const s = 8;

  g.fillStyle(COLORS.red, 0.3);
  g.fillCircle(s / 2, s / 2, s / 2);

  g.fillStyle(COLORS.red);
  g.fillCircle(s / 2, s / 2, 3);

  g.fillStyle(COLORS.white, 0.6);
  g.fillCircle(s / 2, s / 2, 1);

  g.generateTexture('enemy_bullet', s, s);
  g.destroy();

  // Boss bullet - larger, purple
  const g2 = scene.add.graphics().setVisible(false);
  const s2 = 12;

  g2.fillStyle(COLORS.magenta, 0.3);
  g2.fillCircle(s2 / 2, s2 / 2, s2 / 2);

  g2.fillStyle(COLORS.magenta, 0.8);
  g2.fillCircle(s2 / 2, s2 / 2, 4);

  g2.fillStyle(COLORS.white, 0.6);
  g2.fillCircle(s2 / 2, s2 / 2, 2);

  g2.generateTexture('boss_bullet', s2, s2);
  g2.destroy();
}

function drawCrystalEnemy(g: Phaser.GameObjects.Graphics, w: number, h: number, bodyColor: number, trimColor: number): void {
  // Body
  g.fillStyle(bodyColor);
  g.fillRoundedRect(2, 2, w - 4, h - 4, 4);

  // Crystal accents
  g.fillStyle(trimColor, 0.6);
  g.fillTriangle(w / 2, 0, w / 2 - 4, 6, w / 2 + 4, 6);
  g.fillTriangle(w / 2, h, w / 2 - 4, h - 6, w / 2 + 4, h - 6);

  // Core
  g.fillStyle(trimColor, 0.8);
  g.fillCircle(w / 2, h / 2, 3);

  // Highlight
  g.fillStyle(COLORS.white, 0.4);
  g.fillCircle(w / 2 - 1, h / 2 - 1, 1.5);
}

function generateEnemies(scene: Phaser.Scene): void {
  // Scout - small, red
  let g = scene.add.graphics().setVisible(false);
  const sw = 24, sh = 24;
  g.fillStyle(0xaa2233);
  g.fillTriangle(sw / 2, 2, 2, sh - 2, sw - 2, sh - 2);
  g.fillStyle(0xff4455, 0.7);
  g.fillTriangle(sw / 2, 6, 6, sh - 4, sw - 6, sh - 4);
  g.fillStyle(COLORS.red, 0.9);
  g.fillCircle(sw / 2, sh / 2 + 2, 3);
  g.fillStyle(COLORS.white, 0.4);
  g.fillCircle(sw / 2, sh / 2 + 1, 1.5);
  g.generateTexture('enemy_scout', sw, sh);
  g.destroy();

  // Diver - sleek, orange
  g = scene.add.graphics().setVisible(false);
  const dw = 22, dh = 28;
  g.fillStyle(0xcc6600);
  g.fillTriangle(dw / 2, dh - 2, 2, 4, dw - 2, 4);
  g.fillStyle(0xff8833);
  g.fillTriangle(dw / 2, dh - 6, 5, 6, dw - 5, 6);
  g.fillStyle(0xffaa44, 0.9);
  g.fillCircle(dw / 2, 10, 3);
  g.fillStyle(COLORS.white, 0.5);
  g.fillCircle(dw / 2, 9, 1.5);
  g.generateTexture('enemy_diver', dw, dh);
  g.destroy();

  // Tank - bulky, purple
  g = scene.add.graphics().setVisible(false);
  const tw = 32, th = 32;
  g.fillStyle(0x442288);
  g.fillRoundedRect(2, 2, tw - 4, th - 4, 6);
  g.fillStyle(0x6633cc);
  g.fillRoundedRect(5, 5, tw - 10, th - 10, 4);
  g.fillStyle(COLORS.purple, 0.8);
  g.fillCircle(tw / 2, th / 2, 5);
  g.fillStyle(COLORS.white, 0.5);
  g.fillCircle(tw / 2 - 1, th / 2 - 1, 2);
  // Armor plates
  g.lineStyle(2, 0x8855ff, 0.5);
  g.strokeRoundedRect(4, 4, tw - 8, th - 8, 5);
  g.generateTexture('enemy_tank', tw, th);
  g.destroy();

  // Spreader - wide, magenta
  g = scene.add.graphics().setVisible(false);
  const spw = 28, sph = 28;
  g.fillStyle(0x882266);
  g.fillEllipse(spw / 2, sph / 2, spw - 4, sph - 8);
  g.fillStyle(0xcc3399);
  g.fillEllipse(spw / 2, sph / 2, spw - 10, sph - 14);
  // Wings
  g.fillStyle(0x882266);
  g.fillTriangle(0, sph / 2, 6, sph / 2 - 8, 6, sph / 2 + 8);
  g.fillTriangle(spw, sph / 2, spw - 6, sph / 2 - 8, spw - 6, sph / 2 + 8);
  g.fillStyle(COLORS.magenta, 0.8);
  g.fillCircle(spw / 2, sph / 2, 3);
  g.generateTexture('enemy_spreader', spw, sph);
  g.destroy();

  // Summoner - ornate, teal
  g = scene.add.graphics().setVisible(false);
  const smw = 34, smh = 34;
  g.fillStyle(0x115544);
  g.fillCircle(smw / 2, smh / 2, 14);
  g.fillStyle(0x228866);
  g.fillCircle(smw / 2, smh / 2, 11);
  // Ring
  g.lineStyle(2, 0x44ffaa, 0.5);
  g.strokeCircle(smw / 2, smh / 2, 13);
  // Inner runes (dots around)
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI * 2 * i) / 6;
    g.fillStyle(0x44ffaa, 0.7);
    g.fillCircle(smw / 2 + Math.cos(a) * 8, smh / 2 + Math.sin(a) * 8, 1.5);
  }
  g.fillStyle(COLORS.green, 0.9);
  g.fillCircle(smw / 2, smh / 2, 4);
  g.fillStyle(COLORS.white, 0.5);
  g.fillCircle(smw / 2, smh / 2 - 1, 2);
  g.generateTexture('enemy_summoner', smw, smh);
  g.destroy();

  // Elite - large, gold/navy
  g = scene.add.graphics().setVisible(false);
  const ew = 44, eh = 48;
  // Hull
  g.fillStyle(0x112244);
  g.fillRoundedRect(2, 4, ew - 4, eh - 8, 6);
  g.fillStyle(0x1a3366);
  g.fillRoundedRect(6, 8, ew - 12, eh - 16, 4);
  // Wings
  g.fillStyle(0x112244);
  g.fillTriangle(0, eh / 2, 8, eh / 2 - 16, 8, eh / 2 + 16);
  g.fillTriangle(ew, eh / 2, ew - 8, eh / 2 - 16, ew - 8, eh / 2 + 16);
  // Gold trim
  g.lineStyle(2, COLORS.gold, 0.6);
  g.strokeRoundedRect(4, 6, ew - 8, eh - 12, 5);
  // Crystal core
  g.fillStyle(COLORS.gold, 0.9);
  g.fillEllipse(ew / 2, eh / 2, 10, 12);
  g.fillStyle(COLORS.goldLight, 0.7);
  g.fillEllipse(ew / 2, eh / 2 - 2, 5, 6);
  g.generateTexture('enemy_elite', ew, eh);
  g.destroy();
}

function generateBoss(scene: Phaser.Scene): void {
  const g = scene.add.graphics().setVisible(false);
  const w = 120, h = 100;

  // Shadow/base
  g.fillStyle(0x0a0a2a, 0.5);
  g.fillEllipse(w / 2, h / 2 + 5, w - 8, h - 20);

  // Main hull
  g.fillStyle(0x1a1144);
  g.fillRoundedRect(10, 10, w - 20, h - 20, 12);

  // Inner hull
  g.fillStyle(0x221166);
  g.fillRoundedRect(18, 16, w - 36, h - 32, 8);

  // Wing structures
  g.fillStyle(0x1a1144);
  g.fillTriangle(0, h / 2, 16, h / 2 - 30, 16, h / 2 + 30);
  g.fillTriangle(w, h / 2, w - 16, h / 2 - 30, w - 16, h / 2 + 30);

  // Secondary wings
  g.fillStyle(0x221166);
  g.fillTriangle(4, h / 2, 16, h / 2 - 22, 16, h / 2 + 22);
  g.fillTriangle(w - 4, h / 2, w - 16, h / 2 - 22, w - 16, h / 2 + 22);

  // Gold trim lines
  g.lineStyle(2, COLORS.gold, 0.5);
  g.strokeRoundedRect(14, 14, w - 28, h - 28, 10);

  // Armor plates
  g.lineStyle(1, 0x4433aa, 0.4);
  g.lineBetween(w / 2, 14, w / 2, h - 14);
  g.lineBetween(24, h / 2, w - 24, h / 2);

  // Central crystal array
  g.fillStyle(COLORS.magenta, 0.4);
  g.fillEllipse(w / 2, h / 2, 28, 24);

  g.fillStyle(COLORS.purple, 0.8);
  g.fillEllipse(w / 2, h / 2, 18, 16);

  g.fillStyle(COLORS.magenta);
  g.fillEllipse(w / 2, h / 2, 10, 10);

  g.fillStyle(COLORS.white, 0.7);
  g.fillEllipse(w / 2 - 2, h / 2 - 2, 4, 4);

  // Side crystals
  for (const xOff of [-30, 30]) {
    g.fillStyle(COLORS.purple, 0.6);
    g.fillCircle(w / 2 + xOff, h / 2, 6);
    g.fillStyle(COLORS.magenta, 0.8);
    g.fillCircle(w / 2 + xOff, h / 2, 3);
  }

  // Rune dots
  for (let i = 0; i < 8; i++) {
    const a = (Math.PI * 2 * i) / 8;
    g.fillStyle(COLORS.gold, 0.6);
    g.fillCircle(w / 2 + Math.cos(a) * 20, h / 2 + Math.sin(a) * 16, 2);
  }

  // Front cannons
  g.fillStyle(0x332266);
  g.fillRect(w / 2 - 20, h - 16, 8, 10);
  g.fillRect(w / 2 + 12, h - 16, 8, 10);
  g.fillStyle(COLORS.red, 0.7);
  g.fillCircle(w / 2 - 16, h - 10, 2);
  g.fillCircle(w / 2 + 16, h - 10, 2);

  g.generateTexture('boss_ship', w, h);
  g.destroy();
}

function generatePowerups(scene: Phaser.Scene): void {
  const types: { key: string; color: number; icon: (g: Phaser.GameObjects.Graphics, s: number) => void }[] = [
    {
      key: 'powerup_weapon',
      color: COLORS.gold,
      icon: (g, s) => {
        g.fillStyle(COLORS.white, 0.8);
        g.fillTriangle(s / 2, 4, s / 2 - 3, s - 4, s / 2 + 3, s - 4);
      },
    },
    {
      key: 'powerup_shield',
      color: COLORS.crystal,
      icon: (g, s) => {
        g.fillStyle(COLORS.white, 0.8);
        g.fillRoundedRect(s / 2 - 4, s / 2 - 5, 8, 10, 2);
      },
    },
    {
      key: 'powerup_speed',
      color: COLORS.green,
      icon: (g, s) => {
        g.fillStyle(COLORS.white, 0.8);
        g.fillTriangle(s / 2 - 4, s / 2 + 4, s / 2 - 4, s / 2 - 4, s / 2 + 5, s / 2);
      },
    },
    {
      key: 'powerup_special',
      color: COLORS.magenta,
      icon: (g, s) => {
        g.fillStyle(COLORS.white, 0.8);
        for (let i = 0; i < 5; i++) {
          const a = (Math.PI * 2 * i) / 5 - Math.PI / 2;
          g.fillCircle(s / 2 + Math.cos(a) * 4, s / 2 + Math.sin(a) * 4, 1.5);
        }
      },
    },
    {
      key: 'powerup_gem',
      color: COLORS.goldLight,
      icon: (g, s) => {
        g.fillStyle(COLORS.white, 0.9);
        g.fillTriangle(s / 2, s / 2 - 5, s / 2 - 4, s / 2 + 1, s / 2 + 4, s / 2 + 1);
        g.fillRect(s / 2 - 4, s / 2 + 1, 8, 3);
      },
    },
  ];

  const s = 20;
  for (const { key, color, icon } of types) {
    const g = scene.add.graphics().setVisible(false);
    g.fillStyle(color, 0.2);
    g.fillCircle(s / 2, s / 2, s / 2);
    g.fillStyle(color, 0.6);
    g.fillCircle(s / 2, s / 2, s / 2 - 2);
    g.lineStyle(1, color, 0.8);
    g.strokeCircle(s / 2, s / 2, s / 2 - 1);
    icon(g, s);
    g.generateTexture(key, s, s);
    g.destroy();
  }
}

function generateParticles(scene: Phaser.Scene): void {
  // Generic glow particle
  const s = 16;
  let g = scene.add.graphics().setVisible(false);
  g.fillStyle(COLORS.white, 0.8);
  g.fillCircle(s / 2, s / 2, s / 2);
  g.fillStyle(COLORS.white, 0.4);
  g.fillCircle(s / 2, s / 2, s / 2 - 2);
  g.generateTexture('particle_white', s, s);
  g.destroy();

  // Crystal particle
  g = scene.add.graphics().setVisible(false);
  g.fillStyle(COLORS.crystal, 0.8);
  g.fillCircle(s / 2, s / 2, s / 2);
  g.generateTexture('particle_crystal', s, s);
  g.destroy();

  // Fire particle
  g = scene.add.graphics().setVisible(false);
  g.fillStyle(COLORS.red, 0.8);
  g.fillCircle(s / 2, s / 2, s / 2);
  g.generateTexture('particle_fire', s, s);
  g.destroy();

  // Gold particle
  g = scene.add.graphics().setVisible(false);
  g.fillStyle(COLORS.gold, 0.8);
  g.fillCircle(s / 2, s / 2, s / 2);
  g.generateTexture('particle_gold', s, s);
  g.destroy();

  // Small star for background
  g = scene.add.graphics().setVisible(false);
  g.fillStyle(COLORS.white, 1);
  g.fillCircle(2, 2, 2);
  g.generateTexture('star_small', 4, 4);
  g.destroy();

  // Trail particle
  g = scene.add.graphics().setVisible(false);
  const ts = 8;
  g.fillStyle(COLORS.crystal, 0.6);
  g.fillEllipse(ts / 2, ts / 2, ts, ts / 2);
  g.generateTexture('particle_trail', ts, ts);
  g.destroy();
}

function generateUIElements(scene: Phaser.Scene): void {
  // Button background
  const bw = 200, bh = 50;
  let g = scene.add.graphics().setVisible(false);
  g.fillStyle(COLORS.uiPanel, 0.85);
  g.fillRoundedRect(0, 0, bw, bh, 10);
  g.lineStyle(2, COLORS.uiPanelBorder, 0.7);
  g.strokeRoundedRect(0, 0, bw, bh, 10);
  g.fillStyle(COLORS.crystal, 0.1);
  g.fillRoundedRect(2, 2, bw - 4, bh / 2 - 2, { tl: 10, tr: 10, bl: 0, br: 0 });
  g.generateTexture('btn_bg', bw, bh);
  g.destroy();

  // Panel background
  const pw = 400, ph = 600;
  g = scene.add.graphics().setVisible(false);
  g.fillStyle(COLORS.uiBg, 0.92);
  g.fillRoundedRect(0, 0, pw, ph, 16);
  g.lineStyle(2, COLORS.uiPanelBorder, 0.5);
  g.strokeRoundedRect(0, 0, pw, ph, 16);
  g.lineStyle(1, COLORS.crystal, 0.15);
  g.strokeRoundedRect(4, 4, pw - 8, ph - 8, 14);
  g.generateTexture('panel_bg', pw, ph);
  g.destroy();

  // HP pip
  g = scene.add.graphics().setVisible(false);
  g.fillStyle(COLORS.hpBar);
  g.fillRoundedRect(0, 0, 16, 16, 3);
  g.fillStyle(COLORS.white, 0.3);
  g.fillRoundedRect(2, 2, 12, 6, { tl: 3, tr: 3, bl: 0, br: 0 });
  g.generateTexture('hp_pip', 16, 16);
  g.destroy();

  // HP pip empty
  g = scene.add.graphics().setVisible(false);
  g.fillStyle(0x333344, 0.6);
  g.fillRoundedRect(0, 0, 16, 16, 3);
  g.lineStyle(1, 0x555566, 0.4);
  g.strokeRoundedRect(0, 0, 16, 16, 3);
  g.generateTexture('hp_pip_empty', 16, 16);
  g.destroy();

  // Shield pip
  g = scene.add.graphics().setVisible(false);
  g.fillStyle(COLORS.shieldBar);
  g.fillRoundedRect(0, 0, 16, 16, 3);
  g.fillStyle(COLORS.white, 0.3);
  g.fillRoundedRect(2, 2, 12, 6, { tl: 3, tr: 3, bl: 0, br: 0 });
  g.generateTexture('shield_pip', 16, 16);
  g.destroy();

  // Shield pip empty
  g = scene.add.graphics().setVisible(false);
  g.fillStyle(0x222244, 0.6);
  g.fillRoundedRect(0, 0, 16, 16, 3);
  g.lineStyle(1, 0x334455, 0.4);
  g.strokeRoundedRect(0, 0, 16, 16, 3);
  g.generateTexture('shield_pip_empty', 16, 16);
  g.destroy();
}

function generateBackground(scene: Phaser.Scene): void {
  // Far star field
  const g1 = scene.add.graphics().setVisible(false);
  g1.fillStyle(0x050510);
  g1.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  for (let i = 0; i < 120; i++) {
    const x = Math.random() * GAME_WIDTH;
    const y = Math.random() * GAME_HEIGHT;
    const brightness = 0.2 + Math.random() * 0.4;
    const size = 0.5 + Math.random() * 1.5;
    g1.fillStyle(COLORS.white, brightness);
    g1.fillCircle(x, y, size);
  }
  // Subtle nebula patches
  for (let i = 0; i < 4; i++) {
    const nx = Math.random() * GAME_WIDTH;
    const ny = Math.random() * GAME_HEIGHT;
    g1.fillStyle(COLORS.purpleDeep, 0.08);
    g1.fillEllipse(nx, ny, 100 + Math.random() * 150, 60 + Math.random() * 100);
  }
  g1.generateTexture('bg_stars_far', GAME_WIDTH, GAME_HEIGHT);
  g1.destroy();

  // Mid nebula layer
  const g2 = scene.add.graphics().setVisible(false);
  for (let i = 0; i < 60; i++) {
    const x = Math.random() * GAME_WIDTH;
    const y = Math.random() * GAME_HEIGHT;
    const brightness = 0.15 + Math.random() * 0.3;
    const size = 0.5 + Math.random() * 1;
    g2.fillStyle(COLORS.crystalLight, brightness);
    g2.fillCircle(x, y, size);
  }
  for (let i = 0; i < 3; i++) {
    const nx = Math.random() * GAME_WIDTH;
    const ny = Math.random() * GAME_HEIGHT;
    g2.fillStyle(COLORS.crystalDark, 0.06);
    g2.fillEllipse(nx, ny, 80 + Math.random() * 120, 40 + Math.random() * 80);
  }
  g2.generateTexture('bg_stars_mid', GAME_WIDTH, GAME_HEIGHT);
  g2.destroy();

  // Near particles / dust
  const g3 = scene.add.graphics().setVisible(false);
  for (let i = 0; i < 25; i++) {
    const x = Math.random() * GAME_WIDTH;
    const y = Math.random() * GAME_HEIGHT;
    g3.fillStyle(COLORS.crystal, 0.1 + Math.random() * 0.15);
    g3.fillCircle(x, y, 1 + Math.random() * 2);
  }
  g3.generateTexture('bg_stars_near', GAME_WIDTH, GAME_HEIGHT);
  g3.destroy();
}
