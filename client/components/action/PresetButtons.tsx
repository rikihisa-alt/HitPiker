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
      <div className="flex gap-1.5 flex-wrap">
        {PRESET_RATIOS.preflop.map((preset) => (
          <button
            key={preset.label}
            onClick={() => onBBPreset(preset.multiplier)}
            className="px-3 py-1.5 rounded-lg bg-gray-700 hover:bg-gray-600 text-amber-300 text-xs font-bold
              border border-gray-600 transition-colors active:scale-95"
          >
            {preset.label}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="flex gap-1.5 flex-wrap">
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
          className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors active:scale-95
            ${preset.type === 'allin'
              ? 'bg-red-700 hover:bg-red-600 text-white border-red-600'
              : 'bg-gray-700 hover:bg-gray-600 text-amber-300 border-gray-600'
            }`}
        >
          {preset.label}
        </button>
      ))}
    </div>
  );
}
