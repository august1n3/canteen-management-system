import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../hooks/useAuth';
import { SOCKET_URL } from '../constants/config';

interface SocketContextType {
  socket: Socket | null;
  connected: boolean;
  joinRoom: (room: string) => void;
  leaveRoom: (room: string) => void;
  emit: (event: string, data: any) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      // Initialize socket connection
      const newSocket = io(SOCKET_URL, {
        auth: {
          token: localStorage.getItem('token'),
        },
      });

      newSocket.on('connect', () => {
        console.log('Socket connected');
        setConnected(true);
        
        // Join role-specific room
        newSocket.emit('join-role-room', user.role);
      });

      newSocket.on('disconnect', () => {
        console.log('Socket disconnected');
        setConnected(false);
      });

      newSocket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        setConnected(false);
      });

      setSocket(newSocket);

      // Cleanup on unmount
      return () => {
        newSocket.close();
      };
    }
  }, [user]);

  const joinRoom = (room: string) => {
    if (socket) {
      socket.emit('join', room);
    }
  };

  const leaveRoom = (room: string) => {
    if (socket) {
      socket.emit('leave', room);
    }
  };

  const emit = (event: string, data: any) => {
    if (socket) {
      socket.emit(event, data);
    }
  };

  const value: SocketContextType = {
    socket,
    connected,
    joinRoom,
    leaveRoom,
    emit,
  };

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

// TODO: Add reconnection logic with exponential backoff
// TODO: Implement message queuing for offline scenarios
// TODO: Add typing for socket events
// TODO: Implement socket middleware for authentication refresh