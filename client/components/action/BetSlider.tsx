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
        {/* Track背景 */}
        <div className="absolute w-full h-2 rounded-full bg-gray-700 overflow-hidden">
          {/* アクティブトラック */}
          <div
            className="h-full rounded-full bg-gradient-to-r from-blue-500 via-amber-500 to-red-500"
            style={{ width: `${percentage}%` }}
          />
        </div>

        {/* Thumb */}
        <div
          className="absolute w-5 h-5 rounded-full bg-white border-2 border-amber-400
            shadow-[0_0_8px_rgba(251,191,36,0.6)] transform -translate-x-1/2
            hover:scale-110 transition-transform"
          style={{ left: `${percentage}%` }}
        />
      </div>

      {/* Min / Max ラベル */}
      <div className="flex justify-between text-[10px] text-gray-500 font-mono mt-0.5">
        <span>{min.toLocaleString()}</span>
        <span>All-in ({max.toLocaleString()})</span>
      </div>
    </div>
  );
}
