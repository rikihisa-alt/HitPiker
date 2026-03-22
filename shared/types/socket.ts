import { Card } from './card';
import { GameAction, ActionType, ClientGameState, GamePhase, WinnerInfo } from './game';
import { RoomConfig, RoomState, JoinResult } from './room';

export interface HitRevealedPayload {
  playerId: string;
  hitSource: 'pocket' | 'board';
  hitStreet: GamePhase;
}

export interface ShowdownInfo {
  playerId: string;
  holeCards: Card[];
  handName: string;
  mustShow: boolean;
}

export interface HandResult {
  winners: WinnerInfo[];
  showdown: ShowdownInfo[];
  pot: number;
}

export interface ChatMessage {
  playerId: string;
  playerName: string;
  text: string;
  timestamp: number;
}

// Client → Server
export interface ClientToServerEvents {
  'room:create': (config: RoomConfig, cb: (roomId: string) => void) => void;
  'room:join': (payload: { roomId: string; playerName: string }, cb: (result: JoinResult) => void) => void;
  'room:leave': () => void;
  'game:start': () => void;
  'game:action': (action: GameAction) => void;
  'chat:message': (text: string) => void;
  'reconnect:restore': (payload: { roomId: string; playerId: string }) => void;
}

// Server → Client
export interface ServerToClientEvents {
  'room:state': (state: RoomState) => void;
  'game:state': (state: ClientGameState) => void;
  'game:yourCards': (cards: Card[]) => void;
  'game:hitRevealed': (payload: HitRevealedPayload) => void;
  'game:availableActions': (actions: ActionType[]) => void;
  'game:action': (action: GameAction & { playerName: string }) => void;
  'game:result': (result: HandResult) => void;
  'chat:message': (payload: ChatMessage) => void;
  'player:disconnected': (playerId: string) => void;
  'player:reconnected': (playerId: string) => void;
  'error': (message: string) => void;
}
