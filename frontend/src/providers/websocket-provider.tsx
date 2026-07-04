import { createContext, useContext, useEffect, useRef, type ReactNode } from 'react';
import { io, type Socket } from 'socket.io-client';
import { useAuth } from './auth-provider';
import { getAccessToken } from '@/services/api';

const API_URL = import.meta.env.VITE_API_URL ?? '';

interface WebSocketContextValue {
  socket: Socket | null;
}

const WebSocketContext = createContext<WebSocketContextValue>({ socket: null });

export function WebSocketProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    const url = API_URL ? API_URL.replace('/api', '') : 'http://localhost:4000';
    const token = getAccessToken();
    if (!token) return;

    const socket = io(url, {
      auth: { token },
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [isAuthenticated, user]);

  return (
    <WebSocketContext.Provider value={{ socket: socketRef.current }}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(WebSocketContext);
}
