import { Card, ClientCard } from './card';
import { ActionType } from './game';

export interface PlayerHitState {
  hitQualified: boolean;
  hitRevealed: boolean;
  hitSource: 'pocket' | 'board' | null;
  hitStreet: 'preflop' | 'flop' | 'turn' | 'river' | null;
  mustShowIfNotFolded: boolean;
}

export interface PlayerState {
  id: string;
  seatIndex: number; // 0-5
  name: string;
  stack: number;
  holeCards: Card[];
  currentBet: number;
  totalBet: number;
  folded: boolean;
  allIn: boolean;
  disconnected: boolean;
  isDealer: boolean;
  isSB: boolean;
  isBB: boolean;
  lastAction: ActionType | null;
  hit: PlayerHitState;
}

export interface ClientPlayerState extends Omit<PlayerState, 'holeCards'> {
  holeCards: ClientCard[];
}

export function createDefaultHitState(): PlayerHitState {
  return {
    hitQualified: false,
    hitRevealed: false,
    hitSource: null,
    hitStreet: null,
    mustShowIfNotFolded: false,
  };
}
