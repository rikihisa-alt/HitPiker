'use client';

import { ClientPlayerState } from '../../../shared/types/player';
import CardComponent from '../ui/Card';
import HitBadge from '../ui/HitBadge';
import ShowLockBadge from '../ui/ShowLockBadge';

interface PlayerSeatProps {
  player: ClientPlayerState;
  isCurrentTurn: boolean;
  isSelf: boolean;
  position: { top: string; left: string };
}

const ACTION_LABELS: Record<string, { text: string; color: string }> = {
  fold: { text: 'FOLD', color: 'bg-gray-600' },
  check: { text: 'CHECK', color: 'bg-blue-600' },
  call: { text: 'CALL', color: 'bg-blue-500' },
  bet: { text: 'BET', color: 'bg-amber-600' },
  raise: { text: 'RAISE', color: 'bg-orange-600' },
  'all-in': { text: 'ALL-IN', color: 'bg-red-600' },
};

export default function PlayerSeat({ player, isCurrentTurn, isSelf, position }: PlayerSeatProps) {
  const turnRing = isCurrentTurn
    ? 'ring-4 ring-amber-400 animate-pulse-glow'
    : '';

  const foldedOpacity = player.folded ? 'opacity-40' : '';
  const disconnectedBorder = player.disconnected ? 'border-red-500' : 'border-gray-700';

  return (
    <div
      className={`absolute transform -translate-x-1/2 -translate-y-1/2 z-10`}
      style={{ top: position.top, left: position.left }}
    >
      <div className={`flex flex-col items-center gap-1 ${foldedOpacity}`}>
        {/* カード表示 */}
        {!isSelf && player.holeCards.length > 0 && (
          <div className="flex gap-0.5 mb-1">
            {player.holeCards.map((card, i) => (
              <CardComponent key={i} card={card} size="sm" />
            ))}
          </div>
        )}

        {/* プレイヤー情報ボックス */}
        <div className={`rounded-xl border-2 ${disconnectedBorder} ${turnRing}
          bg-gradient-to-b from-gray-800 to-gray-900 shadow-xl
          px-3 py-2 min-w-[100px] text-center`}>

          {/* ポジションマーカー */}
          <div className="flex justify-center gap-1 mb-1">
            {player.isDealer && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-yellow-500 text-black font-bold">D</span>
            )}
            {player.isSB && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-400 text-black font-bold">SB</span>
            )}
            {player.isBB && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-400 text-black font-bold">BB</span>
            )}
          </div>

          {/* 名前 */}
          <div className="text-white text-sm font-semibold truncate max-w-[90px]">
            {player.name}
          </div>

          {/* スタック */}
          <div className="text-amber-400 text-xs font-mono">
            {player.stack.toLocaleString()}
          </div>

          {/* 最後のアクション */}
          {player.lastAction && (
            <div className="mt-1">
              <span className={`text-[10px] px-2 py-0.5 rounded-full text-white font-bold
                ${ACTION_LABELS[player.lastAction]?.color ?? 'bg-gray-500'}`}>
                {ACTION_LABELS[player.lastAction]?.text ?? player.lastAction.toUpperCase()}
              </span>
            </div>
          )}

          {/* 切断表示 */}
          {player.disconnected && (
            <div className="mt-1 text-[10px] text-red-400 font-bold">
              ⚠ DISCONNECTED
            </div>
          )}
        </div>

        {/* ベット額 */}
        {player.currentBet > 0 && (
          <div className="mt-1 bg-gray-900/80 rounded-full px-2 py-0.5 text-amber-300 text-xs font-mono border border-amber-700">
            {player.currentBet.toLocaleString()}
          </div>
        )}

        {/* HIT / SHOW LOCK バッジ */}
        <div className="flex gap-1 mt-1">
          {player.hit.hitRevealed && (
            <HitBadge hitSource={player.hit.hitSource} size="sm" />
          )}
          {player.hit.mustShowIfNotFolded && !player.folded && (
            <ShowLockBadge size="sm" />
          )}
        </div>
      </div>
    </div>
  );
}
