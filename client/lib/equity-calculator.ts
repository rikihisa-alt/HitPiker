// Monte Carlo equity calculator for all-in situations
import { Card, Suit, Rank } from '../../shared/types/card';
import { evaluateBestHand } from './engine/hand-evaluator';

const ALL_SUITS: Suit[] = ['spade', 'heart', 'diamond', 'club'];
const ALL_RANKS: Rank[] = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];

function createFullDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of ALL_SUITS) {
    for (const rank of ALL_RANKS) {
      deck.push({ suit, rank });
    }
  }
  return deck;
}

function cardKey(card: Card): string {
  return `${card.suit}-${card.rank}`;
}

// Fisher-Yates partial shuffle: only shuffle the first `count` positions
function partialShuffle(arr: Card[], count: number): void {
  for (let i = 0; i < count && i < arr.length - 1; i++) {
    const j = i + Math.floor(Math.random() * (arr.length - i));
    const tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  }
}

export interface PlayerEquity {
  playerId: string;
  playerName: string;
  equity: number; // 0-100 percentage
}

export interface EquityResult {
  players: PlayerEquity[];
  simulations: number;
}

/**
 * Monte Carlo equity calculation.
 * Deals remaining board cards 1000 times and evaluates each player's win %.
 */
export function calculateEquity(
  playerHands: { playerId: string; playerName: string; holeCards: Card[] }[],
  board: Card[],
  simulations: number = 1000
): EquityResult {
  if (playerHands.length === 0) {
    return { players: [], simulations: 0 };
  }

  // If only one player, they have 100% equity
  if (playerHands.length === 1) {
    return {
      players: [{
        playerId: playerHands[0].playerId,
        playerName: playerHands[0].playerName,
        equity: 100,
      }],
      simulations: 0,
    };
  }

  // Cards already dealt (known)
  const usedCards = new Set<string>();
  for (const ph of playerHands) {
    for (const c of ph.holeCards) {
      usedCards.add(cardKey(c));
    }
  }
  for (const c of board) {
    usedCards.add(cardKey(c));
  }

  // Remaining deck
  const remainingDeck = createFullDeck().filter(c => !usedCards.has(cardKey(c)));
  const cardsNeeded = 5 - board.length;

  // If board is complete, just evaluate once
  if (cardsNeeded === 0) {
    const wins = new Map<string, number>();
    for (const ph of playerHands) {
      wins.set(ph.playerId, 0);
    }

    const evals = playerHands.map(ph => ({
      playerId: ph.playerId,
      score: evaluateBestHand([...ph.holeCards, ...board]).score,
    }));

    const bestScore = Math.max(...evals.map(e => e.score));
    const winnerCount = evals.filter(e => e.score === bestScore).length;

    for (const e of evals) {
      if (e.score === bestScore) {
        wins.set(e.playerId, 1 / winnerCount);
      }
    }

    return {
      players: playerHands.map(ph => ({
        playerId: ph.playerId,
        playerName: ph.playerName,
        equity: Math.round((wins.get(ph.playerId) ?? 0) * 100),
      })),
      simulations: 1,
    };
  }

  // Monte Carlo simulation
  const winCounts = new Map<string, number>();
  for (const ph of playerHands) {
    winCounts.set(ph.playerId, 0);
  }

  const deckCopy = [...remainingDeck];

  for (let sim = 0; sim < simulations; sim++) {
    // Partial shuffle to get random cards efficiently
    partialShuffle(deckCopy, cardsNeeded);
    const simBoard = [...board, ...deckCopy.slice(0, cardsNeeded)];

    // Evaluate each player
    let bestScore = -1;
    const scores: { playerId: string; score: number }[] = [];

    for (const ph of playerHands) {
      const allCards = [...ph.holeCards, ...simBoard];
      const score = evaluateBestHand(allCards).score;
      scores.push({ playerId: ph.playerId, score });
      if (score > bestScore) bestScore = score;
    }

    // Count winners (could be a tie)
    const winners = scores.filter(s => s.score === bestScore);
    const share = 1 / winners.length;

    for (const w of winners) {
      winCounts.set(w.playerId, (winCounts.get(w.playerId) ?? 0) + share);
    }
  }

  return {
    players: playerHands.map(ph => ({
      playerId: ph.playerId,
      playerName: ph.playerName,
      equity: Math.round(((winCounts.get(ph.playerId) ?? 0) / simulations) * 100),
    })),
    simulations,
  };
}
