// Given hole cards and board, return the best hand name string
import { Card, Rank, Suit } from '../../shared/types/card';

const RANK_NAMES: Record<Rank, string> = {
  2: '2', 3: '3', 4: '4', 5: '5', 6: '6', 7: '7', 8: '8', 9: '9',
  10: '10', 11: 'J', 12: 'Q', 13: 'K', 14: 'A',
};

const SUIT_SYMBOLS: Record<Suit, string> = {
  spade: '\u2660', heart: '\u2665', diamond: '\u2666', club: '\u2663',
};

function rankName(r: Rank): string {
  return RANK_NAMES[r];
}

function rankNamePlural(r: Rank): string {
  const n = RANK_NAMES[r];
  if (n === '6') return 'Sixes';
  return n + (n.length === 1 ? 's' : 's');
}

function rankNameFull(r: Rank): string {
  const map: Partial<Record<Rank, string>> = {
    14: 'Aces', 13: 'Kings', 12: 'Queens', 11: 'Jacks', 10: 'Tens',
    9: 'Nines', 8: 'Eights', 7: 'Sevens', 6: 'Sixes', 5: 'Fives',
    4: 'Fours', 3: 'Threes', 2: 'Twos',
  };
  return map[r] ?? String(r);
}

// ---------- combinatorics ----------

function combinations(arr: Card[], k: number): Card[][] {
  if (k === 0) return [[]];
  if (arr.length < k) return [];
  const result: Card[][] = [];
  const first = arr[0];
  const rest = arr.slice(1);
  for (const combo of combinations(rest, k - 1)) {
    result.push([first, ...combo]);
  }
  for (const combo of combinations(rest, k)) {
    result.push(combo);
  }
  return result;
}

// ---------- hand evaluation ----------

interface HandScore {
  category: number; // 9 = royal flush ... 0 = high card
  ranks: number[];  // tiebreaker ranks descending
  name: string;
}

function evaluateFive(cards: Card[]): HandScore {
  const ranks = cards.map((c) => c.rank).sort((a, b) => b - a);
  const suits = cards.map((c) => c.suit);

  const isFlush = suits.every((s) => s === suits[0]);

  // Check straight
  let isStraight = false;
  let straightHigh = 0;

  // Normal straight check
  if (ranks[0] - ranks[4] === 4 && new Set(ranks).size === 5) {
    isStraight = true;
    straightHigh = ranks[0];
  }
  // Wheel (A-2-3-4-5)
  if (
    ranks[0] === 14 &&
    ranks[1] === 5 &&
    ranks[2] === 4 &&
    ranks[3] === 3 &&
    ranks[4] === 2
  ) {
    isStraight = true;
    straightHigh = 5;
  }

  // Count ranks
  const countMap = new Map<number, number>();
  for (const r of ranks) {
    countMap.set(r, (countMap.get(r) ?? 0) + 1);
  }
  const counts = Array.from(countMap.entries())
    .sort((a, b) => b[1] - a[1] || b[0] - a[0]);

  const pattern = counts.map((c) => c[1]).join('');

  if (isFlush && isStraight) {
    if (straightHigh === 14) {
      return { category: 9, ranks: [14], name: 'Royal Flush' };
    }
    return {
      category: 8,
      ranks: [straightHigh],
      name: `Straight Flush (${rankName(straightHigh as Rank)} high)`,
    };
  }

  if (pattern === '41') {
    return {
      category: 7,
      ranks: [counts[0][0], counts[1][0]],
      name: `Four of a Kind (${rankNameFull(counts[0][0] as Rank)})`,
    };
  }

  if (pattern === '32') {
    return {
      category: 6,
      ranks: [counts[0][0], counts[1][0]],
      name: `Full House (${rankNameFull(counts[0][0] as Rank)} full of ${rankNameFull(counts[1][0] as Rank)})`,
    };
  }

  if (isFlush) {
    return {
      category: 5,
      ranks: ranks.slice(),
      name: `Flush (${rankName(ranks[0] as Rank)} high)`,
    };
  }

  if (isStraight) {
    return {
      category: 4,
      ranks: [straightHigh],
      name: `Straight (${rankName(straightHigh as Rank)} high)`,
    };
  }

  if (pattern === '311') {
    return {
      category: 3,
      ranks: [counts[0][0], counts[1][0], counts[2][0]],
      name: `Three of a Kind (${rankNameFull(counts[0][0] as Rank)})`,
    };
  }

  if (pattern === '221') {
    return {
      category: 2,
      ranks: [counts[0][0], counts[1][0], counts[2][0]],
      name: `Two Pair (${rankNameFull(counts[0][0] as Rank)} and ${rankNameFull(counts[1][0] as Rank)})`,
    };
  }

  if (pattern === '2111') {
    return {
      category: 1,
      ranks: [counts[0][0], ...counts.slice(1).map((c) => c[0])],
      name: `Pair of ${rankNameFull(counts[0][0] as Rank)}`,
    };
  }

  return {
    category: 0,
    ranks: ranks.slice(),
    name: `High Card: ${rankName(ranks[0] as Rank)}`,
  };
}

function compareHands(a: HandScore, b: HandScore): number {
  if (a.category !== b.category) return a.category - b.category;
  for (let i = 0; i < Math.min(a.ranks.length, b.ranks.length); i++) {
    if (a.ranks[i] !== b.ranks[i]) return a.ranks[i] - b.ranks[i];
  }
  return 0;
}

// ---------- public API ----------

function describeHoleCards(cards: Card[]): string {
  if (cards.length !== 2) return '';
  const [a, b] = cards;
  if (a.rank === b.rank) {
    return `Pocket ${rankNameFull(a.rank)}`;
  }
  const high = a.rank > b.rank ? a : b;
  const low = a.rank > b.rank ? b : a;
  return `${rankName(high.rank)}${SUIT_SYMBOLS[high.suit]} ${rankName(low.rank)}${SUIT_SYMBOLS[low.suit]}`;
}

export function getHandName(holeCards: Card[], board: Card[]): string {
  if (holeCards.length === 0) return '';

  if (board.length === 0) {
    return describeHoleCards(holeCards);
  }

  const all = [...holeCards, ...board];

  if (all.length < 5) {
    // Not enough for a full hand - just describe hole cards
    return describeHoleCards(holeCards);
  }

  const combos = combinations(all, 5);
  let best: HandScore | null = null;

  for (const combo of combos) {
    const score = evaluateFive(combo);
    if (!best || compareHands(score, best) > 0) {
      best = score;
    }
  }

  return best?.name ?? '';
}
