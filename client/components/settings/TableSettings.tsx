'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { loadSettings, saveSettings, FeltColor, StackDisplay, TableSettings as Settings } from '../../lib/settings-store';

const FELT_OPTIONS: { value: FeltColor; label: string; swatch: string }[] = [
  { value: 'green', label: 'Green', swatch: '#1b4d35' },
  { value: 'blue', label: 'Blue', swatch: '#1b3d5d' },
  { value: 'red', label: 'Red', swatch: '#4d1b2a' },
  { value: 'purple', label: 'Purple', swatch: '#351b4d' },
  { value: 'dark', label: 'Dark', swatch: '#1e2028' },
];

const STACK_OPTIONS: { value: StackDisplay; label: string }[] = [
  { value: 'points', label: 'Points' },
  { value: 'bb', label: 'BB' },
];

interface TableSettingsProps {
  onSettingsChange: (settings: Settings) => void;
}

export default function TableSettings({ onSettingsChange }: TableSettingsProps) {
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState<Settings>(loadSettings);
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const update = useCallback(
    (patch: Partial<Settings>) => {
      const next = { ...settings, ...patch };
      setSettings(next);
      saveSettings(next);
      onSettingsChange(next);
    },
    [settings, onSettingsChange],
  );

  // Emit initial settings on mount
  useEffect(() => {
    onSettingsChange(settings);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div ref={panelRef} className="relative">
      {/* Gear icon button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-8 h-8 flex items-center justify-center rounded-md
          bg-surface-2/60 border border-border-subtle hover:bg-surface-raised
          text-text-muted hover:text-text transition-colors"
        aria-label="Table settings"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M6.86 1.45a1.14 1.14 0 0 1 2.28 0l.1.72a.57.57 0 0 0 .78.38l.65-.33a1.14 1.14 0 0 1 1.62 1.14l-.12.72a.57.57 0 0 0 .5.66l.73.07a1.14 1.14 0 0 1 .57 2.02l-.55.47a.57.57 0 0 0-.07.82l.43.58a1.14 1.14 0 0 1-.57 1.82l-.7.2a.57.57 0 0 0-.4.72l.2.7a1.14 1.14 0 0 1-1.43 1.32l-.7-.2a.57.57 0 0 0-.72.4l-.2.7a1.14 1.14 0 0 1-2.12.18l-.35-.64a.57.57 0 0 0-.82-.16l-.55.47a1.14 1.14 0 0 1-1.82-.85l.07-.73a.57.57 0 0 0-.52-.6l-.72-.12a1.14 1.14 0 0 1-.67-1.88l.43-.58a.57.57 0 0 0-.02-.73l-.55-.47a1.14 1.14 0 0 1 .37-1.96l.7-.2a.57.57 0 0 0 .39-.72l-.2-.7A1.14 1.14 0 0 1 4.22 2.5l.7.2a.57.57 0 0 0 .66-.5l.1-.72Z" />
          <circle cx="8" cy="8" r="2.25" />
        </svg>
      </button>

      {/* Settings popover */}
      {open && (
        <div
          className="absolute top-10 right-0 z-50 w-56
            bg-surface-1 border border-border rounded-lg shadow-lg
            p-3 flex flex-col gap-3 animate-fade-in"
        >
          <div className="text-text text-xs font-semibold tracking-wide uppercase">
            Table Settings
          </div>

          {/* Felt color */}
          <div className="flex flex-col gap-1.5">
            <span className="text-text-sub text-[11px]">Felt Color</span>
            <div className="flex gap-1.5">
              {FELT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => update({ feltColor: opt.value })}
                  title={opt.label}
                  className={`w-7 h-7 rounded-md border-2 transition-all ${
                    settings.feltColor === opt.value
                      ? 'border-primary scale-110'
                      : 'border-border-subtle hover:border-border-hover'
                  }`}
                  style={{ backgroundColor: opt.swatch }}
                />
              ))}
            </div>
          </div>

          {/* 4-color deck toggle */}
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-text-sub text-[11px]">4-Color Deck</span>
            <button
              role="switch"
              aria-checked={settings.fourColorDeck}
              onClick={() => update({ fourColorDeck: !settings.fourColorDeck })}
              className={`relative w-9 h-5 rounded-pill transition-colors ${
                settings.fourColorDeck ? 'bg-primary' : 'bg-surface-raised'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${
                  settings.fourColorDeck ? 'translate-x-4' : ''
                }`}
              />
            </button>
          </label>

          {/* Sound toggle */}
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-text-sub text-[11px]">Sound</span>
            <button
              role="switch"
              aria-checked={settings.soundEnabled}
              onClick={() => update({ soundEnabled: !settings.soundEnabled })}
              className={`relative w-9 h-5 rounded-pill transition-colors ${
                settings.soundEnabled ? 'bg-primary' : 'bg-surface-raised'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${
                  settings.soundEnabled ? 'translate-x-4' : ''
                }`}
              />
            </button>
          </label>

          {/* Squeeze toggle */}
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-text-sub text-[11px]">Squeeze</span>
            <button
              role="switch"
              aria-checked={settings.squeezeEnabled}
              onClick={() => update({ squeezeEnabled: !settings.squeezeEnabled })}
              className={`relative w-9 h-5 rounded-pill transition-colors ${
                settings.squeezeEnabled ? 'bg-primary' : 'bg-surface-raised'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${
                  settings.squeezeEnabled ? 'translate-x-4' : ''
                }`}
              />
            </button>
          </label>

          {/* Stack display toggle */}
          <div className="flex flex-col gap-1.5">
            <span className="text-text-sub text-[11px]">Stack Display</span>
            <div className="flex gap-1">
              {STACK_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => update({ stackDisplay: opt.value })}
                  className={`flex-1 text-[11px] font-semibold py-1 rounded-md border transition-all ${
                    settings.stackDisplay === opt.value
                      ? 'bg-primary text-white border-primary'
                      : 'bg-surface-raised text-text-sub border-border-subtle hover:border-border-hover'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
