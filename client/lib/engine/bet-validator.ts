// ベット検証ロジック（3ベット禁止ルール含む）
import { GameState, GameAction, ActionType } from '../../../shared/types/game';
import { PlayerState } from '../../../shared/types/player';

export type ValidationResult =
  | { ok: true }
  | { ok: false; reason: string };

export function validateAction(
  state: GameState,
  player: PlayerState,
  action: GameAction
): ValidationResult {
  if (player.folded) return { ok: false, reason: 'already folded' };
  if (player.allIn) return { ok: false, reason: 'already all-in' };
  if (player.disconnected) return { ok: false, reason: 'player disconnected' };

  const isCurrentPlayer =
    state.players[state.currentPlayerIndex].id === player.id;
  if (!isCurrentPlayer) return { ok: false, reason: 'not your turn' };

  switch (action.type) {
    case 'fold':
      return { ok: true };
    case 'check':
      return validateCheck(state, player);
    case 'call':
      return validateCall(state, player);
    case 'bet':
      return validateBet(state, player, action.amount ?? 0);
    case 'raise':
      return validateRaise(state, player, action.amount ?? 0);
    case 'all-in':
      return player.stack > 0
        ? { ok: true }
        : { ok: false, reason: 'no chips to go all-in' };
    default:
      return { ok: false, reason: 'unknown action' };
  }
}

function validateCheck(state: GameState, player: PlayerState): ValidationResult {
  const callAmount = state.currentBet - player.currentBet;
  if (callAmount > 0) return { ok: false, reason: 'must call or fold' };
  return { ok: true };
}

function validateCall(state: GameState, player: PlayerState): ValidationResult {
  const callAmount = state.currentBet - player.currentBet;
  if (callAmount <= 0) return { ok: false, reason: 'no bet to call, use check' };
  return { ok: true };
}

function validateBet(state: GameState, player: PlayerState, amount: number): ValidationResult {
  if (state.currentBet > 0) return { ok: false, reason: 'use raise instead of bet' };
  if (amount < state.minRaise) return { ok: false, reason: `min bet is ${state.minRaise}` };
  if (amount > player.stack) return { ok: false, reason: 'insufficient stack' };
  return { ok: true };
}

function validateRaise(state: GameState, player: PlayerState, amount: number): ValidationResult {
  // プリフロップ3ベット禁止
  if (state.phase === 'preflop' && state.raiseCount >= 1) {
    return { ok: false, reason: '3-bet is not allowed in preflop (Hit Poker rule)' };
  }

  if (state.currentBet === 0) return { ok: false, reason: 'use bet instead of raise' };

  const minRaiseAmount = state.currentBet + state.minRaise;
  if (amount < minRaiseAmount) {
    return { ok: false, reason: `min raise to ${minRaiseAmount}` };
  }
  if (amount > player.stack + player.currentBet) {
    return { ok: false, reason: 'insufficient stack' };
  }
  return { ok: true };
}

/**
 * 現在可能なアクションを計算
 */
export function getAvailableActions(
  state: GameState,
  player: PlayerState
): ActionType[] {
  if (player.folded || player.allIn || player.disconnected) return [];

  const actions: ActionType[] = ['fold'];
  const callAmount = state.currentBet - player.currentBet;

  if (callAmount === 0) {
    actions.push('check');
  } else {
    actions.push('call');
  }

  const canRaise = !(state.phase === 'preflop' && state.raiseCount >= 1);

  if (state.currentBet === 0) {
    actions.push('bet');
  } else if (canRaise) {
    actions.push('raise');
  }

  if (player.stack > 0) {
    actions.push('all-in');
  }

  return actions;
}
