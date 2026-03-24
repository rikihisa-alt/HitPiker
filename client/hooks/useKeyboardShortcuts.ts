'use client';

import { useEffect } from 'react';
import { useGameState } from './useGameState';
import { useGameStore } from '../store/game-store';
import { useBetControl } from './useBetControl';
import { useSocket } from './useSocket';
import { useLocalGame } from './useLocalGame';
import { GameAction } from '../../shared/types/game';

/**
 * Keyboard shortcuts for poker actions.
 * F=Fold, C=Call/Check, R=Raise/Bet, A=All-in, Enter=confirm bet, Escape=close bet mode
 */
export function useKeyboardShortcuts() {
  const { isMyTurn, availableActions, gameState } = useGameState();
  const playerId = useGameStore((s) => s.playerId);
  const isPracticeMode = useGameStore((s) => s.isPracticeMode);
  const { sendAction: sendSocketAction } = useSocket();
  const { sendAction: sendLocalAction } = useLocalGame();
  const sendAction = isPracticeMode ? sendLocalAction : sendSocketAction;
  const {
    betAmount,
    betMode,
    openBetMode,
    closeBetMode,
  } = useBetControl();

  useEffect(() => {
    if (!isMyTurn || !playerId || !gameState) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore when typing in input fields
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      const key = e.key.toLowerCase();

      const dispatch = (type: GameAction['type'], amount?: number) => {
        sendAction({ playerId, type, amount });
        closeBetMode();
      };

      const canFold = availableActions.includes('fold');
      const canCheck = availableActions.includes('check');
      const canCall = availableActions.includes('call');
      const canBet = availableActions.includes('bet');
      const canRaise = availableActions.includes('raise');
      const canAllIn = availableActions.includes('all-in');
      const canBetOrRaise = canBet || canRaise;

      switch (key) {
        case 'f':
          if (canFold) dispatch('fold');
          break;
        case 'c':
          if (canCheck) dispatch('check');
          else if (canCall) dispatch('call');
          break;
        case 'r':
          if (canBetOrRaise && !betMode) openBetMode();
          break;
        case 'a':
          if (canAllIn && !canBetOrRaise) {
            dispatch('all-in');
          }
          break;
        case 'enter':
          if (betMode && canBetOrRaise) {
            dispatch(canBet ? 'bet' : 'raise', betAmount);
          }
          break;
        case 'escape':
          if (betMode) closeBetMode();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMyTurn, playerId, gameState, availableActions, betMode, betAmount, sendAction, openBetMode, closeBetMode]);
}
