'use client';

import { useState, useRef, useCallback } from 'react';
import { Card } from '../../../shared/types/card';
import CardComponent from '../ui/Card';
import HitBadge from '../ui/HitBadge';
import ShowLockBadge from '../ui/ShowLockBadge';
import { ClientPlayerState } from '../../../shared/types/player';

interface HoleCardsProps {
  cards: Card[];
  player: ClientPlayerState | null;
  onFold?: () => void;
  canFold?: boolean;
}

const FOLD_THRESHOLD = 80; // ドラッグ距離のしきい値(px)

export default function HoleCards({ cards, player, onFold, canFold }: HoleCardsProps) {
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isFolding, setIsFolding] = useState(false);
  const startY = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleStart = useCallback((clientY: number) => {
    if (!canFold) return;
    startY.current = clientY;
    setIsDragging(true);
  }, [canFold]);

  const handleMove = useCallback((clientY: number) => {
    if (!isDragging) return;
    const delta = clientY - startY.current;
    // 下方向のみ許可
    setDragY(Math.max(0, delta));
  }, [isDragging]);

  const handleEnd = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);

    if (dragY >= FOLD_THRESHOLD && canFold && onFold) {
      // フォールドアニメーション
      setIsFolding(true);
      setDragY(200);
      setTimeout(() => {
        onFold();
        setIsFolding(false);
        setDragY(0);
      }, 300);
    } else {
      // 元に戻す
      setDragY(0);
    }
  }, [isDragging, dragY, canFold, onFold]);

  // マウスイベント
  const onMouseDown = (e: React.MouseEvent) => handleStart(e.clientY);
  const onMouseMove = (e: React.MouseEvent) => handleMove(e.clientY);
  const onMouseUp = () => handleEnd();
  const onMouseLeave = () => { if (isDragging) handleEnd(); };

  // タッチイベント
  const onTouchStart = (e: React.TouchEvent) => handleStart(e.touches[0].clientY);
  const onTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    handleMove(e.touches[0].clientY);
  };
  const onTouchEnd = () => handleEnd();

  if (cards.length === 0) return null;

  const progress = Math.min(dragY / FOLD_THRESHOLD, 1);
  const opacity = isFolding ? 0 : 1 - progress * 0.6;
  const scale = 1 - progress * 0.15;
  const rotation = progress * 8;

  return (
    <div className="relative select-none">
      <div
        ref={containerRef}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseLeave}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        className={`flex items-center gap-4 bg-black/40 backdrop-blur-sm rounded-2xl px-6 py-3 border
          ${canFold ? 'cursor-grab active:cursor-grabbing' : ''}
          ${isDragging ? 'border-red-500/50' : 'border-gray-700/50'}
          ${isFolding ? 'transition-all duration-300' : isDragging ? '' : 'transition-all duration-200'}`}
        style={{
          transform: `translateY(${dragY}px) scale(${scale}) rotate(${rotation}deg)`,
          opacity,
        }}
      >
        <div className="flex gap-2">
          {cards.map((card, i) => (
            <CardComponent key={`hole-${i}`} card={card} size="lg" />
          ))}
        </div>
        {player && (
          <div className="flex flex-col gap-1">
            {player.hit.hitRevealed && (
              <HitBadge hitSource={player.hit.hitSource} />
            )}
            {player.hit.mustShowIfNotFolded && !player.folded && (
              <ShowLockBadge />
            )}
          </div>
        )}
      </div>

      {/* ドラッグヒント */}
      {canFold && !isDragging && !isFolding && (
        <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] text-gray-600 whitespace-nowrap animate-pulse">
          ↓ drag to fold
        </div>
      )}

      {/* フォールド確認インジケーター */}
      {isDragging && progress > 0.3 && (
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10"
          style={{ opacity: progress }}
        >
          <div className={`px-4 py-1.5 rounded-full text-sm font-bold border
            ${progress >= 1
              ? 'bg-red-600 text-white border-red-500'
              : 'bg-red-900/60 text-red-300 border-red-700/50'
            }`}
          >
            {progress >= 1 ? 'Release to FOLD' : 'FOLD'}
          </div>
        </div>
      )}
    </div>
  );
}
