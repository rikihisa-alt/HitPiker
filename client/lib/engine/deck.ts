// デッキ生成・シャッフル・配布
import { Card, Suit, Rank } from '../../../shared/types/card';

const SUITS: Suit[] = ['spade', 'heart', 'diamond', 'club'];
const RANKS: Rank[] = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];

export function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ suit, rank });
    }
  }
  return deck;
}

// Fisher-Yatesシャッフル
export function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export class DeckManager {
  private cards: Card[];
  private index: number;

  constructor() {
    this.cards = shuffleDeck(createDeck());
    this.index = 0;
  }

  deal(count: number): Card[] {
    if (this.index + count > this.cards.length) {
      throw new Error('Not enough cards in deck');
    }
    const dealt = this.cards.slice(this.index, this.index + count);
    this.index += count;
    return dealt;
  }

  dealOne(): Card {
    return this.deal(1)[0];
  }

  // バーンカード（1枚捨てる）
  burn(): void {
    if (this.index >= this.cards.length) {
      throw new Error('Not enough cards to burn');
    }
    this.index++;
  }

  remaining(): number {
    return this.cards.length - this.index;
  }

  reset(): void {
    this.cards = shuffleDeck(createDeck());
    this.index = 0;
  }
}
