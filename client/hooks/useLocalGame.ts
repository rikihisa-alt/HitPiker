'use client';

import { useCallback, useRef, useEffect } from 'react';
import { useGameStore } from '../store/game-store';
import { LocalGameManager } from '../lib/local-game-manager';
import { GameAction } from '../../shared/types/game';

export function useLocalGame() {
  const managerRef = useRef<LocalGameManager | null>(null);

  const setGameState = useGameStore((s) => s.setGameState);
  const setMyHoleCards = useGameStore((s) => s.setMyHoleCards);
  const setLastResult = useGameStore((s) => s.setLastResult);
  const setRoomInfo = useGameStore((s) => s.setRoomInfo);
  const setIsPracticeMode = useGameStore((s) => s.setIsPracticeMode);
  const reset = useGameStore((s) => s.reset);

  const startPracticeGame = useCallback((playerName: string, comCount: number) => {
    // 前回のゲームをクリーンアップ
    if (managerRef.current) {
      managerRef.current.stop();
    }

    const manager = new LocalGameManager(playerName, comCount, {
      onGameStateUpdate: (state, myCards) => {
        setGameState(state);
        setMyHoleCards(myCards);
      },
      onHandResult: (result) => {
        setLastResult(result);
      },
      onNextHand: () => {
        setLastResult(null);
      },
    });

    managerRef.current = manager;
    setRoomInfo('practice', manager.getPlayerId(), playerName);
    setIsPracticeMode(true);

    // ゲーム開始
    manager.startGame();
  }, [setGameState, setMyHoleCards, setLastResult, setRoomInfo, setIsPracticeMode]);

  const sendAction = useCallback((action: GameAction) => {
    if (managerRef.current) {
      managerRef.current.handlePlayerAction(action);
    }
  }, []);

  const stopGame = useCallback(() => {
    if (managerRef.current) {
      managerRef.current.stop();
      managerRef.current = null;
    }
    reset();
  }, [reset]);

  // コンポーネントアンマウント時にクリーンアップ
  useEffect(() => {
    return () => {
      if (managerRef.current) {
        managerRef.current.stop();
      }
    };
  }, []);

  return {
    startPracticeGame,
    sendAction,
    stopGame,
  };
}
