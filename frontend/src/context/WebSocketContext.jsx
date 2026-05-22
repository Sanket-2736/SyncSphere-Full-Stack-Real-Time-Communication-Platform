import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useAuth } from './AuthContext';

const WebSocketContext = createContext(null);

export function WebSocketProvider({ children }) {
  const { token, isAuthenticated } = useAuth();
  const clientRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const subscriptionsRef = useRef(new Map());
  const reconnectTimeoutRef = useRef(null);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      return;
    }

    const connect = () => {
      const client = new Client({
        brokerURL: 'ws://localhost:8080/ws',
        connectHeaders: {
          Authorization: `Bearer ${token}`,
        },
        webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
        reconnectDelay: 5000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
        onConnect: () => {
          console.log('WebSocket connected');
          setIsConnected(true);
        },
        onDisconnect: () => {
          console.log('WebSocket disconnected');
          setIsConnected(false);
          // Auto-reconnect after 5 seconds
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, 5000);
        },
        onStompError: (frame) => {
          console.error('STOMP error:', frame);
        },
      });

      clientRef.current = client;
      client.activate();
    };

    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (clientRef.current) {
        clientRef.current.deactivate();
      }
    };
  }, [isAuthenticated, token]);

  const subscribe = (destination, callback) => {
    if (!clientRef.current?.connected) {
      console.warn('WebSocket not connected, cannot subscribe to', destination);
      return null;
    }

    const subscription = clientRef.current.subscribe(destination, (message) => {
      try {
        const body = JSON.parse(message.body);
        callback(body);
      } catch (error) {
        console.error('Error parsing message:', error);
        callback(message.body);
      }
    });

    subscriptionsRef.current.set(destination, subscription);
    return subscription;
  };

  const publish = (destination, body) => {
    if (!clientRef.current?.connected) {
      console.warn('WebSocket not connected, cannot publish to', destination);
      return;
    }

    clientRef.current.publish({
      destination,
      body: JSON.stringify(body),
    });
  };

  const unsubscribe = (destination) => {
    const subscription = subscriptionsRef.current.get(destination);
    if (subscription) {
      subscription.unsubscribe();
      subscriptionsRef.current.delete(destination);
    }
  };

  const value = {
    isConnected,
    subscribe,
    publish,
    unsubscribe,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocket() {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within WebSocketProvider');
  }
  return context;
}
