'use client';

import { useGameStore, useMyPlayer, useIsMyTurn, useCurrentPhase, usePotTotal } from '../store/game-store';

export function useGameState() {
  const gameState = useGameStore((s) => s.gameState);
  const myPlayer = useMyPlayer();
  const isMyTurn = useIsMyTurn();
  const phase = useCurrentPhase();
  const potTotal = usePotTotal();
  const availableActions = useGameStore((s) => s.availableActions);
  const myHoleCards = useGameStore((s) => s.myHoleCards);
  const lastResult = useGameStore((s) => s.lastResult);

  return {
    gameState,
    myPlayer,
    isMyTurn,
    phase,
    potTotal,
    availableActions,
    myHoleCards,
    lastResult,
  };
}
