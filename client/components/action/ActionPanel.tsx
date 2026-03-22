'use client';

import { useCallback } from 'react';
import { useGameState } from '../../hooks/useGameState';
import { useGameStore } from '../../store/game-store';
import { useBetControl } from '../../hooks/useBetControl';
import { useSocket } from '../../hooks/useSocket';
import BetSlider from './BetSlider';
import PresetButtons from './PresetButtons';
import BetInput from './BetInput';
import { GameAction } from '../../../shared/types/game';

export default function ActionPanel() {
  const { isMyTurn, availableActions, gameState } = useGameState();
  const playerId = useGameStore((s) => s.playerId);
  const { sendAction } = useSocket();
  const {
    betAmount,
    setBetAmount,
    betMode,
    openBetMode,
    closeBetMode,
    minBet,
    maxBet,
    isPreflop,
    potTotal,
    bbPreset,
    potPreset,
    setAllIn,
  } = useBetControl();

  const handleAction = useCallback((type: GameAction['type'], amount?: number) => {
    if (!playerId) return;
    const action: GameAction = { playerId, type, amount };
    sendAction(action);
    closeBetMode();
  }, [playerId, sendAction, closeBetMode]);

  if (!isMyTurn || !gameState) return null;

  const callAmount = gameState.currentBet -
    (gameState.players.find(p => p.id === playerId)?.currentBet ?? 0);

  const canFold = availableActions.includes('fold');
  const canCheck = availableActions.includes('check');
  const canCall = availableActions.includes('call');
  const canBet = availableActions.includes('bet');
  const canRaise = availableActions.includes('raise');
  const canAllIn = availableActions.includes('all-in');
  const canBetOrRaise = canBet || canRaise;

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-slide-up">
      <div className="bg-gray-900/95 backdrop-blur-md rounded-2xl border border-gray-700 shadow-2xl p-4 min-w-[320px]">

        {/* Bet/Raise エリア */}
        {betMode && (
          <div className="mb-4 space-y-3 border-b border-gray-700 pb-4">
            <PresetButtons
              isPreflop={isPreflop}
              onBBPreset={bbPreset}
              onPotPreset={potPreset}
              onAllIn={setAllIn}
            />
            <BetSlider
              min={minBet}
              max={maxBet}
              value={betAmount}
              onChange={setBetAmount}
            />
            <div className="flex justify-center">
              <BetInput
                value={betAmount}
                min={minBet}
                max={maxBet}
                onChange={setBetAmount}
              />
            </div>
          </div>
        )}

        {/* メインアクションボタン */}
        <div className="flex gap-2">
          {/* FOLD */}
          {canFold && (
            <button
              onClick={() => handleAction('fold')}
              className="flex-1 py-3 px-4 rounded-xl font-bold text-sm
                bg-gray-700 hover:bg-gray-600 text-gray-300
                border border-gray-600 transition-all active:scale-95"
            >
              FOLD
            </button>
          )}

          {/* CHECK / CALL */}
          {canCheck && (
            <button
              onClick={() => handleAction('check')}
              className="flex-1 py-3 px-4 rounded-xl font-bold text-sm
                bg-blue-600 hover:bg-blue-500 text-white
                border border-blue-500 transition-all active:scale-95"
            >
              CHECK
            </button>
          )}
          {canCall && (
            <button
              onClick={() => handleAction('call')}
              className="flex-1 py-3 px-4 rounded-xl font-bold text-sm
                bg-blue-600 hover:bg-blue-500 text-white
                border border-blue-500 transition-all active:scale-95"
            >
              <div>CALL</div>
              <div className="text-xs font-mono text-blue-200">
                {callAmount.toLocaleString()}
              </div>
            </button>
          )}

          {/* BET / RAISE */}
          {canBetOrRaise && (
            betMode ? (
              <button
                onClick={() => handleAction(canBet ? 'bet' : 'raise', betAmount)}
                className="flex-1 py-3 px-4 rounded-xl font-bold text-sm
                  bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white
                  border border-amber-500 transition-all active:scale-95 shadow-lg shadow-amber-900/30"
              >
                <div>{canBet ? 'BET' : 'RAISE'}</div>
                <div className="text-xs font-mono text-amber-200">
                  {betAmount.toLocaleString()}
                </div>
              </button>
            ) : (
              <button
                onClick={openBetMode}
                className="flex-1 py-3 px-4 rounded-xl font-bold text-sm
                  bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white
                  border border-amber-500 transition-all active:scale-95 shadow-lg shadow-amber-900/30"
              >
                {canBet ? 'BET' : 'RAISE'}
              </button>
            )
          )}

          {/* ALL-IN（bet/raiseが使えない場合のフォールバック） */}
          {canAllIn && !canBetOrRaise && (
            <button
              onClick={() => handleAction('all-in')}
              className="flex-1 py-3 px-4 rounded-xl font-bold text-sm
                bg-red-700 hover:bg-red-600 text-white
                border border-red-600 transition-all active:scale-95"
            >
              ALL-IN
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
