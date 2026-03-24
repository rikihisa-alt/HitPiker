'use client';

import { useState } from 'react';
import { PotState } from '../../../shared/types/game';

interface PotDisplayProps {
  pot: PotState;
}

/** CSS-only chip icon */
function ChipIcon({ className }: { className?: string }) {
  return (
    <span
      className={`inline-block w-[10px] h-[10px] rounded-full flex-shrink-0 ${className ?? ''}`}
      style={{
        background: 'linear-gradient(135deg, #e5a030, #c8880a)',
        border: '1.5px solid rgba(255,255,255,0.35)',
        boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.3), 0 1px 2px rgba(0,0,0,0.3)',
      }}
    />
  );
}

export default function PotDisplay({ pot }: PotDisplayProps) {
  const total = pot.main + pot.sides.reduce((s, p) => s + p.amount, 0);
  const [showTooltip, setShowTooltip] = useState(false);

  if (total === 0) return null;

  const hasSidePots = pot.sides.length > 0;

  return (
    <div className="flex flex-col items-center gap-1">
      {/* Total pot */}
      <div
        className="flex items-center gap-1.5 px-2.5 py-1"
        style={{
          background: 'rgba(0,0,0,0.3)',
          borderRadius: '4px',
          border: '1px solid rgba(255,255,255,0.06)',
          backdropFilter: 'blur(4px)',
        }}
      >
        <ChipIcon />
        <div className="flex flex-col items-start leading-none">
          <span className="chip-amt text-[9px] text-[#8b8fa3] font-medium tracking-wider uppercase">
            Pot
          </span>
          <span className="chip-amt text-sm text-[#e4e6eb] font-bold">
            {total.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Main pot + side pots breakdown */}
      {hasSidePots && (
        <div className="flex flex-col items-center gap-0.5">
          {/* Main pot line */}
          <span
            className="chip-amt text-[9px] px-2 py-0.5 text-[#8b8fa3]"
            style={{
              background: 'rgba(0,0,0,0.2)',
              borderRadius: '3px',
              border: '1px solid rgba(255,255,255,0.04)',
            }}
          >
            Main: {pot.main.toLocaleString()}
          </span>

          {/* Side pots with player count */}
          <div className="flex gap-1 flex-wrap justify-center">
            {pot.sides.map((side, i) => (
              <span
                key={i}
                className="chip-amt text-[9px] px-2 py-0.5 text-[#8b8fa3]"
                style={{
                  background: 'rgba(0,0,0,0.2)',
                  borderRadius: '3px',
                  border: '1px solid rgba(255,255,255,0.04)',
                }}
              >
                Side {i + 1}: {side.amount.toLocaleString()}
                <span className="opacity-60 ml-0.5">
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
                className="w-4 h-4 rounded-full
                  text-[#585d70] text-[9px] font-bold leading-none
                  flex items-center justify-center hover:text-[#8b8fa3] transition-colors"
                style={{
                  background: 'rgba(0,0,0,0.2)',
                  border: '1px solid rgba(255,255,255,0.04)',
                }}
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
