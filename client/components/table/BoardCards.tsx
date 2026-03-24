'use client';

import { useRef } from 'react';
import { Card } from '../../../shared/types/card';
import CardComponent from '../ui/Card';

interface BoardCardsProps {
  cards: Card[];
}

export default function BoardCards({ cards }: BoardCardsProps) {
  // Track the previous card count so we know which cards are "new"
  const prevCountRef = useRef(0);
  const revealKeyRef = useRef(0);

  // When card count changes, bump the reveal key to re-trigger animations
  if (cards.length !== prevCountRef.current) {
    revealKeyRef.current += 1;
    prevCountRef.current = cards.length;
  }

  const revealKey = revealKeyRef.current;

  return (
    <div className="flex gap-1.5">
      {cards.map((card, i) => {
        // Flop (indices 0-2): stagger 0ms, 100ms, 200ms
        // Turn (index 3): 0ms
        // River (index 4): 0ms
        let delay = 0;
        if (i < 3) {
          delay = i * 100;
        }

        return (
          <div
            key={`${card.suit}-${card.rank}-${i}-${revealKey}`}
            className="animate-fade-in"
            style={{ animationDelay: `${delay}ms`, animationFillMode: 'both' }}
          >
            <CardComponent card={card} size="md" />
          </div>
        );
      })}
      {/* Empty slots - subtle card-shaped indentations in the felt */}
      {Array.from({ length: 5 - cards.length }).map((_, i) => (
        <div
          key={`empty-${i}`}
          className="w-[46px] h-[64px] rounded-[5px]"
          style={{
            background: 'rgba(0,0,0,0.08)',
            border: '1px dashed rgba(255,255,255,0.06)',
            boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.2)',
          }}
        />
      ))}
    </div>
  );
}
