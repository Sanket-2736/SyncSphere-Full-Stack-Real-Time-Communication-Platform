import { useEffect, useRef, useState } from 'react';
import { useCallStore } from '../store/callStore';

export default function VideoCallOverlay({ onEndCall, onToggleMute, onToggleCamera }) {
  const activeCallInfo = useCallStore((s) => s.getActiveCallInfo());
  const callDuration = useCallStore((s) => s.getCallDuration());
  const isMuted = useCallStore((s) => s.getIsMuted());
  const isCameraOff = useCallStore((s) => s.getIsCameraOff());
  const remoteStream = useCallStore((s) => s.getRemoteStream());
  const localStream = useCallStore((s) => s.getLocalStream());

  const remoteVideoRef = useRef(null);
  const localVideoRef = useRef(null);
  const [pipPosition, setPipPosition] = useState({ x: 20, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Setup remote video
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteVideoRef, remoteStream]);

  // Setup local video
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localVideoRef, localStream]);

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - pipPosition.x,
      y: e.clientY - pipPosition.y,
    });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;

    const newX = e.clientX - dragOffset.x;
    const newY = e.clientY - dragOffset.y;

    // Keep within bounds
    const maxX = window.innerWidth - 200;
    const maxY = window.innerHeight - 150;

    setPipPosition({
      x: Math.max(0, Math.min(newX, maxX)),
      y: Math.max(0, Math.min(newY, maxY)),
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragOffset]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'm' || e.key === 'M') {
        onToggleMute();
      } else if (e.key === 'v' || e.key === 'V') {
        onToggleCamera();
      } else if (e.key === 'Escape') {
        onEndCall();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [onToggleMute, onToggleCamera, onEndCall]);

  if (!activeCallInfo) return null;

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex items-center justify-center" role="dialog" aria-label="Video call">
      {/* Remote Video (Full Screen) */}
      <video
        ref={remoteVideoRef}
        autoPlay
        playsInline
        className="w-full h-full object-cover"
        aria-label="Remote participant video"
      />

      {/* Local Video (PiP - Bottom Right) */}
      <div
        onMouseDown={handleMouseDown}
        style={{
          position: 'fixed',
          left: `${pipPosition.x}px`,
          top: `${pipPosition.y}px`,
          cursor: isDragging ? 'grabbing' : 'grab',
        }}
        className="w-48 h-36 bg-black rounded-lg overflow-hidden border-2 border-white shadow-lg"
        role="region"
        aria-label="Your video (draggable)"
      >
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
          aria-label="Your video"
        />
        {isCameraOff && (
          <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 4h5l3.5-4.5 2.5 4v-11h-13v7.5z" />
            </svg>
          </div>
        )}
      </div>

      {/* Top Bar - Call Info */}
      <div className="absolute top-0 left-0 right-0 bg-black/50 px-6 py-4 flex items-center justify-between">
        <div className="text-white">
          <h2 className="text-lg font-semibold">{activeCallInfo.targetUsername}</h2>
          <p className="text-sm text-slate-300" aria-live="polite">{formatTime(callDuration)}</p>
        </div>
      </div>

      {/* Bottom Bar - Controls */}
      <div className="absolute bottom-0 left-0 right-0 bg-black/50 px-6 py-4 flex items-center justify-center gap-4">
        {/* Mute Button */}
        <button
          onClick={onToggleMute}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
            isMuted
              ? 'bg-red-600 hover:bg-red-700'
              : 'bg-slate-700 hover:bg-slate-600'
          }`}
          title={isMuted ? 'Unmute (M)' : 'Mute (M)'}
          aria-label={isMuted ? 'Unmute microphone' : 'Mute microphone'}
          aria-pressed={isMuted}
        >
          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
            {isMuted ? (
              <path d="M19.114 5.636l-15.832 15.78M9 9v3a3 3 0 006 0V9m6-3v6a6 6 0 01-5.356 5.955M9 19v2m6 0v2" />
            ) : (
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
            )}
          </svg>
        </button>

        {/* Camera Button */}
        <button
          onClick={onToggleCamera}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
            isCameraOff
              ? 'bg-red-600 hover:bg-red-700'
              : 'bg-slate-700 hover:bg-slate-600'
          }`}
          title={isCameraOff ? 'Turn on camera (V)' : 'Turn off camera (V)'}
          aria-label={isCameraOff ? 'Turn on camera' : 'Turn off camera'}
          aria-pressed={isCameraOff}
        >
          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
            {isCameraOff ? (
              <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 4h5l3.5-4.5 2.5 4v-11h-13v7.5z" />
            ) : (
              <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zm-11-7l2.5-3.15L16 13.1V5H5v9z" />
            )}
          </svg>
        </button>

        {/* End Call Button */}
        <button
          onClick={onEndCall}
          className="w-12 h-12 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center transition-colors"
          title="End call (Escape)"
          aria-label="End call"
        >
          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M16.192 6.344L11.949 10.586 7.707 6.344A2.828 2.828 0 104.586 9.465l4.242 4.242-4.242 4.242a2.828 2.828 0 104.121 4.121l4.242-4.242 4.242 4.242a2.827 2.827 0 104.121-4.121l-4.242-4.242 4.242-4.242a2.828 2.828 0 10-4.121-4.121z" />
          </svg>
        </button>
      </div>

      {/* Keyboard Shortcuts Help */}
      <div className="absolute bottom-20 left-6 text-white text-xs bg-black/50 px-3 py-2 rounded">
        <p>Keyboard: <kbd className="px-2 py-1 bg-slate-700 rounded">M</kbd> Mute • <kbd className="px-2 py-1 bg-slate-700 rounded">V</kbd> Camera • <kbd className="px-2 py-1 bg-slate-700 rounded">Esc</kbd> End</p>
      </div>
    </div>
  );
}
