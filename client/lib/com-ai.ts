// GTO-inspired COM AI for Hit Poker
// Position-aware, board-texture-aware, pot-odds-aware decision engine
import { GameState, GameAction, ActionType } from '../../shared/types/game';
import { PlayerState } from '../../shared/types/player';
import { Card, Rank, Suit } from '../../shared/types/card';
import { getAvailableActions } from './engine/bet-validator';
import { evaluateBestHand, HandRank } from './engine/hand-evaluator';
import { GAME_CONSTANTS } from '../../shared/constants/game';

// ---------------------------------------------------------------------------
// COM names
// ---------------------------------------------------------------------------
const COM_NAMES = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve'];

export function getComName(index: number): string {
  return COM_NAMES[index % COM_NAMES.length];
}

// ---------------------------------------------------------------------------
// COM action delay (cosmetic)
// ---------------------------------------------------------------------------
export function getComActionDelay(): number {
  return 800 + Math.floor(Math.random() * 1400); // 800ms - 2200ms
}

// ---------------------------------------------------------------------------
// Position classification for a 6-max table
// ---------------------------------------------------------------------------
type Position = 'UTG' | 'HJ' | 'CO' | 'BTN' | 'SB' | 'BB';

function getPosition(player: PlayerState, state: GameState): Position {
  if (player.isDealer) return 'BTN';
  if (player.isSB) return 'SB';
  if (player.isBB) return 'BB';

  // Determine relative position from dealer
  const activePlayers = state.players.filter(p => !p.folded && !p.disconnected);
  const dealerIdx = state.dealerIndex;
  const totalSeats = state.players.length;

  // Count how many seats ahead of the dealer (after SB/BB) this player is
  let seatsFromDealer = 0;
  for (let i = 1; i <= totalSeats; i++) {
    const idx = (dealerIdx + i) % totalSeats;
    const p = state.players[idx];
    if (p.id === player.id) break;
    if (!p.folded && !p.disconnected) seatsFromDealer++;
  }

  // In 6-max: SB=seat1, BB=seat2, UTG=seat3, HJ=seat4, CO=seat5, BTN=seat0
  // seatsFromDealer counts active players after dealer (excluding SB/BB)
  // Subtract 2 for SB/BB
  const posFromUtg = Math.max(0, seatsFromDealer - 2);
  const nonBlindActive = activePlayers.filter(p => !p.isSB && !p.isBB && !p.isDealer).length;

  if (nonBlindActive <= 1) return 'UTG';
  if (nonBlindActive === 2) return posFromUtg === 0 ? 'UTG' : 'CO';
  if (posFromUtg === 0) return 'UTG';
  if (posFromUtg >= nonBlindActive - 1) return 'CO';
  return 'HJ';
}

function isLatePosition(pos: Position): boolean {
  return pos === 'BTN' || pos === 'CO';
}

function isEarlyPosition(pos: Position): boolean {
  return pos === 'UTG';
}

// ---------------------------------------------------------------------------
// Preflop hand representation
// ---------------------------------------------------------------------------
interface PreflopHand {
  highRank: Rank;
  lowRank: Rank;
  isPair: boolean;
  isSuited: boolean;
  gap: number;
}

function classifyPreflopHand(cards: Card[]): PreflopHand {
  const [c1, c2] = cards;
  const highRank = Math.max(c1.rank, c2.rank) as Rank;
  const lowRank = Math.min(c1.rank, c2.rank) as Rank;
  return {
    highRank,
    lowRank,
    isPair: c1.rank === c2.rank,
    isSuited: c1.suit === c2.suit,
    gap: highRank - lowRank,
  };
}

// ---------------------------------------------------------------------------
// Preflop range check (position-aware)
// ---------------------------------------------------------------------------

// Check if hand is a pocket pair at or above threshold
function isPairAbove(hand: PreflopHand, minRank: Rank): boolean {
  return hand.isPair && hand.highRank >= minRank;
}

// Check suited hand: e.g., isSuitedHand(hand, 14, 10) checks for ATs+
function isSuitedAbove(hand: PreflopHand, high: Rank, minLow: Rank): boolean {
  return hand.isSuited && hand.highRank === high && hand.lowRank >= minLow;
}

// Check offsuit hand
function isOffsuitAbove(hand: PreflopHand, high: Rank, minLow: Rank): boolean {
  return !hand.isSuited && !hand.isPair && hand.highRank === high && hand.lowRank >= minLow;
}

// Check suited connector: both cards within gap and above minimum
function isSuitedConnector(hand: PreflopHand, minHigh: Rank, maxGap: number): boolean {
  return hand.isSuited && !hand.isPair && hand.gap <= maxGap && hand.highRank >= minHigh && hand.lowRank >= 4;
}

// Check if hand is suited broadway (both 10+)
function isSuitedBroadway(hand: PreflopHand): boolean {
  return hand.isSuited && hand.highRank >= 10 && hand.lowRank >= 10;
}

function isInEarlyRange(hand: PreflopHand): boolean {
  // AA-77, AKs-ATs, AKo-AJo, KQs
  if (isPairAbove(hand, 7)) return true;
  if (isSuitedAbove(hand, 14, 10)) return true;   // ATs+
  if (isOffsuitAbove(hand, 14, 11)) return true;   // AJo+
  if (hand.isSuited && hand.highRank === 13 && hand.lowRank === 12) return true; // KQs
  return false;
}

function isInMiddleRange(hand: PreflopHand): boolean {
  if (isInEarlyRange(hand)) return true;
  if (isPairAbove(hand, 5)) return true;            // 55-66
  if (isSuitedAbove(hand, 14, 9)) return true;      // A9s
  if (hand.isSuited && hand.highRank === 13 && hand.lowRank === 11) return true; // KJs
  if (hand.isSuited && hand.highRank === 12 && hand.lowRank === 11) return true; // QJs
  if (hand.isSuited && hand.highRank === 11 && hand.lowRank === 10) return true; // JTs
  return false;
}

function isInLateRange(hand: PreflopHand): boolean {
  if (isInMiddleRange(hand)) return true;
  if (hand.isPair) return true;                     // 22-44
  if (isSuitedAbove(hand, 14, 2)) return true;      // A2s+
  if (isSuitedAbove(hand, 13, 9)) return true;      // K9s+
  if (isSuitedBroadway(hand)) return true;           // any suited broadway
  if (isSuitedConnector(hand, 5, 1)) return true;    // 54s-87s (suited one-gappers)
  if (hand.isSuited && hand.gap <= 2 && hand.highRank >= 6 && hand.lowRank >= 4) return true; // suited connectors/one-gaps
  return false;
}

function isInSBRange(hand: PreflopHand): boolean {
  // SB: middle-ish range
  if (isInMiddleRange(hand)) return true;
  if (isPairAbove(hand, 2)) return true;
  if (isSuitedAbove(hand, 14, 2)) return true;
  if (isSuitedAbove(hand, 13, 10)) return true;
  return false;
}

function isInBBDefendRange(hand: PreflopHand): boolean {
  // BB defends ~40% of hands vs a single raise
  if (isInLateRange(hand)) return true;
  // Additionally defend with:
  if (isOffsuitAbove(hand, 14, 2)) return true;    // any Axo
  if (isOffsuitAbove(hand, 13, 10)) return true;   // KTo+
  if (isOffsuitAbove(hand, 12, 10)) return true;   // QTo+
  if (isOffsuitAbove(hand, 11, 10)) return true;   // JTo
  if (hand.isSuited && hand.gap <= 2 && hand.lowRank >= 3) return true; // wider suited connectors
  return false;
}

// 3-bet range (used conceptually, but Hit Poker forbids preflop 3-bet when raiseCount >= 1)
function isIn3BetRange(hand: PreflopHand, pos: Position): boolean {
  // Value 3-bets: AA-QQ, AKs
  if (isPairAbove(hand, 12)) return true;
  if (hand.isSuited && hand.highRank === 14 && hand.lowRank === 13) return true;
  // Bluff 3-bets from BTN/CO: A5s-A2s
  if ((pos === 'BTN' || pos === 'CO') && hand.isSuited && hand.highRank === 14 && hand.lowRank <= 5 && hand.lowRank >= 2) {
    return true;
  }
  return false;
}

function isInOpenRange(hand: PreflopHand, pos: Position): boolean {
  switch (pos) {
    case 'UTG': return isInEarlyRange(hand);
    case 'HJ': return isInMiddleRange(hand);
    case 'CO': return isInLateRange(hand);
    case 'BTN': return isInLateRange(hand);
    case 'SB': return isInSBRange(hand);
    case 'BB': return isInBBDefendRange(hand);
  }
}

// ---------------------------------------------------------------------------
// Preflop hand strength as a continuous value (for sizing/calling decisions)
// ---------------------------------------------------------------------------
function getPreflopStrength(hand: PreflopHand): number {
  // Scale 0-1 based on general hand quality
  if (hand.isPair) {
    // AA=1.0, KK=0.95, ... 22=0.45
    return 0.45 + (hand.highRank - 2) * (0.55 / 12);
  }

  let base = 0;
  // High card contribution
  base += (hand.highRank - 2) * 0.03;
  base += (hand.lowRank - 2) * 0.015;

  if (hand.isSuited) base += 0.06;
  if (hand.gap <= 1) base += 0.04;
  if (hand.gap <= 2) base += 0.02;

  // Broadway bonus
  if (hand.highRank >= 10 && hand.lowRank >= 10) base += 0.1;

  // Ace high
  if (hand.highRank === 14) base += 0.08;

  return Math.min(0.9, Math.max(0, base));
}

// ---------------------------------------------------------------------------
// Board texture analysis
// ---------------------------------------------------------------------------
interface BoardTexture {
  isMonotone: boolean;       // all same suit
  isTwoTone: boolean;        // two of one suit
  isRainbow: boolean;        // all different suits (on flop)
  isPaired: boolean;         // board has a pair
  isTrips: boolean;          // board has trips
  highCard: Rank;
  hasThreeToStraight: boolean;
  connectedness: number;     // 0=disconnected, 1=somewhat, 2=very connected
  wetness: number;           // 0-1 score: 0=dry, 1=very wet
}

function analyzeBoardTexture(board: readonly Card[]): BoardTexture {
  if (board.length === 0) {
    return {
      isMonotone: false, isTwoTone: false, isRainbow: true,
      isPaired: false, isTrips: false, highCard: 2 as Rank,
      hasThreeToStraight: false, connectedness: 0, wetness: 0,
    };
  }

  // Suit analysis
  const suitCounts = new Map<Suit, number>();
  for (const c of board) {
    suitCounts.set(c.suit, (suitCounts.get(c.suit) ?? 0) + 1);
  }
  const maxSuitCount = Math.max(...Array.from(suitCounts.values()));
  const isMonotone = maxSuitCount >= 3 && board.length >= 3;
  const isTwoTone = maxSuitCount === 2 && board.length >= 3;
  const isRainbow = suitCounts.size === board.length && board.length >= 3;

  // Rank analysis
  const rankCounts = new Map<Rank, number>();
  for (const c of board) {
    rankCounts.set(c.rank, (rankCounts.get(c.rank) ?? 0) + 1);
  }
  const maxRankCount = Math.max(...Array.from(rankCounts.values()));
  const isPaired = maxRankCount >= 2;
  const isTrips = maxRankCount >= 3;

  // Straight potential
  const ranks = Array.from(new Set(board.map(c => c.rank))).sort((a, b) => a - b);
  const highCard = Math.max(...board.map(c => c.rank)) as Rank;

  let connectedness = 0;
  let hasThreeToStraight = false;
  for (let i = 0; i < ranks.length - 1; i++) {
    if (ranks[i + 1] - ranks[i] <= 2) connectedness++;
  }
  // Check for 3 cards within a 5-card window
  if (ranks.length >= 3) {
    for (let i = 0; i < ranks.length - 2; i++) {
      if (ranks[i + 2] - ranks[i] <= 4) {
        hasThreeToStraight = true;
        break;
      }
    }
  }

  // Overall wetness: higher = more dangerous board
  let wetness = 0;
  if (isMonotone) wetness += 0.4;
  else if (isTwoTone) wetness += 0.2;
  if (hasThreeToStraight) wetness += 0.3;
  if (connectedness >= 2) wetness += 0.2;
  if (highCard <= 8) wetness += 0.1; // low boards = more straight potential
  wetness = Math.min(1, wetness);

  return {
    isMonotone, isTwoTone, isRainbow,
    isPaired, isTrips, highCard,
    hasThreeToStraight, connectedness, wetness,
  };
}

// ---------------------------------------------------------------------------
// Postflop hand strength tiers
// ---------------------------------------------------------------------------
type HandStrengthTier = 'monster' | 'strong' | 'medium' | 'weak' | 'nothing';

function getHandStrengthTier(handRank: HandRank, board: readonly Card[], holeCards: Card[]): HandStrengthTier {
  switch (handRank) {
    case HandRank.ROYAL_FLUSH:
    case HandRank.STRAIGHT_FLUSH:
    case HandRank.FOUR_OF_A_KIND:
    case HandRank.FULL_HOUSE:
      return 'monster';

    case HandRank.FLUSH:
    case HandRank.STRAIGHT:
      return 'strong';

    case HandRank.THREE_OF_A_KIND: {
      // If we have a set (pair in hand + one on board) it's strong
      // If it's trips on board it's medium
      const holeRanks = holeCards.map(c => c.rank);
      const boardRanks = board.map(c => c.rank);
      const hasSet = holeRanks.some(r => holeRanks.filter(hr => hr === r).length >= 2) ||
        holeRanks.some(r => boardRanks.filter(br => br === r).length >= 2 && holeRanks.filter(hr => hr === r).length >= 1);
      return hasSet ? 'strong' : 'medium';
    }

    case HandRank.TWO_PAIR: {
      // Two pair with both hole cards involved is strong
      // Board-paired two pair is medium
      const boardTexture = analyzeBoardTexture(board);
      if (boardTexture.isPaired) return 'medium';
      return 'strong';
    }

    case HandRank.ONE_PAIR: {
      // Top pair with good kicker = medium
      // Overpair = medium-strong
      // Middle/bottom pair = weak
      const boardRanks = board.map(c => c.rank).sort((a, b) => b - a);
      const holeRanks = holeCards.map(c => c.rank);
      const pairRank = findPairRank(holeCards, board);

      if (pairRank === null) return 'weak';

      // Overpair: pocket pair above board
      if (holeCards[0].rank === holeCards[1].rank && holeCards[0].rank > boardRanks[0]) {
        return 'medium'; // overpair
      }

      // Top pair
      if (boardRanks.length > 0 && pairRank === boardRanks[0]) {
        // Good kicker? (other hole card >= 10)
        const kicker = holeRanks.find(r => r !== pairRank);
        if (kicker && kicker >= 10) return 'medium';
        return 'weak'; // weak top pair
      }

      // Middle or bottom pair
      return 'weak';
    }

    case HandRank.HIGH_CARD:
    default:
      return 'nothing';
  }
}

function findPairRank(holeCards: Card[], board: readonly Card[]): Rank | null {
  const holeRanks = holeCards.map(c => c.rank);
  const boardRanks = board.map(c => c.rank);

  // Pocket pair
  if (holeRanks[0] === holeRanks[1]) return holeRanks[0];

  // Pair with board
  for (const hr of holeRanks) {
    if (boardRanks.includes(hr)) return hr;
  }

  return null;
}

// ---------------------------------------------------------------------------
// Draw detection
// ---------------------------------------------------------------------------
interface DrawInfo {
  hasFlushDraw: boolean;
  hasStraightDraw: boolean;    // open-ended
  hasGutshot: boolean;
  hasBackdoorFlush: boolean;
  hasBackdoorStraight: boolean;
  drawOuts: number;            // approximate number of outs
}

function detectDraws(holeCards: Card[], board: readonly Card[]): DrawInfo {
  const allCards = [...holeCards, ...board];
  const result: DrawInfo = {
    hasFlushDraw: false,
    hasStraightDraw: false,
    hasGutshot: false,
    hasBackdoorFlush: false,
    hasBackdoorStraight: false,
    drawOuts: 0,
  };

  if (board.length === 0) return result;

  // Flush draw detection
  const suitCounts = new Map<Suit, number>();
  for (const c of allCards) {
    suitCounts.set(c.suit, (suitCounts.get(c.suit) ?? 0) + 1);
  }

  // Check if hole cards contribute to the flush draw
  for (const [suit, count] of Array.from(suitCounts.entries())) {
    const holeCardsInSuit = holeCards.filter(c => c.suit === suit).length;
    if (holeCardsInSuit === 0) continue; // ignore if hole cards don't contribute
    if (count === 4) {
      result.hasFlushDraw = true;
      result.drawOuts += 9;
    } else if (count === 3 && board.length === 3) {
      result.hasBackdoorFlush = true;
      result.drawOuts += 2; // ~equivalent outs for backdoor
    }
  }

  // Straight draw detection
  const uniqueRanks = Array.from(new Set(allCards.map(c => c.rank))).sort((a, b) => a - b);
  // Add low ace for wheel detection
  if (uniqueRanks.includes(14 as Rank)) {
    uniqueRanks.unshift(1 as unknown as Rank);
  }

  // Check all 5-card windows
  let bestConsecutive = 0;
  let bestGapCount = 0;
  for (let start = 0; start <= uniqueRanks.length - 4; start++) {
    const window = uniqueRanks.slice(start, start + 5);
    if (window.length < 4) continue;
    const spread = window[window.length - 1] - window[0];
    if (spread <= 4) {
      const cardsInWindow = window.length;
      if (cardsInWindow >= bestConsecutive) {
        bestConsecutive = cardsInWindow;
      }
    }
  }

  // Check 4-card sequences within 4-rank spread (open-ended) and 5-rank spread (gutshot)
  for (let i = 0; i <= uniqueRanks.length - 3; i++) {
    const subset = uniqueRanks.slice(i, i + 4);
    if (subset.length < 3) continue;
    const spread = subset[subset.length - 1] - subset[0];

    // Ensure at least one hole card is involved in the draw
    const holeRanks = holeCards.map(c => c.rank);
    const subsetHasHoleCard = subset.some(r => holeRanks.includes(r as Rank));
    if (!subsetHasHoleCard) continue;

    if (subset.length === 4 && spread === 3) {
      // 4 consecutive ranks = open-ended straight draw
      // Unless the endpoints are A or 2 (one-ended)
      const low = subset[0];
      const high = subset[3];
      if (low > 1 && high < 14) {
        result.hasStraightDraw = true;
        result.drawOuts += 8;
      } else {
        result.hasGutshot = true;
        result.drawOuts += 4;
      }
    } else if (subset.length === 3 && spread <= 4) {
      // Gutshot or backdoor
      if (board.length >= 4) {
        result.hasGutshot = true;
        result.drawOuts += 4;
      } else if (board.length === 3) {
        result.hasBackdoorStraight = true;
        result.drawOuts += 1;
      }
    }
  }

  // Cap draw outs to avoid double-counting
  result.drawOuts = Math.min(result.drawOuts, 15);

  return result;
}

// ---------------------------------------------------------------------------
// Pot odds & equity calculation
// ---------------------------------------------------------------------------
function calcPotOdds(callAmount: number, pot: number): number {
  if (callAmount <= 0) return 0;
  return callAmount / (pot + callAmount);
}

// Rough equity estimate based on outs (rule of 2 and 4)
function estimateDrawEquity(outs: number, streetsLeft: number): number {
  if (streetsLeft >= 2) return Math.min(0.6, outs * 0.04); // rule of 4
  return Math.min(0.45, outs * 0.02); // rule of 2
}

function streetsRemaining(board: readonly Card[]): number {
  if (board.length <= 3) return 2;
  if (board.length === 4) return 1;
  return 0;
}

// ---------------------------------------------------------------------------
// Stack-to-pot ratio
// ---------------------------------------------------------------------------
function getSPR(stack: number, pot: number): number {
  if (pot <= 0) return 100;
  return stack / pot;
}

// ---------------------------------------------------------------------------
// Bet sizing helpers
// ---------------------------------------------------------------------------
function calcPot(state: GameState): number {
  return state.pot.main + state.pot.sides.reduce((s, p) => s + p.amount, 0);
}

function clampBet(amount: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.floor(amount)));
}

// ---------------------------------------------------------------------------
// Random noise helper (makes AI less predictable)
// ---------------------------------------------------------------------------
function jitter(base: number, variance: number): number {
  return base + (Math.random() - 0.5) * 2 * variance;
}

// ---------------------------------------------------------------------------
// Action builders
// ---------------------------------------------------------------------------
function makeFold(playerId: string): GameAction {
  return { playerId, type: 'fold' };
}

function makeCheck(playerId: string): GameAction {
  return { playerId, type: 'check' };
}

function makeCall(playerId: string): GameAction {
  return { playerId, type: 'call' };
}

function makeBet(playerId: string, amount: number, state: GameState, player: PlayerState): GameAction {
  const clamped = clampBet(amount, state.minRaise, player.stack);
  if (clamped >= player.stack) {
    return { playerId, type: 'all-in' };
  }
  return { playerId, type: 'bet', amount: clamped };
}

function makeRaise(playerId: string, amount: number, state: GameState, player: PlayerState): GameAction {
  const minRaiseAmount = state.currentBet + state.minRaise;
  const maxAmount = player.stack + player.currentBet;
  const clamped = clampBet(amount, minRaiseAmount, maxAmount);
  if (clamped >= maxAmount) {
    return { playerId, type: 'all-in' };
  }
  return { playerId, type: 'raise', amount: clamped };
}

// ---------------------------------------------------------------------------
// Preflop decision
// ---------------------------------------------------------------------------
function decidePreflopAction(
  state: GameState,
  player: PlayerState,
  available: ActionType[],
): GameAction {
  const hand = classifyPreflopHand(player.holeCards);
  const pos = getPosition(player, state);
  const pot = calcPot(state);
  const callAmount = state.currentBet - player.currentBet;
  const preflopStrength = getPreflopStrength(hand);

  // Has there been a raise? (currentBet > BB means someone raised)
  const hasRaise = state.currentBet > GAME_CONSTANTS.BIG_BLIND;
  // Can we raise? (Hit Poker: no 3-bet in preflop)
  const canRaise = available.includes('raise');
  const canBet = available.includes('bet');

  // ---- Unopened pot (no raise yet, we can open) ----
  if (!hasRaise) {
    const inRange = isInOpenRange(hand, pos);

    if (!inRange) {
      // Not in our opening range, fold or check
      if (available.includes('check')) return makeCheck(player.id);
      return makeFold(player.id);
    }

    // We want to raise to open
    if (canRaise) {
      // Standard open: 2.5-3x BB, slightly bigger from early position
      const multiplier = isEarlyPosition(pos) ? 3 : 2.5;
      const openSize = Math.floor(GAME_CONSTANTS.BIG_BLIND * jitter(multiplier, 0.25));
      return makeRaise(player.id, openSize + state.currentBet, state, player);
    }
    if (canBet) {
      const openSize = Math.floor(GAME_CONSTANTS.BIG_BLIND * jitter(2.5, 0.25));
      return makeBet(player.id, openSize, state, player);
    }
    // Can only check or call
    if (available.includes('check')) return makeCheck(player.id);
    return makeCall(player.id);
  }

  // ---- Facing a raise ----
  // Hit Poker rule: raiseCount >= 1 means no more raises in preflop
  // So we can only call or fold

  // Premium hands: just call (would 3-bet if allowed)
  if (isIn3BetRange(hand, pos)) {
    if (available.includes('call')) return makeCall(player.id);
    if (available.includes('check')) return makeCheck(player.id);
  }

  // BB defense range
  if (pos === 'BB') {
    if (isInBBDefendRange(hand)) {
      if (available.includes('call')) return makeCall(player.id);
      if (available.includes('check')) return makeCheck(player.id);
    }
    // Fold junk in BB
    if (available.includes('check')) return makeCheck(player.id);
    return makeFold(player.id);
  }

  // Other positions: call with hands in our open range, fold the rest
  const callRange = isInOpenRange(hand, pos);
  if (!callRange) {
    if (available.includes('check')) return makeCheck(player.id);
    return makeFold(player.id);
  }

  // Pot odds consideration for marginal calls
  if (callAmount > 0) {
    const potOdds = calcPotOdds(callAmount, pot);
    // For marginal hands (not premium), fold if call is too large relative to stack
    if (preflopStrength < 0.5 && callAmount > player.stack * 0.2) {
      if (available.includes('check')) return makeCheck(player.id);
      return makeFold(player.id);
    }
    // If pot odds are terrible for non-premium hands
    if (potOdds > 0.35 && preflopStrength < 0.6) {
      if (available.includes('check')) return makeCheck(player.id);
      return makeFold(player.id);
    }
  }

  if (available.includes('call')) return makeCall(player.id);
  if (available.includes('check')) return makeCheck(player.id);
  return makeFold(player.id);
}

// ---------------------------------------------------------------------------
// Postflop decision
// ---------------------------------------------------------------------------
function decidePostflopAction(
  state: GameState,
  player: PlayerState,
  available: ActionType[],
): GameAction {
  const pot = calcPot(state);
  const callAmount = state.currentBet - player.currentBet;
  const pos = getPosition(player, state);
  const inPosition = isLatePosition(pos) || pos === 'BTN';
  const spr = getSPR(player.stack, pot);

  // Evaluate actual hand
  const allCards = [...player.holeCards, ...state.board];
  const evaluation = evaluateBestHand(allCards);
  const tier = getHandStrengthTier(evaluation.rank, state.board, player.holeCards);
  const texture = analyzeBoardTexture(state.board);
  const draws = detectDraws(player.holeCards, state.board);
  const streets = streetsRemaining(state.board);

  // Effective hand equity estimate
  const handEquity = estimateHandEquity(tier, draws, streets);

  // Was the AI the preflop aggressor? (approximate: was last raiser before flop)
  const isPreflopAggressor = estimateIfAggressor(state, player);

  // ---- Facing no bet (can check or bet) ----
  if (callAmount === 0) {
    return decideNoBet(state, player, available, {
      tier, texture, draws, handEquity, pot, inPosition, spr, isPreflopAggressor, streets,
    });
  }

  // ---- Facing a bet/raise ----
  return decideFacingBet(state, player, available, {
    tier, texture, draws, handEquity, pot, callAmount, inPosition, spr, streets,
  });
}

interface PostflopContext {
  tier: HandStrengthTier;
  texture: BoardTexture;
  draws: DrawInfo;
  handEquity: number;
  pot: number;
  inPosition: boolean;
  spr: number;
  isPreflopAggressor?: boolean;
  streets: number;
  callAmount?: number;
}

function estimateHandEquity(tier: HandStrengthTier, draws: DrawInfo, streets: number): number {
  let base: number;
  switch (tier) {
    case 'monster': base = 0.9; break;
    case 'strong': base = 0.75; break;
    case 'medium': base = 0.55; break;
    case 'weak': base = 0.30; break;
    case 'nothing': base = 0.10; break;
  }
  // Add draw equity
  if (tier === 'nothing' || tier === 'weak') {
    base += estimateDrawEquity(draws.drawOuts, streets);
  }
  return Math.min(0.95, base);
}

function estimateIfAggressor(state: GameState, player: PlayerState): boolean {
  // Simple heuristic: if player's totalBet is notably higher than BB, they likely raised preflop
  return player.totalBet > GAME_CONSTANTS.BIG_BLIND * 2;
}

function decideNoBet(
  state: GameState,
  player: PlayerState,
  available: ActionType[],
  ctx: PostflopContext,
): GameAction {
  const { tier, texture, draws, handEquity, pot, inPosition, spr, isPreflopAggressor, streets } = ctx;
  const rng = Math.random();

  // ---- Monster hands ----
  if (tier === 'monster') {
    // Sometimes slow-play on dry boards
    if (texture.wetness < 0.2 && rng < 0.3) {
      return makeCheck(player.id);
    }
    // Value bet big
    if (available.includes('bet')) {
      const sizing = pot * jitter(0.7, 0.1);
      return makeBet(player.id, sizing, state, player);
    }
    return makeCheck(player.id);
  }

  // ---- Strong hands ----
  if (tier === 'strong') {
    // On wet boards, bet for protection
    if (texture.wetness > 0.4 && available.includes('bet')) {
      const sizing = pot * jitter(0.65, 0.1);
      return makeBet(player.id, sizing, state, player);
    }
    // On dry boards, can slow-play sometimes
    if (texture.wetness < 0.3 && rng < 0.25) {
      return makeCheck(player.id);
    }
    if (available.includes('bet')) {
      const sizing = pot * jitter(0.6, 0.1);
      return makeBet(player.id, sizing, state, player);
    }
    return makeCheck(player.id);
  }

  // ---- Medium hands ----
  if (tier === 'medium') {
    // C-bet as preflop aggressor
    if (isPreflopAggressor && state.board.length === 3) {
      // C-bet ~60% of the time, less on wet boards
      const cbetFreq = texture.wetness > 0.5 ? 0.4 : 0.6;
      if (rng < cbetFreq && available.includes('bet')) {
        const sizing = pot * jitter(0.5, 0.1);
        return makeBet(player.id, sizing, state, player);
      }
    }
    // In position, bet for thin value sometimes
    if (inPosition && rng < 0.4 && available.includes('bet')) {
      const sizing = pot * jitter(0.4, 0.08);
      return makeBet(player.id, sizing, state, player);
    }
    return makeCheck(player.id);
  }

  // ---- Weak hands / draws ----
  if (tier === 'weak') {
    // Semi-bluff with strong draws
    if ((draws.hasFlushDraw || draws.hasStraightDraw) && rng < 0.55 && available.includes('bet')) {
      const sizing = pot * jitter(0.45, 0.1);
      return makeBet(player.id, sizing, state, player);
    }
    // Occasionally bet for protection with weak made hands
    if (rng < 0.15 && available.includes('bet')) {
      const sizing = pot * jitter(0.33, 0.05);
      return makeBet(player.id, sizing, state, player);
    }
    return makeCheck(player.id);
  }

  // ---- Nothing ----
  // C-bet bluff as preflop aggressor
  if (isPreflopAggressor && state.board.length === 3) {
    // Bluff c-bet on dry boards more often
    const bluffFreq = texture.wetness < 0.3 ? 0.45 : 0.2;
    if (rng < bluffFreq && available.includes('bet')) {
      const sizing = pot * jitter(0.4, 0.08);
      return makeBet(player.id, sizing, state, player);
    }
  }

  // Semi-bluff with draws
  if ((draws.hasFlushDraw || draws.hasStraightDraw) && rng < 0.5 && available.includes('bet')) {
    const sizing = pot * jitter(0.45, 0.1);
    return makeBet(player.id, sizing, state, player);
  }

  // In position bluff on turn/river occasionally
  if (inPosition && state.board.length >= 4 && rng < 0.15 && available.includes('bet')) {
    const sizing = pot * jitter(0.35, 0.08);
    return makeBet(player.id, sizing, state, player);
  }

  return makeCheck(player.id);
}

function decideFacingBet(
  state: GameState,
  player: PlayerState,
  available: ActionType[],
  ctx: PostflopContext,
): GameAction {
  const { tier, texture, draws, handEquity, pot, callAmount = 0, inPosition, spr, streets } = ctx;
  const rng = Math.random();
  const potOdds = calcPotOdds(callAmount, pot);
  const canRaise = available.includes('raise');

  // ---- Monster: raise for value (sometimes slow-play/call) ----
  if (tier === 'monster') {
    // Check-raise strong hands sometimes
    if (canRaise && rng < 0.6) {
      const raiseSize = (pot + callAmount) * jitter(0.8, 0.15) + state.currentBet;
      return makeRaise(player.id, raiseSize, state, player);
    }
    // Flat call to trap
    if (available.includes('call')) return makeCall(player.id);
    return makeCheck(player.id);
  }

  // ---- Strong: call or raise depending on board ----
  if (tier === 'strong') {
    // Raise on wet boards for protection
    if (canRaise && texture.wetness > 0.4 && rng < 0.4) {
      const raiseSize = (pot + callAmount) * jitter(0.7, 0.1) + state.currentBet;
      return makeRaise(player.id, raiseSize, state, player);
    }
    // Call: we're likely ahead
    if (available.includes('call')) return makeCall(player.id);
    return makeCheck(player.id);
  }

  // ---- Medium: call if pot odds are okay, fold big bets ----
  if (tier === 'medium') {
    // If bet is small relative to pot, call
    if (potOdds < 0.35) {
      if (available.includes('call')) return makeCall(player.id);
    }
    // Large bet facing medium hand
    if (potOdds > 0.40) {
      // On scary boards, fold
      if (texture.wetness > 0.5 || callAmount > player.stack * 0.3) {
        return makeFold(player.id);
      }
    }
    // In position, more willing to call
    if (inPosition && potOdds < 0.45) {
      if (available.includes('call')) return makeCall(player.id);
    }
    // SPR consideration: low SPR with medium hand, willing to commit
    if (spr < 4 && handEquity > 0.5) {
      if (available.includes('call')) return makeCall(player.id);
    }
    // Default: fold to big bets, call small ones
    if (callAmount <= pot * 0.4 && available.includes('call')) {
      return makeCall(player.id);
    }
    return makeFold(player.id);
  }

  // ---- Weak: mostly fold, call with draws if odds are right ----
  if (tier === 'weak') {
    // With draws, calculate if odds justify a call
    if (draws.hasFlushDraw || draws.hasStraightDraw) {
      const drawEquity = estimateDrawEquity(draws.drawOuts, streets);
      if (drawEquity > potOdds && available.includes('call')) {
        // Semi-bluff raise sometimes with strong draws
        if (canRaise && draws.drawOuts >= 9 && rng < 0.25) {
          const raiseSize = (pot + callAmount) * jitter(0.6, 0.1) + state.currentBet;
          return makeRaise(player.id, raiseSize, state, player);
        }
        return makeCall(player.id);
      }
    }
    // Gutshot: need really good odds
    if (draws.hasGutshot) {
      const drawEquity = estimateDrawEquity(4, streets);
      if (drawEquity > potOdds && callAmount <= pot * 0.25 && available.includes('call')) {
        return makeCall(player.id);
      }
    }
    // Small bets sometimes float in position
    if (inPosition && callAmount <= pot * 0.3 && rng < 0.2 && available.includes('call')) {
      return makeCall(player.id);
    }
    return makeFold(player.id);
  }

  // ---- Nothing: fold unless great draw odds ----
  // Strong draws
  if (draws.hasFlushDraw || draws.hasStraightDraw) {
    const drawEquity = estimateDrawEquity(draws.drawOuts, streets);
    if (drawEquity > potOdds && available.includes('call')) {
      // Bluff raise with strong draws
      if (canRaise && draws.drawOuts >= 12 && rng < 0.3) {
        const raiseSize = (pot + callAmount) * jitter(0.65, 0.1) + state.currentBet;
        return makeRaise(player.id, raiseSize, state, player);
      }
      return makeCall(player.id);
    }
  }

  // Very small bet with backdoor draws (float)
  if (inPosition && callAmount <= pot * 0.2 && (draws.hasBackdoorFlush || draws.hasBackdoorStraight) && rng < 0.2) {
    if (available.includes('call')) return makeCall(player.id);
  }

  // River bluff-raise (balanced ~10%)
  if (state.board.length === 5 && canRaise && rng < 0.08) {
    const raiseSize = (pot + callAmount) * jitter(0.7, 0.1) + state.currentBet;
    return makeRaise(player.id, raiseSize, state, player);
  }

  return makeFold(player.id);
}

// ---------------------------------------------------------------------------
// Main entry: COM action decision
// ---------------------------------------------------------------------------
export function decideCOMAction(
  state: GameState,
  player: PlayerState,
): GameAction {
  const available = getAvailableActions(state, player);

  if (available.length === 0) {
    return { playerId: player.id, type: 'fold' };
  }

  // If only one action available, take it
  if (available.length === 1) {
    return { playerId: player.id, type: available[0] };
  }

  // All-in if stack is very short (< 5 BB) and hand is decent
  if (player.stack <= GAME_CONSTANTS.BIG_BLIND * 5 && available.includes('all-in')) {
    const hand = classifyPreflopHand(player.holeCards);
    const strength = getPreflopStrength(hand);
    if (strength > 0.4 || (state.phase !== 'preflop' && getPostflopTier(state, player) !== 'nothing')) {
      return { playerId: player.id, type: 'all-in' };
    }
  }

  // Route to phase-specific logic
  if (state.phase === 'preflop') {
    return decidePreflopAction(state, player, available);
  }

  return decidePostflopAction(state, player, available);
}

// Helper for short-stack all-in decision
function getPostflopTier(state: GameState, player: PlayerState): HandStrengthTier {
  const allCards = [...player.holeCards, ...state.board];
  const evaluation = evaluateBestHand(allCards);
  return getHandStrengthTier(evaluation.rank, state.board, player.holeCards);
}
