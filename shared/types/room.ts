import { ClientGameState } from './game';
import { ClientPlayerState } from './player';

export interface RoomConfig {
  name: string;
  maxPlayers: number;
  smallBlind: number;
  bigBlind: number;
  startingStack: number;
}

export interface RoomState {
  id: string;
  name: string;
  config: RoomConfig;
  hostId: string;
  players: RoomPlayerInfo[];
  gameInProgress: boolean;
  spectatorCount: number;
}

export interface RoomPlayerInfo {
  id: string;
  name: string;
  seatIndex: number;
  stack: number;
  ready: boolean;
  disconnected: boolean;
}

export interface JoinResult {
  success: boolean;
  playerId?: string;
  roomState?: RoomState;
  error?: string;
}
