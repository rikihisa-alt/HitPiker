'use client';

import { ClientPlayerState } from '../../../shared/types/player';
import CardComponent from '../ui/Card';
import HitBadge from '../ui/HitBadge';
import ShowLockBadge from '../ui/ShowLockBadge';

interface PlayerSeatProps {
  player: ClientPlayerState;
  isCurrentTurn: boolean;
  isSelf: boolean;
  position: { top: string; left: string };
}

const ACTION_LABELS: Record<string, { text: string; color: string }> = {
  fold: { text: 'FOLD', color: 'text-text-tertiary' },
  check: { text: 'CHECK', color: 'text-positive' },
  call: { text: 'CALL', color: 'text-primary' },
  bet: { text: 'BET', color: 'text-caution' },
  raise: { text: 'RAISE', color: 'text-caution' },
  'all-in': { text: 'ALL-IN', color: 'text-danger' },
};

export default function PlayerSeat({ player, isCurrentTurn, isSelf, position }: PlayerSeatProps) {
  const turnRing = isCurrentTurn
    ? 'ring-2 ring-primary animate-turn-pulse'
    : '';

  const foldedOpacity = player.folded ? 'opacity-40' : '';
  const disconnectedBorder = player.disconnected ? 'border-danger/40' : 'border-border';

  return (
    <div
      className={`absolute transform -translate-x-1/2 -translate-y-1/2 z-10`}
      style={{ top: position.top, left: position.left }}
    >
      <div className={`flex flex-col items-center gap-1 ${foldedOpacity}`}>
        {/* Hole cards above seat */}
        {!isSelf && player.holeCards.length > 0 && (
          <div className="flex gap-0.5 mb-1">
            {player.holeCards.map((card, i) => (
              <CardComponent key={i} card={card} size="sm" />
            ))}
          </div>
        )}

        {/* Player info box */}
        <div className={`rounded-lg border ${disconnectedBorder} ${turnRing}
          bg-surface-1 shadow-sm
          px-3 py-2 min-w-[100px] text-center`}>

          {/* Position badges */}
          <div className="flex justify-center gap-1 mb-1">
            {player.isDealer && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-surface-3 text-text-secondary font-semibold">D</span>
            )}
            {player.isSB && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary-muted text-primary font-semibold">SB</span>
            )}
            {player.isBB && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-positive-muted text-positive font-semibold">BB</span>
            )}
          </div>

          {/* Name */}
          <div className="text-sm font-medium text-text-primary truncate max-w-[90px]">
            {player.name}
          </div>

          {/* Stack */}
          <div className="font-mono text-xs text-text-secondary">
            {player.stack.toLocaleString()}
          </div>

          {/* Last action */}
          {player.lastAction && (
            <div className="mt-1">
              <span className={`text-[10px] font-semibold
                ${ACTION_LABELS[player.lastAction]?.color ?? 'text-text-tertiary'}`}>
                {ACTION_LABELS[player.lastAction]?.text ?? player.lastAction.toUpperCase()}
              </span>
            </div>
          )}

          {/* Disconnected indicator */}
          {player.disconnected && (
            <div className="mt-1 text-[10px] text-danger font-semibold">
              DISCONNECTED
            </div>
          )}
        </div>

        {/* Current bet */}
        {player.currentBet > 0 && (
          <div className="mt-1 bg-surface-2 rounded-full px-2 py-0.5 text-text-secondary text-xs font-mono border border-border-subtle">
            {player.currentBet.toLocaleString()}
          </div>
        )}

        {/* HIT / SHOW badges */}
        <div className="flex gap-1 mt-1">
          {player.hit.hitRevealed && (
            <HitBadge hitSource={player.hit.hitSource} size="sm" />
          )}
          {player.hit.mustShowIfNotFolded && !player.folded && (
            <ShowLockBadge size="sm" />
          )}
        </div>
      </div>
    </div>
  );
}
