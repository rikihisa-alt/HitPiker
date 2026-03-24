'use client';

import { useCallback, useState, useEffect } from 'react';

interface BetInputProps {
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}

export default function BetInput({ value, min, max, onChange }: BetInputProps) {
  const [inputValue, setInputValue] = useState(value.toString());

  useEffect(() => {
    setInputValue(value.toLocaleString());
  }, [value]);

  const handleBlur = useCallback(() => {
    const parsed = parseInt(inputValue.replace(/,/g, ''), 10);
    if (isNaN(parsed)) {
      setInputValue(value.toLocaleString());
      return;
    }
    const clamped = Math.min(Math.max(parsed, min), max);
    onChange(clamped);
    setInputValue(clamped.toLocaleString());
  }, [inputValue, min, max, onChange, value]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      (e.target as HTMLInputElement).blur();
    }
  }, []);

  return (
    <input
      type="text"
      value={inputValue}
      onChange={(e) => setInputValue(e.target.value)}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      className="w-24 chip-amt text-sm text-center bg-surface-2 border border-border
        rounded-md py-1.5 px-2 text-text
        focus:border-caution focus:outline-none"
    />
  );
}
