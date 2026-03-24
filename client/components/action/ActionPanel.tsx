'use client';

import { useCallback, useState, useEffect, useRef } from 'react';
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

  // All-in confirmation state
  const [confirmAllIn, setConfirmAllIn] = useState(false);
  const confirmTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clear confirmation timer on unmount or when turn changes
  useEffect(() => {
    return () => {
      if (confirmTimerRef.current) clearTimeout(confirmTimerRef.current);
    };
  }, []);

  useEffect(() => {
    setConfirmAllIn(false);
    if (confirmTimerRef.current) clearTimeout(confirmTimerRef.current);
  }, [isMyTurn]);

  const handleAction = useCallback((type: GameAction['type'], amount?: number) => {
    if (!playerId) return;
    const action: GameAction = { playerId, type, amount };
    sendAction(action);
    closeBetMode();
    setConfirmAllIn(false);
    if (confirmTimerRef.current) clearTimeout(confirmTimerRef.current);
  }, [playerId, sendAction, closeBetMode]);

  const handleAllInClick = useCallback(() => {
    if (confirmAllIn) {
      handleAction('all-in');
    } else {
      setConfirmAllIn(true);
      if (confirmTimerRef.current) clearTimeout(confirmTimerRef.current);
      confirmTimerRef.current = setTimeout(() => {
        setConfirmAllIn(false);
      }, 3000);
    }
  }, [confirmAllIn, handleAction]);

  // Handle bet/raise confirm with all-in guard (>50% of stack)
  const handleBetConfirm = useCallback(() => {
    if (!gameState || !playerId) return;
    const myPlayer = gameState.players.find(p => p.id === playerId);
    if (!myPlayer) return;

    const isLargeBet = betAmount > myPlayer.stack * 0.5;
    const canBet = availableActions.includes('bet');

    if (isLargeBet && !confirmAllIn) {
      setConfirmAllIn(true);
      if (confirmTimerRef.current) clearTimeout(confirmTimerRef.current);
      confirmTimerRef.current = setTimeout(() => {
        setConfirmAllIn(false);
      }, 3000);
      return;
    }

    handleAction(canBet ? 'bet' : 'raise', betAmount);
  }, [gameState, playerId, betAmount, availableActions, confirmAllIn, handleAction]);

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
    <div className="fixed bottom-4 right-4 z-50 w-80 animate-slide-up">
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
                onClick={handleBetConfirm}
                className={`btn flex-[1.3] py-2.5 text-sm font-semibold rounded-md active:scale-[0.97]
                  ${confirmAllIn ? 'bg-danger text-danger-fg' : 'btn-caution'}`}
              >
                <div className="flex flex-col items-center leading-tight">
                  {confirmAllIn ? (
                    <span>CONFIRM?</span>
                  ) : (
                    <>
                      <span>{canBet ? 'BET' : 'RAISE'}</span>
                      <span className="text-[10px] chip-amt opacity-70">
                        {betAmount.toLocaleString()}
                      </span>
                    </>
                  )}
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
              onClick={handleAllInClick}
              className={`btn flex-[1.3] py-2.5 text-sm font-bold rounded-md active:scale-[0.97]
                ${confirmAllIn ? 'bg-danger/80 text-danger-fg animate-pulse' : 'bg-danger text-danger-fg'}`}
            >
              {confirmAllIn ? 'CONFIRM ALL-IN?' : 'ALL-IN'}
            </button>
          )}
        </div>

        {/* Keyboard shortcut hints */}
        <div className="text-[9px] text-text-muted opacity-50 text-center mt-1.5 tracking-wide select-none">
          F:Fold  C:Call  R:Raise  A:All-in
        </div>
      </div>
    </div>
  );
}
