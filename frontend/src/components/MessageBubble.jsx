import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Avatar from './Avatar';

const MessageStatus = ({ status }) => {
  if (status === 'SENT') {
    return (
      <svg className="w-4 h-4 text-slate-400" fill="currentColor" viewBox="0 0 24 24">
        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
      </svg>
    );
  }
  if (status === 'DELIVERED') {
    return (
      <svg className="w-4 h-4 text-slate-400" fill="currentColor" viewBox="0 0 24 24">
        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" style={{ marginLeft: '-8px' }} />
      </svg>
    );
  }
  if (status === 'READ') {
    return (
      <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" style={{ marginLeft: '-8px' }} />
      </svg>
    );
  }
  if (status === 'SENDING') {
    return (
      <svg className="w-4 h-4 text-slate-400 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    );
  }
  if (status === 'FAILED') {
    return (
      <svg className="w-4 h-4 text-red-400" fill="currentColor" viewBox="0 0 24 24">
        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
      </svg>
    );
  }
  return null;
};

export default function MessageBubble({
  message,
  isOwn,
  onEdit,
  onDelete,
  onReact,
  onReply,
  onPin,
  onScroll,
  onRetry,
  isGroupChat,
}) {
  const { user } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content || '');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const commonEmojis = ['👍', '❤️', '😂', '😮', '😢', '🔥'];

  const handleEdit = () => {
    if (editContent.trim()) {
      onEdit(message.id, editContent);
      setIsEditing(false);
    }
  };

  const handleDelete = () => {
    onDelete(message.id);
    setShowMenu(false);
  };

  const handleReply = () => {
    onReply(message);
    setShowMenu(false);
  };

  const handlePin = () => {
    onPin(message.id);
    setShowMenu(false);
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return 'Invalid Date';
    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) return 'Invalid Date';
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return 'Invalid Date';
    }
  };

  const isDeleted = message.deleted;
  const isFailed = message.status === 'FAILED';

  return (
    <div className={`flex gap-3 mb-4 group animate-fade-in ${isOwn ? 'flex-row-reverse justify-end' : ''}`} style={{ animationDelay: '0ms' }}>
      {/* Avatar */}
      {!isOwn && (
        <Avatar user={message.sender} size="sm" />
      )}

      {/* Message Content */}
      <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} max-w-xs`}>
        {/* Sender Name (for group chats) */}
        {!isOwn && isGroupChat && (
          <p className="text-xs text-luxury-muted mb-1 font-semibold tracking-wide">
            {message.sender?.firstName} {message.sender?.lastName}
          </p>
        )}

        {/* Reply Preview */}
        {message.replyTo && (
          <div
            onClick={() => onScroll(message.replyTo.id)}
            className={`mb-2 p-2.5 rounded-lg border-l-4 border-luxury-accent bg-luxury-surface/60 cursor-pointer hover:bg-luxury-surface transition-all duration-300 hover:shadow-glow-sm ${
              isOwn ? 'text-right' : ''
            }`}
          >
            <p className="text-xs text-luxury-muted font-medium">
              Replying to {message.replyTo.sender?.firstName}
            </p>
            <p className="text-xs text-luxury-text truncate mt-0.5">
              {message.replyTo.content || '(deleted message)'}
            </p>
          </div>
        )}

        {/* Message Bubble */}
        <div
          className={`inline-block px-5 py-3 rounded-3xl relative group/bubble transition-all duration-300 ${
            isFailed
              ? 'bg-rose-900/30 border border-rose-700/50 text-rose-300 rounded-2xl'
              : isOwn
              ? 'message-own'
              : 'message-other'
          }`}
        >
          {isEditing ? (
            <div className="flex gap-2">
              <input
                type="text"
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="flex-1 px-2 py-1 bg-luxury-surface text-luxury-text rounded text-sm focus:outline-none focus:ring-2 focus:ring-luxury-accent/50 transition-all"
                autoFocus
              />
              <button
                onClick={handleEdit}
                className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs rounded transition-all duration-300 font-medium hover:shadow-lg active:scale-95"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditContent(message.content || '');
                }}
                className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white text-xs rounded transition-all duration-300 font-medium hover:shadow-lg active:scale-95"
              >
                Cancel
              </button>
            </div>
          ) : (
            <>
              {isDeleted ? (
                <p className="text-sm italic text-luxury-muted">This message was deleted</p>
              ) : (
                <>
                  <p className="text-sm break-words leading-relaxed">{message.content}</p>
                  {message.mediaUrl && (
                    <div className="mt-2">
                      {message.mediaType === 'IMAGE' ? (
                        <img
                          src={message.mediaUrl}
                          alt="Message media"
                          className="max-w-xs rounded-lg shadow-luxury hover:shadow-luxury-lg transition-all duration-300"
                        />
                      ) : (
                        <a
                          href={message.mediaUrl}
                          download
                          className="flex items-center gap-2 px-3 py-2 bg-luxury-surface hover:bg-luxury-card rounded-lg text-xs transition-all duration-300 border border-luxury-accent/20 hover:border-luxury-accent/40 hover:shadow-glow-sm"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                          </svg>
                          Download
                        </a>
                      )}
                    </div>
                  )}
                  {message.edited && (
                    <p className="text-xs opacity-70 mt-1 font-medium">(edited)</p>
                  )}
                </>
              )}
            </>
          )}

          {/* Message Menu */}
          {!isEditing && (
            <div className="absolute -right-8 top-0 opacity-0 group-hover/bubble:opacity-100 transition-opacity duration-300 z-20">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-1 text-luxury-muted hover:text-luxury-accent transition-all duration-300 hover:scale-110"
              >
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                </svg>
              </button>

              {showMenu && (
                <div className="absolute right-0 mt-1 bg-luxury-card border border-luxury-accent/40 rounded-lg shadow-luxury-lg z-50 min-w-max animate-scale-in backdrop-blur-sm">
                  <button
                    onClick={() => {
                      setShowEmojiPicker(!showEmojiPicker);
                    }}
                    className="block w-full text-left px-3 py-2 text-sm text-luxury-text hover:bg-luxury-surface hover:text-luxury-accent transition-all duration-300"
                  >
                    React
                  </button>
                  <button
                    onClick={handleReply}
                    className="block w-full text-left px-3 py-2 text-sm text-luxury-text hover:bg-luxury-surface hover:text-luxury-accent transition-all duration-300"
                  >
                    Reply
                  </button>
                  {isOwn && !isDeleted && (
                    <>
                      <button
                        onClick={() => {
                          setIsEditing(true);
                          setShowMenu(false);
                        }}
                        className="block w-full text-left px-3 py-2 text-sm text-luxury-text hover:bg-luxury-surface hover:text-luxury-accent transition-all duration-300"
                      >
                        Edit
                      </button>
                      <button
                        onClick={handleDelete}
                        className="block w-full text-left px-3 py-2 text-sm text-rose-400 hover:bg-luxury-surface hover:text-rose-300 transition-all duration-300"
                      >
                        Delete
                      </button>
                    </>
                  )}
                  {!isDeleted && (
                    <button
                      onClick={handlePin}
                      className="block w-full text-left px-3 py-2 text-sm text-luxury-text hover:bg-luxury-surface hover:text-luxury-accent transition-all duration-300"
                    >
                      Pin
                    </button>
                  )}
                </div>
              )}

              {showEmojiPicker && (
                <div className="absolute right-0 top-0 bg-luxury-card border border-luxury-accent/40 rounded-lg shadow-luxury-lg z-50 p-2 flex gap-1 flex-wrap w-64 animate-scale-in backdrop-blur-sm">
                  {commonEmojis.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => {
                        onReact(message.id, emoji);
                      }}
                      className="text-lg hover:scale-125 transition-all duration-300 hover:bg-luxury-surface rounded-lg p-1"
                    >
                      {emoji}
                    </button>
                  ))}
                  {/* Close button for emoji picker */}
                  <button
                    onClick={() => setShowEmojiPicker(false)}
                    className="text-lg hover:scale-125 transition-all duration-300 ml-2 pl-2 border-l border-luxury-accent/20"
                    title="Close"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Timestamp & Status */}
        <div className={`flex items-center gap-1 mt-1.5 ${isOwn ? 'justify-end' : ''}`}>
          <p className="text-xs text-luxury-muted/70 font-medium">
            {formatTime(message.sentAt)}
          </p>
          {isOwn && <MessageStatus status={message.status || 'SENT'} />}
        </div>

        {/* Retry Button for Failed Messages */}
        {isFailed && isOwn && (
          <button
            onClick={() => onRetry && onRetry(message.tempId)}
            className="mt-2 text-xs px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-all duration-300 font-medium hover:shadow-lg active:scale-95"
          >
            Retry
          </button>
        )}

        {/* Reactions */}
        {message.reactions && message.reactions.length > 0 && (
          <div className="flex gap-1 mt-2 flex-wrap">
            {message.reactions.map((reaction) => (
              <button
                key={reaction.emoji}
                onClick={() => onReact(message.id, reaction.emoji)}
                className="px-2 py-1 bg-luxury-surface hover:bg-luxury-card text-xs rounded-lg transition-all duration-300 border border-luxury-accent/25 hover:border-luxury-accent/50 hover:shadow-glow-sm font-medium"
              >
                {reaction.emoji} {reaction.count}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
