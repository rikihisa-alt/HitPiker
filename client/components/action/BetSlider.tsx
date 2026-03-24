'use client';

import { useCallback, useRef } from 'react';

interface BetSliderProps {
  min: number;
  max: number;
  value: number;
  onChange: (value: number) => void;
}

// Increment step: BB size or 1% of range, whichever is larger
function getStep(min: number, max: number): number {
  const bb = 100; // BB size
  const rangeStep = Math.max(1, Math.floor((max - min) / 100));
  return Math.max(bb, rangeStep);
}

export default function BetSlider({ min, max, value, onChange }: BetSliderProps) {
  const sliderRef = useRef<HTMLDivElement>(null);
  const step = getStep(min, max);

  const percentage = max > min ? ((value - min) / (max - min)) * 100 : 0;

  const handleSliderChange = useCallback((clientX: number) => {
    if (!sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const newValue = Math.floor(min + pct * (max - min));
    onChange(newValue);
  }, [min, max, onChange]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    handleSliderChange(e.clientX);
    const handleMouseMove = (ev: MouseEvent) => handleSliderChange(ev.clientX);
    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [handleSliderChange]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    handleSliderChange(e.touches[0].clientX);
    const handleTouchMove = (ev: TouchEvent) => {
      ev.preventDefault();
      handleSliderChange(ev.touches[0].clientX);
    };
    const handleTouchEnd = () => {
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);
  }, [handleSliderChange]);

  const decrement = useCallback(() => {
    onChange(Math.max(min, value - step));
  }, [value, min, step, onChange]);

  const increment = useCallback(() => {
    onChange(Math.min(max, value + step));
  }, [value, max, step, onChange]);

  return (
    <div className="w-full px-1">
      <div className="flex items-center gap-2">
        {/* Minus button */}
        <button
          type="button"
          onClick={decrement}
          disabled={value <= min}
          className="w-7 h-7 rounded-full bg-surface-2 border border-border text-text-sub
            flex items-center justify-center text-sm font-bold
            hover:bg-surface-raised hover:text-text active:scale-95
            disabled:opacity-30 disabled:pointer-events-none
            transition-all flex-shrink-0"
        >
          −
        </button>

        {/* Slider track */}
        <div
          ref={sliderRef}
          className="relative h-6 flex items-center cursor-pointer flex-1"
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
        >
          <div className="absolute w-full h-1 rounded-full bg-surface-raised">
            <div
              className="h-full rounded-full bg-caution"
              style={{ width: `${percentage}%` }}
            />
          </div>
          <div
            className="absolute w-5 h-5 rounded-full bg-caution border-2 border-caution-fg
              shadow-md transform -translate-x-1/2
              hover:scale-110 transition-transform"
            style={{ left: `${percentage}%` }}
          />
        </div>

        {/* Plus button */}
        <button
          type="button"
          onClick={increment}
          disabled={value >= max}
          className="w-7 h-7 rounded-full bg-surface-2 border border-border text-text-sub
            flex items-center justify-center text-sm font-bold
            hover:bg-surface-raised hover:text-text active:scale-95
            disabled:opacity-30 disabled:pointer-events-none
            transition-all flex-shrink-0"
        >
          +
        </button>
      </div>

      {/* Min / Max labels */}
      <div className="flex justify-between text-[10px] chip-amt text-text-muted mt-0.5 px-9">
        <span>{min.toLocaleString()}</span>
        <span>All-in ({max.toLocaleString()})</span>
      </div>
    </div>
  );
}
