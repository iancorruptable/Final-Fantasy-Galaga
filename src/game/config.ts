// Game-wide configuration and tuning values

export const GAME_WIDTH = 480;
export const GAME_HEIGHT = 854;

export const COLORS = {
  bg: 0x0a0a1a,
  bgDark: 0x050510,
  crystal: 0x00e5ff,
  crystalLight: 0x80f0ff,
  crystalDark: 0x0088aa,
  gold: 0xffd700,
  goldLight: 0xffec80,
  magenta: 0xff00ff,
  purple: 0x8844ff,
  purpleDeep: 0x4400aa,
  red: 0xff3344,
  redDark: 0xaa0022,
  green: 0x44ff88,
  white: 0xffffff,
  uiPanel: 0x111133,
  uiPanelBorder: 0x3344aa,
  uiBg: 0x0d0d2b,
  hpBar: 0x44ff88,
  hpBarDamage: 0xff3344,
  shieldBar: 0x00e5ff,
  bossHp: 0xff3344,
  comboText: 0xffd700,
};

export const PLAYER = {
  speed: 400,
  maxHp: 5,
  maxShield: 3,
  invincibleMs: 1500,
  fireRate: 180,
  bulletSpeed: 600,
  bulletDamage: 1,
  specialDamage: 999,
  respawnDelay: 1000,
  lives: 3,
  startBombs: 3,
  hitboxRadius: 10,
  shipWidth: 36,
  shipHeight: 44,
};

export const POWERUPS = {
  dropChance: 0.30,
  types: ['weapon_up', 'shield', 'speed', 'bomb', 'score_gem'] as const,
  magnetRange: 80,
  fallSpeed: 120,
};

export const ENEMIES = {
  scout: {
    hp: 1,
    speed: 140,
    score: 100,
    fireRate: 2000,
    bulletSpeed: 250,
    width: 24,
    height: 24,
  },
  diver: {
    hp: 2,
    speed: 280,
    score: 200,
    fireRate: 0,
    bulletSpeed: 0,
    width: 22,
    height: 28,
  },
  tank: {
    hp: 5,
    speed: 80,
    score: 300,
    fireRate: 1500,
    bulletSpeed: 200,
    width: 32,
    height: 32,
  },
  spreader: {
    hp: 3,
    speed: 100,
    score: 250,
    fireRate: 2200,
    bulletSpeed: 220,
    spreadCount: 3,
    width: 28,
    height: 28,
  },
  summoner: {
    hp: 6,
    speed: 60,
    score: 400,
    fireRate: 3000,
    bulletSpeed: 180,
    summonRate: 5000,
    width: 34,
    height: 34,
  },
  elite: {
    hp: 20,
    speed: 70,
    score: 1000,
    fireRate: 1200,
    bulletSpeed: 260,
    width: 44,
    height: 48,
  },
};

export const BOSS = {
  hp: 500,
  width: 120,
  height: 100,
  phases: [
    { hpThreshold: 1.0, fireRate: 1200, bulletSpeed: 210, pattern: 'firaga' },
    { hpThreshold: 0.80, fireRate: 1000, bulletSpeed: 230, pattern: 'thundaga' },
    { hpThreshold: 0.55, fireRate: 800, bulletSpeed: 260, pattern: 'blizzaga' },
    { hpThreshold: 0.30, fireRate: 600, bulletSpeed: 290, pattern: 'ultima' },
    { hpThreshold: 0.12, fireRate: 400, bulletSpeed: 320, pattern: 'meteor' },
  ],
  score: 25000,
  introTime: 3000,
};

export const SCORING = {
  comboWindow: 2000,
  maxMultiplier: 8,
  gemValue: 50,
};

export const WAVES = {
  wavePause: 2000,
  totalWaves: 12,
  bossWave: 12,
  eliteWaves: [6, 9],
  difficultyScale: 0.08,
};

export const SAFE_AREA = {
  top: 44,
  bottom: 34,
  sides: 8,
};
