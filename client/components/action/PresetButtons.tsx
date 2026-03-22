'use client';

import { PRESET_RATIOS } from '../../../shared/constants/bet';

interface PresetButtonsProps {
  isPreflop: boolean;
  onBBPreset: (multiplier: number) => void;
  onPotPreset: (ratio: number) => void;
  onAllIn: () => void;
}

export default function PresetButtons({ isPreflop, onBBPreset, onPotPreset, onAllIn }: PresetButtonsProps) {
  if (isPreflop) {
    return (
      <div className="flex flex-wrap gap-1.5">
        {PRESET_RATIOS.preflop.map((preset) => (
          <button
            key={preset.label}
            onClick={() => onBBPreset(preset.multiplier)}
            className="text-xs font-medium px-3 py-1.5 rounded-full
              bg-surface-3 text-text-secondary border border-border
              hover:border-border-strong hover:text-text-primary
              transition-colors active:scale-95"
          >
            {preset.label}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {PRESET_RATIOS.postflop.map((preset) => (
        <button
          key={preset.label}
          onClick={() => {
            if (preset.type === 'allin') {
              onAllIn();
            } else {
              onPotPreset(preset.ratio!);
            }
          }}
          className={`text-xs font-medium px-3 py-1.5 rounded-full
            border transition-colors active:scale-95
            ${preset.type === 'allin'
              ? 'bg-surface-3 text-danger border-danger/30 hover:border-danger/50 hover:text-danger'
              : 'bg-surface-3 text-text-secondary border-border hover:border-border-strong hover:text-text-primary'
            }`}
        >
          {preset.label}
        </button>
      ))}
    </div>
  );
}
