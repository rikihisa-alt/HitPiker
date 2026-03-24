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
  const [activeTab, setActiveTab] = useState<'practice' | 'online'>('practice');

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL ?? 'http://localhost:3001'}/api/rooms`);
        if (res.ok) {
          const data = await res.json();
          setRooms(data);
        }
      } catch { /* server not running */ }
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
    } catch (e) { console.error('Failed to create room', e); }
    finally { setIsCreating(false); }
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
    } catch (e) { console.error('Failed to join room', e); }
    finally { setIsJoining(false); }
  }, [playerName, joinRoomId, joinRoom, router, clearError]);

  return (
    <div className="min-h-screen bg-[#0e1117] flex flex-col">
      {/* Hero header */}
      <header className="relative overflow-hidden">
        {/* Subtle gradient glow */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#141a2e] to-transparent opacity-80" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary/[0.04] rounded-full blur-[100px]" />

        <div className="relative max-w-2xl mx-auto px-6 pt-16 pb-10 text-center">
          {/* Logo */}
          <div className="inline-flex items-baseline gap-1.5 mb-3">
            <span className="text-4xl sm:text-5xl font-black tracking-tight text-white">HIT</span>
            <span className="text-4xl sm:text-5xl font-light tracking-tight text-text-sub">POKER</span>
          </div>
          <p className="text-text-sub text-sm max-w-xs mx-auto leading-relaxed">
            Texas Hold&apos;em with HIT Rules
          </p>

          {/* Connection indicator */}
          <div className="inline-flex items-center gap-1.5 mt-5 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.06]">
            <span className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-positive' : 'bg-danger animate-pulse'}`} />
            <span className="text-[11px] text-text-sub">
              {connected ? 'Server Connected' : 'Connecting...'}
            </span>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 max-w-lg mx-auto w-full px-5 pb-12 -mt-2">
        {/* Error toast */}
        {error && (
          <div className="mb-4 px-4 py-2.5 rounded-lg bg-danger/10 border border-danger/20 text-danger text-sm text-center">
            {error}
          </div>
        )}

        {/* Tab switcher */}
        <div className="flex rounded-xl bg-[#161a24] border border-white/[0.06] p-1 mb-6">
          <button
            onClick={() => setActiveTab('practice')}
            className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all duration-150
              ${activeTab === 'practice'
                ? 'bg-white/[0.08] text-white shadow-sm'
                : 'text-text-sub hover:text-text'}`}
          >
            Practice
          </button>
          <button
            onClick={() => setActiveTab('online')}
            className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all duration-150
              ${activeTab === 'online'
                ? 'bg-white/[0.08] text-white shadow-sm'
                : 'text-text-sub hover:text-text'}`}
          >
            Online
          </button>
        </div>

        {/* Practice tab */}
        {activeTab === 'practice' && (
          <div className="space-y-4 animate-fade-in">
            <div className="rounded-xl bg-[#161a24] border border-white/[0.06] p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-[15px] font-semibold text-white">Quick Practice</h2>
                  <p className="text-xs text-text-sub">Play against AI — no connection needed</p>
                </div>
              </div>

              <button
                onClick={() => router.push('/practice')}
                className="w-full py-3 rounded-lg text-sm font-semibold text-white
                  bg-gradient-to-r from-primary to-[#3d72d9]
                  hover:brightness-110 active:scale-[0.98] transition-all"
              >
                Start Practice Game
              </button>
            </div>

            {/* Game info card */}
            <div className="rounded-xl bg-[#161a24] border border-white/[0.06] p-4">
              <h3 className="text-xs font-medium text-text-sub uppercase tracking-wider mb-3">Game Info</h3>
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center">
                  <div className="chip-amt text-lg font-bold text-white">50/100</div>
                  <div className="text-[10px] text-text-muted mt-0.5">Blinds</div>
                </div>
                <div className="text-center">
                  <div className="chip-amt text-lg font-bold text-white">10K</div>
                  <div className="text-[10px] text-text-muted mt-0.5">Stack</div>
                </div>
                <div className="text-center">
                  <div className="chip-amt text-lg font-bold text-white">6</div>
                  <div className="text-[10px] text-text-muted mt-0.5">Max Players</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Online tab */}
        {activeTab === 'online' && (
          <div className="space-y-4 animate-fade-in">
            {/* Player name */}
            <div>
              <label className="block text-xs font-medium text-text-sub mb-1.5">Player Name</label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Enter your name"
                maxLength={20}
                className="w-full px-3.5 py-2.5 rounded-lg bg-[#161a24] border border-white/[0.08]
                  text-white text-sm placeholder:text-text-muted
                  focus:border-primary/50 focus:ring-1 focus:ring-primary/20 focus:outline-none
                  transition-all"
              />
            </div>

            {/* Create room */}
            <div className="rounded-xl bg-[#161a24] border border-white/[0.06] p-4">
              <h2 className="text-sm font-semibold text-white mb-3">Create Room</h2>
              <input
                type="text"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                placeholder="Room name (optional)"
                maxLength={30}
                className="w-full px-3.5 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08]
                  text-white text-sm placeholder:text-text-muted mb-3
                  focus:border-primary/50 focus:ring-1 focus:ring-primary/20 focus:outline-none transition-all"
              />
              <button
                onClick={handleCreate}
                disabled={!playerName.trim() || isCreating || !connected}
                className="w-full py-2.5 rounded-lg text-sm font-semibold
                  bg-primary text-white hover:brightness-110 active:scale-[0.98]
                  disabled:opacity-40 disabled:pointer-events-none transition-all"
              >
                {isCreating ? 'Creating...' : 'Create Room'}
              </button>
            </div>

            {/* Join room */}
            <div className="rounded-xl bg-[#161a24] border border-white/[0.06] p-4">
              <h2 className="text-sm font-semibold text-white mb-3">Join Room</h2>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={joinRoomId}
                  onChange={(e) => setJoinRoomId(e.target.value)}
                  placeholder="Room ID"
                  maxLength={20}
                  className="flex-1 px-3.5 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08]
                    text-white text-sm placeholder:text-text-muted
                    focus:border-primary/50 focus:ring-1 focus:ring-primary/20 focus:outline-none transition-all"
                />
                <button
                  onClick={() => handleJoin()}
                  disabled={!playerName.trim() || !joinRoomId.trim() || isJoining || !connected}
                  className="px-6 py-2.5 rounded-lg text-sm font-semibold shrink-0
                    bg-primary text-white hover:brightness-110 active:scale-[0.98]
                    disabled:opacity-40 disabled:pointer-events-none transition-all"
                >
                  {isJoining ? '...' : 'Join'}
                </button>
              </div>
            </div>

            {/* Room list */}
            {rooms.length > 0 && (
              <div className="rounded-xl bg-[#161a24] border border-white/[0.06] p-4">
                <h2 className="text-xs font-medium text-text-sub uppercase tracking-wider mb-3">Open Rooms</h2>
                <div className="max-h-52 overflow-y-auto space-y-1">
                  {rooms.map((room) => (
                    <div
                      key={room.id}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-white/[0.03] transition-colors"
                    >
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-white truncate">{room.name}</div>
                        <div className="text-[11px] text-text-sub">
                          {room.playerCount}/{room.maxPlayers} players
                          {room.gameInProgress && (
                            <span className="text-caution ml-1.5">Playing</span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleJoin(room.id)}
                        disabled={!playerName.trim() || room.playerCount >= room.maxPlayers || !connected}
                        className="px-4 py-1.5 rounded-lg text-xs font-semibold shrink-0 ml-3
                          bg-white/[0.06] text-text-sub border border-white/[0.08]
                          hover:bg-white/[0.1] hover:text-white
                          disabled:opacity-30 disabled:pointer-events-none transition-all"
                      >
                        Join
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="mt-10 text-center">
          <p className="text-[10px] text-text-muted">
            Hit Poker v1.0 — Texas Hold&apos;em with HIT Rules
          </p>
        </div>
      </main>
    </div>
  );
}
