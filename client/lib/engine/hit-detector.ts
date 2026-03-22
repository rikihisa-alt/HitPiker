// HIT判定ロジック
import { Card } from '../../../shared/types/card';
import { PlayerState, PlayerHitState } from '../../../shared/types/player';
import { GamePhase } from '../../../shared/types/game';
import { getBestHandRank, HandRank } from './hand-evaluator';

/**
 * ポケットペア判定
 */
export function detectPocketPairHit(holeCards: Card[]): boolean {
  if (holeCards.length !== 2) return false;
  return holeCards[0].rank === holeCards[1].rank;
}

/**
 * ボードヒット判定
 * 「今回のカード追加で初めてワンペアが成立したか」を判定する
 * 2ペア以上はヒット対象外
 */
export function detectBoardHit(
  holeCards: Card[],
  board: Card[],
  prevBoard: Card[]
): boolean {
  if (holeCards.length !== 2) return false;

  const prevHandRank = getBestHandRank([...holeCards, ...prevBoard]);
  const newHandRank = getBestHandRank([...holeCards, ...board]);

  // 前ストリートまでペアなし → 今ストリートでワンペア成立（のみ）
  const wasNoPair = prevHandRank < HandRank.ONE_PAIR;
  const isExactlyOnePair = newHandRank === HandRank.ONE_PAIR;

  return wasNoPair && isExactlyOnePair;
}

/**
 * アクション権が回ってきた際のHIT公開チェック
 * hitQualified=true かつ hitRevealed=false なら公開する
 */
export function tryRevealHit(
  player: PlayerState,
  phase: GamePhase
): PlayerHitState {
  const hit = { ...player.hit };
  if (hit.hitQualified && !hit.hitRevealed) {
    hit.hitRevealed = true;
    hit.mustShowIfNotFolded = true;
    hit.hitStreet = phase as PlayerHitState['hitStreet'];
  }
  return hit;
}

/**
 * オールイン等でアクション機会を失った場合の強制公開
 * ゲームエンジンがフェーズ終了時に呼ぶ
 */
export function forceRevealIfQualified(player: PlayerState): PlayerHitState {
  const hit = { ...player.hit };
  if (hit.hitQualified && !hit.hitRevealed && !player.folded) {
    hit.hitRevealed = true;
    hit.mustShowIfNotFolded = true;
  }
  return hit;
}

/**
 * 配札後にポケットペアHITを初期設定する
 */
export function initializeHitState(holeCards: Card[]): PlayerHitState {
  const isPocketPair = detectPocketPairHit(holeCards);
  return {
    hitQualified: isPocketPair,
    hitRevealed: false,
    hitSource: isPocketPair ? 'pocket' : null,
    hitStreet: null,
    mustShowIfNotFolded: false,
  };
}

/**
 * ストリート遷移時にボードヒットを判定し、hitQualifiedを更新する
 */
export function checkBoardHitForPlayer(
  player: PlayerState,
  board: Card[],
  prevBoard: Card[]
): PlayerHitState {
  const hit = { ...player.hit };

  // 既にHIT確定済み（ポケットペア等）の場合はそのまま
  if (hit.hitQualified) return hit;

  // フォールド済みは判定不要
  if (player.folded) return hit;

  const boardHit = detectBoardHit(player.holeCards, board, prevBoard);
  if (boardHit) {
    hit.hitQualified = true;
    hit.hitSource = 'board';
  }

  return hit;
}
