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
        className="fixed bottom-4 left-4 z-40 bg-gray-800/80 hover:bg-gray-700 backdrop-blur-sm
          rounded-full p-3 border border-gray-600 shadow-lg transition-colors"
      >
        <span className="text-lg">💬</span>
        {chatMessages.length > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center font-bold">
            {Math.min(chatMessages.length, 9)}
          </span>
        )}
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 left-4 z-40 w-72 animate-slide-up">
      <div className="bg-gray-900/95 backdrop-blur-md rounded-2xl border border-gray-700 shadow-2xl overflow-hidden">
        {/* ヘッダー */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-gray-700">
          <span className="text-gray-300 text-sm font-semibold">Chat</span>
          <button
            onClick={() => setIsOpen(false)}
            className="text-gray-500 hover:text-gray-300 text-lg leading-none"
          >
            &times;
          </button>
        </div>

        {/* メッセージ一覧 */}
        <div ref={scrollRef} className="h-48 overflow-y-auto p-2 space-y-1">
          {chatMessages.length === 0 ? (
            <div className="text-gray-600 text-xs text-center py-4">No messages yet</div>
          ) : (
            chatMessages.map((msg, i) => (
              <div key={i} className="text-xs">
                <span className="text-amber-400 font-semibold">{msg.playerName}: </span>
                <span className="text-gray-300">{msg.text}</span>
              </div>
            ))
          )}
        </div>

        {/* 入力エリア */}
        <div className="flex border-t border-gray-700">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            maxLength={200}
            className="flex-1 bg-transparent px-3 py-2 text-sm text-gray-300
              placeholder-gray-600 focus:outline-none"
          />
          <button
            onClick={handleSend}
            className="px-3 py-2 text-amber-400 hover:text-amber-300 text-sm font-bold"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
