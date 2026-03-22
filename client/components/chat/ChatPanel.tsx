'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useGameStore } from '../../store/game-store';
import { useSocket } from '../../hooks/useSocket';

export default function ChatPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const chatMessages = useGameStore((s) => s.chatMessages);
  const { sendChat } = useSocket();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const handleSend = useCallback(() => {
    const text = message.trim();
    if (!text) return;
    sendChat(text);
    setMessage('');
  }, [message, sendChat]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 left-4 z-40 bg-surface-2 border border-border
          rounded-full p-2.5 text-text-secondary hover:text-text-primary
          shadow-md transition-colors relative"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        {chatMessages.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-danger text-white text-[10px]
            w-4 h-4 rounded-full flex items-center justify-center font-bold">
            {Math.min(chatMessages.length, 9)}
          </span>
        )}
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 left-4 z-40 w-72 animate-slide-up">
      <div className="panel-elevated overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-border">
          <span className="text-text-primary text-sm font-semibold">Chat</span>
          <button
            onClick={() => setIsOpen(false)}
            className="text-text-tertiary hover:text-text-primary text-lg leading-none transition-colors"
          >
            &times;
          </button>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="h-48 overflow-y-auto p-2 space-y-1">
          {chatMessages.length === 0 ? (
            <div className="text-text-tertiary text-xs text-center py-4">No messages yet</div>
          ) : (
            chatMessages.map((msg, i) => (
              <div key={i} className="text-xs">
                <span className="text-primary font-semibold">{msg.playerName}: </span>
                <span className="text-text-secondary">{msg.text}</span>
              </div>
            ))
          )}
        </div>

        {/* Input area */}
        <div className="flex border-t border-border">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            maxLength={200}
            className="flex-1 bg-transparent px-3 py-2 text-sm text-text-primary
              placeholder-text-tertiary focus:outline-none"
          />
          <button
            onClick={handleSend}
            className="px-3 py-2 text-primary hover:text-primary-hover text-sm font-medium transition-colors"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
