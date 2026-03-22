// ルーム管理
import { Room } from './room';
import { RoomConfig } from '../../../shared/types/room';

class RoomManager {
  private rooms: Map<string, Room> = new Map();
  private playerRoomMap: Map<string, string> = new Map(); // playerId → roomId
  private socketPlayerMap: Map<string, string> = new Map(); // socketId → playerId

  createRoom(config: RoomConfig, hostId: string): Room {
    const room = new Room(config, hostId);
    this.rooms.set(room.id, room);
    return room;
  }

  getRoom(roomId: string): Room | undefined {
    return this.rooms.get(roomId);
  }

  getRoomByPlayerId(playerId: string): Room | undefined {
    const roomId = this.playerRoomMap.get(playerId);
    if (!roomId) return undefined;
    return this.rooms.get(roomId);
  }

  joinRoom(roomId: string, playerId: string, playerName: string): { success: boolean; error?: string; seatIndex?: number } {
    const room = this.rooms.get(roomId);
    if (!room) return { success: false, error: 'Room not found' };

    const result = room.addPlayer(playerId, playerName);
    if (result.success) {
      this.playerRoomMap.set(playerId, roomId);
    }
    return { success: result.success, error: result.error, seatIndex: result.seatIndex };
  }

  leaveRoom(playerId: string): string | undefined {
    const roomId = this.playerRoomMap.get(playerId);
    if (!roomId) return undefined;

    const room = this.rooms.get(roomId);
    if (room) {
      room.removePlayer(playerId);
      if (room.players.length === 0) {
        this.rooms.delete(roomId);
      }
    }

    this.playerRoomMap.delete(playerId);
    return roomId;
  }

  registerSocket(socketId: string, playerId: string): void {
    this.socketPlayerMap.set(socketId, playerId);
  }

  unregisterSocket(socketId: string): string | undefined {
    const playerId = this.socketPlayerMap.get(socketId);
    this.socketPlayerMap.delete(socketId);
    return playerId;
  }

  getPlayerIdBySocketId(socketId: string): string | undefined {
    return this.socketPlayerMap.get(socketId);
  }

  getRoomList(): Array<{ id: string; name: string; playerCount: number; maxPlayers: number; gameInProgress: boolean }> {
    return Array.from(this.rooms.values()).map(room => ({
      id: room.id,
      name: room.config.name,
      playerCount: room.players.length,
      maxPlayers: room.config.maxPlayers,
      gameInProgress: room.gameState !== null && room.gameState.phase !== 'waiting',
    }));
  }
}

export const roomManager = new RoomManager();
