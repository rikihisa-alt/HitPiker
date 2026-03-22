'use client';

import { useCallback, useRef } from 'react';

interface BetSliderProps {
  min: number;
  max: number;
  value: number;
  onChange: (value: number) => void;
}

export default function BetSlider({ min, max, value, onChange }: BetSliderProps) {
  const sliderRef = useRef<HTMLDivElement>(null);

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

  return (
    <div className="w-full px-1">
      <div
        ref={sliderRef}
        className="relative h-6 flex items-center cursor-pointer"
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        {/* Track background */}
        <div className="absolute w-full h-1.5 rounded-full bg-surface-3">
          {/* Active fill */}
          <div
            className="h-full rounded-full bg-caution"
            style={{ width: `${percentage}%` }}
          />
        </div>

        {/* Thumb */}
        <div
          className="absolute w-5 h-5 rounded-full bg-white border-2 border-caution
            shadow-md transform -translate-x-1/2
            hover:scale-110 transition-transform"
          style={{ left: `${percentage}%` }}
        />
      </div>

      {/* Min / Max labels */}
      <div className="flex justify-between text-xs text-text-tertiary font-mono mt-0.5">
        <span>{min.toLocaleString()}</span>
        <span>All-in ({max.toLocaleString()})</span>
      </div>
    </div>
  );
}
