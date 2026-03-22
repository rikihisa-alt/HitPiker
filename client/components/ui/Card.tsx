'use client';

import { ClientCard, isVisibleCard, Suit, Rank } from '../../../shared/types/card';

interface CardProps {
  card: ClientCard;
  size?: 'sm' | 'md' | 'lg';
  faceDown?: boolean;
}

const SUIT_SYMBOLS: Record<Suit, string> = {
  spade: '♠',
  heart: '♥',
  diamond: '♦',
  club: '♣',
};

const SUIT_COLORS: Record<Suit, string> = {
  spade: 'text-gray-900',
  heart: 'text-red-600',
  diamond: 'text-red-600',
  club: 'text-gray-900',
};

const RANK_LABELS: Record<Rank, string> = {
  2: '2', 3: '3', 4: '4', 5: '5', 6: '6', 7: '7', 8: '8', 9: '9',
  10: '10', 11: 'J', 12: 'Q', 13: 'K', 14: 'A',
};

const SIZE_CLASSES = {
  sm: 'w-10 h-14 text-xs',
  md: 'w-14 h-20 text-sm',
  lg: 'w-20 h-28 text-lg',
};

export default function CardComponent({ card, size = 'md', faceDown }: CardProps) {
  const sizeClass = SIZE_CLASSES[size];

  if (faceDown || !isVisibleCard(card)) {
    return (
      <div className={`${sizeClass} rounded-lg bg-gradient-to-br from-blue-800 to-blue-950 border-2 border-blue-700 shadow-lg flex items-center justify-center select-none`}>
        <div className="w-3/4 h-3/4 rounded border border-blue-600 bg-blue-900 flex items-center justify-center">
          <span className="text-blue-400 font-bold text-xs">HP</span>
        </div>
      </div>
    );
  }

  const { suit, rank } = card;
  const symbol = SUIT_SYMBOLS[suit];
  const colorClass = SUIT_COLORS[suit];
  const label = RANK_LABELS[rank];

  return (
    <div className={`${sizeClass} rounded-lg bg-white border border-gray-300 shadow-lg flex flex-col justify-between p-1 select-none hover:translate-y-[-4px] transition-transform duration-150 cursor-default`}>
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
