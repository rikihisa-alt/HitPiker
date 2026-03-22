'use client';

import { create } from 'zustand';
import { RoomState } from '../../shared/types/room';

interface SocketStore {
  connected: boolean;
  roomState: RoomState | null;
  error: string | null;

  setConnected: (connected: boolean) => void;
  setRoomState: (state: RoomState | null) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

export const useSocketStore = create<SocketStore>((set) => ({
  connected: false,
  roomState: null,
  error: null,

  setConnected: (connected) => set({ connected }),
  setRoomState: (state) => set({ roomState: state }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),
}));
