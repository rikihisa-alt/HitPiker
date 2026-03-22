'use client';

import { useGameState } from '../../hooks/useGameState';
import PlayerSeat from './PlayerSeat';
import BoardCards from './BoardCards';
import PotDisplay from './PotDisplay';
import HoleCards from './HoleCards';
import { useGameStore } from '../../store/game-store';

// 6人卓の座席位置（楕円配置）
const SEAT_POSITIONS: { top: string; left: string }[] = [
  { top: '12%', left: '70%' },   // Seat 0: 右上
  { top: '50%', left: '92%' },   // Seat 1: 右
  { top: '88%', left: '70%' },   // Seat 2: 右下
  { top: '88%', left: '30%' },   // Seat 3: 左下（自分のデフォルト位置付近）
  { top: '50%', left: '8%' },    // Seat 4: 左
  { top: '12%', left: '30%' },   // Seat 5: 左上
];

export default function PokerTable() {
  const { gameState, myPlayer, myHoleCards } = useGameState();
  const playerId = useGameStore((s) => s.playerId);

  if (!gameState) {
    return (
      <div className="relative w-full h-full flex items-center justify-center">
        <div className="text-green-300 text-xl font-semibold">
          Waiting for game to start...
        </div>
      </div>
    );
  }

  // 自分の席を下に配置するようにシートを回転
  const selfSeatIndex = myPlayer?.seatIndex ?? 0;
  const rotateSeats = (originalIndex: number) => {
    // 自分を常に下（Seat 2 or 3の位置）に見せる
    const offset = selfSeatIndex - 3; // Seat 3を自分の位置にする
    const rotated = (originalIndex - offset + 6) % 6;
    return SEAT_POSITIONS[rotated];
  };

  return (
    <div className="relative w-full h-full">
      {/* テーブル本体 */}
      <div className="absolute inset-8 rounded-[50%] bg-gradient-to-b from-felt-light to-felt-dark
        border-[12px] border-wood shadow-[inset_0_4px_30px_rgba(0,0,0,0.5),0_8px_40px_rgba(0,0,0,0.4)]">

        {/* フェルトのテクスチャ感 */}
        <div className="absolute inset-0 rounded-[50%] opacity-10 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.3)_100%)]" />

        {/* テーブル内側のライン */}
        <div className="absolute inset-6 rounded-[50%] border-2 border-green-600/20" />

        {/* ボードカード + ポット */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-3">
          <PotDisplay pot={gameState.pot} />
          <BoardCards cards={gameState.board} />
        </div>
      </div>

      {/* プレイヤー席 */}
      {gameState.players.map((player) => (
        <PlayerSeat
          key={player.id}
          player={player}
          isCurrentTurn={gameState.players[gameState.currentPlayerIndex]?.id === player.id}
          isSelf={player.id === playerId}
          position={rotateSeats(player.seatIndex)}
        />
      ))}

      {/* 自分のホールカード（画面下部中央） */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-20">
        <HoleCards cards={myHoleCards} player={myPlayer} />
      </div>

      {/* フェーズ表示 */}
      <div className="absolute top-3 left-1/2 transform -translate-x-1/2 z-10">
        <span className="text-xs font-mono text-green-300/60 bg-black/30 rounded-full px-3 py-1">
          {gameState.phase.toUpperCase()} — Hand #{gameState.handNumber}
        </span>
      </div>
    </div>
  );
}
