'use client';

import { ClientCard, isVisibleCard, Suit, Rank } from '../../../shared/types/card';

interface CardProps {
  card: ClientCard;
  size?: 'sm' | 'md' | 'lg';
  faceDown?: boolean;
}

const SUIT_SYMBOLS: Record<Suit, string> = {
  spade: '\u2660',
  heart: '\u2665',
  diamond: '\u2666',
  club: '\u2663',
};

const SUIT_COLORS: Record<Suit, string> = {
  spade: 'text-gray-800',
  heart: 'text-red-500',
  diamond: 'text-red-500',
  club: 'text-gray-800',
};

const RANK_LABELS: Record<Rank, string> = {
  2: '2', 3: '3', 4: '4', 5: '5', 6: '6', 7: '7', 8: '8', 9: '9',
  10: '10', 11: 'J', 12: 'Q', 13: 'K', 14: 'A',
};

const SIZE_CLASSES = {
  sm: 'w-9 h-[52px] text-[10px]',
  md: 'w-12 h-[68px] text-xs',
  lg: 'w-16 h-[92px] text-base',
};

export default function CardComponent({ card, size = 'md', faceDown }: CardProps) {
  const sizeClass = SIZE_CLASSES[size];

  if (faceDown || !isVisibleCard(card)) {
    return (
      <div className={`${sizeClass} rounded-md bg-surface-2 border border-border-strong shadow-sm flex items-center justify-center select-none`}>
        <span className="text-text-tertiary font-semibold text-[9px] tracking-wider">HP</span>
      </div>
    );
  }

  const { suit, rank } = card;
  const symbol = SUIT_SYMBOLS[suit];
  const colorClass = SUIT_COLORS[suit];
  const label = RANK_LABELS[rank];

  return (
    <div className={`${sizeClass} rounded-md bg-white border border-gray-200 shadow-sm flex flex-col justify-between p-1 select-none cursor-default`}>
      <div className={`${colorClass} font-bold leading-none`}>
        <div>{label}</div>
        <div className="text-[0.65em]">{symbol}</div>
      </div>
      <div className={`${colorClass} text-center text-[1.5em] leading-none`}>
        {symbol}
      </div>
      <div className={`${colorClass} font-bold leading-none self-end rotate-180`}>
        <div>{label}</div>
        <div className="text-[0.65em]">{symbol}</div>
      </div>
    </div>
  );
}
