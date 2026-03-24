'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useGameStore } from '../../store/game-store';
import { useGameState } from '../../hooks/useGameState';
import { calculateEquity, PlayerEquity } from '../../lib/equity-calculator';
import { Card } from '../../../shared/types/card';

// Player color palette (muted, poker-appropriate)
const PLAYER_COLORS = [
  '#4a8eff', // blue (primary)
  '#2dd4a0', // teal (positive)
  '#e5a030', // amber (caution)
  '#e05454', // red (danger)
  '#a78bfa', // purple
  '#f472b6', // pink
];

function getPlayerColor(index: number): string {
  return PLAYER_COLORS[index % PLAYER_COLORS.length];
}

export default function EquityBar() {
  const { gameState, phase } = useGameState();
  const showdownCards = useGameStore((s) => s.showdownCards);
  const myHoleCards = useGameStore((s) => s.myHoleCards);
  const playerId = useGameStore((s) => s.playerId);
  const [equities, setEquities] = useState<PlayerEquity[]>([]);
  const [animated, setAnimated] = useState(false);
  const prevHandRef = useRef<number>(0);

  // Determine if we should show the equity bar
  const shouldShow = useMemo(() => {
    if (!gameState) return false;
    if (phase === 'waiting' || phase === 'result') return false;

    const nonFolded = gameState.players.filter(p => !p.folded);
    if (nonFolded.length < 2) return false;

    // All remaining players are all-in, or only 1 active (non-folded, non-all-in) left
    const activePlayers = nonFolded.filter(p => !p.allIn);
    return activePlayers.length <= 1 && nonFolded.some(p => p.allIn);
  }, [gameState, phase]);

  // Gather known hole cards for equity calculation
  const playerHands = useMemo(() => {
    if (!gameState || !shouldShow) return [];

    const nonFolded = gameState.players.filter(p => !p.folded);
    const hands: { playerId: string; playerName: string; holeCards: Card[] }[] = [];

    for (const player of nonFolded) {
      let holeCards: Card[] = [];

      // My own cards
      if (player.id === playerId && myHoleCards.length === 2) {
        holeCards = myHoleCards;
      }
      // Showdown-revealed cards
      else if (showdownCards.has(player.id)) {
        holeCards = showdownCards.get(player.id) ?? [];
      }

      if (holeCards.length === 2) {
        hands.push({
          playerId: player.id,
          playerName: player.name,
          holeCards,
        });
      }
    }

    return hands;
  }, [gameState, shouldShow, playerId, myHoleCards, showdownCards]);

  // Calculate equity
  useEffect(() => {
    if (!shouldShow || playerHands.length < 2 || !gameState) {
      setEquities([]);
      return;
    }

    // Reset animation on new hand
    if (gameState.handNumber !== prevHandRef.current) {
      prevHandRef.current = gameState.handNumber;
      setAnimated(false);
    }

    const result = calculateEquity(playerHands, gameState.board, 1000);
    setEquities(result.players);

    // Trigger animation
    const timer = setTimeout(() => setAnimated(true), 50);
    return () => clearTimeout(timer);
  }, [shouldShow, playerHands, gameState?.board.length, gameState?.handNumber]);

  if (!shouldShow || equities.length < 2) return null;

  // Build a mapping of playerId -> player index for consistent coloring
  const playerIndexMap = new Map<string, number>();
  if (gameState) {
    gameState.players.forEach((p, i) => {
      playerIndexMap.set(p.id, i);
    });
  }

  const totalEquity = equities.reduce((sum, e) => sum + e.equity, 0);
  // Normalize to 100% in case rounding doesn't add up
  const normalizedEquities = equities.map(e => ({
    ...e,
    equity: totalEquity > 0 ? (e.equity / totalEquity) * 100 : 100 / equities.length,
  }));

  return (
    <div className="absolute top-[38%] left-1/2 -translate-x-1/2 -translate-y-full z-20 w-64 animate-fade-in">
      {/* Equity bar */}
      <div className="h-3 rounded-pill overflow-hidden flex bg-surface-2 border border-border-subtle">
        {normalizedEquities.map((eq, i) => {
          const color = getPlayerColor(playerIndexMap.get(eq.playerId) ?? i);
          return (
            <div
              key={eq.playerId}
              className="h-full transition-all duration-700 ease-out"
              style={{
                width: animated ? `${eq.equity}%` : '0%',
                backgroundColor: color,
                opacity: 0.85,
              }}
            />
          );
        })}
      </div>

      {/* Labels */}
      <div className="flex justify-between mt-1 px-0.5">
        {normalizedEquities.map((eq, i) => {
          const color = getPlayerColor(playerIndexMap.get(eq.playerId) ?? i);
          const isSelf = eq.playerId === playerId;
          return (
            <div key={eq.playerId} className="flex items-center gap-1">
              <div
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ backgroundColor: color }}
              />
              <span className={`text-[10px] truncate max-w-[60px] ${
                isSelf ? 'text-text font-medium' : 'text-text-sub'
              }`}>
                {eq.playerName}
              </span>
              <span className="chip-amt text-[10px] text-text-sub">
                {Math.round(eq.equity)}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
