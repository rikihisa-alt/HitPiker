export type Suit = 'spade' | 'heart' | 'diamond' | 'club';
export type Rank = 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14;
// 11=J, 12=Q, 13=K, 14=A

export interface Card {
  suit: Suit;
  rank: Rank;
}

export type HiddenCard = { hidden: true };
export type VisibleCard = Card;
export type ClientCard = VisibleCard | HiddenCard;

export function isVisibleCard(card: ClientCard): card is VisibleCard {
  return !('hidden' in card);
}
