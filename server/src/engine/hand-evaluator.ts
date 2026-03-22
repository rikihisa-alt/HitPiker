// 5枚（以上）からの最強ハンド評価
import { Card, Rank } from '../../../shared/types/card';

export enum HandRank {
  HIGH_CARD = 0,
  ONE_PAIR = 1,
  TWO_PAIR = 2,
  THREE_OF_A_KIND = 3,
  STRAIGHT = 4,
  FLUSH = 5,
  FULL_HOUSE = 6,
  FOUR_OF_A_KIND = 7,
  STRAIGHT_FLUSH = 8,
  ROYAL_FLUSH = 9,
}

export const HAND_NAMES: Record<HandRank, string> = {
  [HandRank.HIGH_CARD]: 'High Card',
  [HandRank.ONE_PAIR]: 'One Pair',
  [HandRank.TWO_PAIR]: 'Two Pair',
  [HandRank.THREE_OF_A_KIND]: 'Three of a Kind',
  [HandRank.STRAIGHT]: 'Straight',
  [HandRank.FLUSH]: 'Flush',
  [HandRank.FULL_HOUSE]: 'Full House',
  [HandRank.FOUR_OF_A_KIND]: 'Four of a Kind',
  [HandRank.STRAIGHT_FLUSH]: 'Straight Flush',
  [HandRank.ROYAL_FLUSH]: 'Royal Flush',
};

export interface HandEvaluation {
  rank: HandRank;
  score: number; // 比較用数値（大きいほど強い）
  name: string;
  bestFive: Card[];
}

// 5枚の組み合わせを全列挙
function combinations(cards: Card[], k: number): Card[][] {
  if (k === 0) return [[]];
  if (cards.length < k) return [];
  const result: Card[][] = [];
  const [first, ...rest] = cards;
  // firstを含む
  for (const combo of combinations(rest, k - 1)) {
    result.push([first, ...combo]);
  }
  // firstを含まない
  for (const combo of combinations(rest, k)) {
    result.push(combo);
  }
  return result;
}

function getRankCounts(cards: Card[]): Map<Rank, number> {
  const counts = new Map<Rank, number>();
  for (const card of cards) {
    counts.set(card.rank, (counts.get(card.rank) ?? 0) + 1);
  }
  return counts;
}

function isFlush(cards: Card[]): boolean {
  return cards.every(c => c.suit === cards[0].suit);
}

function isStraight(cards: Card[]): boolean {
  const ranks = cards.map(c => c.rank).sort((a, b) => a - b);
  // A-2-3-4-5 (wheel)
  if (ranks[4] === 14 && ranks[0] === 2 && ranks[1] === 3 && ranks[2] === 4 && ranks[3] === 5) {
    return true;
  }
  for (let i = 1; i < ranks.length; i++) {
    if (ranks[i] !== ranks[i - 1] + 1) return false;
  }
  return true;
}

function getStraightHighCard(cards: Card[]): Rank {
  const ranks = cards.map(c => c.rank).sort((a, b) => a - b);
  // A-2-3-4-5 wheel: high card is 5
  if (ranks[4] === 14 && ranks[0] === 2) {
    return 5 as Rank;
  }
  return ranks[4];
}

// 5枚のハンドを評価してスコアを返す
function evaluateFiveCards(cards: Card[]): { rank: HandRank; score: number } {
  const flush = isFlush(cards);
  const straight = isStraight(cards);
  const counts = getRankCounts(cards);
  const sortedRanks = cards.map(c => c.rank).sort((a, b) => b - a);

  // スコア計算: ハンドランク * 10^10 + キッカー情報
  // これで同ランクハンドの比較が可能

  if (flush && straight) {
    const high = getStraightHighCard(cards);
    if (high === 14) {
      return { rank: HandRank.ROYAL_FLUSH, score: HandRank.ROYAL_FLUSH * 1e10 + 14 };
    }
    return { rank: HandRank.STRAIGHT_FLUSH, score: HandRank.STRAIGHT_FLUSH * 1e10 + high };
  }

  const entries = Array.from(counts.entries());
  entries.sort((a, b) => b[1] - a[1] || b[0] - a[0]);

  if (entries[0][1] === 4) {
    const quad = entries[0][0];
    const kicker = entries[1][0];
    return {
      rank: HandRank.FOUR_OF_A_KIND,
      score: HandRank.FOUR_OF_A_KIND * 1e10 + quad * 100 + kicker,
    };
  }

  if (entries[0][1] === 3 && entries[1][1] === 2) {
    const trips = entries[0][0];
    const pair = entries[1][0];
    return {
      rank: HandRank.FULL_HOUSE,
      score: HandRank.FULL_HOUSE * 1e10 + trips * 100 + pair,
    };
  }

  if (flush) {
    let s = 0;
    for (let i = 0; i < sortedRanks.length; i++) {
      s += sortedRanks[i] * Math.pow(15, 4 - i);
    }
    return { rank: HandRank.FLUSH, score: HandRank.FLUSH * 1e10 + s };
  }

  if (straight) {
    const high = getStraightHighCard(cards);
    return { rank: HandRank.STRAIGHT, score: HandRank.STRAIGHT * 1e10 + high };
  }

  if (entries[0][1] === 3) {
    const trips = entries[0][0];
    const kickers = entries.filter(e => e[1] === 1).map(e => e[0]).sort((a, b) => b - a);
    return {
      rank: HandRank.THREE_OF_A_KIND,
      score: HandRank.THREE_OF_A_KIND * 1e10 + trips * 1e4 + kickers[0] * 15 + kickers[1],
    };
  }

  if (entries[0][1] === 2 && entries[1][1] === 2) {
    const pairs = entries.filter(e => e[1] === 2).map(e => e[0]).sort((a, b) => b - a);
    const kicker = entries.find(e => e[1] === 1)![0];
    return {
      rank: HandRank.TWO_PAIR,
      score: HandRank.TWO_PAIR * 1e10 + pairs[0] * 1e4 + pairs[1] * 15 + kicker,
    };
  }

  if (entries[0][1] === 2) {
    const pair = entries[0][0];
    const kickers = entries.filter(e => e[1] === 1).map(e => e[0]).sort((a, b) => b - a);
    return {
      rank: HandRank.ONE_PAIR,
      score: HandRank.ONE_PAIR * 1e10 + pair * 1e6 + kickers[0] * 225 + kickers[1] * 15 + kickers[2],
    };
  }

  // High card
  let s = 0;
  for (let i = 0; i < sortedRanks.length; i++) {
    s += sortedRanks[i] * Math.pow(15, 4 - i);
  }
  return { rank: HandRank.HIGH_CARD, score: HandRank.HIGH_CARD * 1e10 + s };
}

// 持ちカード+ボードから最強の5枚組み合わせを見つける
export function evaluateBestHand(cards: Card[]): HandEvaluation {
  if (cards.length < 5) {
    // 5枚未満の場合は全カードで評価（ゲーム途中での判定用）
    const padded = [...cards];
    while (padded.length < 5) {
      padded.push({ suit: 'spade', rank: 2 as Rank }); // ダミー
    }
    const result = evaluateFiveCards(padded);
    return {
      rank: result.rank,
      score: result.score,
      name: HAND_NAMES[result.rank],
      bestFive: cards,
    };
  }

  const combos = combinations(cards, 5);
  let best: { rank: HandRank; score: number } = { rank: HandRank.HIGH_CARD, score: -1 };
  let bestCards: Card[] = combos[0];

  for (const combo of combos) {
    const evaluation = evaluateFiveCards(combo);
    if (evaluation.score > best.score) {
      best = evaluation;
      bestCards = combo;
    }
  }

  return {
    rank: best.rank,
    score: best.score,
    name: HAND_NAMES[best.rank],
    bestFive: bestCards,
  };
}

// HIT判定用: ハンドランクのみ取得
export function getBestHandRank(cards: Card[]): HandRank {
  if (cards.length < 5) {
    // 5枚未満の場合、可能な範囲で評価
    const counts = getRankCounts(cards);
    const maxCount = Math.max(...counts.values());
    if (maxCount >= 4) return HandRank.FOUR_OF_A_KIND;
    if (maxCount === 3) {
      if (counts.size <= cards.length - 3 && Array.from(counts.values()).filter(v => v >= 2).length >= 2) {
        return HandRank.FULL_HOUSE;
      }
      return HandRank.THREE_OF_A_KIND;
    }
    const pairs = Array.from(counts.values()).filter(v => v === 2).length;
    if (pairs >= 2) return HandRank.TWO_PAIR;
    if (pairs === 1) return HandRank.ONE_PAIR;
    return HandRank.HIGH_CARD;
  }
  return evaluateBestHand(cards).rank;
}

// 複数プレイヤーのハンドを比較して勝者を返す
export function compareHands(
  playerHands: { playerId: string; cards: Card[] }[]
): { winnersIds: string[]; handName: string } {
  const evaluations = playerHands.map(ph => ({
    playerId: ph.playerId,
    evaluation: evaluateBestHand(ph.cards),
  }));

  evaluations.sort((a, b) => b.evaluation.score - a.evaluation.score);

  const bestScore = evaluations[0].evaluation.score;
  const winners = evaluations.filter(e => e.evaluation.score === bestScore);

  return {
    winnersIds: winners.map(w => w.playerId),
    handName: winners[0].evaluation.name,
  };
}
