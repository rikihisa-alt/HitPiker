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

const SUIT_COLORS: Record<Suit, { text: string; bg: string }> = {
  spade: { text: 'text-slate-800', bg: 'bg-slate-50' },
  heart: { text: 'text-rose-600', bg: 'bg-rose-50/50' },
  diamond: { text: 'text-blue-600', bg: 'bg-blue-50/50' },
  club: { text: 'text-emerald-700', bg: 'bg-emerald-50/50' },
};

const RANK_LABELS: Record<Rank, string> = {
  2: '2', 3: '3', 4: '4', 5: '5', 6: '6', 7: '7', 8: '8', 9: '9',
  10: '10', 11: 'J', 12: 'Q', 13: 'K', 14: 'A',
};

const SIZE_CONFIG = {
  sm: {
    card: 'w-9 h-[52px]',
    rank: 'text-[11px] font-bold',
    suit: 'text-[9px]',
    center: 'text-base',
  },
  md: {
    card: 'w-12 h-[68px]',
    rank: 'text-sm font-bold',
    suit: 'text-[10px]',
    center: 'text-xl',
  },
  lg: {
    card: 'w-16 h-[92px]',
    rank: 'text-base font-bold',
    suit: 'text-xs',
    center: 'text-2xl',
  },
};

export default function CardComponent({ card, size = 'md', faceDown }: CardProps) {
  const cfg = SIZE_CONFIG[size];

  // Face down / hidden card
  if (faceDown || !isVisibleCard(card)) {
    return (
      <div className={`${cfg.card} rounded-md shadow-card select-none
        bg-gradient-to-br from-[#1e3a5f] to-[#0f1f35]
        border border-[#2a4a6f]/60
        flex items-center justify-center`}
      >
        <div className="w-[70%] h-[75%] rounded-sm border border-[#3a5a8f]/40
          bg-gradient-to-br from-[#1a3050]/60 to-[#0d1825]/60
          flex items-center justify-center">
          <span className="text-[#4a7aaf]/50 text-[8px] font-bold tracking-widest">HP</span>
        </div>
      </div>
    );
  }

  const { suit, rank } = card;
  const symbol = SUIT_SYMBOLS[suit];
  const colors = SUIT_COLORS[suit];
  const label = RANK_LABELS[rank];

  return (
    <div className={`${cfg.card} ${colors.bg} rounded-md shadow-card select-none cursor-default
      bg-white border border-gray-200/80
      flex flex-col justify-between p-[3px] relative overflow-hidden`}
    >
      {/* Top-left rank + suit */}
      <div className={`${colors.text} leading-none flex flex-col items-center w-fit`}>
        <span className={cfg.rank}>{label}</span>
        <span className={cfg.suit}>{symbol}</span>
      </div>

      {/* Center suit (large, subtle) */}
      <div className={`absolute inset-0 flex items-center justify-center pointer-events-none`}>
        <span className={`${colors.text} ${cfg.center} opacity-20`}>{symbol}</span>
      </div>

      {/* Bottom-right rank + suit (inverted) */}
      <div className={`${colors.text} leading-none flex flex-col items-center w-fit self-end rotate-180`}>
        <span className={cfg.rank}>{label}</span>
        <span className={cfg.suit}>{symbol}</span>
      </div>
    </div>
  );
}
