'use client';

import { useEffect, useState, useRef } from 'react';
import { ClientPlayerState } from '../../../shared/types/player';
import { Card } from '../../../shared/types/card';
import CardComponent from '../ui/Card';
import HitBadge from '../ui/HitBadge';
import { useGameStore } from '../../store/game-store';
import { GAME_CONSTANTS } from '../../../shared/constants/game';

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

/** Chip color based on bet amount */
function getChipColor(amount: number): string {
  if (amount >= 1000) return '#e05454';   // red
  if (amount >= 500) return '#2dd4a0';    // green
  if (amount >= 100) return '#4a8eff';    // blue
  return '#8b8fa3';                        // gray
}

/** Determine if seat is in the top half of the table */
function isTopHalf(positionTop: string): boolean {
  return parseFloat(positionTop) < 50;
}

export default function PlayerSeat({ player, isCurrentTurn, isSelf, position, chipDelta }: PlayerSeatProps) {
  const [showDelta, setShowDelta] = useState(false);
  const [displayedDelta, setDisplayedDelta] = useState(0);
  const [revealedCards, setRevealedCards] = useState<Card[] | null>(null);
  const showdownCards = useGameStore((s) => s.showdownCards);
  const activeEmote = useGameStore((s) => s.activeEmote);
  const timerRef = useRef<string>('');

  // Generate a unique key to reset timer animation when turn changes
  const timerKey = isCurrentTurn ? `${player.id}-${Date.now()}` : '';
  useEffect(() => {
    if (isCurrentTurn) {
      timerRef.current = timerKey;
    }
  }, [isCurrentTurn, timerKey]);

  // Chip delta animation
  useEffect(() => {
    if (chipDelta !== undefined && chipDelta !== 0) {
      setDisplayedDelta(chipDelta);
      setShowDelta(true);
      const timer = setTimeout(() => setShowDelta(false), 2500);
      return () => clearTimeout(timer);
    }
  }, [chipDelta]);

  // Showdown card reveal animation
  useEffect(() => {
    const cards = showdownCards.get(player.id);
    if (cards && cards.length > 0 && !isSelf) {
      const timer = setTimeout(() => {
        setRevealedCards(cards);
      }, 300);
      return () => clearTimeout(timer);
    } else if (!cards || cards.length === 0) {
      setRevealedCards(null);
    }
  }, [showdownCards, player.id, isSelf]);

  const isActive = !player.folded && !player.disconnected;
  const displayCards = revealedCards || ((!isSelf && player.holeCards.length > 0) ? player.holeCards : null);
  const topHalf = isTopHalf(position.top);
  const hasBet = player.currentBet > 0 && !player.folded;
  // Self seat: chips and dealer always go ABOVE capsule (toward center, away from hand cards at bottom)
  const chipAbove = isSelf || !topHalf;
  const chipBelow = !chipAbove;

  return (
    <div
      className="absolute -translate-x-1/2 -translate-y-1/2 z-10"
      style={{ top: position.top, left: position.left }}
    >
      {/* Emote float */}
      {activeEmote && activeEmote.playerId === player.id && (
        <div
          key={activeEmote.timestamp}
          className="absolute -top-10 left-1/2 -translate-x-1/2 z-30 pointer-events-none
            text-sm font-bold whitespace-nowrap bg-surface-1/90 backdrop-blur-sm
            border border-border rounded-md px-2 py-0.5 shadow-lg"
          style={{
            animation: 'emote-float 2s ease-out forwards',
          }}
        >
          {activeEmote.emote}
        </div>
      )}

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
        {/* Bet chip - ABOVE capsule for self/bottom-row players */}
        {hasBet && chipAbove && (
          <BetChip amount={player.currentBet} direction="above" />
        )}

        {/* Hole cards above seat (other players) */}
        {!isSelf && displayCards && displayCards.length > 0 && (
          <div className="flex gap-0.5 mb-0.5">
            {displayCards.map((card, i) => (
              <div
                key={i}
                className={revealedCards ? 'animate-card-flip' : ''}
                style={revealedCards ? { animationDelay: `${i * 150}ms` } : undefined}
              >
                <CardComponent card={card} size="sm" />
              </div>
            ))}
          </div>
        )}

        {/* Dealer button puck on felt */}
        {player.isDealer && (
          <DealerPuck topHalf={topHalf && !isSelf} />
        )}

        {/* Main capsule */}
        <div className={`relative flex items-center gap-2 px-3 py-1.5 rounded-pill
          bg-surface-1/90 backdrop-blur-sm border transition-all duration-200 overflow-hidden
          ${isCurrentTurn ? 'border-primary animate-turn-glow' : 'border-border'}
          ${player.folded ? 'opacity-40 grayscale' : ''}
          ${player.disconnected ? 'opacity-30' : ''}
          ${isSelf && !player.folded ? 'border-primary/30' : ''}`}
        >
          {/* Position badge (SB/BB only - dealer uses felt puck) */}
          {(player.isSB || player.isBB) && (
            <span className="absolute -top-2 -right-1 text-[9px] font-bold px-1.5 py-0 rounded-pill
              bg-surface-raised border border-border text-text-sub">
              {player.isSB ? 'SB' : 'BB'}
            </span>
          )}

          {/* HIT indicator dot */}
          {player.hit.hitRevealed && !player.folded && (
            <span className={`absolute -top-1 -left-1 w-3 h-3 rounded-full bg-danger border-2 border-surface-1
              ${isCurrentTurn ? 'animate-hit-blink' : ''}`} />
          )}

          {/* Avatar */}
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
            style={{
              fontSize: '11px',
              backgroundColor: (() => {
                const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#14b8a6', '#06b6d4', '#84cc16'];
                let hash = 0;
                for (let i = 0; i < player.name.length; i++) {
                  hash = player.name.charCodeAt(i) + ((hash << 5) - hash);
                }
                return colors[Math.abs(hash) % colors.length];
              })(),
            }}
          >
            {player.name.charAt(0).toUpperCase()}
          </div>

          {/* Info */}
          <div className="flex flex-col items-center min-w-[60px]">
            <span className="text-[11px] text-text-sub truncate max-w-[80px]">
              {player.name}
            </span>
            <span className="chip-amt text-xs font-semibold text-text">
              {player.stack.toLocaleString()}
            </span>
          </div>

          {/* Action timer bar */}
          {isCurrentTurn && isActive && (
            <div
              key={timerRef.current}
              className="absolute bottom-0 left-0 h-[3px] w-full"
            >
              <div
                className="h-full rounded-b-pill"
                style={{
                  animation: `timer-bar ${GAME_CONSTANTS.ACTION_TIMEOUT_MS}ms linear forwards`,
                }}
              />
            </div>
          )}
        </div>

        {/* Bet chip - BELOW capsule for top-row non-self players */}
        {hasBet && chipBelow && (
          <BetChip amount={player.currentBet} direction="below" />
        )}

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

        {/* HIT badge */}
        {player.hit.hitRevealed && !player.folded && (
          <HitBadge hitSource={player.hit.hitSource} size="sm" blink={isCurrentTurn} />
        )}
      </div>
    </div>
  );
}

/** Visual bet chip with amount, positioned toward the center of the table */
function BetChip({ amount, direction }: { amount: number; direction: 'above' | 'below' }) {
  const chipColor = getChipColor(amount);

  return (
    <div className={`flex items-center gap-1 ${direction === 'above' ? 'mb-1' : 'mt-1'}`}>
      {/* Chip circle */}
      <span
        className="inline-block w-[14px] h-[14px] rounded-full border-2 border-white/30 flex-shrink-0"
        style={{
          backgroundColor: chipColor,
          boxShadow: `0 1px 3px rgba(0,0,0,0.4), inset 0 1px 1px rgba(255,255,255,0.2)`,
        }}
      />
      {/* Amount */}
      <span className="chip-amt text-[11px] font-semibold text-caution whitespace-nowrap">
        {amount.toLocaleString()}
      </span>
    </div>
  );
}

/** Dealer button puck on the felt */
function DealerPuck({ topHalf }: { topHalf: boolean }) {
  return (
    <div
      className={`absolute z-20 ${topHalf ? '-bottom-3 -right-4' : '-top-3 -right-4'}`}
    >
      <div
        className="w-5 h-5 rounded-full bg-white flex items-center justify-center
          border border-gray-300"
        style={{
          boxShadow: '0 1px 4px rgba(0,0,0,0.35)',
        }}
      >
        <span className="text-[10px] font-bold text-gray-800 leading-none">D</span>
      </div>
    </div>
  );
}
