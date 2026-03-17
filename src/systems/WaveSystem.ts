import { EnemyType } from '../entities/Enemy';
import { WAVES, GAME_WIDTH } from '../game/config';
import { randomRange, randomInt } from '../utils/math';

interface SpawnEvent {
  type: EnemyType;
  x: number;
  y: number;
  delay: number;
}

interface WaveData {
  spawns: SpawnEvent[];
  isElite: boolean;
  isBoss: boolean;
}

export class WaveSystem {
  currentWave: number = 0;
  totalWaves: number = WAVES.totalWaves;
  waveActive: boolean = false;

  getDifficultyMod(): number {
    return 1 + this.currentWave * WAVES.difficultyScale;
  }

  getNextWave(): WaveData | null {
    this.currentWave++;
    if (this.currentWave > this.totalWaves) return null;

    if (this.currentWave === WAVES.bossWave) {
      return { spawns: [], isElite: false, isBoss: true };
    }

    if (WAVES.eliteWaves.includes(this.currentWave)) {
      return this.generateEliteWave();
    }

    return this.generateNormalWave();
  }

  private generateNormalWave(): WaveData {
    const spawns: SpawnEvent[] = [];
    const wave = this.currentWave;
    const margin = 40;
    const maxX = GAME_WIDTH - margin;

    // Scale enemy count and variety with wave number
    const baseCount = 3 + Math.floor(wave * 0.8);
    const count = Math.min(baseCount, 12);

    const availableTypes: EnemyType[] = ['scout'];
    if (wave >= 2) availableTypes.push('diver');
    if (wave >= 3) availableTypes.push('tank');
    if (wave >= 4) availableTypes.push('spreader');
    if (wave >= 7) availableTypes.push('summoner');

    for (let i = 0; i < count; i++) {
      const type = availableTypes[randomInt(0, availableTypes.length - 1)];
      spawns.push({
        type,
        x: randomRange(margin, maxX),
        y: randomRange(-60, -20),
        delay: i * randomRange(200, 500),
      });
    }

    return { spawns, isElite: false, isBoss: false };
  }

  private generateEliteWave(): WaveData {
    const spawns: SpawnEvent[] = [];
    const margin = 40;
    const maxX = GAME_WIDTH - margin;

    // Escort enemies first
    const escortCount = 3 + randomInt(0, 2);
    for (let i = 0; i < escortCount; i++) {
      spawns.push({
        type: randomRange(0, 1) > 0.5 ? 'scout' : 'tank',
        x: randomRange(margin, maxX),
        y: randomRange(-60, -20),
        delay: i * 300,
      });
    }

    // Then the elite
    spawns.push({
      type: 'elite',
      x: GAME_WIDTH / 2,
      y: -50,
      delay: escortCount * 300 + 500,
    });

    return { spawns, isElite: true, isBoss: false };
  }

  isComplete(): boolean {
    return this.currentWave >= this.totalWaves;
  }
}
