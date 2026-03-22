import { GameState, GameAction, ActionType } from '../../../shared/types/game';
import { PlayerState, createDefaultHitState } from '../../../shared/types/player';
import { validateAction, getAvailableActions } from '../../src/engine/bet-validator';

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

function makeGameState(overrides: Partial<GameState> = {}): GameState {
  const defaultPlayer = makePlayer();
  return {
    phase: 'flop',
    players: [defaultPlayer],
    board: [],
    pot: { main: 0, sides: [] },
    currentPlayerIndex: 0,
    dealerIndex: 0,
    raiseCount: 0,
    currentBet: 0,
    minRaise: 100,
    handNumber: 1,
    lastAction: null,
    ...overrides,
  };
}

describe('validateAction - basic checks', () => {
  it('rejects action from folded player', () => {
    const player = makePlayer({ folded: true });
    const state = makeGameState({ players: [player] });
    const result = validateAction(state, player, { playerId: 'p1', type: 'check' });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('already folded');
  });

  it('rejects action from all-in player', () => {
    const player = makePlayer({ allIn: true });
    const state = makeGameState({ players: [player] });
    const result = validateAction(state, player, { playerId: 'p1', type: 'check' });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('already all-in');
  });

  it('rejects action from disconnected player', () => {
    const player = makePlayer({ disconnected: true });
    const state = makeGameState({ players: [player] });
    const result = validateAction(state, player, { playerId: 'p1', type: 'check' });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('player disconnected');
  });

  it('rejects action when not the current player', () => {
    const p1 = makePlayer({ id: 'p1' });
    const p2 = makePlayer({ id: 'p2', seatIndex: 1 });
    const state = makeGameState({ players: [p1, p2], currentPlayerIndex: 0 });
    const result = validateAction(state, p2, { playerId: 'p2', type: 'check' });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('not your turn');
  });

  it('allows fold for current player', () => {
    const player = makePlayer();
    const state = makeGameState({ players: [player] });
    const result = validateAction(state, player, { playerId: 'p1', type: 'fold' });
    expect(result.ok).toBe(true);
  });

  it('rejects unknown action type', () => {
    const player = makePlayer();
    const state = makeGameState({ players: [player] });
    const result = validateAction(state, player, {
      playerId: 'p1',
      type: 'unknown' as ActionType,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('unknown action');
  });
});

describe('validateAction - check', () => {
  it('allows check when no bet to call', () => {
    const player = makePlayer({ currentBet: 0 });
    const state = makeGameState({ players: [player], currentBet: 0 });
    const result = validateAction(state, player, { playerId: 'p1', type: 'check' });
    expect(result.ok).toBe(true);
  });

  it('rejects check when there is a bet to call', () => {
    const player = makePlayer({ currentBet: 0 });
    const state = makeGameState({ players: [player], currentBet: 200 });
    const result = validateAction(state, player, { playerId: 'p1', type: 'check' });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('must call or fold');
  });

  it('allows check when player has already matched the current bet', () => {
    const player = makePlayer({ currentBet: 200 });
    const state = makeGameState({ players: [player], currentBet: 200 });
    const result = validateAction(state, player, { playerId: 'p1', type: 'check' });
    expect(result.ok).toBe(true);
  });
});

describe('validateAction - call', () => {
  it('allows call when there is a bet to call', () => {
    const player = makePlayer({ currentBet: 0 });
    const state = makeGameState({ players: [player], currentBet: 200 });
    const result = validateAction(state, player, { playerId: 'p1', type: 'call' });
    expect(result.ok).toBe(true);
  });

  it('rejects call when no bet to call', () => {
    const player = makePlayer({ currentBet: 0 });
    const state = makeGameState({ players: [player], currentBet: 0 });
    const result = validateAction(state, player, { playerId: 'p1', type: 'call' });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('no bet to call, use check');
  });
});

describe('validateAction - bet', () => {
  it('allows bet when no current bet and amount meets min', () => {
    const player = makePlayer({ stack: 10000 });
    const state = makeGameState({ players: [player], currentBet: 0, minRaise: 100 });
    const result = validateAction(state, player, { playerId: 'p1', type: 'bet', amount: 200 });
    expect(result.ok).toBe(true);
  });

  it('rejects bet when current bet already exists', () => {
    const player = makePlayer();
    const state = makeGameState({ players: [player], currentBet: 100 });
    const result = validateAction(state, player, { playerId: 'p1', type: 'bet', amount: 200 });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('use raise instead of bet');
  });

  it('rejects bet below min raise', () => {
    const player = makePlayer();
    const state = makeGameState({ players: [player], currentBet: 0, minRaise: 100 });
    const result = validateAction(state, player, { playerId: 'p1', type: 'bet', amount: 50 });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toContain('min bet');
  });

  it('rejects bet exceeding stack', () => {
    const player = makePlayer({ stack: 100 });
    const state = makeGameState({ players: [player], currentBet: 0, minRaise: 100 });
    const result = validateAction(state, player, { playerId: 'p1', type: 'bet', amount: 200 });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('insufficient stack');
  });
});

describe('validateAction - raise (3-bet prohibition)', () => {
  it('allows raise postflop even with raiseCount >= 1', () => {
    const player = makePlayer({ currentBet: 0, stack: 10000 });
    const state = makeGameState({
      players: [player],
      phase: 'flop',
      currentBet: 200,
      minRaise: 100,
      raiseCount: 1,
    });
    const result = validateAction(state, player, { playerId: 'p1', type: 'raise', amount: 400 });
    expect(result.ok).toBe(true);
  });

  it('rejects raise in preflop when raiseCount >= 1 (3-bet rule)', () => {
    const player = makePlayer({ currentBet: 0, stack: 10000 });
    const state = makeGameState({
      players: [player],
      phase: 'preflop',
      currentBet: 200,
      minRaise: 100,
      raiseCount: 1,
    });
    const result = validateAction(state, player, { playerId: 'p1', type: 'raise', amount: 400 });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toContain('3-bet');
  });

  it('allows raise in preflop when raiseCount is 0', () => {
    const player = makePlayer({ currentBet: 0, stack: 10000 });
    const state = makeGameState({
      players: [player],
      phase: 'preflop',
      currentBet: 100,
      minRaise: 100,
      raiseCount: 0,
    });
    const result = validateAction(state, player, { playerId: 'p1', type: 'raise', amount: 300 });
    expect(result.ok).toBe(true);
  });

  it('rejects raise when no current bet (should use bet)', () => {
    const player = makePlayer();
    const state = makeGameState({ players: [player], currentBet: 0, phase: 'flop' });
    const result = validateAction(state, player, { playerId: 'p1', type: 'raise', amount: 200 });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('use bet instead of raise');
  });

  it('rejects raise below minimum raise amount', () => {
    const player = makePlayer({ currentBet: 0, stack: 10000 });
    const state = makeGameState({
      players: [player],
      phase: 'flop',
      currentBet: 200,
      minRaise: 100,
      raiseCount: 0,
    });
    // min raise amount = currentBet + minRaise = 300
    const result = validateAction(state, player, { playerId: 'p1', type: 'raise', amount: 250 });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toContain('min raise');
  });

  it('rejects raise exceeding stack', () => {
    const player = makePlayer({ currentBet: 0, stack: 300 });
    const state = makeGameState({
      players: [player],
      phase: 'flop',
      currentBet: 200,
      minRaise: 100,
      raiseCount: 0,
    });
    const result = validateAction(state, player, { playerId: 'p1', type: 'raise', amount: 500 });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('insufficient stack');
  });
});

describe('validateAction - all-in', () => {
  it('allows all-in when player has chips', () => {
    const player = makePlayer({ stack: 500 });
    const state = makeGameState({ players: [player] });
    const result = validateAction(state, player, { playerId: 'p1', type: 'all-in' });
    expect(result.ok).toBe(true);
  });

  it('rejects all-in when player has no chips', () => {
    const player = makePlayer({ stack: 0 });
    const state = makeGameState({ players: [player] });
    const result = validateAction(state, player, { playerId: 'p1', type: 'all-in' });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('no chips to go all-in');
  });
});

describe('getAvailableActions', () => {
  it('returns empty for folded player', () => {
    const player = makePlayer({ folded: true });
    const state = makeGameState({ players: [player] });
    expect(getAvailableActions(state, player)).toEqual([]);
  });

  it('returns empty for all-in player', () => {
    const player = makePlayer({ allIn: true });
    const state = makeGameState({ players: [player] });
    expect(getAvailableActions(state, player)).toEqual([]);
  });

  it('returns empty for disconnected player', () => {
    const player = makePlayer({ disconnected: true });
    const state = makeGameState({ players: [player] });
    expect(getAvailableActions(state, player)).toEqual([]);
  });

  it('includes check and bet when no current bet', () => {
    const player = makePlayer({ stack: 10000 });
    const state = makeGameState({ players: [player], currentBet: 0 });
    const actions = getAvailableActions(state, player);
    expect(actions).toContain('fold');
    expect(actions).toContain('check');
    expect(actions).toContain('bet');
    expect(actions).toContain('all-in');
    expect(actions).not.toContain('call');
  });

  it('includes call and raise when there is a current bet (postflop)', () => {
    const player = makePlayer({ stack: 10000, currentBet: 0 });
    const state = makeGameState({ players: [player], currentBet: 200, phase: 'flop' });
    const actions = getAvailableActions(state, player);
    expect(actions).toContain('fold');
    expect(actions).toContain('call');
    expect(actions).toContain('raise');
    expect(actions).toContain('all-in');
    expect(actions).not.toContain('check');
    expect(actions).not.toContain('bet');
  });

  it('excludes raise when preflop 3-bet rule applies (raiseCount >= 1)', () => {
    const player = makePlayer({ stack: 10000, currentBet: 0 });
    const state = makeGameState({
      players: [player],
      currentBet: 200,
      phase: 'preflop',
      raiseCount: 1,
    });
    const actions = getAvailableActions(state, player);
    expect(actions).toContain('fold');
    expect(actions).toContain('call');
    expect(actions).toContain('all-in');
    expect(actions).not.toContain('raise');
  });

  it('includes raise when preflop raiseCount is 0', () => {
    const player = makePlayer({ stack: 10000, currentBet: 0 });
    const state = makeGameState({
      players: [player],
      currentBet: 100,
      phase: 'preflop',
      raiseCount: 0,
    });
    const actions = getAvailableActions(state, player);
    expect(actions).toContain('raise');
  });

  it('excludes all-in when stack is 0', () => {
    const player = makePlayer({ stack: 0, currentBet: 200 });
    const state = makeGameState({ players: [player], currentBet: 200 });
    const actions = getAvailableActions(state, player);
    expect(actions).not.toContain('all-in');
  });
});
