'use client';

import { useCallback } from 'react';
import { useGameState } from '../../hooks/useGameState';
import { useGameStore } from '../../store/game-store';
import { useBetControl } from '../../hooks/useBetControl';
import { useSocket } from '../../hooks/useSocket';
import { useLocalGame } from '../../hooks/useLocalGame';
import BetSlider from './BetSlider';
import PresetButtons from './PresetButtons';
import BetInput from './BetInput';
import { GameAction } from '../../../shared/types/game';

export default function ActionPanel() {
  const { isMyTurn, availableActions, gameState } = useGameState();
  const playerId = useGameStore((s) => s.playerId);
  const isPracticeMode = useGameStore((s) => s.isPracticeMode);
  const { sendAction: sendSocketAction } = useSocket();
  const { sendAction: sendLocalAction } = useLocalGame();
  const sendAction = isPracticeMode ? sendLocalAction : sendSocketAction;
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
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4 animate-slide-up">
      <div className="bg-surface-1/95 backdrop-blur-md border border-border rounded-lg shadow-lg p-3">

        {/* Bet/Raise controls */}
        {betMode && (
          <div className="mb-3 pb-3 border-b border-border-subtle space-y-2">
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
              <BetInput value={betAmount} min={minBet} max={maxBet} onChange={setBetAmount} />
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2">
          {/* FOLD */}
          {canFold && (
            <button
              onClick={() => handleAction('fold')}
              className="btn btn-danger flex-1 py-2.5 text-sm rounded-md active:scale-[0.97]"
            >
              FOLD
            </button>
          )}

          {/* CHECK */}
          {canCheck && (
            <button
              onClick={() => handleAction('check')}
              className="btn btn-positive flex-[1.3] py-2.5 text-sm font-semibold rounded-md active:scale-[0.97]"
            >
              CHECK
            </button>
          )}

          {/* CALL */}
          {canCall && (
            <button
              onClick={() => handleAction('call')}
              className="btn btn-primary flex-[1.3] py-2.5 text-sm font-semibold rounded-md active:scale-[0.97]"
            >
              <div className="flex flex-col items-center leading-tight">
                <span>CALL</span>
                <span className="text-[10px] chip-amt opacity-70">
                  {callAmount.toLocaleString()}
                </span>
              </div>
            </button>
          )}

          {/* BET / RAISE */}
          {canBetOrRaise && (
            betMode ? (
              <button
                onClick={() => handleAction(canBet ? 'bet' : 'raise', betAmount)}
                className="btn btn-caution flex-[1.3] py-2.5 text-sm font-semibold rounded-md active:scale-[0.97]"
              >
                <div className="flex flex-col items-center leading-tight">
                  <span>{canBet ? 'BET' : 'RAISE'}</span>
                  <span className="text-[10px] chip-amt opacity-70">
                    {betAmount.toLocaleString()}
                  </span>
                </div>
              </button>
            ) : (
              <button
                onClick={openBetMode}
                className="btn btn-caution flex-[1.3] py-2.5 text-sm font-semibold rounded-md active:scale-[0.97]"
              >
                {canBet ? 'BET' : 'RAISE'}
              </button>
            )
          )}

          {/* ALL-IN (fallback when bet/raise unavailable) */}
          {canAllIn && !canBetOrRaise && (
            <button
              onClick={() => handleAction('all-in')}
              className="btn flex-[1.3] py-2.5 text-sm font-bold rounded-md bg-danger text-danger-fg active:scale-[0.97]"
            >
              ALL-IN
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
