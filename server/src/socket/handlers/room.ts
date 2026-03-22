// ルームハンドラー
import { Server, Socket } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import { ClientToServerEvents, ServerToClientEvents } from '../../../../shared/types/socket';
import { RoomConfig, JoinResult } from '../../../../shared/types/room';
import { roomManager } from '../../room/room-manager';
import { registerPlayerSocket } from '../emitter';

type TypedServer = Server<ClientToServerEvents, ServerToClientEvents>;
type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents>;

export function registerRoomHandlers(io: TypedServer, socket: TypedSocket): void {
  socket.on('room:create', (config: RoomConfig, cb) => {
    const playerId = uuidv4();
    const room = roomManager.createRoom(config, playerId);

    // ホスト自身を参加させる
    const joinResult = roomManager.joinRoom(room.id, playerId, 'Host');
    if (!joinResult.success) {
      cb('');
      return;
    }

    roomManager.registerSocket(socket.id, playerId);
    registerPlayerSocket(playerId, socket);
    socket.join(room.id);

    socket.emit('room:state', room.getRoomState());
    cb(room.id);
  });

  socket.on('room:join', (payload, cb) => {
    const { roomId, playerName } = payload;
    const playerId = uuidv4();

    const result = roomManager.joinRoom(roomId, playerId, playerName);
    if (!result.success) {
      const joinResult: JoinResult = { success: false, error: result.error };
      cb(joinResult);
      return;
    }

    roomManager.registerSocket(socket.id, playerId);
    registerPlayerSocket(playerId, socket);
    socket.join(roomId);

    const room = roomManager.getRoom(roomId)!;
    const roomState = room.getRoomState();

    // 全員にルーム状態を通知
    io.to(roomId).emit('room:state', roomState);

    const joinResult: JoinResult = {
      success: true,
      playerId,
      roomState,
    };
    cb(joinResult);
  });

  socket.on('room:leave', () => {
    const playerId = roomManager.getPlayerIdBySocketId(socket.id);
    if (!playerId) return;

    const roomId = roomManager.leaveRoom(playerId);
    if (roomId) {
      socket.leave(roomId);
      const room = roomManager.getRoom(roomId);
      if (room) {
        io.to(roomId).emit('room:state', room.getRoomState());
      }
    }

    roomManager.unregisterSocket(socket.id);
  });
}
