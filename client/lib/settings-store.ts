// Table settings stored in localStorage with sensible defaults

export type FeltColor = 'green' | 'blue' | 'red' | 'purple' | 'dark';

export interface TableSettings {
  feltColor: FeltColor;
  fourColorDeck: boolean;
  soundEnabled: boolean;
}

const STORAGE_KEY = 'hitpoker-settings';

const DEFAULTS: TableSettings = {
  feltColor: 'green',
  fourColorDeck: false,
  soundEnabled: true,
};

export function loadSettings(): TableSettings {
  if (typeof window === 'undefined') return { ...DEFAULTS };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULTS };
    const parsed = JSON.parse(raw) as Partial<TableSettings>;
    return {
      feltColor: isValidFelt(parsed.feltColor) ? parsed.feltColor : DEFAULTS.feltColor,
      fourColorDeck: typeof parsed.fourColorDeck === 'boolean' ? parsed.fourColorDeck : DEFAULTS.fourColorDeck,
      soundEnabled: typeof parsed.soundEnabled === 'boolean' ? parsed.soundEnabled : DEFAULTS.soundEnabled,
    };
  } catch {
    return { ...DEFAULTS };
  }
}

export function saveSettings(settings: TableSettings): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // localStorage may be full or disabled
  }
}

function isValidFelt(value: unknown): value is FeltColor {
  return typeof value === 'string' && ['green', 'blue', 'red', 'purple', 'dark'].includes(value);
}

// CSS class name for felt color variant
export function feltClassName(color: FeltColor): string {
  return `felt-${color}`;
}
