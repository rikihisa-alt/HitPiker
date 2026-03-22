import { Card } from './card';
import { PlayerState, ClientPlayerState } from './player';

export type GamePhase =
  | 'waiting'
  | 'dealing'
  | 'preflop'
  | 'flop'
  | 'turn'
  | 'river'
  | 'showdown'
  | 'result';

export type ActionType =
  | 'fold'
  | 'check'
  | 'call'
  | 'bet'
  | 'raise'
  | 'all-in';

export interface GameAction {
  playerId: string;
  type: ActionType;
  amount?: number;
}

export interface PotState {
  main: number;
  sides: SidePot[];
}

export interface SidePot {
  amount: number;
  eligiblePlayerIds: string[];
}

export interface GameState {
  phase: GamePhase;
  players: PlayerState[];
  board: Card[];
  pot: PotState;
  currentPlayerIndex: number;
  dealerIndex: number;
  raiseCount: number;
  currentBet: number;
  minRaise: number;
  handNumber: number;
  lastAction: GameAction | null;
}

export interface ClientGameState extends Omit<GameState, 'players'> {
  players: ClientPlayerState[];
  availableActions: ActionType[];
}

export interface WinnerInfo {
  playerId: string;
  amount: number;
  handName: string;
}
