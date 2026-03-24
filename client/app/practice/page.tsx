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
    <div className="min-h-screen bg-[#0e1117] flex flex-col">
      {/* Header */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#141a2e] to-transparent opacity-60" />
        <div className="relative max-w-lg mx-auto px-6 pt-10 pb-6">
          <button
            onClick={() => router.push('/')}
            className="inline-flex items-center gap-1 text-text-sub hover:text-white text-sm transition-colors mb-6 group"
          >
            <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Practice Mode
          </h1>
          <p className="text-text-sub text-sm mt-1.5">Play against AI opponents — no server required</p>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 max-w-lg mx-auto w-full px-5 pb-12 -mt-1">
        <div className="space-y-4">
          {/* Name input */}
          <div className="rounded-xl bg-[#161a24] border border-white/[0.06] p-4">
            <label className="block text-xs font-medium text-text-sub mb-2">Your Name</label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Enter your name"
              maxLength={20}
              className="w-full px-3.5 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08]
                text-white text-sm placeholder:text-text-muted
                focus:border-primary/50 focus:ring-1 focus:ring-primary/20 focus:outline-none transition-all"
            />
          </div>

          {/* COM count selector */}
          <div className="rounded-xl bg-[#161a24] border border-white/[0.06] p-4">
            <label className="block text-xs font-medium text-text-sub mb-3">Opponents</label>
            <div className="grid grid-cols-5 gap-1.5">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => setComCount(n)}
                  className={`relative py-3 rounded-lg text-sm font-semibold transition-all duration-150
                    ${comCount === n
                      ? 'bg-primary text-white shadow-md shadow-primary/20'
                      : 'bg-white/[0.04] text-text-sub border border-white/[0.06] hover:bg-white/[0.08] hover:text-white'}`}
                >
                  {n}
                  {comCount === n && (
                    <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full bg-white/60" />
                  )}
                </button>
              ))}
            </div>
            <div className="flex justify-between mt-2 px-0.5">
              <span className="text-[10px] text-text-muted">Heads Up</span>
              <span className="text-[10px] text-text-muted">Full Table</span>
            </div>
          </div>

          {/* Game info */}
          <div className="rounded-xl bg-[#161a24] border border-white/[0.06] p-4">
            <h3 className="text-xs font-medium text-text-sub uppercase tracking-wider mb-3">Table Info</h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 rounded-lg bg-white/[0.02]">
                <div className="chip-amt text-base font-bold text-white">50/100</div>
                <div className="text-[10px] text-text-muted mt-1">Blinds</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-white/[0.02]">
                <div className="chip-amt text-base font-bold text-white">10K</div>
                <div className="text-[10px] text-text-muted mt-1">Stack</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-white/[0.02]">
                <div className="chip-amt text-base font-bold text-white">{comCount + 1}</div>
                <div className="text-[10px] text-text-muted mt-1">Players</div>
              </div>
            </div>
          </div>

          {/* Start button */}
          <button
            onClick={handleStart}
            className="w-full py-3.5 rounded-xl text-sm font-semibold text-white
              bg-gradient-to-r from-positive to-[#1fb889]
              hover:brightness-110 active:scale-[0.98]
              shadow-lg shadow-positive/10 transition-all"
          >
            Start Game
          </button>
        </div>
      </main>
    </div>
  );
}
