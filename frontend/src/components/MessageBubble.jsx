import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Avatar from './Avatar';

const MessageStatus = ({ status }) => {
  if (status === 'SENT') {
    return <svg className="w-4 h-4 text-apple-secondary/60" fill="currentColor" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" /></svg>;
  }
  if (status === 'DELIVERED') {
    return <svg className="w-4 h-4 text-apple-secondary/60" fill="currentColor" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" /><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" style={{ marginLeft: '-8px' }} /></svg>;
  }
  if (status === 'READ') {
    return <svg className="w-4 h-4 text-apple-accent" fill="currentColor" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" /><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" style={{ marginLeft: '-8px' }} /></svg>;
  }
  if (status === 'SENDING') {
    return <svg className="w-4 h-4 text-apple-secondary/60 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>;
  }
  if (status === 'FAILED') {
    return <svg className="w-4 h-4 text-apple-danger" fill="currentColor" viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" /></svg>;
  }
  return null;
};

export default function MessageBubble({ message, isOwn, onEdit, onDelete, onReact, onReply, onPin, onScroll, onRetry, isGroupChat }) {
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

  const handleReact = (emoji) => {
    if (message.id && String(message.id).startsWith('temp-')) {
      console.warn('Cannot add reaction to unsent message');
      return;
    }
    onReact(message.id, emoji);
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
  const isTemporary = message.id && String(message.id).startsWith('temp-');

  return (
    <div className={`flex gap-3 mb-6 group slide-up ${isOwn ? 'flex-row-reverse justify-end' : ''}`}>
      {!isOwn && <Avatar user={message.sender} size="sm" />}

      <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} max-w-sm`}>
        {!isOwn && isGroupChat && (
          <p className="text-xs text-apple-secondary mb-1 font-medium">{message.sender?.firstName} {message.sender?.lastName}</p>
        )}

        {message.replyTo && (
          <div onClick={() => onScroll(message.replyTo.id)} className={`mb-2 p-2 rounded-md border-l-2 border-apple-accent bg-apple-bg/40 cursor-pointer hover:bg-apple-bg/60 transition-all ${isOwn ? 'text-right' : ''}`}>
            <p className="text-xs text-apple-secondary font-medium">Replying to {message.replyTo.sender?.firstName}</p>
            <p className="text-xs text-apple-text truncate mt-0.5">{message.replyTo.content || '(deleted message)'}</p>
          </div>
        )}

        <div className={`inline-block px-4 py-2.5 rounded-lg relative group/bubble transition-all ${
          isFailed
            ? 'bg-apple-danger/10 border border-apple-danger/30 text-apple-danger'
            : isOwn
            ? 'message-sent bg-apple-accent text-white'
            : 'message-received bg-apple-border/30 text-apple-text'
        }`}>
          {isEditing ? (
            <div className="flex gap-2">
              <input type="text" value={editContent} onChange={(e) => setEditContent(e.target.value)} className="flex-1 px-2 py-1 bg-white border border-apple-border rounded text-sm focus:outline-none focus:ring-2 focus:ring-apple-accent/30 transition-all" autoFocus />
              <button onClick={handleEdit} className="px-2 py-1 btn-primary text-xs">Save</button>
              <button onClick={() => { setIsEditing(false); setEditContent(message.content || ''); }} className="px-2 py-1 btn-danger text-xs">Cancel</button>
            </div>
          ) : (
            <>
              {isDeleted ? (
                <p className="text-sm italic text-apple-secondary/70">This message was deleted</p>
              ) : (
                <>
                  <p className="text-sm break-words leading-relaxed">{message.content}</p>
                  {message.mediaUrl && (
                    <div className="mt-2">
                      {message.mediaType === 'IMAGE' ? (
                        <img src={message.mediaUrl} alt="Message media" className="max-w-xs rounded-md shadow-md hover:shadow-lg transition-all" />
                      ) : (
                        <a href={message.mediaUrl} download className="flex items-center gap-2 px-3 py-2 bg-white/20 hover:bg-white/30 rounded-md text-xs transition-all border border-white/20 hover:border-white/40 font-medium">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" /></svg>
                          Download
                        </a>
                      )}
                    </div>
                  )}
                  {message.edited && <p className="text-xs opacity-70 mt-1">(edited)</p>}
                </>
              )}
            </>
          )}

          {!isEditing && (
            <div className="absolute -right-8 top-0 opacity-0 group-hover/bubble:opacity-100 transition-opacity z-20">
              <button onClick={() => setShowMenu(!showMenu)} className="btn-icon-sm">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" /></svg>
              </button>

              {showMenu && (
                <div className="absolute right-0 mt-1 bg-white border border-apple-border rounded-md shadow-lg z-50 min-w-max scale-in">
                  <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="block w-full text-left px-3 py-2 text-sm text-apple-text hover:bg-apple-bg transition-all">React</button>
                  <button onClick={handleReply} className="block w-full text-left px-3 py-2 text-sm text-apple-text hover:bg-apple-bg transition-all">Reply</button>
                  {isOwn && !isDeleted && (
                    <>
                      <button onClick={() => { setIsEditing(true); setShowMenu(false); }} className="block w-full text-left px-3 py-2 text-sm text-apple-text hover:bg-apple-bg transition-all">Edit</button>
                      <button onClick={handleDelete} className="block w-full text-left px-3 py-2 text-sm text-apple-danger hover:bg-apple-danger/10 transition-all">Delete</button>
                    </>
                  )}
                  {!isDeleted && (
                    <button onClick={handlePin} className="block w-full text-left px-3 py-2 text-sm text-apple-text hover:bg-apple-bg transition-all">Pin</button>
                  )}
                </div>
              )}

              {showEmojiPicker && (
                <div className="absolute right-0 top-0 bg-white border border-apple-border rounded-md shadow-lg z-50 p-2 flex gap-1 flex-wrap w-64 scale-in">
                  {commonEmojis.map((emoji) => (
                    <button key={emoji} onClick={() => { handleReact(emoji); setShowEmojiPicker(false); }} disabled={isTemporary} className="text-lg hover:scale-125 transition-all hover:bg-apple-bg rounded p-1 disabled:opacity-50">
                      {emoji}
                    </button>
                  ))}
                  <button onClick={() => setShowEmojiPicker(false)} className="text-lg ml-2 pl-2 border-l border-apple-border">✕</button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className={`flex items-center gap-1 mt-1 ${isOwn ? 'justify-end' : ''}`}>
          <p className="text-xs text-apple-secondary/60 font-medium">{formatTime(message.sentAt)}</p>
          {isOwn && <MessageStatus status={message.status || 'SENT'} />}
        </div>

        {isFailed && isOwn && (
          <button onClick={() => onRetry && onRetry(message.tempId)} className="mt-2 text-xs px-2 py-1 btn btn-danger">Retry</button>
        )}

        {message.reactions && message.reactions.length > 0 && (
          <div className="flex gap-1 mt-2 flex-wrap">
            {message.reactions.map((reaction) => (
              <button key={reaction.emoji} onClick={() => handleReact(reaction.emoji)} disabled={isTemporary} className="px-2 py-1 bg-apple-bg hover:bg-apple-border text-xs rounded-md transition-all border border-apple-border/50 hover:border-apple-border font-medium disabled:opacity-50">
                {reaction.emoji} {reaction.count}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}