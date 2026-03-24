'use client';

import { useState } from 'react';
import { PotState } from '../../../shared/types/game';

interface PotDisplayProps {
  pot: PotState;
}

export default function PotDisplay({ pot }: PotDisplayProps) {
  const total = pot.main + pot.sides.reduce((s, p) => s + p.amount, 0);
  const [showTooltip, setShowTooltip] = useState(false);

  if (total === 0) return null;

  const hasSidePots = pot.sides.length > 0;

  return (
    <div className="flex flex-col items-center gap-1">
      {/* Total pot */}
      <div className="bg-surface-2/80 backdrop-blur-sm rounded-pill px-3 py-1 border border-border-subtle">
        <span className="chip-amt text-xs text-text-sub font-semibold tracking-wide">
          POT{' '}
          <span className="text-text">{total.toLocaleString()}</span>
        </span>
      </div>

      {/* Main pot + side pots breakdown */}
      {hasSidePots && (
        <div className="flex flex-col items-center gap-0.5">
          {/* Main pot line */}
          <span className="chip-amt text-[9px] bg-surface-2/60 rounded-pill px-2 py-0.5 text-text-muted border border-border-subtle">
            Main: {pot.main.toLocaleString()}
          </span>

          {/* Side pots with player count */}
          <div className="flex gap-1 flex-wrap justify-center">
            {pot.sides.map((side, i) => (
              <span
                key={i}
                className="chip-amt text-[9px] bg-surface-2/60 rounded-pill px-2 py-0.5 text-text-muted border border-border-subtle"
              >
                Side {i + 1}: {side.amount.toLocaleString()}
                <span className="text-text-muted/60 ml-0.5">
                  ({side.eligiblePlayerIds.length}p)
                </span>
              </span>
            ))}

            {/* Tooltip trigger */}
            <div className="relative inline-flex">
              <button
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
                onClick={() => setShowTooltip((v) => !v)}
                className="w-4 h-4 rounded-full bg-surface-2/60 border border-border-subtle
                  text-text-muted text-[9px] font-bold leading-none
                  flex items-center justify-center hover:text-text-sub transition-colors"
              >
                ?
              </button>
              {showTooltip && (
                <div
                  className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 z-50
                    bg-surface-1 border border-border rounded-md shadow-md
                    px-2.5 py-1.5 text-[10px] text-text-sub leading-tight
                    w-44 text-center animate-fade-in pointer-events-none"
                >
                  Players who went all-in for less are only eligible for the main pot
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
