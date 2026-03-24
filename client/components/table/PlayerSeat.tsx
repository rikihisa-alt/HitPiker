'use client';

import { useEffect, useState, useRef } from 'react';
import { ClientPlayerState } from '../../../shared/types/player';
import { Card } from '../../../shared/types/card';
import CardComponent from '../ui/Card';
import HitBadge from '../ui/HitBadge';
import { useGameStore } from '../../store/game-store';
import { GAME_CONSTANTS } from '../../../shared/constants/game';
import { loadSettings, StackDisplay } from '../../lib/settings-store';

interface PlayerSeatProps {
  player: ClientPlayerState;
  isCurrentTurn: boolean;
  isSelf: boolean;
  position: { top: string; left: string };
  chipDelta?: number;
}

const ACTION_LABELS: Record<string, { text: string; bg: string; fg: string }> = {
  fold: { text: 'FOLD', bg: 'bg-surface-2', fg: 'text-text-muted' },
  check: { text: 'CHECK', bg: 'bg-positive-soft', fg: 'text-positive' },
  call: { text: 'CALL', bg: 'bg-primary-soft', fg: 'text-primary' },
  bet: { text: 'BET', bg: 'bg-caution-soft', fg: 'text-caution' },
  raise: { text: 'RAISE', bg: 'bg-caution-soft', fg: 'text-caution' },
  'all-in': { text: 'ALL IN', bg: 'bg-danger-soft', fg: 'text-danger' },
};

/** Format amount based on stack display setting */
function formatAmount(amount: number, display: StackDisplay): string {
  if (display === 'bb') {
    return `${(amount / GAME_CONSTANTS.BIG_BLIND).toFixed(1)} BB`;
  }
  return amount.toLocaleString();
}

/** Chip color based on bet amount */
function getChipColor(amount: number): string {
  if (amount >= 1000) return '#e05454';
  if (amount >= 500) return '#2dd4a0';
  if (amount >= 100) return '#4a8eff';
  return '#8b8fa3';
}

/** Determine if seat is in the top half of the table */
function isTopHalf(positionTop: string): boolean {
  return parseFloat(positionTop) < 50;
}

/** Hash a name string to pick a consistent avatar color */
function avatarColor(name: string): string {
  const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#14b8a6', '#06b6d4', '#84cc16'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

export default function PlayerSeat({ player, isCurrentTurn, isSelf, position, chipDelta }: PlayerSeatProps) {
  const [showDelta, setShowDelta] = useState(false);
  const [displayedDelta, setDisplayedDelta] = useState(0);
  const [revealedCards, setRevealedCards] = useState<Card[] | null>(null);
  const [stackDisplay, setStackDisplay] = useState<StackDisplay>('points');
  const showdownCards = useGameStore((s) => s.showdownCards);
  const activeEmote = useGameStore((s) => s.activeEmote);
  const timerRef = useRef<string>('');

  // Load stack display setting on mount and when localStorage changes
  useEffect(() => {
    setStackDisplay(loadSettings().stackDisplay);

    function handleStorage() {
      setStackDisplay(loadSettings().stackDisplay);
    }
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // Poll settings for same-tab changes
  useEffect(() => {
    const interval = setInterval(() => {
      const current = loadSettings().stackDisplay;
      setStackDisplay((prev) => (prev !== current ? current : prev));
    }, 500);
    return () => clearInterval(interval);
  }, []);

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
  const chipAbove = isSelf || !topHalf;
  const chipBelow = !chipAbove;

  const isFolded = player.folded;

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
            border border-border rounded-lg px-2 py-0.5 shadow-lg"
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
          {displayedDelta > 0 ? '+' : ''}{formatAmount(Math.abs(displayedDelta), stackDisplay)}
        </div>
      )}

      <div className="flex flex-col items-center gap-1 relative">
        {/* Bet chip - ABOVE capsule for self/bottom-row players */}
        {hasBet && chipAbove && (
          <BetChip amount={player.currentBet} direction="above" stackDisplay={stackDisplay} />
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

        {/* Main seat card */}
        <div
          className={`relative flex items-center gap-2.5 px-3 py-2 rounded-xl
            bg-surface-1/90 backdrop-blur-sm border-2 transition-all duration-200 overflow-hidden
            ${isCurrentTurn && isActive
              ? 'border-primary animate-turn-breathe'
              : isSelf && !isFolded
                ? 'border-primary/25'
                : 'border-border'
            }
            ${player.disconnected ? 'opacity-30' : ''}`}
          style={isFolded ? {
            filter: 'saturate(0.35)',
            transform: 'scale(0.95)',
            opacity: 0.55,
          } : undefined}
        >
          {/* Position badge (SB/BB) */}
          {(player.isSB || player.isBB) && (
            <span className="absolute -top-2 -right-1 text-[9px] font-bold px-1.5 py-0 rounded-md
              bg-surface-raised border border-border text-text-sub">
              {player.isSB ? 'SB' : 'BB'}
            </span>
          )}

          {/* HIT indicator dot */}
          {player.hit.hitRevealed && !player.folded && (
            <span className="absolute -top-1 -left-1 w-3 h-3 rounded-full bg-danger border-2 border-surface-1" />
          )}

          {/* Avatar with active ring */}
          <div className="relative flex-shrink-0">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-white font-bold
                ${isCurrentTurn && isActive ? 'ring-2 ring-primary/50 ring-offset-1 ring-offset-surface-1' : ''}`}
              style={{
                fontSize: '12px',
                backgroundColor: avatarColor(player.name),
              }}
            >
              {player.name.charAt(0).toUpperCase()}
            </div>
          </div>

          {/* Info stacked on right */}
          <div className="flex flex-col items-start min-w-[56px]">
            <span className="text-[11px] text-text-sub truncate max-w-[80px] leading-tight">
              {player.name}
            </span>
            <span className="chip-amt text-xs font-bold text-text tabular-nums leading-tight">
              {formatAmount(player.stack, stackDisplay)}
            </span>
          </div>

          {/* Action timer bar */}
          {isCurrentTurn && isActive && (
            <div
              key={timerRef.current}
              className="absolute bottom-0 left-0 h-[2px] w-full"
            >
              <div
                className="h-full rounded-b-xl"
                style={{
                  animation: `timer-bar ${GAME_CONSTANTS.ACTION_TIMEOUT_MS}ms linear forwards`,
                  background: 'linear-gradient(90deg, var(--primary), var(--caution))',
                }}
              />
            </div>
          )}
        </div>

        {/* Bet chip - BELOW capsule for top-row non-self players */}
        {hasBet && chipBelow && (
          <BetChip amount={player.currentBet} direction="below" stackDisplay={stackDisplay} />
        )}

        {/* Action label as a badge */}
        {player.lastAction && isActive && (
          <div className="whitespace-nowrap">
            <span className={`inline-block text-[10px] font-semibold uppercase tracking-wide
              px-2 py-0.5 rounded-md
              ${ACTION_LABELS[player.lastAction]?.bg ?? 'bg-surface-2'}
              ${ACTION_LABELS[player.lastAction]?.fg ?? 'text-text-sub'}`}>
              {ACTION_LABELS[player.lastAction]?.text ?? player.lastAction.toUpperCase()}
            </span>
          </div>
        )}

        {/* Disconnected label */}
        {player.disconnected && (
          <div className="whitespace-nowrap">
            <span className="inline-block text-[10px] text-danger font-semibold bg-danger-soft px-2 py-0.5 rounded-md">
              DISCONNECTED
            </span>
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
function BetChip({ amount, direction, stackDisplay }: { amount: number; direction: 'above' | 'below'; stackDisplay: StackDisplay }) {
  const chipColor = getChipColor(amount);

  return (
    <div className={`flex items-center gap-1 ${direction === 'above' ? 'mb-1' : 'mt-1'}`}>
      {/* Chip circle with inner dashed ring */}
      <span
        className="inline-block w-[14px] h-[14px] rounded-full flex-shrink-0"
        style={{
          backgroundColor: chipColor,
          border: '2px solid rgba(255,255,255,0.25)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.4), inset 0 1px 1px rgba(255,255,255,0.2)',
        }}
      />
      {/* Amount */}
      <span className="chip-amt text-[11px] font-semibold text-caution whitespace-nowrap">
        {formatAmount(amount, stackDisplay)}
      </span>
    </div>
  );
}

/** Dealer button puck with beveled gradient */
function DealerPuck({ topHalf }: { topHalf: boolean }) {
  return (
    <div
      className={`absolute z-20 ${topHalf ? '-bottom-3 -right-4' : '-top-3 -right-4'}`}
    >
      <div
        className="w-5 h-5 rounded-full flex items-center justify-center"
        style={{
          background: 'linear-gradient(145deg, #ffffff, #dde0e4)',
          border: '1px solid #c0c4cc',
          boxShadow: '0 2px 6px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.9)',
        }}
      >
        <span className="text-[10px] font-extrabold text-gray-700 leading-none" style={{ textShadow: '0 1px 0 rgba(255,255,255,0.6)' }}>D</span>
      </div>
    </div>
  );
}
