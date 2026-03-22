// ショーダウン制御
import { Card } from '../../../shared/types/card';
import { PlayerState } from '../../../shared/types/player';
import { WinnerInfo } from '../../../shared/types/game';
import { ShowdownInfo } from '../../../shared/types/socket';

export interface ShowdownPlayer {
  playerId: string;
  holeCards: Card[];
  mustShow: boolean;
  voluntaryShow: boolean;
}

/**
 * ショーダウン参加プレイヤーの公開カード決定
 */
export function resolveShowdown(
  players: PlayerState[],
  winners: string[]
): ShowdownPlayer[] {
  return players
    .filter(p => !p.folded)
    .map(p => ({
      playerId: p.id,
      holeCards: p.holeCards,
      mustShow: p.hit.mustShowIfNotFolded, // HIT義務
      voluntaryShow: winners.includes(p.id), // 勝者は公開
    }));
}

/**
 * ShowdownInfo形式に変換（クライアント送信用）
 */
export function buildShowdownInfo(
  showdownPlayers: ShowdownPlayer[],
  handNames: Map<string, string>
): ShowdownInfo[] {
  return showdownPlayers
    .filter(p => p.mustShow || p.voluntaryShow)
    .map(p => ({
      playerId: p.playerId,
      holeCards: p.holeCards,
      handName: handNames.get(p.playerId) ?? 'Unknown',
      mustShow: p.mustShow,
    }));
}

/**
 * 全員がフォールドして1人残った場合
 */
export function resolveLastManStanding(
  winner: PlayerState
): { showCards: boolean; reason: string } {
  return { showCards: false, reason: 'last man standing' };
}
