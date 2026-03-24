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
      <div className="bg-surface-1/95 backdrop-blur-md border border-border rounded-xl shadow-lg p-3">

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

        {/* Action buttons with hierarchy */}
        <div className="flex gap-2 items-end">
          {/* FOLD - smallest, subdued */}
          {canFold && (
            <button
              onClick={() => handleAction('fold')}
              className="py-2 px-3 text-xs rounded-lg border border-danger/20
                bg-danger-soft text-danger font-medium
                hover:bg-danger/15 active:scale-[0.97] transition-all
                w-[72px] shrink-0"
            >
              FOLD
            </button>
          )}

          {/* CHECK - medium */}
          {canCheck && (
            <button
              onClick={() => handleAction('check')}
              className="btn btn-positive py-3 text-sm font-semibold rounded-lg border border-positive/20
                active:scale-[0.97] flex-1"
            >
              CHECK
            </button>
          )}

          {/* CALL - medium */}
          {canCall && (
            <button
              onClick={() => handleAction('call')}
              className="btn btn-primary py-3 text-sm font-semibold rounded-lg border border-primary/20
                active:scale-[0.97] flex-1"
            >
              <div className="flex flex-col items-center leading-tight">
                <span>CALL</span>
                <span className="text-[10px] chip-amt opacity-70">
                  {callAmount.toLocaleString()}
                </span>
              </div>
            </button>
          )}

          {/* BET / RAISE - largest, prominent with elevation */}
          {canBetOrRaise && (
            betMode ? (
              <button
                onClick={handleBetConfirm}
                className={`py-3.5 text-sm font-bold rounded-lg border active:scale-[0.97] transition-all flex-1
                  ${confirmAllIn
                    ? 'bg-danger text-danger-fg border-danger/40'
                    : 'btn-caution border-caution/20'
                  }`}
                style={{
                  boxShadow: confirmAllIn
                    ? '0 2px 8px rgba(224,84,84,0.3)'
                    : '0 2px 8px rgba(229,160,48,0.2)',
                }}
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
                className="btn btn-caution py-3.5 text-sm font-bold rounded-lg border border-caution/20
                  active:scale-[0.97] flex-1"
                style={{ boxShadow: '0 2px 8px rgba(229,160,48,0.2)' }}
              >
                {canBet ? 'BET' : 'RAISE'}
              </button>
            )
          )}

          {/* ALL-IN (fallback when bet/raise unavailable) - distinct danger style */}
          {canAllIn && !canBetOrRaise && (
            <button
              onClick={handleAllInClick}
              className={`py-3.5 text-sm font-bold rounded-xl border active:scale-[0.97] transition-all flex-1
                ${confirmAllIn
                  ? 'bg-danger/80 text-danger-fg border-danger/50 animate-pulse'
                  : 'bg-danger text-danger-fg border-danger/30'
                }`}
              style={{ boxShadow: '0 2px 10px rgba(224,84,84,0.3)' }}
            >
              {confirmAllIn ? 'CONFIRM ALL-IN?' : 'ALL-IN'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
