// ゲームエンジン主制御
import { Card } from '../../../shared/types/card';
import { PlayerState, createDefaultHitState } from '../../../shared/types/player';
import { GameState, GameAction, GamePhase, PotState, WinnerInfo, ActionType } from '../../../shared/types/game';
import { GAME_CONSTANTS } from '../../../shared/constants/game';
import { DeckManager } from './deck';
import { validateAction, getAvailableActions } from './bet-validator';
import {
  initializeHitState,
  tryRevealHit,
  forceRevealIfQualified,
  checkBoardHitForPlayer,
} from './hit-detector';
import { calculatePots, distributePots } from './pot-manager';
import { evaluateBestHand } from './hand-evaluator';
import { resolveShowdown, buildShowdownInfo, resolveLastManStanding } from './showdown';
import { ShowdownInfo, HandResult } from '../../../shared/types/socket';

export type GameEvent =
  | { type: 'hit_revealed'; playerId: string; hitSource: 'pocket' | 'board' }
  | { type: 'phase_changed'; phase: GamePhase }
  | { type: 'player_action'; action: GameAction & { playerName: string } }
  | { type: 'showdown'; results: ShowdownInfo[] }
  | { type: 'hand_complete'; result: HandResult }
  | { type: 'deal_cards'; playerId: string; cards: Card[] };

export function createInitialGameState(
  players: PlayerState[],
  dealerIndex: number,
  handNumber: number
): GameState {
  return {
    phase: 'waiting',
    players,
    board: [],
    pot: { main: 0, sides: [] },
    currentPlayerIndex: 0,
    dealerIndex,
    raiseCount: 0,
    currentBet: 0,
    minRaise: GAME_CONSTANTS.BIG_BLIND,
    handNumber,
    lastAction: null,
  };
}

/**
 * 新しいハンドを開始する
 */
export function startNewHand(state: GameState): { newState: GameState; events: GameEvent[] } {
  const events: GameEvent[] = [];
  const deck = new DeckManager();
  const playerCount = state.players.length;

  if (playerCount < GAME_CONSTANTS.MIN_PLAYERS_TO_START) {
    return { newState: state, events: [] };
  }

  // ポジション決定
  const dealerIdx = state.dealerIndex % playerCount;
  const sbIdx = (dealerIdx + 1) % playerCount;
  const bbIdx = (dealerIdx + 2) % playerCount;

  // プレイヤーリセット
  const players = state.players.map((p, i) => ({
    ...p,
    holeCards: [] as Card[],
    currentBet: 0,
    totalBet: 0,
    folded: false,
    allIn: false,
    lastAction: null as ActionType | null,
    isDealer: i === dealerIdx,
    isSB: i === sbIdx,
    isBB: i === bbIdx,
    hit: createDefaultHitState(),
  }));

  // 手札配布
  for (let i = 0; i < playerCount; i++) {
    const cards = deck.deal(2);
    players[i].holeCards = cards;
    players[i].hit = initializeHitState(cards);

    events.push({
      type: 'deal_cards',
      playerId: players[i].id,
      cards,
    });
  }

  // ブラインド投入
  const sb = GAME_CONSTANTS.SMALL_BLIND;
  const bb = GAME_CONSTANTS.BIG_BLIND;

  players[sbIdx].currentBet = Math.min(sb, players[sbIdx].stack);
  players[sbIdx].totalBet = players[sbIdx].currentBet;
  players[sbIdx].stack -= players[sbIdx].currentBet;
  if (players[sbIdx].stack === 0) players[sbIdx].allIn = true;

  players[bbIdx].currentBet = Math.min(bb, players[bbIdx].stack);
  players[bbIdx].totalBet = players[bbIdx].currentBet;
  players[bbIdx].stack -= players[bbIdx].currentBet;
  if (players[bbIdx].stack === 0) players[bbIdx].allIn = true;

  // UTG（BBの次）からアクション開始
  let utg = (bbIdx + 1) % playerCount;
  // アクション可能なプレイヤーを探す
  while (players[utg].allIn || players[utg].folded) {
    utg = (utg + 1) % playerCount;
    if (utg === (bbIdx + 1) % playerCount) break;
  }

  const newState: GameState = {
    ...state,
    phase: 'preflop',
    players,
    board: [],
    pot: { main: sb + bb, sides: [] },
    currentPlayerIndex: utg,
    raiseCount: 0,
    currentBet: bb,
    minRaise: bb,
    lastAction: null,
    handNumber: state.handNumber + 1,
  };

  // ポケットペアHIT判定: 最初のアクション時に公開するので、ここではイベント不要
  events.push({ type: 'phase_changed', phase: 'preflop' });

  return { newState, events };
}

/**
 * プレイヤーアクションを適用
 */
export function applyAction(
  state: GameState,
  action: GameAction
): { newState: GameState; events: GameEvent[] } {
  const events: GameEvent[] = [];
  const playerIndex = state.players.findIndex(p => p.id === action.playerId);

  if (playerIndex === -1) {
    return { newState: state, events: [] };
  }

  const player = state.players[playerIndex];
  const validation = validateAction(state, player, action);

  if (!validation.ok) {
    return { newState: state, events: [] };
  }

  // HIT公開チェック（アクション権が回ってきた = ここで公開）
  const hitState = tryRevealHit(player, state.phase);
  if (hitState.hitRevealed && !player.hit.hitRevealed) {
    events.push({
      type: 'hit_revealed',
      playerId: player.id,
      hitSource: hitState.hitSource!,
    });
  }

  // 新しいプレイヤー配列を作成
  let players = [...state.players];
  let newCurrentBet = state.currentBet;
  let newRaiseCount = state.raiseCount;
  let newMinRaise = state.minRaise;
  let potAdd = 0;

  const updatedPlayer = { ...player, hit: hitState };

  switch (action.type) {
    case 'fold':
      updatedPlayer.folded = true;
      updatedPlayer.lastAction = 'fold';
      break;

    case 'check':
      updatedPlayer.lastAction = 'check';
      break;

    case 'call': {
      const callAmount = Math.min(state.currentBet - player.currentBet, player.stack);
      updatedPlayer.currentBet += callAmount;
      updatedPlayer.totalBet += callAmount;
      updatedPlayer.stack -= callAmount;
      if (updatedPlayer.stack === 0) updatedPlayer.allIn = true;
      updatedPlayer.lastAction = 'call';
      potAdd = callAmount;
      break;
    }

    case 'bet': {
      const betAmount = action.amount!;
      updatedPlayer.currentBet = betAmount;
      updatedPlayer.totalBet += betAmount;
      updatedPlayer.stack -= betAmount;
      if (updatedPlayer.stack === 0) updatedPlayer.allIn = true;
      updatedPlayer.lastAction = 'bet';
      newCurrentBet = betAmount;
      newMinRaise = betAmount;
      potAdd = betAmount;
      break;
    }

    case 'raise': {
      const raiseAmount = action.amount!;
      const additional = raiseAmount - updatedPlayer.currentBet;
      newMinRaise = raiseAmount - state.currentBet;
      updatedPlayer.totalBet += additional;
      updatedPlayer.stack -= additional;
      updatedPlayer.currentBet = raiseAmount;
      if (updatedPlayer.stack === 0) updatedPlayer.allIn = true;
      updatedPlayer.lastAction = 'raise';
      newCurrentBet = raiseAmount;
      newRaiseCount++;
      potAdd = additional;
      break;
    }

    case 'all-in': {
      const allInAmount = player.stack;
      const newBet = player.currentBet + allInAmount;
      if (newBet > state.currentBet) {
        // レイズ扱い
        newMinRaise = newBet - state.currentBet;
        newCurrentBet = newBet;
        if (state.currentBet > 0) newRaiseCount++;
      }
      updatedPlayer.totalBet += allInAmount;
      updatedPlayer.currentBet = newBet;
      updatedPlayer.stack = 0;
      updatedPlayer.allIn = true;
      updatedPlayer.lastAction = 'all-in';
      potAdd = allInAmount;
      break;
    }
  }

  players[playerIndex] = updatedPlayer;

  // ポット更新
  const currentPotTotal = state.pot.main + state.pot.sides.reduce((s, p) => s + p.amount, 0);
  const newPot: PotState = {
    main: currentPotTotal + potAdd,
    sides: [],
  };

  events.push({
    type: 'player_action',
    action: { ...action, playerName: player.name },
  });

  // 次のプレイヤーを決定
  let newState: GameState = {
    ...state,
    players,
    pot: newPot,
    currentBet: newCurrentBet,
    raiseCount: newRaiseCount,
    minRaise: newMinRaise,
    lastAction: action,
  };

  // ストリート終了判定
  if (shouldEndStreet(newState, playerIndex)) {
    const result = advanceToNextPhase(newState);
    newState = result.newState;
    events.push(...result.events);
  } else {
    // 次のアクティブプレイヤーへ
    newState.currentPlayerIndex = findNextActivePlayer(newState, playerIndex);
  }

  return { newState, events };
}

/**
 * ストリート終了条件チェック
 */
function shouldEndStreet(state: GameState, lastActorIndex: number): boolean {
  const activePlayers = state.players.filter(p => !p.folded && !p.allIn);

  // アクティブ1人以下 → 終了
  if (activePlayers.length <= 1) {
    // フォールドしてないプレイヤーが1人以下なら即終了
    const nonFolded = state.players.filter(p => !p.folded);
    if (nonFolded.length <= 1) return true;
    if (activePlayers.length === 0) return true; // 全員オールインorフォールド
  }

  // 全アクティブプレイヤーのベットが揃っているかチェック
  const allBetsEqual = activePlayers.every(
    p => p.currentBet === state.currentBet
  );

  if (!allBetsEqual) return false;

  // 全員がアクション済みかチェック（プリフロップBBオプション考慮）
  const nextPlayer = findNextActivePlayer(state, lastActorIndex);
  if (nextPlayer === lastActorIndex) return true; // 一周した

  // 全アクティブプレイヤーがアクション済みかチェック
  for (const p of activePlayers) {
    if (p.lastAction === null && p.currentBet < state.currentBet) {
      return false; // まだアクションしていないプレイヤーがいる
    }
  }

  // BBオプション: プリフロップでBBがまだアクションしていない場合
  if (state.phase === 'preflop') {
    const bb = state.players.find(p => p.isBB);
    if (bb && !bb.folded && !bb.allIn && bb.lastAction === null) {
      return false;
    }
  }

  return true;
}

/**
 * 次のフェーズへ進む
 */
function advanceToNextPhase(state: GameState): { newState: GameState; events: GameEvent[] } {
  const events: GameEvent[] = [];
  const nonFolded = state.players.filter(p => !p.folded);

  // 1人だけ残った場合 → ハンド終了
  if (nonFolded.length <= 1) {
    return resolveHandEnd(state);
  }

  // 全員オールイン → ショーダウンまで進める
  const activePlayers = nonFolded.filter(p => !p.allIn);
  if (activePlayers.length <= 1) {
    return runOutBoard(state);
  }

  const prevBoard = [...state.board];
  let newPhase: GamePhase;
  let newBoard: Card[];
  const deck = new DeckManager(); // 実際のゲームではdeckをstateに持たせる必要あり

  // NOTE: 簡易実装。実際にはデッキをGameState内に保持するべき
  // ここではボードカードを直接stateに追加する形にする

  switch (state.phase) {
    case 'preflop':
      newPhase = 'flop';
      // フロップ3枚は別途dealする（game-engine外から注入）
      newBoard = state.board; // 呼び出し側で設定
      break;
    case 'flop':
      newPhase = 'turn';
      newBoard = state.board;
      break;
    case 'turn':
      newPhase = 'river';
      newBoard = state.board;
      break;
    case 'river':
      return resolveHandEnd(state);
    default:
      return { newState: state, events: [] };
  }

  // プレイヤーのベットリセット
  const players = state.players.map(p => ({
    ...p,
    currentBet: 0,
    lastAction: null as ActionType | null,
  }));

  // オールインプレイヤーのHIT強制公開
  for (let i = 0; i < players.length; i++) {
    if (players[i].allIn && !players[i].folded) {
      const hit = forceRevealIfQualified(players[i]);
      if (hit.hitRevealed && !players[i].hit.hitRevealed) {
        events.push({
          type: 'hit_revealed',
          playerId: players[i].id,
          hitSource: hit.hitSource!,
        });
      }
      players[i] = { ...players[i], hit };
    }
  }

  // 最初のアクティブプレイヤー（SBから）
  const firstActive = findFirstActivePlayerPostflop(players, state.dealerIndex);

  events.push({ type: 'phase_changed', phase: newPhase });

  return {
    newState: {
      ...state,
      phase: newPhase,
      players,
      currentPlayerIndex: firstActive,
      currentBet: 0,
      raiseCount: 0,
      minRaise: GAME_CONSTANTS.BIG_BLIND,
    },
    events,
  };
}

/**
 * ボードカードを設定する（外部から呼ぶ）
 */
export function setBoardCards(state: GameState, cards: Card[]): { newState: GameState; events: GameEvent[] } {
  const events: GameEvent[] = [];
  const prevBoard = [...state.board];
  const newBoard = [...state.board, ...cards];

  // ボードヒット判定
  const players = state.players.map(p => {
    if (p.folded) return p;
    const hit = checkBoardHitForPlayer(p, newBoard, prevBoard);
    return { ...p, hit };
  });

  return {
    newState: { ...state, players, board: newBoard },
    events,
  };
}

/**
 * ボードを最後まで出す（全員オールイン時）
 */
function runOutBoard(state: GameState): { newState: GameState; events: GameEvent[] } {
  // ショーダウンへ進む
  return resolveHandEnd(state);
}

/**
 * ハンド終了処理
 */
function resolveHandEnd(state: GameState): { newState: GameState; events: GameEvent[] } {
  const events: GameEvent[] = [];
  const nonFolded = state.players.filter(p => !p.folded);

  let winners: WinnerInfo[];
  let showdownInfo: ShowdownInfo[] = [];

  if (nonFolded.length === 1) {
    // 全員フォールド
    const winner = nonFolded[0];
    const totalPot = state.pot.main + state.pot.sides.reduce((s, p) => s + p.amount, 0);
    winners = [{
      playerId: winner.id,
      amount: totalPot,
      handName: 'Last Man Standing',
    }];
    resolveLastManStanding(winner);
  } else {
    // ショーダウン
    winners = distributePots(state.players, state.board);

    const winnerIds = winners.map(w => w.playerId);
    const showdownPlayers = resolveShowdown(state.players, winnerIds);

    // ハンド名のマッピング
    const handNames = new Map<string, string>();
    for (const p of nonFolded) {
      const eval_ = evaluateBestHand([...p.holeCards, ...state.board]);
      handNames.set(p.id, eval_.name);
    }

    showdownInfo = buildShowdownInfo(showdownPlayers, handNames);
    events.push({ type: 'showdown', results: showdownInfo });
  }

  // スタック更新
  const players = state.players.map(p => {
    const win = winners.find(w => w.playerId === p.id);
    return {
      ...p,
      stack: p.stack + (win?.amount ?? 0),
    };
  });

  const totalPot = state.pot.main + state.pot.sides.reduce((s, p) => s + p.amount, 0);

  const result: HandResult = {
    winners,
    showdown: showdownInfo,
    pot: totalPot,
  };

  events.push({ type: 'hand_complete', result });

  return {
    newState: {
      ...state,
      phase: 'result',
      players,
      pot: { main: 0, sides: [] },
    },
    events,
  };
}

/**
 * 次のアクティブプレイヤーを見つける
 */
function findNextActivePlayer(state: GameState, currentIndex: number): number {
  const count = state.players.length;
  let next = (currentIndex + 1) % count;

  for (let i = 0; i < count; i++) {
    const player = state.players[next];
    if (!player.folded && !player.allIn) {
      return next;
    }
    next = (next + 1) % count;
  }

  return currentIndex; // 全員フォールドorオールイン
}

/**
 * ポストフロップの最初のアクティブプレイヤー（SBから時計回り）
 */
function findFirstActivePlayerPostflop(players: PlayerState[], dealerIndex: number): number {
  const count = players.length;
  let idx = (dealerIndex + 1) % count; // SBから

  for (let i = 0; i < count; i++) {
    if (!players[idx].folded && !players[idx].allIn) {
      return idx;
    }
    idx = (idx + 1) % count;
  }

  return 0;
}

/**
 * フェーズ終了後に次のハンドへ進む準備
 */
export function prepareNextHand(state: GameState): GameState {
  const newDealerIndex = (state.dealerIndex + 1) % state.players.length;

  // スタック0のプレイヤーを除外
  const activePlayers = state.players.filter(p => p.stack > 0);

  return createInitialGameState(activePlayers, newDealerIndex, state.handNumber);
}
