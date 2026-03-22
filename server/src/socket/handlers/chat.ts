// チャットハンドラー
import { Server, Socket } from 'socket.io';
import { ClientToServerEvents, ServerToClientEvents } from '../../../../shared/types/socket';
import { roomManager } from '../../room/room-manager';

type TypedServer = Server<ClientToServerEvents, ServerToClientEvents>;
type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents>;

export function registerChatHandlers(io: TypedServer, socket: TypedSocket): void {
  socket.on('chat:message', (text: string) => {
    const playerId = roomManager.getPlayerIdBySocketId(socket.id);
    if (!playerId) return;

    const room = roomManager.getRoomByPlayerId(playerId);
    if (!room) return;

    const player = room.players.find(p => p.id === playerId);
    if (!player) return;

    // テキストをサニタイズ
    const sanitizedText = text.trim().slice(0, 200);
    if (!sanitizedText) return;

    io.to(room.id).emit('chat:message', {
      playerId: player.id,
      playerName: player.name,
      text: sanitizedText,
      timestamp: Date.now(),
    });
  });
}
