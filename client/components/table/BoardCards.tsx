'use client';

import { Card } from '../../../shared/types/card';
import CardComponent from '../ui/Card';

interface BoardCardsProps {
  cards: Card[];
}

export default function BoardCards({ cards }: BoardCardsProps) {
  if (cards.length === 0) return null;

  return (
    <div className="flex gap-2 animate-fade-in">
      {cards.map((card, i) => (
        <div key={`${card.suit}-${card.rank}-${i}`} className="animate-slide-up" style={{ animationDelay: `${i * 100}ms` }}>
          <CardComponent card={card} size="md" />
        </div>
      ))}
      {/* 空スロット表示 */}
      {Array.from({ length: 5 - cards.length }).map((_, i) => (
        <div
          key={`empty-${i}`}
          className="w-14 h-20 rounded-lg border-2 border-dashed border-green-700/30"
        />
      ))}
    </div>
  );
}
