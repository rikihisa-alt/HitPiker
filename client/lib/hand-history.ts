// Hand history types and storage for practice mode
import { Card } from '../../shared/types/card';
import { ActionType, GamePhase } from '../../shared/types/game';

export interface HandHistoryAction {
  playerName: string;
  playerId: string;
  action: ActionType;
  amount?: number;
  phase: GamePhase;
}

export interface HandHistoryPlayer {
  playerId: string;
  playerName: string;
  actions: HandHistoryAction[];
  finalStack: number;
  folded: boolean;
}

export interface HandHistoryEntry {
  handNumber: number;
  timestamp: number;
  board: Card[];
  players: HandHistoryPlayer[];
  winners: { playerId: string; playerName: string; amount: number; handName: string }[];
  myHoleCards: Card[];
  myHandName: string;
  potTotal: number;
  myStartStack: number;
  myEndStack: number;
  myVPIP: boolean; // whether player voluntarily put money in pot (excluding BB)
}

const MAX_HISTORY = 50;

// Build a history entry from the completed hand data
export function createHandHistoryEntry(params: {
  handNumber: number;
  board: Card[];
  players: HandHistoryPlayer[];
  winners: { playerId: string; playerName: string; amount: number; handName: string }[];
  myHoleCards: Card[];
  myHandName: string;
  potTotal: number;
  myStartStack: number;
  myEndStack: number;
  myPlayerId: string;
  myIsBB: boolean;
}): HandHistoryEntry {
  // VPIP: voluntarily put money in pot (excludes forced BB)
  const myActions = params.players.find(p => p.playerId === params.myPlayerId)?.actions ?? [];
  const vpipActions: ActionType[] = ['call', 'bet', 'raise', 'all-in'];
  const preflopActions = myActions.filter(a => a.phase === 'preflop');
  const hasVPIP = preflopActions.some(a => vpipActions.includes(a.action));
  // If player is BB and only action was check, that's not VPIP
  const isOnlyBBCheck = params.myIsBB && preflopActions.length === 1 && preflopActions[0].action === 'check';
  const myVPIP = hasVPIP && !isOnlyBBCheck;

  return {
    handNumber: params.handNumber,
    timestamp: Date.now(),
    board: params.board,
    players: params.players,
    winners: params.winners,
    myHoleCards: params.myHoleCards,
    myHandName: params.myHandName,
    potTotal: params.potTotal,
    myStartStack: params.myStartStack,
    myEndStack: params.myEndStack,
    myVPIP,
  };
}

// Trim history to max size
export function trimHistory(history: HandHistoryEntry[]): HandHistoryEntry[] {
  if (history.length > MAX_HISTORY) {
    return history.slice(history.length - MAX_HISTORY);
  }
  return history;
}
