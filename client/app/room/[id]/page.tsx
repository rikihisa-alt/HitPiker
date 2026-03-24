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
    <div className="h-screen w-screen bg-bg overflow-hidden relative">
      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-30 bg-bg/90 backdrop-blur-sm border-b border-border-subtle px-4 py-2 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <button
            onClick={handleLeave}
            className="text-text-sub hover:text-text text-sm transition-colors"
          >
            &larr; Leave
          </button>
          <span className="text-border text-xs">|</span>
          <span className="text-text text-sm font-medium">
            {roomName}
          </span>
          {isPracticeMode && (
            <span className="text-[11px] bg-primary-soft text-primary rounded-pill px-2 py-0.5">
              vs COM
            </span>
          )}
          {!isPracticeMode && (
            <span className="text-text-sub text-xs font-mono">
              ID: {roomId}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <span className="text-text-sub text-xs">
            {playerCount} players
          </span>
          {gameState && (
            <span className="text-text-sub text-xs">
              Hand #{gameState.handNumber}
            </span>
          )}
          {canStart && (
            <button
              onClick={startGame}
              className="btn btn-positive px-5 py-2 text-sm"
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

      {/* Lightweight result banner */}
      {lastResult && gameState?.phase === 'result' && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-30">
          <div className="bg-surface-1/95 backdrop-blur-sm border border-border rounded-lg shadow-lg px-4 py-2 flex items-center gap-3 text-sm">
            {lastResult.winners.map((w, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-text font-medium">
                  {gameState.players.find(p => p.id === w.playerId)?.name ?? '?'}
                </span>
                <span className="text-positive font-mono font-bold">
                  +{w.amount.toLocaleString()}
                </span>
                <span className="text-text-sub text-xs">
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
          <div className="panel p-6 text-center">
            <div className="text-text-sub text-base mb-2">Waiting for players...</div>
            <div className="text-text-sub text-sm">
              {playerCount}/{roomState.config.maxPlayers} players in room
            </div>
            {isHost && playerCount >= 2 && (
              <button
                onClick={startGame}
                className="btn btn-positive px-6 py-2.5 text-sm mt-4"
              >
                Start Game
              </button>
            )}
            {isHost && playerCount < 2 && (
              <div className="mt-2 text-caution text-xs">Need at least 2 players to start</div>
            )}
            {!isHost && (
              <div className="mt-2 text-text-sub text-xs">Waiting for host to start the game</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
