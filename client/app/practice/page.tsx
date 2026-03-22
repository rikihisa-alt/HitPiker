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
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* ヘッダー */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black tracking-tight bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 bg-clip-text text-transparent">
            Practice Mode
          </h1>
          <p className="text-gray-500 text-sm mt-2">Play against COM players</p>
        </div>

        <div className="bg-gray-800/60 rounded-2xl p-6 border border-gray-700/50 space-y-6">
          {/* プレイヤー名 */}
          <div>
            <label className="block text-gray-400 text-xs mb-1.5 font-semibold uppercase tracking-wider">
              Your Name
            </label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Enter your name"
              maxLength={20}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white
                placeholder-gray-600 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/50 text-sm"
            />
          </div>

          {/* COM人数 */}
          <div>
            <label className="block text-gray-400 text-xs mb-3 font-semibold uppercase tracking-wider">
              COM Players: <span className="text-amber-400 text-lg">{comCount}</span>
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => setComCount(n)}
                  className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all
                    ${comCount === n
                      ? 'bg-amber-600 text-white border border-amber-500 shadow-lg shadow-amber-600/20'
                      : 'bg-gray-800 text-gray-400 border border-gray-700 hover:border-gray-600 hover:text-gray-300'
                    }`}
                >
                  {n}
                </button>
              ))}
            </div>
            <div className="flex justify-between mt-1.5">
              <span className="text-[10px] text-gray-600">Heads Up</span>
              <span className="text-[10px] text-gray-600">Full Table</span>
            </div>
          </div>

          {/* ゲーム設定情報 */}
          <div className="bg-gray-900/50 rounded-xl p-3 border border-gray-700/30">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="text-gray-500">Blinds</div>
              <div className="text-gray-300 text-right">50 / 100</div>
              <div className="text-gray-500">Starting Stack</div>
              <div className="text-gray-300 text-right">10,000</div>
              <div className="text-gray-500">Total Players</div>
              <div className="text-gray-300 text-right">{comCount + 1}</div>
            </div>
          </div>

          {/* 開始ボタン */}
          <button
            onClick={handleStart}
            className="w-full py-4 rounded-xl font-bold text-base
              bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500
              text-white border border-green-500 transition-all active:scale-[0.98]
              shadow-lg shadow-green-600/20"
          >
            Start Game
          </button>
        </div>

        {/* 戻るリンク */}
        <button
          onClick={() => router.push('/')}
          className="w-full mt-4 text-center text-gray-600 hover:text-gray-400 text-sm transition-colors"
        >
          &larr; Back to Lobby
        </button>
      </div>
    </div>
  );
}
