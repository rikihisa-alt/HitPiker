'use client';

import { useEffect, useRef } from 'react';
import { useGameStore } from '../store/game-store';
import { GamePhase, ActionType } from '../../shared/types/game';
import {
  playCheck,
  playBet,
  playFold,
  playWin,
  playAllIn,
  playTurn,
  playDeal,
} from '../lib/audio-manager';

// Play sound effects in response to game state changes
export function useGameSounds(): void {
  const gameState = useGameStore((s) => s.gameState);
  const playerId = useGameStore((s) => s.playerId);
  const lastResult = useGameStore((s) => s.lastResult);
  const myHoleCards = useGameStore((s) => s.myHoleCards);

  const prevPhaseRef = useRef<GamePhase | null>(null);
  const prevTurnIndexRef = useRef<number>(-1);
  const prevLastActionRef = useRef<string | null>(null);
  const prevHoleCardsLenRef = useRef<number>(0);
  const prevResultRef = useRef<typeof lastResult>(null);

  // React to game state changes
  useEffect(() => {
    if (!gameState) return;

    const { phase, currentPlayerIndex, lastAction } = gameState;

    // Cards dealt - play deal sound when we receive hole cards
    if (myHoleCards.length > 0 && prevHoleCardsLenRef.current === 0) {
      playDeal();
    }
    prevHoleCardsLenRef.current = myHoleCards.length;

    // Phase change sounds (new community cards dealt)
    if (prevPhaseRef.current !== null && phase !== prevPhaseRef.current) {
      if (phase === 'flop' || phase === 'turn' || phase === 'river') {
        playDeal();
      }
    }
    prevPhaseRef.current = phase;

    // Action sounds - create a stable key from lastAction
    const actionKey = lastAction
      ? `${lastAction.playerId}-${lastAction.type}-${lastAction.amount ?? 0}`
      : null;

    if (actionKey && actionKey !== prevLastActionRef.current) {
      // Only play if it was someone else's action (our own is already felt via button press)
      if (lastAction && lastAction.playerId !== playerId) {
        playActionSound(lastAction.type);
      }
    }
    prevLastActionRef.current = actionKey;

    // Turn change - play notification if it is now my turn
    const currentPlayerId = gameState.players[currentPlayerIndex]?.id;
    if (
      currentPlayerIndex !== prevTurnIndexRef.current &&
      currentPlayerId === playerId &&
      phase !== 'waiting' &&
      phase !== 'result' &&
      phase !== 'showdown'
    ) {
      playTurn();
    }
    prevTurnIndexRef.current = currentPlayerIndex;
  }, [gameState, playerId, myHoleCards]);

  // Win sound
  useEffect(() => {
    if (lastResult && lastResult !== prevResultRef.current) {
      playWin();
    }
    prevResultRef.current = lastResult;
  }, [lastResult]);
}

function playActionSound(type: ActionType): void {
  switch (type) {
    case 'check':
      playCheck();
      break;
    case 'bet':
    case 'raise':
    case 'call':
      playBet();
      break;
    case 'fold':
      playFold();
      break;
    case 'all-in':
      playAllIn();
      break;
  }
}
