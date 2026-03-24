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

// 4-color deck: spade=black, heart=red, diamond=blue, club=green
const SUIT_COLORS: Record<Suit, string> = {
  spade: '#1a1a2e',
  heart: '#c62828',
  diamond: '#1565c0',
  club: '#2e7d32',
};

const RANK_LABELS: Record<Rank, string> = {
  2: '2', 3: '3', 4: '4', 5: '5', 6: '6', 7: '7', 8: '8', 9: '9',
  10: '10', 11: 'J', 12: 'Q', 13: 'K', 14: 'A',
};

// Real card proportions: 2.5:3.5 ratio
const SIZE_CONFIG = {
  sm: {
    card: 'w-[34px] h-[48px]',
    rank: 'text-[10px] font-extrabold leading-none',
    suit: 'text-[8px] leading-none',
    center: 'text-[16px]',
    padding: 'p-[2px]',
  },
  md: {
    card: 'w-[46px] h-[64px]',
    rank: 'text-[13px] font-extrabold leading-none',
    suit: 'text-[9px] leading-none',
    center: 'text-[22px]',
    padding: 'p-[3px]',
  },
  lg: {
    card: 'w-[62px] h-[86px]',
    rank: 'text-[16px] font-extrabold leading-none',
    suit: 'text-[11px] leading-none',
    center: 'text-[28px]',
    padding: 'p-[4px]',
  },
};

export default function CardComponent({ card, size = 'md', faceDown }: CardProps) {
  const cfg = SIZE_CONFIG[size];

  // Face down / hidden card
  if (faceDown || !isVisibleCard(card)) {
    return (
      <div
        className={`${cfg.card} rounded-[5px] select-none card-back relative overflow-hidden`}
        style={{
          background: 'linear-gradient(145deg, #1e3a5f, #0f1f35)',
          boxShadow: '0 2px 6px rgba(0,0,0,0.35), 0 1px 2px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.05)',
          border: '1px solid rgba(42,74,111,0.5)',
        }}
      >
        {/* Cross-hatch pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: `
              repeating-linear-gradient(45deg, transparent, transparent 3px, rgba(255,255,255,1) 3px, rgba(255,255,255,1) 3.5px),
              repeating-linear-gradient(-45deg, transparent, transparent 3px, rgba(255,255,255,1) 3px, rgba(255,255,255,1) 3.5px)
            `,
          }}
        />
        {/* Inner border with gold/cream accent */}
        <div
          className="absolute inset-[3px] rounded-[3px] flex items-center justify-center"
          style={{
            border: '1px solid rgba(210,190,140,0.15)',
          }}
        >
          {/* Embossed HP text */}
          <span
            className="text-[8px] font-bold tracking-[0.15em] select-none"
            style={{
              color: 'rgba(74,122,175,0.25)',
              textShadow: '0 1px 1px rgba(0,0,0,0.4), 0 -1px 0 rgba(255,255,255,0.05)',
            }}
          >
            HP
          </span>
        </div>
      </div>
    );
  }

  const { suit, rank } = card;
  const symbol = SUIT_SYMBOLS[suit];
  const suitColor = SUIT_COLORS[suit];
  const label = RANK_LABELS[rank];

  return (
    <div
      className={`${cfg.card} rounded-[5px] select-none cursor-default
        flex flex-col justify-between ${cfg.padding} relative overflow-hidden`}
      style={{
        backgroundColor: '#f8f6f0',
        border: '1px solid #e0ddd5',
        boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.06), 0 2px 6px rgba(0,0,0,0.25), 0 1px 2px rgba(0,0,0,0.15)',
      }}
    >
      {/* Top-left rank + suit */}
      <div className="leading-none flex flex-col items-center w-fit" style={{ color: suitColor }}>
        <span className={cfg.rank}>{label}</span>
        <span className={cfg.suit}>{symbol}</span>
      </div>

      {/* Center suit (large, 30% opacity) */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <span
          className={cfg.center}
          style={{ color: suitColor, opacity: 0.3 }}
        >
          {symbol}
        </span>
      </div>

      {/* Bottom-right rank + suit (inverted) */}
      <div className="leading-none flex flex-col items-center w-fit self-end rotate-180" style={{ color: suitColor }}>
        <span className={cfg.rank}>{label}</span>
        <span className={cfg.suit}>{symbol}</span>
      </div>
    </div>
  );
}
