'use client';

import { useState } from 'react';
import { PRESET_RATIOS } from '../../../shared/constants/bet';

interface PresetButtonsProps {
  isPreflop: boolean;
  onBBPreset: (multiplier: number) => void;
  onPotPreset: (ratio: number) => void;
  onAllIn: () => void;
}

export default function PresetButtons({ isPreflop, onBBPreset, onPotPreset, onAllIn }: PresetButtonsProps) {
  const [activeLabel, setActiveLabel] = useState<string | null>(null);

  const handleClick = (label: string, action: () => void) => {
    setActiveLabel(label);
    action();
    // Clear active state after a brief moment
    setTimeout(() => setActiveLabel(null), 600);
  };

  if (isPreflop) {
    return (
      <div className="flex flex-wrap gap-1.5">
        {PRESET_RATIOS.preflop.map((preset) => (
          <button
            key={preset.label}
            onClick={() => handleClick(preset.label, () => onBBPreset(preset.multiplier))}
            className={`px-3 py-1 text-[11px] chip-amt font-medium rounded-lg
              border transition-all active:scale-95
              ${activeLabel === preset.label
                ? 'bg-caution text-caution-fg border-caution/40'
                : 'bg-surface-2 border-border text-text-sub hover:bg-surface-raised hover:text-text'
              }`}
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
          onClick={() => handleClick(preset.label, () => {
            if (preset.type === 'allin') {
              onAllIn();
            } else {
              onPotPreset(preset.ratio!);
            }
          })}
          className={`px-3 py-1 text-[11px] chip-amt font-medium rounded-lg
            border transition-all active:scale-95
            ${activeLabel === preset.label
              ? preset.type === 'allin'
                ? 'bg-danger text-danger-fg border-danger/40'
                : 'bg-caution text-caution-fg border-caution/40'
              : preset.type === 'allin'
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
