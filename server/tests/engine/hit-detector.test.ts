import { Card, Rank, Suit } from '../../../shared/types/card';
import { PlayerState, PlayerHitState, createDefaultHitState } from '../../../shared/types/player';
import { GamePhase } from '../../../shared/types/game';
import {
  detectPocketPairHit,
  detectBoardHit,
  tryRevealHit,
  forceRevealIfQualified,
  initializeHitState,
} from '../../src/engine/hit-detector';

// Helper to create a card
function card(rank: Rank, suit: Suit = 'spade'): Card {
  return { rank, suit };
}

// Helper to create a minimal PlayerState
function makePlayer(overrides: Partial<PlayerState> = {}): PlayerState {
  return {
    id: 'p1',
    seatIndex: 0,
    name: 'Test',
    stack: 10000,
    holeCards: [],
    currentBet: 0,
    totalBet: 0,
    folded: false,
    allIn: false,
    disconnected: false,
    isDealer: false,
    isSB: false,
    isBB: false,
    lastAction: null,
    hit: createDefaultHitState(),
    ...overrides,
  };
}

describe('detectPocketPairHit', () => {
  it('returns true for a pocket pair', () => {
    expect(detectPocketPairHit([card(10), card(10, 'heart')])).toBe(true);
  });

  it('returns true for pocket aces', () => {
    expect(detectPocketPairHit([card(14), card(14, 'diamond')])).toBe(true);
  });

  it('returns false for non-pair hole cards', () => {
    expect(detectPocketPairHit([card(10), card(11)])).toBe(false);
  });

  it('returns false for empty array', () => {
    expect(detectPocketPairHit([])).toBe(false);
  });

  it('returns false for single card', () => {
    expect(detectPocketPairHit([card(5)])).toBe(false);
  });

  it('returns false for three cards', () => {
    expect(detectPocketPairHit([card(5), card(5), card(5)])).toBe(false);
  });
});

describe('detectBoardHit', () => {
  it('returns true when flop creates first one-pair', () => {
    const holeCards = [card(10, 'spade'), card(8, 'heart')];
    const prevBoard: Card[] = [];
    const board = [card(10, 'diamond'), card(3, 'club'), card(7, 'heart')];
    expect(detectBoardHit(holeCards, board, prevBoard)).toBe(true);
  });

  it('returns true when turn creates first one-pair', () => {
    const holeCards = [card(10, 'spade'), card(8, 'heart')];
    const prevBoard = [card(2, 'diamond'), card(3, 'club'), card(7, 'heart')];
    const board = [...prevBoard, card(8, 'diamond')];
    expect(detectBoardHit(holeCards, board, prevBoard)).toBe(true);
  });

  it('returns false when no pair formed', () => {
    const holeCards = [card(10, 'spade'), card(8, 'heart')];
    const prevBoard: Card[] = [];
    const board = [card(2, 'diamond'), card(3, 'club'), card(7, 'heart')];
    expect(detectBoardHit(holeCards, board, prevBoard)).toBe(false);
  });

  it('returns false when two-pair forms (not just one-pair)', () => {
    const holeCards = [card(10, 'spade'), card(8, 'heart')];
    const prevBoard: Card[] = [];
    const board = [card(10, 'diamond'), card(8, 'club'), card(7, 'heart')];
    expect(detectBoardHit(holeCards, board, prevBoard)).toBe(false);
  });

  it('returns false when pair already existed on previous street', () => {
    const holeCards = [card(10, 'spade'), card(8, 'heart')];
    const prevBoard = [card(10, 'diamond'), card(3, 'club'), card(7, 'heart')];
    const board = [...prevBoard, card(2, 'club')];
    expect(detectBoardHit(holeCards, board, prevBoard)).toBe(false);
  });

  it('returns false for three-of-a-kind on new street', () => {
    const holeCards = [card(10, 'spade'), card(10, 'heart')];
    const prevBoard: Card[] = [];
    const board = [card(10, 'diamond'), card(3, 'club'), card(7, 'heart')];
    // pocket pair already gives ONE_PAIR before flop, so prev is ONE_PAIR, new is THREE_OF_A_KIND
    expect(detectBoardHit(holeCards, board, prevBoard)).toBe(false);
  });

  it('returns false for invalid hole cards (not 2 cards)', () => {
    expect(detectBoardHit([card(10)], [card(10, 'heart'), card(3), card(7)], [])).toBe(false);
  });
});

describe('tryRevealHit', () => {
  it('reveals hit when hitQualified=true and hitRevealed=false', () => {
    const player = makePlayer({
      hit: {
        hitQualified: true,
        hitRevealed: false,
        hitSource: 'pocket',
        hitStreet: null,
        mustShowIfNotFolded: false,
      },
    });
    const result = tryRevealHit(player, 'preflop');
    expect(result.hitRevealed).toBe(true);
    expect(result.mustShowIfNotFolded).toBe(true);
    expect(result.hitStreet).toBe('preflop');
  });

  it('sets hitStreet to the current phase', () => {
    const player = makePlayer({
      hit: {
        hitQualified: true,
        hitRevealed: false,
        hitSource: 'board',
        hitStreet: null,
        mustShowIfNotFolded: false,
      },
    });
    const result = tryRevealHit(player, 'flop');
    expect(result.hitStreet).toBe('flop');
  });

  it('does not reveal if hitQualified=false', () => {
    const player = makePlayer({
      hit: {
        hitQualified: false,
        hitRevealed: false,
        hitSource: null,
        hitStreet: null,
        mustShowIfNotFolded: false,
      },
    });
    const result = tryRevealHit(player, 'preflop');
    expect(result.hitRevealed).toBe(false);
    expect(result.mustShowIfNotFolded).toBe(false);
  });

  it('does not re-reveal if already revealed', () => {
    const player = makePlayer({
      hit: {
        hitQualified: true,
        hitRevealed: true,
        hitSource: 'pocket',
        hitStreet: 'preflop',
        mustShowIfNotFolded: true,
      },
    });
    const result = tryRevealHit(player, 'flop');
    // Should remain unchanged
    expect(result.hitStreet).toBe('preflop');
  });

  it('does not mutate the original player state', () => {
    const player = makePlayer({
      hit: {
        hitQualified: true,
        hitRevealed: false,
        hitSource: 'pocket',
        hitStreet: null,
        mustShowIfNotFolded: false,
      },
    });
    tryRevealHit(player, 'preflop');
    expect(player.hit.hitRevealed).toBe(false);
  });
});

describe('forceRevealIfQualified', () => {
  it('reveals hit for all-in player who is qualified and not yet revealed', () => {
    const player = makePlayer({
      allIn: true,
      hit: {
        hitQualified: true,
        hitRevealed: false,
        hitSource: 'board',
        hitStreet: null,
        mustShowIfNotFolded: false,
      },
    });
    const result = forceRevealIfQualified(player);
    expect(result.hitRevealed).toBe(true);
    expect(result.mustShowIfNotFolded).toBe(true);
  });

  it('does not reveal if player has folded', () => {
    const player = makePlayer({
      folded: true,
      hit: {
        hitQualified: true,
        hitRevealed: false,
        hitSource: 'board',
        hitStreet: null,
        mustShowIfNotFolded: false,
      },
    });
    const result = forceRevealIfQualified(player);
    expect(result.hitRevealed).toBe(false);
  });

  it('does not reveal if not qualified', () => {
    const player = makePlayer({
      hit: {
        hitQualified: false,
        hitRevealed: false,
        hitSource: null,
        hitStreet: null,
        mustShowIfNotFolded: false,
      },
    });
    const result = forceRevealIfQualified(player);
    expect(result.hitRevealed).toBe(false);
  });

  it('does not re-reveal if already revealed', () => {
    const player = makePlayer({
      hit: {
        hitQualified: true,
        hitRevealed: true,
        hitSource: 'pocket',
        hitStreet: 'preflop',
        mustShowIfNotFolded: true,
      },
    });
    const result = forceRevealIfQualified(player);
    expect(result.hitRevealed).toBe(true);
  });
});

describe('initializeHitState', () => {
  it('sets hitQualified=true and hitSource=pocket for pocket pair', () => {
    const result = initializeHitState([card(9, 'spade'), card(9, 'heart')]);
    expect(result.hitQualified).toBe(true);
    expect(result.hitSource).toBe('pocket');
    expect(result.hitRevealed).toBe(false);
    expect(result.hitStreet).toBeNull();
    expect(result.mustShowIfNotFolded).toBe(false);
  });

  it('sets hitQualified=false and hitSource=null for non-pair', () => {
    const result = initializeHitState([card(9, 'spade'), card(10, 'heart')]);
    expect(result.hitQualified).toBe(false);
    expect(result.hitSource).toBeNull();
  });

  it('sets hitQualified=false for empty cards', () => {
    const result = initializeHitState([]);
    expect(result.hitQualified).toBe(false);
  });
});
