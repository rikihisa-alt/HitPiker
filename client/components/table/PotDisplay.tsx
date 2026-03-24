'use client';

import { PotState } from '../../../shared/types/game';

interface PotDisplayProps {
  pot: PotState;
}

export default function PotDisplay({ pot }: PotDisplayProps) {
  const total = pot.main + pot.sides.reduce((s, p) => s + p.amount, 0);

  if (total === 0) return null;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="bg-surface-2/80 backdrop-blur-sm rounded-pill px-3 py-1 border border-border-subtle">
        <span className="chip-amt text-xs text-text-sub font-semibold tracking-wide">
          POT{' '}
          <span className="text-text">{total.toLocaleString()}</span>
        </span>
      </div>
      {pot.sides.length > 0 && (
        <div className="flex gap-1">
          {pot.sides.map((side, i) => (
            <span
              key={i}
              className="chip-amt text-[9px] bg-surface-2/60 rounded-pill px-2 py-0.5 text-text-muted border border-border-subtle"
            >
              Side {i + 1}: {side.amount.toLocaleString()}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
