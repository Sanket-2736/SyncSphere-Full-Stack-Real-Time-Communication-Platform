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
    <div className={`flex gap-3 mb-4 group ${isOwn ? 'flex-row-reverse justify-end' : ''}`}>
      {/* Avatar */}
      {!isOwn && (
        <Avatar user={message.sender} size="sm" />
      )}

      {/* Message Content */}
      <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} max-w-xs`}>
        {/* Sender Name (for group chats) */}
        {!isOwn && isGroupChat && (
          <p className="text-xs text-slate-400 mb-1">
            {message.sender?.firstName} {message.sender?.lastName}
          </p>
        )}

        {/* Reply Preview */}
        {message.replyTo && (
          <div
            onClick={() => onScroll(message.replyTo.id)}
            className={`mb-2 p-2 rounded border-l-2 border-indigo-500 bg-slate-700/50 cursor-pointer hover:bg-slate-700 transition-colors ${
              isOwn ? 'text-right' : ''
            }`}
          >
            <p className="text-xs text-slate-400">
              Replying to {message.replyTo.sender?.firstName}
            </p>
            <p className="text-xs text-slate-300 truncate">
              {message.replyTo.content || '(deleted message)'}
            </p>
          </div>
        )}

        {/* Message Bubble */}
        <div
          className={`inline-block px-4 py-2 rounded-lg relative group/bubble ${
            isFailed
              ? 'bg-red-900/30 border border-red-700 text-red-300'
              : isOwn
              ? 'bg-indigo-600 text-white'
              : 'bg-slate-700 text-slate-100'
          }`}
        >
          {isEditing ? (
            <div className="flex gap-2">
              <input
                type="text"
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="flex-1 px-2 py-1 bg-slate-600 text-white rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                autoFocus
              />
              <button
                onClick={handleEdit}
                className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded transition-colors"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditContent(message.content || '');
                }}
                className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded transition-colors"
              >
                Cancel
              </button>
            </div>
          ) : (
            <>
              {isDeleted ? (
                <p className="text-sm italic text-slate-400">This message was deleted</p>
              ) : (
                <>
                  <p className="text-sm break-words">{message.content}</p>
                  {message.mediaUrl && (
                    <div className="mt-2">
                      {message.mediaType === 'IMAGE' ? (
                        <img
                          src={message.mediaUrl}
                          alt="Message media"
                          className="max-w-xs rounded"
                        />
                      ) : (
                        <a
                          href={message.mediaUrl}
                          download
                          className="flex items-center gap-2 px-3 py-2 bg-slate-600 hover:bg-slate-500 rounded text-xs transition-colors"
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
                    <p className="text-xs opacity-70 mt-1">(edited)</p>
                  )}
                </>
              )}
            </>
          )}

          {/* Message Menu */}
          {!isEditing && (
            <div className="absolute -right-8 top-0 opacity-0 group-hover/bubble:opacity-100 transition-opacity z-20">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-1 text-slate-400 hover:text-white"
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
                <div className="absolute right-0 mt-1 bg-slate-800 border border-slate-700 rounded shadow-lg z-50 min-w-max">
                  <button
                    onClick={() => {
                      setShowEmojiPicker(!showEmojiPicker);
                    }}
                    className="block w-full text-left px-3 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                  >
                    React
                  </button>
                  <button
                    onClick={handleReply}
                    className="block w-full text-left px-3 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
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
                        className="block w-full text-left px-3 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={handleDelete}
                        className="block w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-slate-700 hover:text-red-300 transition-colors"
                      >
                        Delete
                      </button>
                    </>
                  )}
                  {!isDeleted && (
                    <button
                      onClick={handlePin}
                      className="block w-full text-left px-3 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                    >
                      Pin
                    </button>
                  )}
                </div>
              )}

              {showEmojiPicker && (
                <div className="absolute right-0 top-0 bg-slate-800 border border-slate-700 rounded shadow-lg z-50 p-2 flex gap-1 flex-wrap w-64">
                  {commonEmojis.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => {
                        onReact(message.id, emoji);
                        // Don't close emoji picker - keep it open for more reactions
                      }}
                      className="text-lg hover:scale-125 transition-transform"
                    >
                      {emoji}
                    </button>
                  ))}
                  {/* Close button for emoji picker */}
                  <button
                    onClick={() => setShowEmojiPicker(false)}
                    className="text-lg hover:scale-125 transition-transform ml-2 pl-2 border-l border-slate-600"
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
        <div className={`flex items-center gap-1 mt-1 ${isOwn ? 'justify-end' : ''}`}>
          <p className="text-xs text-slate-500">
            {formatTime(message.sentAt)}
          </p>
          {isOwn && <MessageStatus status={message.status || 'SENT'} />}
        </div>

        {/* Retry Button for Failed Messages */}
        {isFailed && isOwn && (
          <button
            onClick={() => onRetry && onRetry(message.tempId)}
            className="mt-2 text-xs px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
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
                className="px-2 py-1 bg-slate-600 hover:bg-slate-500 text-xs rounded transition-colors"
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
