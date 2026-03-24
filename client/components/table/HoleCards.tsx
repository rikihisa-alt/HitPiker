'use client';

import { useState, useRef, useCallback } from 'react';
import { Card } from '../../../shared/types/card';
import CardComponent from '../ui/Card';
import HitBadge from '../ui/HitBadge';
import { ClientPlayerState } from '../../../shared/types/player';
import { useGameStore } from '../../store/game-store';
import { getHandName } from '../../lib/hand-name';

interface HoleCardsProps {
  cards: Card[];
  player: ClientPlayerState | null;
  onFold?: () => void;
  canFold?: boolean;
}

const FOLD_THRESHOLD = 80;

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
    setDragY(Math.max(0, delta));
  }, [isDragging]);

  const handleEnd = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);

    if (dragY >= FOLD_THRESHOLD && canFold && onFold) {
      setIsFolding(true);
      setDragY(200);
      setTimeout(() => {
        onFold();
        setIsFolding(false);
        setDragY(0);
      }, 300);
    } else {
      setDragY(0);
    }
  }, [isDragging, dragY, canFold, onFold]);

  const onMouseDown = (e: React.MouseEvent) => handleStart(e.clientY);
  const onMouseMove = (e: React.MouseEvent) => handleMove(e.clientY);
  const onMouseUp = () => handleEnd();
  const onMouseLeave = () => { if (isDragging) handleEnd(); };

  const onTouchStart = (e: React.TouchEvent) => handleStart(e.touches[0].clientY);
  const onTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    handleMove(e.touches[0].clientY);
  };
  const onTouchEnd = () => handleEnd();

  const gameState = useGameStore((s) => s.gameState);
  const board = gameState?.board ?? [];

  if (cards.length === 0) return null;

  const handName = getHandName(cards, board);
  const progress = Math.min(dragY / FOLD_THRESHOLD, 1);
  const opacity = isFolding ? 0 : 1 - progress * 0.6;
  const scale = 1 - progress * 0.15;
  const rotation = progress * 8;
  // Show HIT as soon as qualified (for self, we know immediately), or when revealed
  const isHit = (player?.hit.hitQualified ?? false) || (player?.hit.hitRevealed ?? false);

  return (
    <div className="relative select-none">
      {/* HIT badge above cards - always visible when hit */}
      {isHit && (
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 z-20">
          <HitBadge hitSource={player?.hit.hitSource ?? null} size="lg" blink />
        </div>
      )}

      <div
        ref={containerRef}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseLeave}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        className={`flex items-center gap-3 bg-surface-1 backdrop-blur-sm rounded-lg px-4 py-2 border
          ${canFold ? 'cursor-grab active:cursor-grabbing' : ''}
          ${isDragging ? 'border-danger/40' : isHit ? 'border-danger/50' : 'border-border'}
          ${isFolding ? 'transition-all duration-300' : isDragging ? '' : 'transition-all duration-200'}`}
        style={{
          transform: `translateY(${dragY}px) scale(${scale}) rotate(${rotation}deg)`,
          opacity,
        }}
      >
        <div className="flex gap-1.5">
          {cards.map((card, i) => (
            <CardComponent key={`hole-${i}`} card={card} size="lg" />
          ))}
        </div>
      </div>

      {/* Hand name */}
      {handName && !isFolding && (
        <div className="text-center mt-0.5">
          <span className="text-[10px] text-text-sub chip-amt">{handName}</span>
        </div>
      )}

      {/* Drag hint */}
      {canFold && !isDragging && !isFolding && (
        <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[9px] text-text-muted whitespace-nowrap opacity-60">
          drag to fold
        </div>
      )}

      {/* Fold confirmation indicator */}
      {isDragging && progress > 0.3 && (
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10"
          style={{ opacity: progress }}
        >
          <div className={`px-3 py-1 rounded-pill text-xs font-semibold border
            ${progress >= 1
              ? 'bg-danger text-danger-fg border-danger'
              : 'bg-danger-soft text-danger border-danger/30'
            }`}
          >
            {progress >= 1 ? 'Release to FOLD' : 'FOLD'}
          </div>
        </div>
      )}
    </div>
  );
}
