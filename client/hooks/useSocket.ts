'use client';

import { useEffect, useCallback, useRef } from 'react';
import { connectSocket, disconnectSocket, getSocket, TypedSocket } from '../lib/socket-client';
import { useGameStore } from '../store/game-store';
import { useSocketStore } from '../store/socket-store';
import { GameAction } from '../../shared/types/game';
import { RoomConfig } from '../../shared/types/room';

export function useSocket() {
  const socketRef = useRef<TypedSocket | null>(null);
  const { setGameState, setMyHoleCards, setAvailableActions, addChatMessage, setLastResult, setRoomInfo } = useGameStore();
  const { setConnected, setRoomState, setError } = useSocketStore();

  useEffect(() => {
    const socket = connectSocket();
    socketRef.current = socket;

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    socket.on('room:state', (state) => setRoomState(state));
    socket.on('game:state', (state) => setGameState(state));
    socket.on('game:yourCards', (cards) => setMyHoleCards(cards));
    socket.on('game:availableActions', (actions) => setAvailableActions(actions));
    socket.on('game:result', (result) => setLastResult(result));
    socket.on('chat:message', (msg) => addChatMessage(msg));
    socket.on('error', (msg) => setError(msg));

    socket.on('game:hitRevealed', (payload) => {
      // HIT公開はgame:stateに反映されるので追加処理不要
      // 将来的にアニメーション用のイベント発火に使う
    });

    socket.on('player:disconnected', (playerId) => {
      // game:stateに反映されるので追加処理不要
    });

    socket.on('player:reconnected', (playerId) => {
      // game:stateに反映されるので追加処理不要
    });

    return () => {
      socket.removeAllListeners();
      disconnectSocket();
    };
  }, []);

  const createRoom = useCallback((config: RoomConfig, playerName: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const socket = getSocket();
      socket.emit('room:create', { ...config, name: config.name || 'New Room' } as RoomConfig, (roomId: string) => {
        if (roomId) {
          setRoomInfo(roomId, '', playerName);
          resolve(roomId);
        } else {
          reject(new Error('Failed to create room'));
        }
      });
    });
  }, [setRoomInfo]);

  const joinRoom = useCallback((roomId: string, playerName: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const socket = getSocket();
      socket.emit('room:join', { roomId, playerName }, (result) => {
        if (result.success && result.playerId) {
          setRoomInfo(roomId, result.playerId, playerName);
          resolve();
        } else {
          reject(new Error(result.error ?? 'Failed to join'));
        }
      });
    });
  }, [setRoomInfo]);

  const leaveRoom = useCallback(() => {
    getSocket().emit('room:leave');
    setRoomState(null);
  }, [setRoomState]);

  const startGame = useCallback(() => {
    getSocket().emit('game:start');
  }, []);

  const sendAction = useCallback((action: GameAction) => {
    getSocket().emit('game:action', action);
  }, []);

  const sendChat = useCallback((text: string) => {
    getSocket().emit('chat:message', text);
  }, []);

  const reconnect = useCallback((roomId: string, playerId: string) => {
    getSocket().emit('reconnect:restore', { roomId, playerId });
  }, []);

  return {
    createRoom,
    joinRoom,
    leaveRoom,
    startGame,
    sendAction,
    sendChat,
    reconnect,
  };
}
