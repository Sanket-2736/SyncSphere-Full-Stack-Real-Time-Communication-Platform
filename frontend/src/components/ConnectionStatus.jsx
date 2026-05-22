import { useEffect, useState } from 'react';
import { useWebSocket } from '../context/WebSocketContext';

export default function ConnectionStatus() {
  const { isConnected } = useWebSocket();
  const [wasDisconnected, setWasDisconnected] = useState(false);
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    if (!isConnected) {
      setWasDisconnected(true);
      setShowReconnected(false);
    } else if (wasDisconnected) {
      setShowReconnected(true);
      setWasDisconnected(false);
      const timer = setTimeout(() => setShowReconnected(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [isConnected, wasDisconnected]);

  if (!isConnected && !wasDisconnected) return null;

  return (
    <>
      {!isConnected && (
        <div className="fixed top-16 right-4 bg-yellow-600 text-white text-xs py-2 px-3 rounded-lg z-40 flex items-center justify-center gap-2 shadow-lg">
          <svg className="w-3 h-3 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Reconnecting...
        </div>
      )}

      {showReconnected && (
        <div className="fixed top-16 right-4 bg-green-600 text-white text-xs py-2 px-3 rounded-lg z-40 shadow-lg animate-out fade-out duration-500">
          ✓ Connected
        </div>
      )}
    </>
  );
}
