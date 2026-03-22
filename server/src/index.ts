// サーバーエントリーポイント
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { ClientToServerEvents, ServerToClientEvents } from '../../shared/types/socket';
import { GameAction } from '../../shared/types/game';
import { roomManager } from './room/room-manager';
import { registerRoomHandlers } from './socket/handlers/room';
import { registerGameHandlers } from './socket/handlers/game';
import { registerChatHandlers } from './socket/handlers/chat';
import {
  registerPlayerSocket,
  unregisterPlayerSocket,
  broadcastGameState,
  getSocketByPlayerId,
} from './socket/emitter';
import { GAME_CONSTANTS } from '../../shared/constants/game';

const app = express();
app.use(cors());

const httpServer = createServer(app);

const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL ?? 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

io.on('connection', (socket) => {
  console.log(`Connected: ${socket.id}`);

  // ハンドラー登録
  registerRoomHandlers(io, socket);
  registerGameHandlers(io, socket);
  registerChatHandlers(io, socket);

  // 再接続ハンドラー
  socket.on('reconnect:restore', ({ roomId, playerId }) => {
    const room = roomManager.getRoom(roomId);
    if (!room) {
      socket.emit('error', 'Room not found');
      return;
    }

    const player = room.players.find(p => p.id === playerId);
    if (!player) {
      socket.emit('error', 'Player not found');
      return;
    }

    // タイムアウトキャンセル
    const timeout = room.disconnectTimeouts.get(playerId);
    if (timeout) {
      clearTimeout(timeout);
      room.disconnectTimeouts.delete(playerId);
    }

    room.markReconnected(playerId);
    roomManager.registerSocket(socket.id, playerId);
    registerPlayerSocket(playerId, socket);
    socket.join(roomId);

    // 現在の状態を再送信
    socket.emit('room:state', room.getRoomState());
    if (room.gameState) {
      broadcastGameState(io, roomId, room.gameState);
      socket.emit('game:yourCards', player.holeCards);
    }

    io.to(roomId).emit('player:reconnected', playerId);
  });

  // 切断ハンドラー
  socket.on('disconnect', () => {
    console.log(`Disconnected: ${socket.id}`);

    const playerId = roomManager.getPlayerIdBySocketId(socket.id);
    if (!playerId) {
      unregisterPlayerSocket(socket.id);
      return;
    }

    const room = roomManager.getRoomByPlayerId(playerId);
    if (!room) {
      roomManager.unregisterSocket(socket.id);
      unregisterPlayerSocket(socket.id);
      return;
    }

    room.markDisconnected(playerId);
    io.to(room.id).emit('player:disconnected', playerId);

    // 30秒後にオートフォールド
    const timeout = setTimeout(() => {
      if (!room.gameState) return;

      const currentPlayer = room.gameState.players[room.gameState.currentPlayerIndex];
      if (currentPlayer?.id === playerId) {
        const canCheck = room.gameState.currentBet === currentPlayer.currentBet;
        const autoAction: GameAction = {
          playerId,
          type: canCheck ? 'check' : 'fold',
        };

        const { events } = room.handleAction(autoAction);
        if (room.gameState) {
          broadcastGameState(io, room.id, room.gameState);
        }
      }

      room.disconnectTimeouts.delete(playerId);
    }, GAME_CONSTANTS.DISCONNECT_TIMEOUT_MS);

    room.disconnectTimeouts.set(playerId, timeout);

    roomManager.unregisterSocket(socket.id);
    unregisterPlayerSocket(socket.id);
  });
});

// ヘルスチェック
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// ルーム一覧API
app.get('/api/rooms', (_req, res) => {
  res.json(roomManager.getRoomList());
});

const PORT = process.env.PORT ?? 3001;
httpServer.listen(PORT, () => {
  console.log(`Hit Poker server running on port ${PORT}`);
});
