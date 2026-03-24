'use client';

import { useCallback, useEffect } from 'react';
import { useGameStore } from '../store/game-store';
import { LocalGameManager } from '../lib/local-game-manager';
import { GameAction } from '../../shared/types/game';

// モジュールレベルのシングルトン（全コンポーネントで共有）
let globalManager: LocalGameManager | null = null;

export function useLocalGame() {
  const setGameState = useGameStore((s) => s.setGameState);
  const setMyHoleCards = useGameStore((s) => s.setMyHoleCards);
  const setLastResult = useGameStore((s) => s.setLastResult);
  const setShowdownCards = useGameStore((s) => s.setShowdownCards);
  const setRoomInfo = useGameStore((s) => s.setRoomInfo);
  const setIsPracticeMode = useGameStore((s) => s.setIsPracticeMode);
  const addHandHistory = useGameStore((s) => s.addHandHistory);
  const reset = useGameStore((s) => s.reset);

  const startPracticeGame = useCallback((playerName: string, comCount: number) => {
    // 前回のゲームをクリーンアップ
    if (globalManager) {
      globalManager.stop();
    }

    const manager = new LocalGameManager(playerName, comCount, {
      onGameStateUpdate: (state, myCards) => {
        setGameState(state);
        setMyHoleCards(myCards);
      },
      onHandResult: (result) => {
        setLastResult(result);
      },
      onShowdown: (cards) => {
        setShowdownCards(cards);
      },
      onNextHand: () => {
        setLastResult(null);
        setShowdownCards(new Map());
      },
      onHandHistoryEntry: (entry) => {
        addHandHistory(entry);
      },
    });

    globalManager = manager;
    setRoomInfo('practice', manager.getPlayerId(), playerName);
    setIsPracticeMode(true);

    // ゲーム開始
    manager.startGame();
  }, [setGameState, setMyHoleCards, setLastResult, setShowdownCards, setRoomInfo, setIsPracticeMode, addHandHistory]);

  const sendAction = useCallback((action: GameAction) => {
    if (globalManager) {
      globalManager.handlePlayerAction(action);
    }
  }, []);

  const stopGame = useCallback(() => {
    if (globalManager) {
      globalManager.stop();
      globalManager = null;
    }
    reset();
  }, [reset]);

  return {
    startPracticeGame,
    sendAction,
    stopGame,
  };
}
