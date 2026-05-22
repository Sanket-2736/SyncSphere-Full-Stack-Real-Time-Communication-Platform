import { useEffect } from 'react';
import { useWebSocket } from '../context/WebSocketContext';
import { useAuth } from '../context/AuthContext';

export function usePresence() {
  const { isConnected, subscribe, publish, unsubscribe } = useWebSocket();
  const { user } = useAuth();

  useEffect(() => {
    if (!isConnected || !user) {
      return;
    }

    // Subscribe to presence updates
    const presenceDestination = `/user/queue/presence`;
    const topicDestination = `/topic/presence/${user.id}`;

    subscribe(presenceDestination, (message) => {
      console.log('Presence update:', message);
    });

    subscribe(topicDestination, (message) => {
      console.log('User presence update:', message);
    });

    // Publish online status
    publish('/app/presence', {
      status: 'ONLINE',
    });

    return () => {
      // Publish offline status
      publish('/app/presence', {
        status: 'OFFLINE',
      });

      unsubscribe(presenceDestination);
      unsubscribe(topicDestination);
    };
  }, [isConnected, user, subscribe, publish, unsubscribe]);
}
