'use client';

import { create } from 'zustand';
import { Card } from '../../shared/types/card';
import { ClientGameState, ActionType, GamePhase } from '../../shared/types/game';
import { ClientPlayerState } from '../../shared/types/player';
import { ChatMessage, HandResult } from '../../shared/types/socket';

interface GameStore {
  gameState: ClientGameState | null;
  myHoleCards: Card[];
  availableActions: ActionType[];
  roomId: string | null;
  playerId: string | null;
  playerName: string | null;
  chatMessages: ChatMessage[];
  lastResult: HandResult | null;

  // ベットUI状態
  betMode: boolean;
  betAmount: number;

  // アクション
  setGameState: (state: ClientGameState) => void;
  setMyHoleCards: (cards: Card[]) => void;
  setAvailableActions: (actions: ActionType[]) => void;
  setBetAmount: (amount: number) => void;
  toggleBetMode: () => void;
  setBetMode: (mode: boolean) => void;
  setRoomInfo: (roomId: string, playerId: string, name: string) => void;
  addChatMessage: (msg: ChatMessage) => void;
  setLastResult: (result: HandResult | null) => void;
  reset: () => void;
}

export const useGameStore = create<GameStore>((set) => ({
  gameState: null,
  myHoleCards: [],
  availableActions: [],
  roomId: null,
  playerId: null,
  playerName: null,
  chatMessages: [],
  lastResult: null,
  betMode: false,
  betAmount: 0,

  setGameState: (state) => set({
    gameState: state,
    availableActions: state.availableActions,
  }),
  setMyHoleCards: (cards) => set({ myHoleCards: cards }),
  setAvailableActions: (actions) => set({ availableActions: actions }),
  setBetAmount: (amount) => set({ betAmount: amount }),
  toggleBetMode: () => set((s) => ({ betMode: !s.betMode })),
  setBetMode: (mode) => set({ betMode: mode }),
  setRoomInfo: (roomId, playerId, name) => set({ roomId, playerId, playerName: name }),
  addChatMessage: (msg) => set((s) => ({
    chatMessages: [...s.chatMessages.slice(-99), msg],
  })),
  setLastResult: (result) => set({ lastResult: result }),
  reset: () => set({
    gameState: null,
    myHoleCards: [],
    availableActions: [],
    roomId: null,
    playerId: null,
    playerName: null,
    chatMessages: [],
    lastResult: null,
    betMode: false,
    betAmount: 0,
  }),
}));

// セレクタ
export const useMyPlayer = (): ClientPlayerState | null =>
  useGameStore((s) => {
    if (!s.gameState || !s.playerId) return null;
    return s.gameState.players.find((p) => p.id === s.playerId) ?? null;
  });

export const useIsMyTurn = (): boolean =>
  useGameStore((s) => {
    if (!s.gameState || !s.playerId) return false;
    const current = s.gameState.players[s.gameState.currentPlayerIndex];
    return current?.id === s.playerId;
  });

export const useCurrentPhase = (): GamePhase =>
  useGameStore((s) => s.gameState?.phase ?? 'waiting');

export const usePotTotal = (): number =>
  useGameStore((s) => {
    if (!s.gameState) return 0;
    const { pot } = s.gameState;
    return pot.main + pot.sides.reduce((sum, sp) => sum + sp.amount, 0);
  });
