import { Card, Rank, Suit } from '../../../shared/types/card';
import {
  evaluateBestHand,
  compareHands,
  getBestHandRank,
  HandRank,
} from '../../src/engine/hand-evaluator';

function card(rank: Rank, suit: Suit = 'spade'): Card {
  return { rank, suit };
}

describe('evaluateBestHand - hand rank identification', () => {
  it('identifies Royal Flush', () => {
    const cards = [
      card(14, 'heart'), card(13, 'heart'), card(12, 'heart'),
      card(11, 'heart'), card(10, 'heart'), card(3, 'club'), card(2, 'diamond'),
    ];
    const result = evaluateBestHand(cards);
    expect(result.rank).toBe(HandRank.ROYAL_FLUSH);
    expect(result.name).toBe('Royal Flush');
  });

  it('identifies Straight Flush', () => {
    const cards = [
      card(9, 'club'), card(8, 'club'), card(7, 'club'),
      card(6, 'club'), card(5, 'club'), card(2, 'heart'), card(3, 'diamond'),
    ];
    const result = evaluateBestHand(cards);
    expect(result.rank).toBe(HandRank.STRAIGHT_FLUSH);
    expect(result.name).toBe('Straight Flush');
  });

  it('identifies wheel Straight Flush (A-2-3-4-5)', () => {
    const cards = [
      card(14, 'diamond'), card(2, 'diamond'), card(3, 'diamond'),
      card(4, 'diamond'), card(5, 'diamond'), card(9, 'heart'), card(10, 'club'),
    ];
    const result = evaluateBestHand(cards);
    expect(result.rank).toBe(HandRank.STRAIGHT_FLUSH);
  });

  it('identifies Four of a Kind', () => {
    const cards = [
      card(8, 'spade'), card(8, 'heart'), card(8, 'diamond'),
      card(8, 'club'), card(14, 'spade'), card(3, 'heart'), card(2, 'club'),
    ];
    const result = evaluateBestHand(cards);
    expect(result.rank).toBe(HandRank.FOUR_OF_A_KIND);
    expect(result.name).toBe('Four of a Kind');
  });

  it('identifies Full House', () => {
    const cards = [
      card(10, 'spade'), card(10, 'heart'), card(10, 'diamond'),
      card(5, 'club'), card(5, 'spade'), card(2, 'heart'), card(3, 'club'),
    ];
    const result = evaluateBestHand(cards);
    expect(result.rank).toBe(HandRank.FULL_HOUSE);
    expect(result.name).toBe('Full House');
  });

  it('identifies Flush', () => {
    const cards = [
      card(14, 'heart'), card(10, 'heart'), card(7, 'heart'),
      card(4, 'heart'), card(2, 'heart'), card(13, 'club'), card(12, 'diamond'),
    ];
    const result = evaluateBestHand(cards);
    expect(result.rank).toBe(HandRank.FLUSH);
    expect(result.name).toBe('Flush');
  });

  it('identifies Straight', () => {
    const cards = [
      card(9, 'spade'), card(8, 'heart'), card(7, 'diamond'),
      card(6, 'club'), card(5, 'spade'), card(2, 'heart'), card(3, 'club'),
    ];
    const result = evaluateBestHand(cards);
    expect(result.rank).toBe(HandRank.STRAIGHT);
    expect(result.name).toBe('Straight');
  });

  it('identifies wheel Straight (A-2-3-4-5)', () => {
    const cards = [
      card(14, 'spade'), card(2, 'heart'), card(3, 'diamond'),
      card(4, 'club'), card(5, 'spade'), card(9, 'heart'), card(10, 'club'),
    ];
    const result = evaluateBestHand(cards);
    expect(result.rank).toBe(HandRank.STRAIGHT);
  });

  it('identifies Three of a Kind', () => {
    const cards = [
      card(7, 'spade'), card(7, 'heart'), card(7, 'diamond'),
      card(13, 'club'), card(2, 'spade'), card(4, 'heart'), card(9, 'club'),
    ];
    const result = evaluateBestHand(cards);
    expect(result.rank).toBe(HandRank.THREE_OF_A_KIND);
    expect(result.name).toBe('Three of a Kind');
  });

  it('identifies Two Pair', () => {
    const cards = [
      card(10, 'spade'), card(10, 'heart'), card(5, 'diamond'),
      card(5, 'club'), card(14, 'spade'), card(3, 'heart'), card(2, 'club'),
    ];
    const result = evaluateBestHand(cards);
    expect(result.rank).toBe(HandRank.TWO_PAIR);
    expect(result.name).toBe('Two Pair');
  });

  it('identifies One Pair', () => {
    const cards = [
      card(10, 'spade'), card(10, 'heart'), card(14, 'diamond'),
      card(8, 'club'), card(3, 'spade'), card(2, 'heart'), card(6, 'club'),
    ];
    const result = evaluateBestHand(cards);
    expect(result.rank).toBe(HandRank.ONE_PAIR);
    expect(result.name).toBe('One Pair');
  });

  it('identifies High Card', () => {
    const cards = [
      card(14, 'spade'), card(10, 'heart'), card(8, 'diamond'),
      card(6, 'club'), card(3, 'spade'), card(2, 'heart'), card(4, 'club'),
    ];
    const result = evaluateBestHand(cards);
    expect(result.rank).toBe(HandRank.HIGH_CARD);
    expect(result.name).toBe('High Card');
  });

  it('returns bestFive with exactly 5 cards', () => {
    const cards = [
      card(14, 'spade'), card(13, 'spade'), card(12, 'spade'),
      card(11, 'spade'), card(10, 'spade'), card(2, 'heart'), card(3, 'diamond'),
    ];
    const result = evaluateBestHand(cards);
    expect(result.bestFive).toHaveLength(5);
  });

  it('handles exactly 5 cards', () => {
    const cards = [
      card(14, 'spade'), card(13, 'heart'), card(10, 'diamond'),
      card(7, 'club'), card(3, 'spade'),
    ];
    const result = evaluateBestHand(cards);
    expect(result.rank).toBe(HandRank.HIGH_CARD);
  });
});

describe('compareHands', () => {
  it('identifies single winner with higher hand rank', () => {
    const result = compareHands([
      {
        playerId: 'p1',
        cards: [
          card(14, 'heart'), card(13, 'heart'), card(12, 'heart'),
          card(11, 'heart'), card(10, 'heart'), card(2, 'club'), card(3, 'diamond'),
        ],
      },
      {
        playerId: 'p2',
        cards: [
          card(8, 'spade'), card(8, 'heart'), card(8, 'diamond'),
          card(5, 'club'), card(5, 'spade'), card(2, 'heart'), card(3, 'club'),
        ],
      },
    ]);
    expect(result.winnersIds).toEqual(['p1']);
    expect(result.handName).toBe('Royal Flush');
  });

  it('identifies tie (split pot)', () => {
    // Both players have the same straight from the board
    const board = [
      card(10, 'spade'), card(9, 'heart'), card(8, 'diamond'),
      card(7, 'club'), card(6, 'spade'),
    ];
    const result = compareHands([
      { playerId: 'p1', cards: [...board, card(2, 'heart'), card(3, 'club')] },
      { playerId: 'p2', cards: [...board, card(2, 'diamond'), card(4, 'club')] },
    ]);
    expect(result.winnersIds).toContain('p1');
    expect(result.winnersIds).toContain('p2');
    expect(result.winnersIds).toHaveLength(2);
  });

  it('distinguishes same rank hands by kicker', () => {
    // Both one pair (tens), but p1 has Ace kicker, p2 has King kicker
    const result = compareHands([
      {
        playerId: 'p1',
        cards: [
          card(10, 'spade'), card(10, 'heart'), card(14, 'diamond'),
          card(8, 'club'), card(3, 'spade'), card(2, 'heart'), card(4, 'club'),
        ],
      },
      {
        playerId: 'p2',
        cards: [
          card(10, 'diamond'), card(10, 'club'), card(13, 'diamond'),
          card(8, 'heart'), card(3, 'diamond'), card(2, 'club'), card(4, 'heart'),
        ],
      },
    ]);
    expect(result.winnersIds).toEqual(['p1']);
    expect(result.handName).toBe('One Pair');
  });

  it('higher pair beats lower pair', () => {
    const result = compareHands([
      {
        playerId: 'p1',
        cards: [
          card(14, 'spade'), card(14, 'heart'), card(7, 'diamond'),
          card(5, 'club'), card(3, 'spade'), card(2, 'heart'), card(9, 'club'),
        ],
      },
      {
        playerId: 'p2',
        cards: [
          card(13, 'spade'), card(13, 'heart'), card(7, 'club'),
          card(5, 'diamond'), card(3, 'club'), card(2, 'diamond'), card(9, 'diamond'),
        ],
      },
    ]);
    expect(result.winnersIds).toEqual(['p1']);
  });

  it('flush beats straight', () => {
    const result = compareHands([
      {
        playerId: 'p1',
        cards: [
          card(14, 'heart'), card(10, 'heart'), card(7, 'heart'),
          card(4, 'heart'), card(2, 'heart'), card(13, 'club'), card(12, 'diamond'),
        ],
      },
      {
        playerId: 'p2',
        cards: [
          card(10, 'spade'), card(9, 'heart'), card(8, 'diamond'),
          card(7, 'club'), card(6, 'spade'), card(2, 'club'), card(3, 'diamond'),
        ],
      },
    ]);
    expect(result.winnersIds).toEqual(['p1']);
    expect(result.handName).toBe('Flush');
  });

  it('handles three-way comparison', () => {
    const result = compareHands([
      {
        playerId: 'p1',
        cards: [
          card(14, 'spade'), card(13, 'spade'), card(12, 'spade'),
          card(11, 'spade'), card(10, 'spade'), card(2, 'heart'), card(3, 'diamond'),
        ],
      },
      {
        playerId: 'p2',
        cards: [
          card(8, 'heart'), card(8, 'diamond'), card(8, 'club'),
          card(8, 'spade'), card(14, 'heart'), card(2, 'club'), card(3, 'club'),
        ],
      },
      {
        playerId: 'p3',
        cards: [
          card(7, 'heart'), card(7, 'diamond'), card(5, 'club'),
          card(5, 'heart'), card(14, 'diamond'), card(2, 'diamond'), card(3, 'heart'),
        ],
      },
    ]);
    expect(result.winnersIds).toEqual(['p1']);
    expect(result.handName).toBe('Royal Flush');
  });
});

describe('getBestHandRank', () => {
  it('returns HIGH_CARD for 2 unmatched cards', () => {
    expect(getBestHandRank([card(10), card(8, 'heart')])).toBe(HandRank.HIGH_CARD);
  });

  it('returns ONE_PAIR for pocket pair (2 cards)', () => {
    expect(getBestHandRank([card(10), card(10, 'heart')])).toBe(HandRank.ONE_PAIR);
  });

  it('returns ONE_PAIR for 3 cards with one pair', () => {
    expect(
      getBestHandRank([card(10), card(10, 'heart'), card(5, 'diamond')])
    ).toBe(HandRank.ONE_PAIR);
  });

  it('returns TWO_PAIR for 4 cards with two pair', () => {
    expect(
      getBestHandRank([card(10), card(10, 'heart'), card(5), card(5, 'heart')])
    ).toBe(HandRank.TWO_PAIR);
  });

  it('returns THREE_OF_A_KIND for 3 matching cards', () => {
    expect(
      getBestHandRank([card(10), card(10, 'heart'), card(10, 'diamond')])
    ).toBe(HandRank.THREE_OF_A_KIND);
  });

  it('returns FOUR_OF_A_KIND for 4 matching cards', () => {
    expect(
      getBestHandRank([card(10), card(10, 'heart'), card(10, 'diamond'), card(10, 'club')])
    ).toBe(HandRank.FOUR_OF_A_KIND);
  });

  it('returns correct rank for full 7-card hand', () => {
    const cards = [
      card(14, 'heart'), card(13, 'heart'), card(12, 'heart'),
      card(11, 'heart'), card(10, 'heart'), card(2, 'club'), card(3, 'diamond'),
    ];
    expect(getBestHandRank(cards)).toBe(HandRank.ROYAL_FLUSH);
  });

  it('returns FULL_HOUSE for 3+2 in partial hand', () => {
    // 3 tens + 2 fives = full house with 5 cards (falls through to evaluateBestHand)
    const cards = [
      card(10), card(10, 'heart'), card(10, 'diamond'), card(5), card(5, 'heart'),
    ];
    expect(getBestHandRank(cards)).toBe(HandRank.FULL_HOUSE);
  });

  it('returns STRAIGHT for 5-card straight', () => {
    const cards = [
      card(9, 'spade'), card(8, 'heart'), card(7, 'diamond'),
      card(6, 'club'), card(5, 'spade'),
    ];
    expect(getBestHandRank(cards)).toBe(HandRank.STRAIGHT);
  });

  it('returns FLUSH for 5-card flush', () => {
    const cards = [
      card(14, 'heart'), card(10, 'heart'), card(7, 'heart'),
      card(4, 'heart'), card(2, 'heart'),
    ];
    expect(getBestHandRank(cards)).toBe(HandRank.FLUSH);
  });
});
