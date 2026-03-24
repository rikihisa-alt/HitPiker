'use client';

import { useCallback, useMemo, useState } from 'react';
import { useGameState } from '../../hooks/useGameState';
import PlayerSeat from './PlayerSeat';
import BoardCards from './BoardCards';
import PotDisplay from './PotDisplay';
import HoleCards from './HoleCards';
import TableSettings from '../settings/TableSettings';
import { useGameStore } from '../../store/game-store';
import { useSocket } from '../../hooks/useSocket';
import { useLocalGame } from '../../hooks/useLocalGame';
import { loadSettings, feltClassName, TableSettings as SettingsType } from '../../lib/settings-store';

// 6人卓の座席位置（楕円配置）
const SEAT_POSITIONS: { top: string; left: string }[] = [
  { top: '8%', left: '68%' },    // 0: top-right
  { top: '44%', left: '90%' },   // 1: right
  { top: '78%', left: '68%' },   // 2: bottom-right
  { top: '78%', left: '32%' },   // 3: bottom-left (self default)
  { top: '44%', left: '10%' },   // 4: left
  { top: '8%', left: '32%' },    // 5: top-left
];

export default function PokerTable() {
  const { gameState, myPlayer, myHoleCards, isMyTurn, availableActions, lastResult } = useGameState();
  const playerId = useGameStore((s) => s.playerId);
  const isPracticeMode = useGameStore((s) => s.isPracticeMode);
  const { sendAction: sendSocketAction } = useSocket();
  const { sendAction: sendLocalAction } = useLocalGame();
  const sendAction = isPracticeMode ? sendLocalAction : sendSocketAction;

  const [feltClass, setFeltClass] = useState(() => feltClassName(loadSettings().feltColor));

  const handleSettingsChange = useCallback((s: SettingsType) => {
    setFeltClass(feltClassName(s.feltColor));
  }, []);

  const canFold = isMyTurn && availableActions.includes('fold');

  const handleDragFold = useCallback(() => {
    if (!playerId || !canFold) return;
    sendAction({ playerId, type: 'fold' });
  }, [playerId, canFold, sendAction]);

  // result時のチップ増減マップを計算
  const chipDeltas = useMemo(() => {
    const deltas = new Map<string, number>();
    if (lastResult && gameState?.phase === 'result') {
      for (const w of lastResult.winners) {
        deltas.set(w.playerId, w.amount);
      }
    }
    return deltas;
  }, [lastResult, gameState?.phase]);

  if (!gameState) {
    return (
      <div className="relative w-full h-full flex items-center justify-center">
        <div className="text-text-sub text-lg font-medium">
          Waiting for game to start...
        </div>
      </div>
    );
  }

  // 自分の席を下に配置するようにシートを回転
  const selfSeatIndex = myPlayer?.seatIndex ?? 0;
  const rotateSeats = (originalIndex: number) => {
    const offset = selfSeatIndex - 3;
    const rotated = (originalIndex - offset + 6) % 6;
    return SEAT_POSITIONS[rotated];
  };

  return (
    <div className={`relative w-full h-full ${feltClass}`}>
      {/* Phase pill - top left */}
      <div className="absolute top-2 left-4 z-10">
        <span className="chip-amt text-[11px] text-text-muted bg-surface-2 border border-border-subtle rounded-pill px-2.5 py-0.5">
          {gameState.phase.toUpperCase()} — #{gameState.handNumber}
        </span>
      </div>

      {/* Settings gear - top right */}
      <div className="absolute top-2 right-4 z-10">
        <TableSettings onSettingsChange={handleSettingsChange} />
      </div>

      {/* Felt table */}
      <div
        className="absolute inset-4 sm:inset-6 lg:inset-8 rounded-[50%] felt-texture"
        style={{
          background: 'linear-gradient(180deg, var(--felt), var(--felt-deep))',
          borderWidth: '6px',
          borderStyle: 'solid',
          borderColor: '#3a2518',
          boxShadow: `
            inset 0 4px 30px rgba(0,0,0,0.5),
            inset 0 0 60px rgba(0,0,0,0.15),
            0 0 0 2px rgba(80,50,20,0.4),
            0 0 40px rgba(0,0,0,0.3)
          `,
        }}
      >
        {/* Wood rail inner highlight */}
        <div
          className="absolute inset-0 rounded-[50%] pointer-events-none"
          style={{
            boxShadow: 'inset 0 1px 0 rgba(255,220,160,0.12), inset 0 -1px 0 rgba(0,0,0,0.3)',
          }}
        />

        {/* Vignette overlay — darker edges, lighter center */}
        <div
          className="absolute inset-0 rounded-[50%] pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at 50% 45%, transparent 30%, rgba(0,0,0,0.25) 100%)',
          }}
        />

        {/* Embroidered stitch line */}
        <div
          className="absolute inset-5 rounded-[50%] pointer-events-none"
          style={{
            border: '1.5px dashed rgba(255,255,255,0.07)',
            backgroundClip: 'padding-box',
          }}
        />

        {/* Center: board + pot (side by side) */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
          flex items-center gap-3">
          <BoardCards cards={gameState.board} />
          <PotDisplay pot={gameState.pot} />
        </div>
      </div>

      {/* Player seats */}
      {gameState.players.map((player) => (
        <PlayerSeat
          key={player.id}
          player={player}
          isCurrentTurn={gameState.players[gameState.currentPlayerIndex]?.id === player.id}
          isSelf={player.id === playerId}
          position={rotateSeats(player.seatIndex)}
          chipDelta={chipDeltas.get(player.id)}
        />
      ))}

      {/* Hole cards (bottom center) */}
      <div className="absolute left-1/2 -translate-x-1/2 z-20 bottom-2">
        <HoleCards cards={myHoleCards} player={myPlayer} canFold={canFold} onFold={handleDragFold} />
      </div>
    </div>
  );
}
