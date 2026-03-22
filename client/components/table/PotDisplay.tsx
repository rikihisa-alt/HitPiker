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
      <div className="bg-black/60 backdrop-blur-sm rounded-full px-4 py-1.5 border border-amber-600/50">
        <span className="text-amber-400 font-mono font-bold text-sm">
          POT: {total.toLocaleString()}
        </span>
      </div>
      {pot.sides.length > 0 && (
        <div className="flex gap-1">
          {pot.sides.map((side, i) => (
            <span
              key={i}
              className="text-[10px] bg-black/40 rounded-full px-2 py-0.5 text-amber-300 font-mono border border-amber-800/40"
            >
              Side {i + 1}: {side.amount.toLocaleString()}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
