'use client';

import { useMemo } from 'react';
import { useGameStore } from '../../store/game-store';
import { GAME_CONSTANTS } from '../../../shared/constants/game';

export default function SessionStats() {
  const handHistory = useGameStore((s) => s.handHistory);
  const isPracticeMode = useGameStore((s) => s.isPracticeMode);
  const myPlayer = useGameStore((s) => {
    if (!s.gameState || !s.playerId) return null;
    return s.gameState.players.find((p) => p.id === s.playerId) ?? null;
  });

  const stats = useMemo(() => {
    const handsPlayed = handHistory.length;
    if (handsPlayed === 0) {
      return {
        handsPlayed: 0,
        winRate: 0,
        vpip: 0,
        profitLoss: 0,
      };
    }

    // Win rate: hands where player gained chips
    const handsWon = handHistory.filter(h => h.myEndStack > h.myStartStack).length;
    const winRate = Math.round((handsWon / handsPlayed) * 100);

    // VPIP: % of hands where player voluntarily put money in pot
    const vpipHands = handHistory.filter(h => h.myVPIP).length;
    const vpip = Math.round((vpipHands / handsPlayed) * 100);

    // Profit/Loss: current stack - starting stack
    const currentStack = myPlayer?.stack ?? GAME_CONSTANTS.STARTING_STACK;
    const profitLoss = currentStack - GAME_CONSTANTS.STARTING_STACK;

    return {
      handsPlayed,
      winRate,
      vpip,
      profitLoss,
    };
  }, [handHistory, myPlayer?.stack]);

  // Only show in practice mode and after at least 1 hand
  if (!isPracticeMode) return null;

  return (
    <div className="absolute top-11 left-1/2 -translate-x-1/2 z-30">
      <div className="flex items-center gap-4 bg-surface-1/80 backdrop-blur-sm border border-border-subtle rounded-md px-3 py-1">
        <StatItem label="Hands" value={stats.handsPlayed.toString()} />
        <Divider />
        <StatItem label="Win Rate" value={`${stats.winRate}%`} />
        <Divider />
        <StatItem label="VPIP" value={`${stats.vpip}%`} />
        <Divider />
        <StatItem
          label="P/L"
          value={`${stats.profitLoss > 0 ? '+' : ''}${stats.profitLoss.toLocaleString()}`}
          valueClass={
            stats.profitLoss > 0 ? 'text-positive' :
            stats.profitLoss < 0 ? 'text-danger' :
            'text-text-sub'
          }
        />
      </div>
    </div>
  );
}

function StatItem({ label, value, valueClass }: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-text-muted text-[10px] uppercase tracking-wider">{label}</span>
      <span className={`chip-amt text-[11px] font-medium ${valueClass ?? 'text-text-sub'}`}>
        {value}
      </span>
    </div>
  );
}

function Divider() {
  return <div className="w-px h-3 bg-border-subtle" />;
}
