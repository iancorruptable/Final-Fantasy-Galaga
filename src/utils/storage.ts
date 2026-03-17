const STORAGE_KEY = 'crystal_vanguard_data';

interface SaveData {
  highScore: number;
  settings: {
    sfxVolume: number;
    musicVolume: number;
    screenShake: boolean;
    particles: 'high' | 'low';
  };
}

const DEFAULT_DATA: SaveData = {
  highScore: 0,
  settings: {
    sfxVolume: 0.7,
    musicVolume: 0.5,
    screenShake: true,
    particles: 'high',
  },
};

function load(): SaveData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return { ...DEFAULT_DATA, ...JSON.parse(raw) };
    }
  } catch {
    // ignore parse errors
  }
  return { ...DEFAULT_DATA };
}

function save(data: SaveData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // storage full or unavailable
  }
}

export function getHighScore(): number {
  return load().highScore;
}

export function setHighScore(score: number): boolean {
  const data = load();
  if (score > data.highScore) {
    data.highScore = score;
    save(data);
    return true;
  }
  return false;
}

export function getSettings(): SaveData['settings'] {
  return load().settings;
}

export function saveSettings(settings: Partial<SaveData['settings']>): void {
  const data = load();
  data.settings = { ...data.settings, ...settings };
  save(data);
}
