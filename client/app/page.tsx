'use client';

import { useState, useCallback, useEffect } from 'react';
import { useSocket } from '../hooks/useSocket';
import { useSocketStore } from '../store/socket-store';
import { useGameStore } from '../store/game-store';
import { useRouter } from 'next/navigation';
import { GAME_CONSTANTS } from '../../shared/constants/game';

interface RoomListItem {
  id: string;
  name: string;
  playerCount: number;
  maxPlayers: number;
  gameInProgress: boolean;
}

export default function LobbyPage() {
  const router = useRouter();
  const { createRoom, joinRoom } = useSocket();
  const { connected, error, clearError } = useSocketStore();
  const [playerName, setPlayerName] = useState('');
  const [roomName, setRoomName] = useState('');
  const [joinRoomId, setJoinRoomId] = useState('');
  const [rooms, setRooms] = useState<RoomListItem[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  // ルーム一覧取得
  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL ?? 'http://localhost:3001'}/api/rooms`);
        if (res.ok) {
          const data = await res.json();
          setRooms(data);
        }
      } catch {
        // サーバー未起動時は無視
      }
    };

    fetchRooms();
    const interval = setInterval(fetchRooms, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleCreate = useCallback(async () => {
    if (!playerName.trim()) return;
    setIsCreating(true);
    clearError();

    try {
      const roomId = await createRoom({
        name: roomName.trim() || `${playerName}'s Room`,
        maxPlayers: GAME_CONSTANTS.MAX_PLAYERS,
        smallBlind: GAME_CONSTANTS.SMALL_BLIND,
        bigBlind: GAME_CONSTANTS.BIG_BLIND,
        startingStack: GAME_CONSTANTS.STARTING_STACK,
      }, playerName.trim());

      router.push(`/room/${roomId}`);
    } catch (e) {
      console.error('Failed to create room', e);
    } finally {
      setIsCreating(false);
    }
  }, [playerName, roomName, createRoom, router, clearError]);

  const handleJoin = useCallback(async (roomId?: string) => {
    if (!playerName.trim()) return;
    const targetId = roomId ?? joinRoomId.trim();
    if (!targetId) return;

    setIsJoining(true);
    clearError();

    try {
      await joinRoom(targetId, playerName.trim());
      router.push(`/room/${targetId}`);
    } catch (e) {
      console.error('Failed to join room', e);
    } finally {
      setIsJoining(false);
    }
  }, [playerName, joinRoomId, joinRoom, router, clearError]);

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-text tracking-tight">
            <span className="text-primary font-extrabold">HIT</span> POKER
          </h1>
          <p className="text-text-sub text-sm mt-1">Texas Hold&apos;em with HIT Rules</p>
        </div>

        {/* Connection status */}
        <div className="flex items-center gap-2 mb-6">
          <div
            className={`w-1.5 h-1.5 rounded-full ${
              connected ? 'bg-positive' : 'bg-danger'
            }`}
          />
          <span className="text-xs text-text-sub">
            {connected ? 'Connected' : 'Connecting...'}
          </span>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 panel p-3 bg-danger-soft border-danger/30 text-danger text-sm text-center">
            {error}
          </div>
        )}

        {/* Practice section */}
        <div className="panel p-4 mb-6">
          <h2 className="text-sm font-semibold text-text mb-1">Practice</h2>
          <p className="text-xs text-text-sub mb-3">
            Play against COM players -- no server required
          </p>
          <button
            onClick={() => router.push('/practice')}
            className="btn btn-primary w-full py-2.5 text-sm"
          >
            Start Practice
          </button>
        </div>

        {/* Separator */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 border-t border-border" />
          <span className="text-text-sub text-xs">Online</span>
          <div className="flex-1 border-t border-border" />
        </div>

        {/* Player name */}
        <div className="mb-5">
          <label className="block text-text-sub text-xs mb-1.5 font-medium">
            Player Name
          </label>
          <input
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="Enter your name"
            maxLength={20}
            className="input"
          />
        </div>

        {/* Create room */}
        <div className="panel p-4 mb-3">
          <h2 className="text-sm font-semibold text-text mb-3">Create Room</h2>
          <input
            type="text"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            placeholder="Room name (optional)"
            maxLength={30}
            className="input mb-3"
          />
          <button
            onClick={handleCreate}
            disabled={!playerName.trim() || isCreating || !connected}
            className="btn btn-primary w-full py-2.5 text-sm"
          >
            {isCreating ? 'Creating...' : 'Create Room'}
          </button>
        </div>

        {/* Join room */}
        <div className="panel p-4 mb-3">
          <h2 className="text-sm font-semibold text-text mb-3">Join Room</h2>
          <div className="flex gap-2">
            <input
              type="text"
              value={joinRoomId}
              onChange={(e) => setJoinRoomId(e.target.value)}
              placeholder="Room ID"
              maxLength={20}
              className="input flex-1"
            />
            <button
              onClick={() => handleJoin()}
              disabled={!playerName.trim() || !joinRoomId.trim() || isJoining || !connected}
              className="btn btn-primary px-5 py-2.5 text-sm shrink-0"
            >
              {isJoining ? '...' : 'Join'}
            </button>
          </div>
        </div>

        {/* Room list */}
        {rooms.length > 0 && (
          <div className="panel p-4">
            <h2 className="text-sm font-semibold text-text mb-3">Open Rooms</h2>
            <div className="max-h-48 overflow-y-auto">
              {rooms.map((room) => (
                <div
                  key={room.id}
                  className="flex items-center justify-between py-2.5 border-b border-border-subtle last:border-b-0"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-text truncate">{room.name}</div>
                    <div className="text-xs text-text-sub">
                      {room.playerCount}/{room.maxPlayers} players
                      {room.gameInProgress && (
                        <span className="text-caution ml-2">In Progress</span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleJoin(room.id)}
                    disabled={!playerName.trim() || room.playerCount >= room.maxPlayers || !connected}
                    className="btn btn-ghost px-3 py-1.5 text-xs ml-3 shrink-0"
                  >
                    Join
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
