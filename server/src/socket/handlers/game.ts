// ゲームハンドラー
import { Server, Socket } from 'socket.io';
import { ClientToServerEvents, ServerToClientEvents } from '../../../../shared/types/socket';
import { GameAction } from '../../../../shared/types/game';
import { roomManager } from '../../room/room-manager';
import {
  broadcastGameState,
  dealHoleCards,
  getSocketByPlayerId,
  sendAvailableActions,
} from '../emitter';
import { GAME_CONSTANTS } from '../../../../shared/constants/game';

type TypedServer = Server<ClientToServerEvents, ServerToClientEvents>;
type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents>;

export function registerGameHandlers(io: TypedServer, socket: TypedSocket): void {
  socket.on('game:start', () => {
    const playerId = roomManager.getPlayerIdBySocketId(socket.id);
    if (!playerId) {
      socket.emit('error', 'Not in a room');
      return;
    }

    const room = roomManager.getRoomByPlayerId(playerId);
    if (!room) {
      socket.emit('error', 'Room not found');
      return;
    }

    if (room.hostId !== playerId) {
      socket.emit('error', 'Only host can start the game');
      return;
    }

    const { events, error } = room.startGame();
    if (error) {
      socket.emit('error', error);
      return;
    }

    // イベント処理
    for (const event of events) {
      switch (event.type) {
        case 'deal_cards':
          // 各プレイヤーに自分の手札を送信
          const player = room.gameState?.players.find(p => p.id === event.playerId);
          if (player) {
            dealHoleCards(player);
          }
          break;
        case 'hit_revealed':
          io.to(room.id).emit('game:hitRevealed', {
            playerId: event.playerId,
            hitSource: event.hitSource,
            hitStreet: room.gameState?.phase ?? 'preflop',
          });
          break;
        case 'phase_changed':
          // game:stateで一括送信されるので個別処理不要
          break;
      }
    }

    // ゲーム状態を全員に送信
    if (room.gameState) {
      broadcastGameState(io, room.id, room.gameState);

      // 現在のプレイヤーに利用可能アクションを送信
      const currentPlayer = room.gameState.players[room.gameState.currentPlayerIndex];
      if (currentPlayer) {
        sendAvailableActions(room.gameState, currentPlayer.id);
      }
    }
  });

  socket.on('game:action', (action: GameAction) => {
    const playerId = roomManager.getPlayerIdBySocketId(socket.id);
    if (!playerId) {
      socket.emit('error', 'Not in a room');
      return;
    }

    // アクションのplayerIdが送信者と一致するか確認
    if (action.playerId !== playerId) {
      socket.emit('error', 'Player ID mismatch');
      return;
    }

    const room = roomManager.getRoomByPlayerId(playerId);
    if (!room) {
      socket.emit('error', 'Room not found');
      return;
    }

    if (!room.gameState) {
      socket.emit('error', 'No game in progress');
      return;
    }

    const { events, error } = room.handleAction(action);
    if (error) {
      socket.emit('error', error);
      return;
    }

    // イベント処理
    for (const event of events) {
      switch (event.type) {
        case 'player_action':
          io.to(room.id).emit('game:action', event.action);
          break;
        case 'hit_revealed':
          io.to(room.id).emit('game:hitRevealed', {
            playerId: event.playerId,
            hitSource: event.hitSource,
            hitStreet: room.gameState?.phase ?? 'preflop',
          });
          break;
        case 'hand_complete':
          io.to(room.id).emit('game:result', event.result);
          // 結果表示後に次のハンドへ
          setTimeout(() => {
            if (room.players.filter(p => p.stack > 0).length >= GAME_CONSTANTS.MIN_PLAYERS_TO_START) {
              const nextResult = room.nextHand();
              for (const ev of nextResult.events) {
                if (ev.type === 'deal_cards') {
                  const p = room.gameState?.players.find(pl => pl.id === ev.playerId);
                  if (p) dealHoleCards(p);
                }
              }
              if (room.gameState) {
                broadcastGameState(io, room.id, room.gameState);
                const cp = room.gameState.players[room.gameState.currentPlayerIndex];
                if (cp) sendAvailableActions(room.gameState, cp.id);
              }
            }
          }, GAME_CONSTANTS.RESULT_DISPLAY_MS);
          break;
        case 'showdown':
          // showdownはhand_completeに含まれるので個別通知不要
          break;
      }
    }

    // ゲーム状態を全員に送信
    if (room.gameState) {
      broadcastGameState(io, room.id, room.gameState);

      // 次のプレイヤーに利用可能アクションを送信
      if (room.gameState.phase !== 'result' && room.gameState.phase !== 'showdown') {
        const currentPlayer = room.gameState.players[room.gameState.currentPlayerIndex];
        if (currentPlayer && !currentPlayer.folded && !currentPlayer.allIn) {
          sendAvailableActions(room.gameState, currentPlayer.id);
        }
      }
    }
  });
}
