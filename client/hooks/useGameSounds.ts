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
  speakAction,
  startAllInBGM,
  stopAllInBGM,
  playPotWin,
} from '../lib/audio-manager';

// Map ActionType to spoken word
function actionToSpeech(type: ActionType): string {
  switch (type) {
    case 'check': return 'Check';
    case 'call': return 'Call';
    case 'bet': return 'Bet';
    case 'raise': return 'Raise';
    case 'fold': return 'Fold';
    case 'all-in': return 'All in';
  }
}

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
  const allInBGMActiveRef = useRef<boolean>(false);

  // React to game state changes
  useEffect(() => {
    if (!gameState) return;

    const { phase, currentPlayerIndex, lastAction, players } = gameState;

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

    // Stop all-in BGM when hand ends (result/waiting/dealing)
    if (phase === 'result' || phase === 'waiting' || phase === 'dealing') {
      if (allInBGMActiveRef.current) {
        stopAllInBGM();
        allInBGMActiveRef.current = false;
      }
    }

    prevPhaseRef.current = phase;

    // Action sounds - create a stable key from lastAction
    const actionKey = lastAction
      ? `${lastAction.playerId}-${lastAction.type}-${lastAction.amount ?? 0}`
      : null;

    if (actionKey && actionKey !== prevLastActionRef.current) {
      // Play sound effect for other players' actions
      if (lastAction && lastAction.playerId !== playerId) {
        playActionSound(lastAction.type);
      }

      // Voice announcement for ALL actions (including own)
      if (lastAction) {
        speakAction(actionToSpeech(lastAction.type));
      }

      // Check if all remaining (non-folded) players are all-in
      // This detects the runout situation
      const activePlayers = players.filter((p) => !p.folded);
      const allPlayersAllIn = activePlayers.length >= 2 &&
        activePlayers.every((p) => p.allIn);

      if (allPlayersAllIn && !allInBGMActiveRef.current) {
        startAllInBGM();
        allInBGMActiveRef.current = true;
      }
    }
    prevLastActionRef.current = actionKey;

    // Turn change - play notification if it is now my turn
    const currentPlayerId = players[currentPlayerIndex]?.id;
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

  // Win sound + pot collection sound
  useEffect(() => {
    if (lastResult && lastResult !== prevResultRef.current) {
      playWin();
      playPotWin();

      // Ensure BGM is stopped when result arrives
      if (allInBGMActiveRef.current) {
        stopAllInBGM();
        allInBGMActiveRef.current = false;
      }
    }
    prevResultRef.current = lastResult;
  }, [lastResult]);

  // Cleanup: stop BGM on unmount
  useEffect(() => {
    return () => {
      if (allInBGMActiveRef.current) {
        stopAllInBGM();
        allInBGMActiveRef.current = false;
      }
    };
  }, []);
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
