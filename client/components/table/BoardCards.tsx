'use client';

import { Card } from '../../../shared/types/card';
import CardComponent from '../ui/Card';

interface BoardCardsProps {
  cards: Card[];
}

export default function BoardCards({ cards }: BoardCardsProps) {
  if (cards.length === 0) return null;

  return (
    <div className="flex gap-2">
      {cards.map((card, i) => (
        <div key={`${card.suit}-${card.rank}-${i}`} className="animate-fade-in">
          <CardComponent card={card} size="md" />
        </div>
      ))}
      {/* Empty slots */}
      {Array.from({ length: 5 - cards.length }).map((_, i) => (
        <div
          key={`empty-${i}`}
          className="w-12 h-[68px] rounded-md bg-surface-3/30"
        />
      ))}
    </div>
  );
}
