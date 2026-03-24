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
            className="px-2.5 py-1 text-[11px] chip-amt font-medium rounded-full
              bg-surface-2 border border-border text-text-sub
              hover:bg-surface-raised hover:text-text
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
          className={`px-2.5 py-1 text-[11px] chip-amt font-medium rounded-full
            border transition-colors active:scale-95
            ${preset.type === 'allin'
              ? 'bg-surface-2 text-danger border-danger/20 hover:bg-surface-raised hover:text-danger'
              : 'bg-surface-2 text-text-sub border-border hover:bg-surface-raised hover:text-text'
            }`}
        >
          {preset.label}
        </button>
      ))}
    </div>
  );
}
