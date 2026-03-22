// Roomクラス
import { v4 as uuidv4 } from 'uuid';
import { PlayerState, createDefaultHitState } from '../../../shared/types/player';
import { GameState, GameAction, ActionType } from '../../../shared/types/game';
import { RoomConfig, RoomState, RoomPlayerInfo } from '../../../shared/types/room';
import { GAME_CONSTANTS } from '../../../shared/constants/game';
import { DeckManager } from '../engine/deck';
import {
  createInitialGameState,
  startNewHand,
  applyAction,
  setBoardCards,
  prepareNextHand,
  GameEvent,
} from '../engine/game-engine';
import { getAvailableActions } from '../engine/bet-validator';
import { checkBoardHitForPlayer, forceRevealIfQualified } from '../engine/hit-detector';
import { Card } from '../../../shared/types/card';

export class Room {
  id: string;
  config: RoomConfig;
  hostId: string;
  players: PlayerState[];
  gameState: GameState | null;
  spectators: Set<string>;
  deck: DeckManager | null;
  disconnectTimeouts: Map<string, NodeJS.Timeout>;

  constructor(config: RoomConfig, hostId: string) {
    this.id = uuidv4().slice(0, 8);
    this.config = config;
    this.hostId = hostId;
    this.players = [];
    this.gameState = null;
    this.spectators = new Set();
    this.deck = null;
    this.disconnectTimeouts = new Map();
  }

  addPlayer(id: string, name: string): { success: boolean; seatIndex: number; error?: string } {
    if (this.players.length >= this.config.maxPlayers) {
      return { success: false, seatIndex: -1, error: 'Room is full' };
    }

    // 空いている席を探す
    const occupiedSeats = new Set(this.players.map(p => p.seatIndex));
    let seatIndex = -1;
    for (let i = 0; i < this.config.maxPlayers; i++) {
      if (!occupiedSeats.has(i)) {
        seatIndex = i;
        break;
      }
    }

    if (seatIndex === -1) {
      return { success: false, seatIndex: -1, error: 'No available seat' };
    }

    const player: PlayerState = {
      id,
      seatIndex,
      name,
      stack: this.config.startingStack,
      holeCards: [],
      currentBet: 0,
      totalBet: 0,
      folded: false,
      allIn: false,
      disconnected: false,
      isDealer: false,
      isSB: false,
      isBB: false,
      lastAction: null,
      hit: createDefaultHitState(),
    };

    this.players.push(player);
    return { success: true, seatIndex };
  }

  removePlayer(playerId: string): void {
    this.players = this.players.filter(p => p.id !== playerId);
    if (this.players.length > 0 && this.hostId === playerId) {
      this.hostId = this.players[0].id;
    }
  }

  startGame(): { events: GameEvent[]; error?: string } {
    if (this.players.length < GAME_CONSTANTS.MIN_PLAYERS_TO_START) {
      return { events: [], error: 'Not enough players' };
    }

    const dealerIndex = 0;
    this.gameState = createInitialGameState(this.players, dealerIndex, 0);
    this.deck = new DeckManager();

    const result = startNewHand(this.gameState);
    this.gameState = result.newState;

    // デッキを新たに作成してボード用に確保
    // (startNewHand内でカード配布はイベントとして返る)
    return { events: result.events };
  }

  handleAction(action: GameAction): { events: GameEvent[]; error?: string } {
    if (!this.gameState) {
      return { events: [], error: 'No game in progress' };
    }

    const result = applyAction(this.gameState, action);
    this.gameState = result.newState;

    // フェーズが変わった場合、ボードカードを追加
    const phaseEvent = result.events.find(e => e.type === 'phase_changed');
    if (phaseEvent && phaseEvent.type === 'phase_changed' && this.deck) {
      const boardResult = this.dealBoardCards(phaseEvent.phase);
      if (boardResult) {
        result.events.push(...boardResult.events);
      }
    }

    return { events: result.events };
  }

  private dealBoardCards(phase: string): { events: GameEvent[] } | null {
    if (!this.gameState || !this.deck) return null;
    const events: GameEvent[] = [];

    let cards: Card[] = [];
    switch (phase) {
      case 'flop':
        this.deck.burn();
        cards = this.deck.deal(3);
        break;
      case 'turn':
        this.deck.burn();
        cards = this.deck.deal(1);
        break;
      case 'river':
        this.deck.burn();
        cards = this.deck.deal(1);
        break;
      default:
        return null;
    }

    const boardResult = setBoardCards(this.gameState, cards);
    this.gameState = boardResult.newState;
    events.push(...boardResult.events);

    // ボードヒット後のHIT強制公開チェック（オールインプレイヤー）
    if (this.gameState) {
      for (let i = 0; i < this.gameState.players.length; i++) {
        const p = this.gameState.players[i];
        if (p.allIn && !p.folded) {
          const hit = forceRevealIfQualified(p);
          if (hit.hitRevealed && !p.hit.hitRevealed) {
            events.push({
              type: 'hit_revealed',
              playerId: p.id,
              hitSource: hit.hitSource!,
            });
            this.gameState.players[i] = { ...p, hit };
          }
        }
      }
    }

    return { events };
  }

  getAvailableActionsForPlayer(playerId: string): ActionType[] {
    if (!this.gameState) return [];
    const player = this.gameState.players.find(p => p.id === playerId);
    if (!player) return [];
    return getAvailableActions(this.gameState, player);
  }

  getRoomState(): RoomState {
    return {
      id: this.id,
      name: this.config.name,
      config: this.config,
      hostId: this.hostId,
      players: this.players.map(p => ({
        id: p.id,
        name: p.name,
        seatIndex: p.seatIndex,
        stack: p.stack,
        ready: true,
        disconnected: p.disconnected,
      })),
      gameInProgress: this.gameState !== null && this.gameState.phase !== 'waiting',
      spectatorCount: this.spectators.size,
    };
  }

  markDisconnected(playerId: string): void {
    const player = this.players.find(p => p.id === playerId);
    if (player) player.disconnected = true;
    if (this.gameState) {
      const gp = this.gameState.players.find(p => p.id === playerId);
      if (gp) gp.disconnected = true;
    }
  }

  markReconnected(playerId: string): void {
    const player = this.players.find(p => p.id === playerId);
    if (player) player.disconnected = false;
    if (this.gameState) {
      const gp = this.gameState.players.find(p => p.id === playerId);
      if (gp) gp.disconnected = false;
    }
  }

  nextHand(): { events: GameEvent[] } {
    if (!this.gameState) return { events: [] };

    // ディーラーを次に移動
    this.gameState = prepareNextHand(this.gameState);
    this.players = this.gameState.players;
    this.deck = new DeckManager();

    const result = startNewHand(this.gameState);
    this.gameState = result.newState;

    return { events: result.events };
  }
}
