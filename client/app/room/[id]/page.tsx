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

  // 練習モードでroomId=practiceでなければ、かつplayerIdがなければロビーに戻す
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
    <div className="h-screen w-screen bg-gray-900 overflow-hidden relative">
      {/* トップバー */}
      <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-4 py-2 bg-gray-900/80 backdrop-blur-sm border-b border-gray-800">
        <div className="flex items-center gap-3">
          <button
            onClick={handleLeave}
            className="text-gray-500 hover:text-gray-300 text-sm transition-colors"
          >
            &larr; Leave
          </button>
          <span className="text-gray-600 text-xs">|</span>
          <span className="text-amber-400 font-bold text-sm">
            {roomName}
          </span>
          {isPracticeMode && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-900/50 text-green-400 border border-green-700/50">
              vs COM
            </span>
          )}
          {!isPracticeMode && (
            <span className="text-gray-600 text-xs font-mono">
              ID: {roomId}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <span className="text-gray-500 text-xs">
            {playerCount} players
          </span>
          {gameState && (
            <span className="text-gray-600 text-xs">
              Hand #{gameState.handNumber}
            </span>
          )}
          {canStart && (
            <button
              onClick={startGame}
              className="px-4 py-1.5 rounded-lg font-bold text-xs
                bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500
                text-white border border-green-500 transition-all active:scale-95"
            >
              Start Game
            </button>
          )}
        </div>
      </div>

      {/* テーブル */}
      <div className="absolute inset-0 pt-12">
        <PokerTable />
      </div>

      {/* アクションパネル */}
      <ActionPanel />

      {/* チャット（オンラインのみ） */}
      {!isPracticeMode && <ChatPanel />}

      {/* 結果表示オーバーレイ */}
      {lastResult && gameState?.phase === 'result' && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-gray-900 rounded-2xl border border-amber-600 shadow-2xl p-6 max-w-sm animate-fade-in">
            <h2 className="text-center text-amber-400 font-bold text-lg mb-4">Hand Result</h2>

            {/* 勝者 */}
            <div className="space-y-2 mb-4">
              {lastResult.winners.map((w, i) => (
                <div key={i} className="flex items-center justify-between bg-amber-900/20 rounded-lg px-3 py-2 border border-amber-700/30">
                  <span className="text-amber-300 font-semibold text-sm">
                    {gameState.players.find(p => p.id === w.playerId)?.name ?? 'Unknown'}
                  </span>
                  <div className="text-right">
                    <div className="text-amber-400 font-mono text-sm font-bold">+{w.amount.toLocaleString()}</div>
                    <div className="text-gray-500 text-xs">{w.handName}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* ショーダウン情報 */}
            {lastResult.showdown.length > 0 && (
              <div className="border-t border-gray-700 pt-3">
                <h3 className="text-gray-500 text-xs uppercase tracking-wider mb-2">Showdown</h3>
                <div className="space-y-1">
                  {lastResult.showdown.map((s, i) => (
                    <div key={i} className="text-xs text-gray-400">
                      <span className="text-gray-300">{gameState.players.find(p => p.id === s.playerId)?.name}</span>
                      {' — '}
                      <span className="text-gray-500">{s.handName}</span>
                      {s.mustShow && <span className="text-red-400 ml-1">(HIT SHOW)</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="text-center text-gray-600 text-xs mt-4">
              Next hand starting soon...
            </div>
          </div>
        </div>
      )}

      {/* 待機中の表示（オンラインモードのみ） */}
      {!isPracticeMode && !gameState && roomState && (
        <div className="absolute inset-0 pt-12 flex items-center justify-center">
          <div className="text-center">
            <div className="text-gray-400 text-lg mb-2">Waiting for players...</div>
            <div className="text-gray-600 text-sm">
              {playerCount}/{roomState.config.maxPlayers} players in room
            </div>
            {isHost && playerCount >= 2 && (
              <button
                onClick={startGame}
                className="mt-4 px-8 py-3 rounded-xl font-bold text-base
                  bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500
                  text-white border border-green-500 transition-all active:scale-95 shadow-lg"
              >
                Start Game
              </button>
            )}
            {isHost && playerCount < 2 && (
              <div className="mt-2 text-amber-500 text-xs">Need at least 2 players to start</div>
            )}
            {!isHost && (
              <div className="mt-2 text-gray-600 text-xs">Waiting for host to start the game</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
