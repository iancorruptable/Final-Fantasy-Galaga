# Crystal Vanguard

A premium fantasy arcade shooter built with Phaser 3, TypeScript, and Vite. Pilot a magical crystal starfighter through waves of celestial enemies culminating in a dramatic boss battle.

## Features

- Portrait-mode mobile-first design
- Touch drag-to-move controls with auto-fire
- 12 waves of escalating enemy encounters
- 6 distinct enemy types with unique behaviors
- Multi-phase boss battle with cinematic intro
- Combo/multiplier scoring system
- Power-up drops (weapons, shields, speed, special charge, score gems)
- Crystal burst special ability
- Synthesized audio (no external audio files needed)
- Procedurally generated visuals (no external art assets needed)
- Local high score persistence
- Settings menu (SFX/music volume, screen shake, particle quality)
- Safe-area support for notched/rounded devices
- Responsive scaling for all phone sizes

## Setup

```bash
npm install
```

## Development

```bash
npm run dev
```

Opens at `http://localhost:3000`. Use Chrome DevTools device emulation for mobile preview.

## Build

```bash
npm run build
```

Output goes to `dist/`.

## Preview Production Build

```bash
npm run preview
```

## Deploy to GitHub Pages

### Option 1: Using gh-pages package

```bash
npm run deploy
```

### Option 2: Manual

1. Run `npm run build`
2. Push the `dist/` folder contents to your `gh-pages` branch
3. Enable GitHub Pages in repo settings, set source to `gh-pages` branch

### Option 3: GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Pages
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    permissions:
      pages: write
      id-token: write
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist
      - uses: actions/deploy-pages@v4
```

The Vite config uses `base: './'` for correct relative asset paths on GitHub Pages.

## Mobile Wrapping (Capacitor)

To package as a native app:

```bash
npm install @capacitor/core @capacitor/cli
npx cap init
npx cap add android
npx cap add ios
npm run build
npx cap sync
npx cap open android  # or ios
```

## Project Structure

```
src/
  main.ts              # Phaser game initialization
  game/
    config.ts          # All tuning values and constants
  scenes/
    BootScene.ts       # Initial boot
    PreloadScene.ts    # Asset generation
    MenuScene.ts       # Main menu
    SettingsScene.ts   # Settings panel
    GameScene.ts       # Core gameplay
    HudScene.ts        # In-game HUD overlay
    PauseScene.ts      # Pause overlay
    GameOverScene.ts   # Defeat screen
    VictoryScene.ts    # Victory screen
  entities/
    Player.ts          # Player ship
    Enemy.ts           # Enemy types and behaviors
    Boss.ts            # Multi-phase boss
    Bullet.ts          # Bullet pool system
    PowerUp.ts         # Power-up pool system
  systems/
    AssetGenerator.ts  # Procedural texture generation
    AudioSystem.ts     # Web Audio synthesized sounds
    WaveSystem.ts      # Wave progression logic
  utils/
    math.ts            # Math helpers
    storage.ts         # LocalStorage persistence
```

## Controls

- **Move**: Touch and drag anywhere on screen
- **Fire**: Automatic
- **Special Ability**: Tap the crystal button (bottom-right)
- **Pause**: Tap pause button (top-right)

## Tuning

All gameplay values are centralized in `src/game/config.ts` for easy balancing adjustments.
