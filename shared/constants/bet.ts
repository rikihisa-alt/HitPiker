export const PRESET_RATIOS = {
  preflop: [
    { label: '2.2x', multiplier: 2.2, type: 'bb' as const },
    { label: '2.5x', multiplier: 2.5, type: 'bb' as const },
    { label: '3x', multiplier: 3.0, type: 'bb' as const },
  ],
  postflop: [
    { label: '25%', ratio: 0.25, type: 'pot' as const },
    { label: '33%', ratio: 0.33, type: 'pot' as const },
    { label: '50%', ratio: 0.50, type: 'pot' as const },
    { label: '66%', ratio: 0.66, type: 'pot' as const },
    { label: '75%', ratio: 0.75, type: 'pot' as const },
    { label: '100%', ratio: 1.00, type: 'pot' as const },
    { label: 'All-in', ratio: null, type: 'allin' as const },
  ],
} as const;
