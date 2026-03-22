'use client';

import { useCallback, useMemo } from 'react';
import { useGameStore, useMyPlayer, usePotTotal } from '../store/game-store';
import { GAME_CONSTANTS } from '../../shared/constants/game';

export function useBetControl() {
  const { betAmount, setBetAmount, betMode, setBetMode, gameState } = useGameStore();
  const myPlayer = useMyPlayer();
  const potTotal = usePotTotal();

  const minBet = useMemo(() => {
    if (!gameState) return GAME_CONSTANTS.BIG_BLIND;
    return gameState.minRaise;
  }, [gameState]);

  const maxBet = useMemo(() => {
    if (!myPlayer) return 0;
    return myPlayer.stack + myPlayer.currentBet;
  }, [myPlayer]);

  const currentBet = gameState?.currentBet ?? 0;
  const isPreflop = gameState?.phase === 'preflop';

  const setPresetBet = useCallback((value: number) => {
    const clamped = Math.min(Math.max(value, minBet), maxBet);
    setBetAmount(Math.floor(clamped));
  }, [minBet, maxBet, setBetAmount]);

  const bbPreset = useCallback((multiplier: number) => {
    setPresetBet(GAME_CONSTANTS.BIG_BLIND * multiplier);
  }, [setPresetBet]);

  const potPreset = useCallback((ratio: number) => {
    setPresetBet(potTotal * ratio);
  }, [potTotal, setPresetBet]);

  const setAllIn = useCallback(() => {
    if (myPlayer) {
      setBetAmount(myPlayer.stack);
    }
  }, [myPlayer, setBetAmount]);

  const openBetMode = useCallback(() => {
    const initialBet = currentBet > 0
      ? currentBet + minBet
      : minBet;
    setBetAmount(Math.min(initialBet, maxBet));
    setBetMode(true);
  }, [currentBet, minBet, maxBet, setBetAmount, setBetMode]);

  const closeBetMode = useCallback(() => {
    setBetMode(false);
  }, [setBetMode]);

  return {
    betAmount,
    setBetAmount: setPresetBet,
    betMode,
    openBetMode,
    closeBetMode,
    minBet,
    maxBet,
    isPreflop,
    potTotal,
    bbPreset,
    potPreset,
    setAllIn,
  };
}
