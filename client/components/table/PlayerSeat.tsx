'use client';

import { useEffect, useState } from 'react';
import { ClientPlayerState } from '../../../shared/types/player';
import CardComponent from '../ui/Card';
import HitBadge from '../ui/HitBadge';
import ShowLockBadge from '../ui/ShowLockBadge';

interface PlayerSeatProps {
  player: ClientPlayerState;
  isCurrentTurn: boolean;
  isSelf: boolean;
  position: { top: string; left: string };
  chipDelta?: number;
}

const ACTION_LABELS: Record<string, { text: string; color: string }> = {
  fold: { text: 'FOLD', color: 'text-text-muted' },
  check: { text: 'CHECK', color: 'text-positive' },
  call: { text: 'CALL', color: 'text-primary' },
  bet: { text: 'BET', color: 'text-caution' },
  raise: { text: 'RAISE', color: 'text-caution' },
  'all-in': { text: 'ALL IN', color: 'text-danger' },
};

export default function PlayerSeat({ player, isCurrentTurn, isSelf, position, chipDelta }: PlayerSeatProps) {
  const [showDelta, setShowDelta] = useState(false);
  const [displayedDelta, setDisplayedDelta] = useState(0);

  // チップ増減アニメーション
  useEffect(() => {
    if (chipDelta !== undefined && chipDelta !== 0) {
      setDisplayedDelta(chipDelta);
      setShowDelta(true);
      const timer = setTimeout(() => setShowDelta(false), 2500);
      return () => clearTimeout(timer);
    }
  }, [chipDelta]);

  const isActive = !player.folded && !player.disconnected;

  return (
    <div
      className="absolute -translate-x-1/2 -translate-y-1/2 z-10"
      style={{ top: position.top, left: position.left }}
    >
      {/* Chip delta float */}
      {showDelta && displayedDelta !== 0 && (
        <div
          className={`absolute -top-7 left-1/2 -translate-x-1/2 z-20 pointer-events-none
            chip-amt text-sm font-bold whitespace-nowrap animate-chip-float
            ${displayedDelta > 0 ? 'text-positive' : 'text-danger'}`}
        >
          {displayedDelta > 0 ? '+' : ''}{displayedDelta.toLocaleString()}
        </div>
      )}

      <div className="flex flex-col items-center gap-1 relative">
        {/* Hole cards above seat (other players, shown at showdown) */}
        {!isSelf && player.holeCards.length > 0 && (
          <div className="flex gap-0.5 mb-0.5">
            {player.holeCards.map((card, i) => (
              <CardComponent key={i} card={card} size="sm" />
            ))}
          </div>
        )}

        {/* Main capsule */}
        <div className={`relative flex items-center gap-2 px-3 py-1.5 rounded-pill
          bg-surface-1/90 backdrop-blur-sm border transition-all duration-200
          ${isCurrentTurn ? 'border-primary animate-turn-glow' : 'border-border'}
          ${player.folded ? 'opacity-40 grayscale' : ''}
          ${player.disconnected ? 'opacity-30' : ''}
          ${isSelf && !player.folded ? 'border-primary/30' : ''}`}
        >
          {/* Position badge (D/SB/BB) */}
          {(player.isDealer || player.isSB || player.isBB) && (
            <span className="absolute -top-2 -right-1 text-[9px] font-bold px-1.5 py-0 rounded-pill
              bg-surface-raised border border-border text-text-sub">
              {player.isDealer ? 'D' : player.isSB ? 'SB' : 'BB'}
            </span>
          )}

          {/* HIT indicator dot */}
          {player.hit.hitRevealed && (
            <span className="absolute -top-1 -left-1 w-3 h-3 rounded-full bg-danger border-2 border-surface-1" />
          )}

          {/* Info */}
          <div className="flex flex-col items-center min-w-[60px]">
            <span className="text-[11px] text-text-sub truncate max-w-[80px]">
              {player.name}
            </span>
            <span className="chip-amt text-xs font-semibold text-text">
              {player.stack.toLocaleString()}
            </span>
            {/* Current bet inline */}
            {player.currentBet > 0 && !player.folded && (
              <span className="chip-amt text-[10px] text-caution font-medium">
                bet {player.currentBet.toLocaleString()}
              </span>
            )}
          </div>
        </div>

        {/* Action label below capsule */}
        {player.lastAction && isActive && (
          <div className="whitespace-nowrap">
            <span className={`text-[10px] font-semibold uppercase tracking-wide
              ${ACTION_LABELS[player.lastAction]?.color ?? 'text-text-sub'}`}>
              {ACTION_LABELS[player.lastAction]?.text ?? player.lastAction.toUpperCase()}
            </span>
          </div>
        )}

        {/* Disconnected label */}
        {player.disconnected && (
          <div className="whitespace-nowrap">
            <span className="text-[10px] text-danger font-semibold">DISCONNECTED</span>
          </div>
        )}

        {/* HIT / SHOW badges */}
        {(player.hit.hitRevealed || (player.hit.mustShowIfNotFolded && !player.folded)) && (
          <div className="flex gap-1">
            {player.hit.hitRevealed && (
              <HitBadge hitSource={player.hit.hitSource} size="sm" />
            )}
            {player.hit.mustShowIfNotFolded && !player.folded && (
              <ShowLockBadge size="sm" />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
