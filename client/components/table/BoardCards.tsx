'use client';

import { Card } from '../../../shared/types/card';
import CardComponent from '../ui/Card';

interface BoardCardsProps {
  cards: Card[];
}

export default function BoardCards({ cards }: BoardCardsProps) {
  return (
    <div className="flex gap-1.5">
      {cards.map((card, i) => (
        <div key={`${card.suit}-${card.rank}-${i}`} className="animate-fade-in">
          <CardComponent card={card} size="md" />
        </div>
      ))}
      {/* Empty slots - subtle outline placeholders */}
      {Array.from({ length: 5 - cards.length }).map((_, i) => (
        <div
          key={`empty-${i}`}
          className="w-11 h-[62px] rounded-md border border-felt-line bg-transparent"
        />
      ))}
    </div>
  );
}
