'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocalGame } from '../../hooks/useLocalGame';

export default function PracticePage() {
  const router = useRouter();
  const { startPracticeGame } = useLocalGame();
  const [playerName, setPlayerName] = useState('');
  const [comCount, setComCount] = useState(3);

  const handleStart = () => {
    const name = playerName.trim() || 'You';
    startPracticeGame(name, comCount);
    router.push('/room/practice');
  };

  return (
    <div className="min-h-screen bg-surface-0 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* ヘッダー */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/')}
            className="text-text-tertiary hover:text-text-secondary text-sm transition-colors duration-fast mb-4 inline-block"
          >
            &larr; Back to Lobby
          </button>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">
            Practice Mode
          </h1>
          <p className="text-text-tertiary text-sm mt-1">Play against COM players</p>
        </div>

        <div className="panel p-5 space-y-5">
          {/* プレイヤー名 */}
          <div>
            <label className="block text-text-secondary text-xs mb-1.5 font-medium">
              Your Name
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

          {/* COM人数 */}
          <div>
            <label className="block text-text-secondary text-xs mb-2.5 font-medium">
              COM Players
            </label>
            <div className="flex gap-1.5">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => setComCount(n)}
                  className={`btn flex-1 py-2.5 text-sm
                    ${comCount === n
                      ? 'btn-primary'
                      : 'btn-ghost'
                    }`}
                >
                  {n}
                </button>
              ))}
            </div>
            <div className="flex justify-between mt-1.5 px-1">
              <span className="text-[10px] text-text-tertiary">Heads Up</span>
              <span className="text-[10px] text-text-tertiary">Full Table</span>
            </div>
          </div>

          {/* ゲーム設定情報 */}
          <div className="bg-surface-2 rounded-md p-3 border border-border-subtle">
            <div className="grid grid-cols-2 gap-y-2 text-xs">
              <div className="text-text-tertiary">Blinds</div>
              <div className="text-text-secondary text-right font-medium">50 / 100</div>
              <div className="text-text-tertiary">Starting Stack</div>
              <div className="text-text-secondary text-right font-medium">10,000</div>
              <div className="text-text-tertiary">Total Players</div>
              <div className="text-text-secondary text-right font-medium">{comCount + 1}</div>
            </div>
          </div>

          {/* 開始ボタン */}
          <button
            onClick={handleStart}
            className="btn btn-positive w-full py-3 text-sm"
          >
            Start Game
          </button>
        </div>
      </div>
    </div>
  );
}
