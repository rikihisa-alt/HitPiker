'use client';

import { Card } from '../../../shared/types/card';
import CardComponent from '../ui/Card';
import HitBadge from '../ui/HitBadge';
import ShowLockBadge from '../ui/ShowLockBadge';
import { ClientPlayerState } from '../../../shared/types/player';

interface HoleCardsProps {
  cards: Card[];
  player: ClientPlayerState | null;
}

export default function HoleCards({ cards, player }: HoleCardsProps) {
  if (cards.length === 0) return null;

  return (
    <div className="flex items-center gap-4 bg-black/40 backdrop-blur-sm rounded-2xl px-6 py-3 border border-gray-700/50">
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
  );
}
