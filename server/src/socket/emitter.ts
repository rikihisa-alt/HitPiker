// サーバー→クライアント送信ヘルパー
import { Server, Socket } from 'socket.io';
import { GameState, ClientGameState, ActionType } from '../../../shared/types/game';
import { PlayerState, ClientPlayerState } from '../../../shared/types/player';
import { Card, HiddenCard } from '../../../shared/types/card';
import { ServerToClientEvents, ClientToServerEvents } from '../../../shared/types/socket';
import { getAvailableActions } from '../engine/bet-validator';

type TypedServer = Server<ClientToServerEvents, ServerToClientEvents>;
type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents>;

// socketId → Socket のマッピング
const socketMap = new Map<string, TypedSocket>();
// playerId → socketId のマッピング
const playerSocketMap = new Map<string, string>();

export function registerPlayerSocket(playerId: string, socket: TypedSocket): void {
  socketMap.set(socket.id, socket);
  playerSocketMap.set(playerId, socket.id);
}

export function unregisterPlayerSocket(socketId: string): void {
  for (const [playerId, sid] of playerSocketMap.entries()) {
    if (sid === socketId) {
      playerSocketMap.delete(playerId);
      break;
    }
  }
  socketMap.delete(socketId);
}

export function getSocketByPlayerId(playerId: string): TypedSocket | undefined {
  const socketId = playerSocketMap.get(playerId);
  if (!socketId) return undefined;
  return socketMap.get(socketId);
}

/**
 * ゲーム状態を全員に送信する（手札はマスクして送る）
 */
export function broadcastGameState(
  io: TypedServer,
  roomId: string,
  state: GameState
): void {
  state.players.forEach(player => {
    const socket = getSocketByPlayerId(player.id);
    if (!socket) return;

    const clientState = buildClientState(state, player.id);
    socket.emit('game:state', clientState);
  });

  // 観戦者にも送信（手札は全てhidden）
  io.to(`${roomId}:spectators`).emit('game:state', buildSpectatorState(state));
}

/**
 * 自分の手札のみ個別送信（配札時）
 */
export function dealHoleCards(player: PlayerState): void {
  const socket = getSocketByPlayerId(player.id);
  if (!socket) return;
  socket.emit('game:yourCards', player.holeCards);
}

/**
 * 利用可能アクションを送信
 */
export function sendAvailableActions(
  state: GameState,
  playerId: string
): void {
  const socket = getSocketByPlayerId(playerId);
  if (!socket) return;

  const player = state.players.find(p => p.id === playerId);
  if (!player) return;

  const actions = getAvailableActions(state, player);
  socket.emit('game:availableActions', actions);
}

/**
 * 対象プレイヤーの視点でゲーム状態を構築
 */
function buildClientState(state: GameState, selfId: string): ClientGameState {
  const player = state.players.find(p => p.id === selfId);
  const availableActions = player ? getAvailableActions(state, player) : [];

  return {
    phase: state.phase,
    players: state.players.map(p => buildClientPlayer(p, selfId)),
    board: state.board,
    pot: state.pot,
    currentPlayerIndex: state.currentPlayerIndex,
    dealerIndex: state.dealerIndex,
    raiseCount: state.raiseCount,
    currentBet: state.currentBet,
    minRaise: state.minRaise,
    handNumber: state.handNumber,
    lastAction: state.lastAction,
    availableActions,
  };
}

/**
 * 観戦者向けゲーム状態（全手札hidden）
 */
function buildSpectatorState(state: GameState): ClientGameState {
  return {
    phase: state.phase,
    players: state.players.map(p => buildClientPlayer(p, '__spectator__')),
    board: state.board,
    pot: state.pot,
    currentPlayerIndex: state.currentPlayerIndex,
    dealerIndex: state.dealerIndex,
    raiseCount: state.raiseCount,
    currentBet: state.currentBet,
    minRaise: state.minRaise,
    handNumber: state.handNumber,
    lastAction: state.lastAction,
    availableActions: [],
  };
}

function buildClientPlayer(player: PlayerState, selfId: string): ClientPlayerState {
  const hidden: HiddenCard[] = player.holeCards.map(() => ({ hidden: true as const }));

  return {
    id: player.id,
    seatIndex: player.seatIndex,
    name: player.name,
    stack: player.stack,
    currentBet: player.currentBet,
    totalBet: player.totalBet,
    folded: player.folded,
    allIn: player.allIn,
    disconnected: player.disconnected,
    isDealer: player.isDealer,
    isSB: player.isSB,
    isBB: player.isBB,
    lastAction: player.lastAction,
    hit: player.hit,
    holeCards: player.id === selfId ? player.holeCards : hidden,
  };
}
