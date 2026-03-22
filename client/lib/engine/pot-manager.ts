// ポット・サイドポット計算
import { PlayerState } from '../../../shared/types/player';
import { PotState, SidePot, WinnerInfo } from '../../../shared/types/game';
import { compareHands } from './hand-evaluator';
import { Card } from '../../../shared/types/card';

/**
 * 全プレイヤーのtotalBetからメインポット・サイドポットを計算
 */
export function calculatePots(players: PlayerState[]): PotState {
  const activePlayers = players.filter(p => !p.folded);

  if (activePlayers.length === 0) {
    return { main: 0, sides: [] };
  }

  // オールインプレイヤーのベット額でソート
  const allInAmounts = activePlayers
    .filter(p => p.allIn)
    .map(p => p.totalBet)
    .sort((a, b) => a - b);

  // ユニークなベット閾値を作成
  const thresholds = Array.from(new Set(allInAmounts));

  if (thresholds.length === 0) {
    // オールインなし: メインポットのみ
    const total = players.reduce((sum, p) => sum + p.totalBet, 0);
    return { main: total, sides: [] };
  }

  const pots: { amount: number; eligiblePlayerIds: string[] }[] = [];
  let previousThreshold = 0;

  for (const threshold of thresholds) {
    const contribution = threshold - previousThreshold;
    if (contribution <= 0) continue;

    let potAmount = 0;
    const eligible: string[] = [];

    for (const p of players) {
      const playerContribution = Math.min(p.totalBet - previousThreshold, contribution);
      if (playerContribution > 0) {
        potAmount += playerContribution;
      }
      // フォールドしていないプレイヤーで、このポットに貢献できるプレイヤーが対象
      if (!p.folded && p.totalBet >= threshold) {
        eligible.push(p.id);
      }
    }

    if (potAmount > 0) {
      pots.push({ amount: potAmount, eligiblePlayerIds: eligible });
    }
    previousThreshold = threshold;
  }

  // 残りのベット（最大オールイン額を超える分）
  const maxAllIn = thresholds[thresholds.length - 1];
  let remainingPot = 0;
  const remainingEligible: string[] = [];

  for (const p of players) {
    const excess = p.totalBet - maxAllIn;
    if (excess > 0) {
      remainingPot += excess;
    }
    if (!p.folded && !p.allIn && p.totalBet > maxAllIn) {
      remainingEligible.push(p.id);
    }
  }

  // オールインでないアクティブプレイヤーも残りポットの対象
  for (const p of activePlayers) {
    if (!p.allIn && !remainingEligible.includes(p.id)) {
      remainingEligible.push(p.id);
    }
  }

  if (remainingPot > 0) {
    pots.push({ amount: remainingPot, eligiblePlayerIds: remainingEligible });
  }

  if (pots.length === 0) {
    const total = players.reduce((sum, p) => sum + p.totalBet, 0);
    return { main: total, sides: [] };
  }

  // 最初のポットがメイン、残りがサイド
  const mainPot = pots[0].amount;
  const sidePots: SidePot[] = pots.slice(1).map(p => ({
    amount: p.amount,
    eligiblePlayerIds: p.eligiblePlayerIds,
  }));

  // メインポットの対象にfoldしてないプレイヤー全員を入れる
  return {
    main: mainPot,
    sides: sidePots,
  };
}

/**
 * 全ポットを勝者に分配する
 */
export function distributePots(
  players: PlayerState[],
  board: Card[]
): WinnerInfo[] {
  const pots = calculatePots(players);
  const winners: Map<string, number> = new Map();
  let handName = '';

  // メインポットの勝者決定
  const mainEligible = players.filter(p => !p.folded);
  if (mainEligible.length === 1) {
    const winnerId = mainEligible[0].id;
    winners.set(winnerId, (winners.get(winnerId) ?? 0) + pots.main);
    handName = 'Last Man Standing';
  } else if (mainEligible.length > 1) {
    const result = compareHands(
      mainEligible.map(p => ({
        playerId: p.id,
        cards: [...p.holeCards, ...board],
      }))
    );
    handName = result.handName;
    const share = Math.floor(pots.main / result.winnersIds.length);
    for (const id of result.winnersIds) {
      winners.set(id, (winners.get(id) ?? 0) + share);
    }
  }

  // サイドポットの勝者決定
  for (const side of pots.sides) {
    const eligible = players.filter(
      p => !p.folded && side.eligiblePlayerIds.includes(p.id)
    );

    if (eligible.length === 1) {
      const winnerId = eligible[0].id;
      winners.set(winnerId, (winners.get(winnerId) ?? 0) + side.amount);
    } else if (eligible.length > 1) {
      const result = compareHands(
        eligible.map(p => ({
          playerId: p.id,
          cards: [...p.holeCards, ...board],
        }))
      );
      const share = Math.floor(side.amount / result.winnersIds.length);
      for (const id of result.winnersIds) {
        winners.set(id, (winners.get(id) ?? 0) + share);
      }
    }
  }

  return Array.from(winners.entries()).map(([playerId, amount]) => ({
    playerId,
    amount,
    handName,
  }));
}

/**
 * 現在のポット合計を計算
 */
export function getTotalPot(pot: PotState): number {
  return pot.main + pot.sides.reduce((sum, s) => sum + s.amount, 0);
}
