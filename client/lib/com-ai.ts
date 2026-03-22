// COM AIの意思決定ロジック
import { GameState, GameAction, ActionType } from '../../shared/types/game';
import { PlayerState } from '../../shared/types/player';
import { getAvailableActions } from './engine/bet-validator';
import { getBestHandRank, HandRank } from './engine/hand-evaluator';

// COM名前リスト
const COM_NAMES = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve'];

export function getComName(index: number): string {
  return COM_NAMES[index % COM_NAMES.length];
}

// ハンド強度を0-1で評価
function evaluateHandStrength(player: PlayerState, board: readonly import('../../shared/types/card').Card[]): number {
  const allCards = [...player.holeCards, ...board];

  if (allCards.length < 2) return 0.3;

  const handRank = getBestHandRank(allCards);

  // プリフロップ（ボードなし）
  if (board.length === 0) {
    return evaluatePreflopStrength(player);
  }

  // ポストフロップ: ハンドランクベースの強度
  switch (handRank) {
    case HandRank.ROYAL_FLUSH: return 1.0;
    case HandRank.STRAIGHT_FLUSH: return 0.98;
    case HandRank.FOUR_OF_A_KIND: return 0.95;
    case HandRank.FULL_HOUSE: return 0.90;
    case HandRank.FLUSH: return 0.82;
    case HandRank.STRAIGHT: return 0.75;
    case HandRank.THREE_OF_A_KIND: return 0.65;
    case HandRank.TWO_PAIR: return 0.55;
    case HandRank.ONE_PAIR: return 0.40;
    case HandRank.HIGH_CARD: return 0.20;
    default: return 0.15;
  }
}

// プリフロップのハンド強度評価
function evaluatePreflopStrength(player: PlayerState): number {
  const cards = player.holeCards;
  if (cards.length !== 2) return 0.3;

  const [c1, c2] = cards;
  const highRank = Math.max(c1.rank, c2.rank);
  const lowRank = Math.min(c1.rank, c2.rank);
  const isPair = c1.rank === c2.rank;
  const isSuited = c1.suit === c2.suit;
  const gap = highRank - lowRank;

  let strength = 0;

  // ペア
  if (isPair) {
    strength = 0.5 + (c1.rank / 14) * 0.4; // AA=0.9, 22=0.57
  } else {
    // ハイカードの価値
    strength = (highRank / 14) * 0.3 + (lowRank / 14) * 0.1;

    // スーテッドボーナス
    if (isSuited) strength += 0.05;

    // コネクターボーナス
    if (gap <= 2) strength += 0.05;
    if (gap === 1) strength += 0.03;

    // 両方10以上
    if (highRank >= 10 && lowRank >= 10) strength += 0.1;

    // Aハイ
    if (highRank === 14) strength += 0.1;
  }

  return Math.min(1, Math.max(0, strength));
}

// COMのアクション決定
export function decideCOMAction(
  state: GameState,
  player: PlayerState
): GameAction {
  const available = getAvailableActions(state, player);
  const strength = evaluateHandStrength(player, state.board);
  const random = Math.random();

  // ランダム要素を加えた実効強度
  const effectiveStrength = strength + (random - 0.5) * 0.15;

  const callAmount = state.currentBet - player.currentBet;
  const potTotal = state.pot.main + state.pot.sides.reduce((s, p) => s + p.amount, 0);
  const potOdds = callAmount > 0 ? callAmount / (potTotal + callAmount) : 0;

  // 強いハンド (上位30%): ベット/レイズ
  if (effectiveStrength > 0.65) {
    if (available.includes('raise')) {
      const raiseAmount = Math.min(
        state.currentBet + state.minRaise + Math.floor(potTotal * (0.3 + random * 0.4)),
        player.stack + player.currentBet
      );
      return { playerId: player.id, type: 'raise', amount: Math.max(raiseAmount, state.currentBet + state.minRaise) };
    }
    if (available.includes('bet')) {
      const betAmount = Math.min(
        Math.max(state.minRaise, Math.floor(potTotal * (0.4 + random * 0.3))),
        player.stack
      );
      return { playerId: player.id, type: 'bet', amount: Math.max(betAmount, state.minRaise) };
    }
    if (available.includes('call')) {
      return { playerId: player.id, type: 'call' };
    }
    if (available.includes('check')) {
      return { playerId: player.id, type: 'check' };
    }
  }

  // 中程度 (30-60%): コール/チェック
  if (effectiveStrength > 0.35) {
    // ポットオッズが良ければコール
    if (available.includes('call') && (potOdds < effectiveStrength || callAmount < player.stack * 0.15)) {
      return { playerId: player.id, type: 'call' };
    }
    if (available.includes('check')) {
      return { playerId: player.id, type: 'check' };
    }
    // たまにブラフベット (10%の確率)
    if (available.includes('bet') && random > 0.9) {
      const betAmount = Math.min(Math.floor(potTotal * 0.5), player.stack);
      return { playerId: player.id, type: 'bet', amount: Math.max(betAmount, state.minRaise) };
    }
    // コールが高すぎる場合はフォールド
    if (available.includes('fold') && callAmount > player.stack * 0.3) {
      return { playerId: player.id, type: 'fold' };
    }
    if (available.includes('call')) {
      return { playerId: player.id, type: 'call' };
    }
  }

  // 弱いハンド: チェック可能ならチェック、そうでなければフォールド
  if (available.includes('check')) {
    return { playerId: player.id, type: 'check' };
  }

  // ごくまれにブラフコール (5%)
  if (available.includes('call') && random > 0.95 && callAmount < player.stack * 0.1) {
    return { playerId: player.id, type: 'call' };
  }

  if (available.includes('fold')) {
    return { playerId: player.id, type: 'fold' };
  }

  // フォールバック
  return { playerId: player.id, type: available[0] };
}

// COMアクションの遅延時間（ms）をランダムに生成
export function getComActionDelay(): number {
  return 600 + Math.floor(Math.random() * 1200); // 600ms - 1800ms
}
