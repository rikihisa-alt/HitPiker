// ローカルゲームマネージャー - サーバーなしでCOM対戦を実現
import { Card } from '../../shared/types/card';
import { PlayerState, createDefaultHitState, ClientPlayerState } from '../../shared/types/player';
import { GameState, GameAction, ActionType, ClientGameState, GamePhase } from '../../shared/types/game';
import { HandResult } from '../../shared/types/socket';
import { GAME_CONSTANTS } from '../../shared/constants/game';
import { DeckManager } from './engine/deck';
import {
  createInitialGameState,
  startNewHand,
  applyAction,
  setBoardCards,
  prepareNextHand,
  GameEvent,
} from './engine/game-engine';
import { getAvailableActions } from './engine/bet-validator';
import { decideCOMAction, getComActionDelay, getComName } from './com-ai';

export type LocalGameCallback = {
  onGameStateUpdate: (state: ClientGameState, myCards: Card[]) => void;
  onHandResult: (result: HandResult) => void;
  onNextHand: () => void;
};

export class LocalGameManager {
  private gameState: GameState | null = null;
  private deck: DeckManager | null = null;
  private playerId: string;
  private comCount: number;
  private callbacks: LocalGameCallback;
  private isRunning: boolean = false;
  private actionTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor(
    playerName: string,
    comCount: number,
    callbacks: LocalGameCallback
  ) {
    this.playerId = 'human-player';
    this.comCount = comCount;
    this.callbacks = callbacks;

    // プレイヤー作成
    const players: PlayerState[] = [];

    // 人間プレイヤー
    players.push({
      id: this.playerId,
      seatIndex: 0,
      name: playerName,
      stack: GAME_CONSTANTS.STARTING_STACK,
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
    });

    // COMプレイヤー
    for (let i = 0; i < comCount; i++) {
      players.push({
        id: `com-${i}`,
        seatIndex: i + 1,
        name: getComName(i),
        stack: GAME_CONSTANTS.STARTING_STACK,
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
      });
    }

    this.gameState = createInitialGameState(players, 0, 0);
  }

  getPlayerId(): string {
    return this.playerId;
  }

  // ゲーム開始
  startGame(): void {
    if (!this.gameState) return;
    this.isRunning = true;
    this.startNewHandInternal();
  }

  // 新しいハンドを開始
  private startNewHandInternal(): void {
    if (!this.gameState) return;

    this.deck = new DeckManager();
    const { newState, events } = startNewHand(this.gameState);
    this.gameState = newState;

    // イベント処理
    this.processEvents(events);

    // 状態更新通知
    this.notifyStateUpdate();

    // COMターンチェック
    this.scheduleComActionIfNeeded();
  }

  // 人間プレイヤーのアクション
  handlePlayerAction(action: GameAction): void {
    if (!this.gameState || !this.isRunning) return;

    const currentPlayer = this.gameState.players[this.gameState.currentPlayerIndex];
    if (currentPlayer.id !== this.playerId) return; // 人間のターンでなければ無視

    this.executeAction(action);
  }

  // アクション実行（人間・COM共通）
  private executeAction(action: GameAction): void {
    if (!this.gameState) return;

    const prevPhase = this.gameState.phase;
    const { newState, events } = applyAction(this.gameState, action);
    this.gameState = newState;

    // フェーズが変わった場合、ボードカードを追加
    if (newState.phase !== prevPhase && newState.phase !== 'result') {
      this.dealBoardCardsIfNeeded(prevPhase, newState.phase);
    }

    // イベント処理
    this.processEvents(events);

    // 状態更新通知
    this.notifyStateUpdate();

    // ハンド終了チェック
    const handComplete = events.find(e => e.type === 'hand_complete');
    if (handComplete && handComplete.type === 'hand_complete') {
      this.handleHandComplete(handComplete.result);
      return;
    }

    // 次のCOMターンをスケジュール
    this.scheduleComActionIfNeeded();
  }

  // ボードカード追加
  private dealBoardCardsIfNeeded(prevPhase: GamePhase, newPhase: GamePhase): void {
    if (!this.gameState || !this.deck) return;

    let cardsToDeal = 0;
    if (prevPhase === 'preflop' && newPhase === 'flop') {
      this.deck.burn();
      cardsToDeal = 3;
    } else if (
      (prevPhase === 'flop' && newPhase === 'turn') ||
      (prevPhase === 'turn' && newPhase === 'river')
    ) {
      this.deck.burn();
      cardsToDeal = 1;
    }

    if (cardsToDeal > 0) {
      const cards = this.deck.deal(cardsToDeal);
      const result = setBoardCards(this.gameState, cards);
      this.gameState = result.newState;
      this.processEvents(result.events);
    }
  }

  // 全員オールイン時のランアウト
  private runOutBoard(): void {
    if (!this.gameState || !this.deck) return;

    const phase = this.gameState.phase;

    if (phase === 'preflop' && this.gameState.board.length === 0) {
      this.deck.burn();
      const flopCards = this.deck.deal(3);
      const r1 = setBoardCards(this.gameState, flopCards);
      this.gameState = r1.newState;
    }
    if (this.gameState.board.length === 3) {
      this.deck.burn();
      const turnCard = this.deck.deal(1);
      const r2 = setBoardCards(this.gameState, turnCard);
      this.gameState = r2.newState;
    }
    if (this.gameState.board.length === 4) {
      this.deck.burn();
      const riverCard = this.deck.deal(1);
      const r3 = setBoardCards(this.gameState, riverCard);
      this.gameState = r3.newState;
    }
  }

  // COMアクションをスケジュール
  private scheduleComActionIfNeeded(): void {
    if (!this.gameState || !this.isRunning) return;
    if (this.gameState.phase === 'result' || this.gameState.phase === 'waiting') return;

    const currentPlayer = this.gameState.players[this.gameState.currentPlayerIndex];
    if (!currentPlayer || currentPlayer.id === this.playerId) return; // 人間のターン

    // 全員オールインチェック
    const activePlayers = this.gameState.players.filter(p => !p.folded && !p.allIn);
    if (activePlayers.length <= 1) {
      // ランアウトが必要
      this.runOutBoard();
      // ハンド終了処理
      const { newState, events } = applyAction(this.gameState, {
        playerId: currentPlayer.id,
        type: currentPlayer.currentBet >= this.gameState.currentBet ? 'check' : 'call',
      });
      this.gameState = newState;
      this.processEvents(events);
      this.notifyStateUpdate();

      const handComplete = events.find(e => e.type === 'hand_complete');
      if (handComplete && handComplete.type === 'hand_complete') {
        this.handleHandComplete(handComplete.result);
      }
      return;
    }

    // COMの思考時間
    const delay = getComActionDelay();
    this.actionTimeout = setTimeout(() => {
      this.executeCOMAction();
    }, delay);
  }

  // COMアクション実行
  private executeCOMAction(): void {
    if (!this.gameState || !this.isRunning) return;

    const currentPlayer = this.gameState.players[this.gameState.currentPlayerIndex];
    if (currentPlayer.id === this.playerId) return;

    const action = decideCOMAction(this.gameState, currentPlayer);
    this.executeAction(action);
  }

  // イベント処理
  private processEvents(events: GameEvent[]): void {
    // イベントはログ等に使えるが、ここでは特に追加処理なし
    // HIT公開やフェーズ変更はゲームステートに反映済み
  }

  // ハンド終了処理
  private handleHandComplete(result: HandResult): void {
    this.callbacks.onHandResult(result);

    // 結果表示後に次のハンドへ
    setTimeout(() => {
      if (!this.gameState || !this.isRunning) return;

      // スタック0のプレイヤーを除外
      const activePlayers = this.gameState.players.filter(p => p.stack > 0);
      if (activePlayers.length < 2) {
        this.isRunning = false;
        return;
      }

      this.gameState = prepareNextHand(this.gameState);
      this.callbacks.onNextHand();
      this.startNewHandInternal();
    }, GAME_CONSTANTS.RESULT_DISPLAY_MS);
  }

  // ゲーム状態をクライアント形式で構築して通知
  private notifyStateUpdate(): void {
    if (!this.gameState) return;

    const currentPlayer = this.gameState.players[this.gameState.currentPlayerIndex];
    const humanPlayer = this.gameState.players.find(p => p.id === this.playerId);

    const availableActions: ActionType[] = currentPlayer?.id === this.playerId
      ? getAvailableActions(this.gameState, currentPlayer)
      : [];

    const clientState: ClientGameState = {
      ...this.gameState,
      players: this.gameState.players.map(p => ({
        ...p,
        holeCards: p.id === this.playerId
          ? p.holeCards
          : p.holeCards.map(() => ({ hidden: true as const })),
      })),
      availableActions,
    };

    const myCards = humanPlayer?.holeCards ?? [];
    this.callbacks.onGameStateUpdate(clientState, myCards);
  }

  // ゲーム停止
  stop(): void {
    this.isRunning = false;
    if (this.actionTimeout) {
      clearTimeout(this.actionTimeout);
      this.actionTimeout = null;
    }
  }

  // ゲームが動作中か
  getIsRunning(): boolean {
    return this.isRunning;
  }
}
