'use client';

import { useState } from 'react';
import { useGameStore } from '../../store/game-store';
import { HandHistoryEntry } from '../../lib/hand-history';
import { Card, Rank, Suit } from '../../../shared/types/card';

const SUIT_SYMBOLS: Record<Suit, string> = {
  spade: '\u2660',
  heart: '\u2665',
  diamond: '\u2666',
  club: '\u2663',
};

const SUIT_COLORS: Record<Suit, string> = {
  spade: 'text-slate-300',
  heart: 'text-rose-400',
  diamond: 'text-blue-400',
  club: 'text-emerald-400',
};

const RANK_LABELS: Record<Rank, string> = {
  2: '2', 3: '3', 4: '4', 5: '5', 6: '6', 7: '7', 8: '8', 9: '9',
  10: 'T', 11: 'J', 12: 'Q', 13: 'K', 14: 'A',
};

function formatCard(card: Card): { label: string; colorClass: string } {
  return {
    label: `${RANK_LABELS[card.rank]}${SUIT_SYMBOLS[card.suit]}`,
    colorClass: SUIT_COLORS[card.suit],
  };
}

function formatCards(cards: Card[]): JSX.Element {
  return (
    <span className="inline-flex gap-0.5">
      {cards.map((c, i) => {
        const { label, colorClass } = formatCard(c);
        return (
          <span key={i} className={`chip-amt text-[11px] ${colorClass}`}>
            {label}
          </span>
        );
      })}
    </span>
  );
}

function HandEntryRow({ entry, isExpanded, onToggle }: {
  entry: HandHistoryEntry;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const isWinner = entry.winners.some(w => w.amount > 0 && entry.myEndStack > entry.myStartStack);
  const profit = entry.myEndStack - entry.myStartStack;

  return (
    <div className="border-b border-border-subtle last:border-b-0">
      {/* Summary row */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-surface-2/50 transition-colors"
      >
        <span className="text-text-muted text-[10px] chip-amt w-6 shrink-0">
          #{entry.handNumber}
        </span>
        <span className="flex-1 min-w-0">
          {formatCards(entry.myHoleCards)}
        </span>
        <span className="text-text-sub text-[10px] truncate max-w-[80px]">
          {entry.myHandName}
        </span>
        <span className={`chip-amt text-[11px] font-medium w-14 text-right shrink-0 ${
          profit > 0 ? 'text-positive' : profit < 0 ? 'text-danger' : 'text-text-muted'
        }`}>
          {profit > 0 ? '+' : ''}{profit.toLocaleString()}
        </span>
        <span className={`text-text-muted text-[10px] transition-transform ${isExpanded ? 'rotate-90' : ''}`}>
          {'\u25B6'}
        </span>
      </button>

      {/* Expanded details */}
      {isExpanded && (
        <div className="px-3 pb-2.5 pt-0.5 space-y-1.5 bg-surface-2/30">
          {/* Board */}
          <div className="flex items-center gap-1.5">
            <span className="text-text-muted text-[10px] w-10 shrink-0">Board</span>
            {entry.board.length > 0 ? formatCards(entry.board) : (
              <span className="text-text-muted text-[10px]">-</span>
            )}
          </div>

          {/* Pot */}
          <div className="flex items-center gap-1.5">
            <span className="text-text-muted text-[10px] w-10 shrink-0">Pot</span>
            <span className="chip-amt text-[11px] text-text-sub">
              {entry.potTotal.toLocaleString()}
            </span>
          </div>

          {/* Winners */}
          <div className="flex items-start gap-1.5">
            <span className="text-text-muted text-[10px] w-10 shrink-0">Win</span>
            <div className="flex flex-col gap-0.5">
              {entry.winners.map((w, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <span className="text-text text-[11px]">{w.playerName}</span>
                  <span className="chip-amt text-[11px] text-positive">+{w.amount.toLocaleString()}</span>
                  <span className="text-text-muted text-[10px]">{w.handName}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Actions by phase */}
          {entry.players.length > 0 && (
            <div className="flex items-start gap-1.5">
              <span className="text-text-muted text-[10px] w-10 shrink-0">Acts</span>
              <div className="flex flex-col gap-0.5 text-[10px]">
                {(['preflop', 'flop', 'turn', 'river'] as const).map(phase => {
                  const phaseActions = entry.players.flatMap(p =>
                    p.actions.filter(a => a.phase === phase).map(a => ({
                      name: p.playerName,
                      action: a.action,
                      amount: a.amount,
                    }))
                  );
                  if (phaseActions.length === 0) return null;
                  return (
                    <div key={phase} className="flex items-start gap-1">
                      <span className="text-text-muted w-10 shrink-0 uppercase">{phase}</span>
                      <span className="text-text-sub">
                        {phaseActions.map((a, i) => (
                          <span key={i}>
                            {i > 0 && ', '}
                            <span className="text-text">{a.name}</span>{' '}
                            <span className={
                              a.action === 'fold' ? 'text-danger' :
                              a.action === 'raise' || a.action === 'bet' ? 'text-caution' :
                              a.action === 'all-in' ? 'text-primary' :
                              'text-text-sub'
                            }>
                              {a.action}
                              {a.amount ? ` ${a.amount.toLocaleString()}` : ''}
                            </span>
                          </span>
                        ))}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function HandHistoryPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedHand, setExpandedHand] = useState<number | null>(null);
  const handHistory = useGameStore((s) => s.handHistory);

  const sortedHistory = [...handHistory].reverse();

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`absolute top-14 right-3 z-40 flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-medium transition-all ${
          isOpen
            ? 'bg-primary text-primary-fg'
            : 'bg-surface-1 text-text-sub border border-border hover:bg-surface-2 hover:text-text'
        }`}
      >
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M2 3h12M2 6.5h12M2 10h8M2 13.5h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        History
        {handHistory.length > 0 && (
          <span className={`chip-amt text-[10px] ${isOpen ? 'text-primary-fg/70' : 'text-text-muted'}`}>
            {handHistory.length}
          </span>
        )}
      </button>

      {/* Panel */}
      {isOpen && (
        <div className="absolute top-24 right-3 z-40 w-72 max-h-[calc(100vh-140px)] bg-surface-1 border border-border rounded-lg shadow-lg overflow-hidden flex flex-col animate-fade-in">
          {/* Header */}
          <div className="px-3 py-2 border-b border-border flex items-center justify-between shrink-0">
            <span className="text-text text-xs font-medium">Hand History</span>
            <span className="text-text-muted text-[10px] chip-amt">
              {handHistory.length} hands
            </span>
          </div>

          {/* List */}
          <div className="overflow-y-auto flex-1">
            {sortedHistory.length === 0 ? (
              <div className="px-3 py-6 text-center text-text-muted text-xs">
                No hands played yet
              </div>
            ) : (
              sortedHistory.map((entry) => (
                <HandEntryRow
                  key={entry.handNumber}
                  entry={entry}
                  isExpanded={expandedHand === entry.handNumber}
                  onToggle={() => setExpandedHand(
                    expandedHand === entry.handNumber ? null : entry.handNumber
                  )}
                />
              ))
            )}
          </div>
        </div>
      )}
    </>
  );
}
