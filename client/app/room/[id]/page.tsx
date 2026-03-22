'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSocket } from '../../../hooks/useSocket';
import { useLocalGame } from '../../../hooks/useLocalGame';
import { useGameStore } from '../../../store/game-store';
import { useSocketStore } from '../../../store/socket-store';
import PokerTable from '../../../components/table/PokerTable';
import ActionPanel from '../../../components/action/ActionPanel';
import ChatPanel from '../../../components/chat/ChatPanel';

export default function RoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.id as string;
  const isPracticeMode = useGameStore((s) => s.isPracticeMode);
  const { startGame, leaveRoom } = useSocket();
  const { stopGame } = useLocalGame();
  const { roomState } = useSocketStore();
  const playerId = useGameStore((s) => s.playerId);
  const gameState = useGameStore((s) => s.gameState);
  const lastResult = useGameStore((s) => s.lastResult);

  useEffect(() => {
    if (!roomId) {
      router.push('/');
    }
    if (isPracticeMode && roomId !== 'practice') {
      router.push('/');
    }
  }, [roomId, router, isPracticeMode]);

  const isHost = roomState?.hostId === playerId;
  const playerCount = isPracticeMode
    ? (gameState?.players.length ?? 0)
    : (roomState?.players.length ?? 0);
  const canStart = !isPracticeMode && isHost && playerCount >= 2 && !roomState?.gameInProgress;

  const handleLeave = () => {
    if (isPracticeMode) {
      stopGame();
    } else {
      leaveRoom();
    }
    router.push('/');
  };

  const roomName = isPracticeMode
    ? 'Practice Mode'
    : (roomState?.name ?? 'Loading...');

  return (
    <div className="h-screen w-screen bg-surface-0 overflow-hidden relative">
      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-4 py-2
        bg-surface-0/90 backdrop-blur-sm border-b border-border-subtle">
        <div className="flex items-center gap-3">
          <button
            onClick={handleLeave}
            className="text-text-tertiary hover:text-text-primary text-sm transition-colors"
          >
            &larr; Leave
          </button>
          <span className="text-border text-xs">|</span>
          <span className="text-text-primary font-medium text-sm">
            {roomName}
          </span>
          {isPracticeMode && (
            <span className="bg-primary-muted text-primary text-[10px] font-medium px-2 py-0.5 rounded-full">
              vs COM
            </span>
          )}
          {!isPracticeMode && (
            <span className="text-text-tertiary text-xs font-mono">
              ID: {roomId}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <span className="text-text-tertiary text-xs">
            {playerCount} players
          </span>
          {gameState && (
            <span className="text-text-tertiary text-xs">
              Hand #{gameState.handNumber}
            </span>
          )}
          {canStart && (
            <button
              onClick={startGame}
              className="btn btn-positive px-4 py-1.5 text-xs"
            >
              Start Game
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="absolute inset-0 pt-12">
        <PokerTable />
      </div>

      {/* Action panel */}
      <ActionPanel />

      {/* Chat (online only) */}
      {!isPracticeMode && <ChatPanel />}

      {/* Lightweight result banner (no overlay, no blocking) */}
      {lastResult && gameState?.phase === 'result' && (
        <div className="absolute top-12 left-1/2 -translate-x-1/2 z-30 animate-slide-up">
          <div className="bg-surface-1/95 backdrop-blur-sm border border-border rounded-lg shadow-lg px-4 py-2.5 flex items-center gap-3">
            {lastResult.winners.map((w, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <span className="text-text-primary font-medium">
                  {gameState.players.find(p => p.id === w.playerId)?.name ?? '?'}
                </span>
                <span className="text-positive font-mono font-bold">
                  +{w.amount.toLocaleString()}
                </span>
                <span className="text-text-tertiary text-xs">
                  {w.handName}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Waiting screen (online mode only) */}
      {!isPracticeMode && !gameState && roomState && (
        <div className="absolute inset-0 pt-12 flex items-center justify-center">
          <div className="text-center">
            <div className="text-text-secondary text-base mb-2">Waiting for players...</div>
            <div className="text-text-tertiary text-sm">
              {playerCount}/{roomState.config.maxPlayers} players in room
            </div>
            {isHost && playerCount >= 2 && (
              <button
                onClick={startGame}
                className="btn btn-positive px-6 py-2.5 text-base mt-4"
              >
                Start Game
              </button>
            )}
            {isHost && playerCount < 2 && (
              <div className="mt-2 text-caution text-xs">Need at least 2 players to start</div>
            )}
            {!isHost && (
              <div className="mt-2 text-text-tertiary text-xs">Waiting for host to start the game</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
