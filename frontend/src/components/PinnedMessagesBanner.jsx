import { useState } from 'react';

export default function PinnedMessagesBanner({ pinnedMessages, onScroll }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!pinnedMessages || pinnedMessages.length === 0) {
    return null;
  }

  const current = pinnedMessages[currentIndex];

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % pinnedMessages.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) =>
      prev === 0 ? pinnedMessages.length - 1 : prev - 1
    );
  };

  return (
    <div className="bg-slate-700 border-b border-slate-600 px-4 py-3 flex items-center justify-between gap-3">
      <div
        onClick={() => onScroll(current.id)}
        className="flex-1 min-w-0 cursor-pointer hover:opacity-80 transition-opacity"
      >
        <p className="text-xs text-slate-400 mb-1">📌 Pinned Message</p>
        <p className="text-sm text-white truncate">
          {current.content || '(media message)'}
        </p>
        <p className="text-xs text-slate-500 mt-1">
          by {current.sender?.firstName} {current.sender?.lastName}
        </p>
      </div>

      {pinnedMessages.length > 1 && (
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrev}
            className="p-1 text-slate-400 hover:text-white transition-colors"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
            </svg>
          </button>
          <span className="text-xs text-slate-400">
            {currentIndex + 1} / {pinnedMessages.length}
          </span>
          <button
            onClick={handleNext}
            className="p-1 text-slate-400 hover:text-white transition-colors"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
