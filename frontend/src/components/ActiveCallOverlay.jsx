import { useEffect, useState } from 'react';
import { useCallStore } from '../store/callStore';

export default function ActiveCallOverlay({ onEndCall, onToggleMute, onToggleCamera }) {
  const activeCallInfo = useCallStore((s) => s.getActiveCallInfo());
  const callDuration = useCallStore((s) => s.getCallDuration());
  const isMuted = useCallStore((s) => s.getIsMuted());
  const remoteStream = useCallStore((s) => s.getRemoteStream());

  const [audioRef, setAudioRef] = useState(null);

  // Setup remote audio
  useEffect(() => {
    if (audioRef && remoteStream) {
      audioRef.srcObject = remoteStream;
    }
  }, [audioRef, remoteStream]);

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
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50" role="dialog" aria-label="Active call">
      {/* Remote Audio Element */}
      <audio
        ref={setAudioRef}
        autoPlay
        playsInline
        style={{ display: 'none' }}
      />

      <div className="text-center">
        {/* Avatar */}
        <div className="mb-8 flex justify-center">
          <div className="w-32 h-32 rounded-full bg-indigo-600 flex items-center justify-center text-white text-6xl font-bold">
            {activeCallInfo.targetUsername?.[0]?.toUpperCase()}
          </div>
        </div>

        {/* Call Info */}
        <h2 className="text-3xl font-bold text-white mb-2">
          {activeCallInfo.targetUsername}
        </h2>
        <p className="text-slate-300 text-lg mb-8" aria-live="polite">
          {formatTime(callDuration)}
        </p>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4 mb-8">
          {/* Mute Button */}
          <button
            onClick={onToggleMute}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
              isMuted
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-slate-700 hover:bg-slate-600'
            }`}
            title={isMuted ? 'Unmute (M)' : 'Mute (M)'}
            aria-label={isMuted ? 'Unmute microphone' : 'Mute microphone'}
            aria-pressed={isMuted}
          >
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
              {isMuted ? (
                <path d="M19.114 5.636l-15.832 15.78M9 9v3a3 3 0 006 0V9m6-3v6a6 6 0 01-5.356 5.955M9 19v2m6 0v2" />
              ) : (
                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
              )}
            </svg>
          </button>

          {/* Speaker Button */}
          <button
            className="w-14 h-14 rounded-full bg-slate-700 hover:bg-slate-600 flex items-center justify-center transition-colors"
            title="Speaker"
            aria-label="Speaker"
          >
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
            </svg>
          </button>

          {/* End Call Button */}
          <button
            onClick={onEndCall}
            className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center transition-colors"
            title="End call (Escape)"
            aria-label="End call"
          >
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M16.192 6.344L11.949 10.586 7.707 6.344A2.828 2.828 0 104.586 9.465l4.242 4.242-4.242 4.242a2.828 2.828 0 104.121 4.121l4.242-4.242 4.242 4.242a2.827 2.827 0 104.121-4.121l-4.242-4.242 4.242-4.242a2.828 2.828 0 10-4.121-4.121z" />
            </svg>
          </button>
        </div>

        {/* Status */}
        <p className="text-slate-400 text-sm" aria-live="polite">
          {isMuted && '🔇 Muted'}
        </p>

        {/* Keyboard Shortcuts Help */}
        <p className="text-slate-500 text-xs mt-4">
          Keyboard: <kbd className="px-2 py-1 bg-slate-700 rounded">M</kbd> Mute • <kbd className="px-2 py-1 bg-slate-700 rounded">V</kbd> Camera • <kbd className="px-2 py-1 bg-slate-700 rounded">Esc</kbd> End
        </p>
      </div>
    </div>
  );
}
