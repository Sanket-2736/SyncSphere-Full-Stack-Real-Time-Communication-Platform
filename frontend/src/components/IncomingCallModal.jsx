import { useEffect } from 'react';
import { useCallStore } from '../store/callStore';
import Avatar from './Avatar';

export default function IncomingCallModal({ onAccept, onDecline }) {
  const activeCallInfo = useCallStore((s) => s.getActiveCallInfo());

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'Escape') {
        onDecline();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [onDecline]);

  if (!activeCallInfo) return null;

  const isVideo = activeCallInfo.type === 'video';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-lg p-8 max-w-sm w-full mx-4 text-center">
        {/* Avatar */}
        <div className="mb-6 flex justify-center">
          <div className="w-24 h-24 rounded-full bg-indigo-600 flex items-center justify-center text-white text-4xl font-bold">
            {activeCallInfo.targetUsername?.[0]?.toUpperCase()}
          </div>
        </div>

        {/* Caller Info */}
        <h2 className="text-2xl font-bold text-white mb-2">
          {activeCallInfo.targetUsername}
        </h2>
        <p className="text-slate-400 mb-8">
          {isVideo ? 'Incoming video call' : 'Incoming audio call'}
        </p>

        {/* Buttons */}
        <div className="flex gap-4 justify-center">
          <button
            onClick={onDecline}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M16.192 6.344L11.949 10.586 7.707 6.344A2.828 2.828 0 104.586 9.465l4.242 4.242-4.242 4.242a2.828 2.828 0 104.121 4.121l4.242-4.242 4.242 4.242a2.827 2.827 0 104.121-4.121l-4.242-4.242 4.242-4.242a2.828 2.828 0 10-4.121-4.121z" />
            </svg>
            Decline
          </button>
          <button
            onClick={onAccept}
            className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
            </svg>
            Accept
          </button>
        </div>

        {/* Keyboard hint */}
        <p className="text-xs text-slate-500 mt-4">Press ESC to decline</p>
      </div>
    </div>
  );
}
