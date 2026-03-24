'use client';

import { useState, useCallback } from 'react';
import { useGameStore } from '../../store/game-store';

const EMOTES = ['GG', 'NH', 'WP', '\u{1F914}', '\u{1F60E}', '\u{1F480}'];

export default function EmotePanel() {
  const [open, setOpen] = useState(false);
  const playerId = useGameStore((s) => s.playerId);
  const setActiveEmote = useGameStore((s) => s.setActiveEmote);

  const handleEmote = useCallback((emote: string) => {
    if (!playerId) return;
    setActiveEmote({ playerId, emote, timestamp: Date.now() });
    setOpen(false);

    // Auto-clear after 2 seconds
    setTimeout(() => {
      setActiveEmote(null);
    }, 2000);
  }, [playerId, setActiveEmote]);

  return (
    <div className="fixed bottom-4 left-4 z-40">
      {/* Emote row */}
      {open && (
        <div className="mb-2 flex gap-1 bg-surface-1/95 backdrop-blur-sm border border-border rounded-lg px-2 py-1.5 shadow-lg animate-slide-up">
          {EMOTES.map((emote) => (
            <button
              key={emote}
              onClick={() => handleEmote(emote)}
              className="w-8 h-8 flex items-center justify-center rounded-md
                text-sm hover:bg-surface-raised active:scale-[0.92] transition-all
                text-text-sub hover:text-text select-none"
            >
              {emote}
            </button>
          ))}
        </div>
      )}

      {/* Toggle button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className={`w-9 h-9 flex items-center justify-center rounded-full
          border transition-all text-sm select-none
          ${open
            ? 'bg-surface-raised border-primary/40 text-text'
            : 'bg-surface-1/80 border-border text-text-muted hover:text-text hover:border-border'
          }`}
        title="Quick emotes"
      >
        {'\u{1F4AC}'}
      </button>
    </div>
  );
}
