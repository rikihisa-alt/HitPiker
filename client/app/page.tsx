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
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* ロゴ */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-black tracking-tight bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 bg-clip-text text-transparent">
            Hit Poker
          </h1>
          <p className="text-gray-500 text-sm mt-2">Texas Hold&apos;em with HIT Rules</p>
        </div>

        {/* 接続状態 */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-xs text-gray-500">
            {connected ? 'Connected' : 'Connecting...'}
          </span>
        </div>

        {/* エラー表示 */}
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-900/30 border border-red-700 text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        {/* プレイヤー名 */}
        <div className="mb-6">
          <label className="block text-gray-400 text-xs mb-1 font-semibold uppercase tracking-wider">
            Player Name
          </label>
          <input
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="Enter your name"
            maxLength={20}
            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white
              placeholder-gray-600 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/50
              text-sm"
          />
        </div>

        {/* ルーム作成 */}
        <div className="bg-gray-800/50 rounded-2xl p-5 mb-4 border border-gray-700/50">
          <h2 className="text-sm font-bold text-gray-300 mb-3 uppercase tracking-wider">Create Room</h2>
          <input
            type="text"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            placeholder="Room name (optional)"
            maxLength={30}
            className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white
              placeholder-gray-600 focus:border-amber-500 focus:outline-none text-sm mb-3"
          />
          <button
            onClick={handleCreate}
            disabled={!playerName.trim() || isCreating || !connected}
            className="w-full py-3 rounded-xl font-bold text-sm
              bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500
              text-white border border-amber-500 transition-all active:scale-[0.98]
              disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isCreating ? 'Creating...' : 'Create Room'}
          </button>
        </div>

        {/* ルーム参加（ID入力） */}
        <div className="bg-gray-800/50 rounded-2xl p-5 mb-4 border border-gray-700/50">
          <h2 className="text-sm font-bold text-gray-300 mb-3 uppercase tracking-wider">Join Room</h2>
          <div className="flex gap-2">
            <input
              type="text"
              value={joinRoomId}
              onChange={(e) => setJoinRoomId(e.target.value)}
              placeholder="Room ID"
              maxLength={20}
              className="flex-1 px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white
                placeholder-gray-600 focus:border-blue-500 focus:outline-none text-sm"
            />
            <button
              onClick={() => handleJoin()}
              disabled={!playerName.trim() || !joinRoomId.trim() || isJoining || !connected}
              className="px-6 py-2.5 rounded-xl font-bold text-sm
                bg-blue-600 hover:bg-blue-500 text-white border border-blue-500
                transition-all active:scale-95
                disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isJoining ? '...' : 'Join'}
            </button>
          </div>
        </div>

        {/* ルーム一覧 */}
        {rooms.length > 0 && (
          <div className="bg-gray-800/50 rounded-2xl p-5 border border-gray-700/50">
            <h2 className="text-sm font-bold text-gray-300 mb-3 uppercase tracking-wider">Open Rooms</h2>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {rooms.map((room) => (
                <div
                  key={room.id}
                  className="flex items-center justify-between p-3 bg-gray-800 rounded-lg border border-gray-700"
                >
                  <div>
                    <div className="text-sm font-semibold text-gray-200">{room.name}</div>
                    <div className="text-xs text-gray-500">
                      {room.playerCount}/{room.maxPlayers} players
                      {room.gameInProgress && <span className="text-amber-500 ml-2">In Progress</span>}
                    </div>
                  </div>
                  <button
                    onClick={() => handleJoin(room.id)}
                    disabled={!playerName.trim() || room.playerCount >= room.maxPlayers || !connected}
                    className="px-4 py-1.5 rounded-lg text-xs font-bold
                      bg-green-600 hover:bg-green-500 text-white
                      disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
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
