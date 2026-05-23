import { useState, useRef } from 'react';
import { useMessageStore } from '../store/messageStore';
import axiosInstance from '../api/axiosInstance';

export default function MessageInput({
  conversationId,
  onSendMessage,
  onTyping,
  disabled = false,
}) {
  const [messageInput, setMessageInput] = useState('');
  const [uploading, setUploading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const fileInputRef = useRef(null);
  const typingDebounceRef = useRef(null);

  const replyingTo = useMessageStore((s) => s.getReplyingTo(conversationId));
  const clearReplyingTo = useMessageStore((s) => s.clearReplyingTo);

  const commonEmojis = [
    '😀', '😂', '😍', '🤔', '😢', '😡',
    '👍', '👎', '❤️', '🔥', '✨', '🎉',
    '🚀', '💯', '🙏', '😎', '🤝', '💪',
  ];

  const handleSendMessage = async () => {
    if (!messageInput.trim()) return;

    onSendMessage(messageInput, null, replyingTo?.id);
    setMessageInput('');
    setShowEmojiPicker(false); // Close emoji picker when sending
    clearTimeout(typingDebounceRef.current);
    onTyping?.(false);
    clearReplyingTo(conversationId);
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setMessageInput(value);

    // Debounce typing indicator (300ms)
    clearTimeout(typingDebounceRef.current);
    
    if (value.length > 0) {
      typingDebounceRef.current = setTimeout(() => {
        onTyping?.(true);
      }, 300);
    } else {
      onTyping?.(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const { data } = await axiosInstance.post(
        '/api/chat/media/upload',
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
        }
      );

      // Send message with media
      const mediaType = file.type.startsWith('image/') ? 'IMAGE' : 'FILE';
      onSendMessage(
        `[${mediaType}]`,
        data.url,
        replyingTo?.id
      );
      clearReplyingTo(conversationId);
    } catch (error) {
      console.error('Failed to upload file:', error);
      alert('Failed to upload file');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleEmojiSelect = (emoji) => {
    setMessageInput((prev) => prev + emoji);
    // Don't close emoji picker - keep it open for more selections
  };

  return (
    <div className="message-input-container p-4 space-y-3">
      {/* Reply Preview */}
      {replyingTo && (
        <div className="flex items-center justify-between p-3 bg-luxury-card rounded-xl border-l-4 border-luxury-accent shadow-glow-sm hover:shadow-glow transition-all duration-300 animate-slide-up">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-luxury-muted font-semibold uppercase tracking-wider">
              Replying to {replyingTo.sender?.firstName}
            </p>
            <p className="text-sm text-luxury-text truncate mt-1">
              {replyingTo.content || '(deleted message)'}
            </p>
          </div>
          <button
            onClick={() => clearReplyingTo(conversationId)}
            className="ml-2 p-1.5 text-luxury-muted hover:text-luxury-accent hover:bg-luxury-surface/80 rounded-lg transition-all duration-300 hover:scale-110"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
            </svg>
          </button>
        </div>
      )}

      {/* Input Area */}
      <div className="flex items-end gap-2">
        <div className="flex-1 flex flex-col gap-2">
          <textarea
            value={messageInput}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Type a message... (Shift+Enter for new line)"
            disabled={disabled || uploading}
            className="message-textarea flex-1"
            rows="1"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5">
          {/* File Upload */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || uploading}
            className="p-2.5 text-luxury-muted hover:text-luxury-accent hover:bg-luxury-card/80 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 rounded-lg hover:shadow-glow-sm hover:scale-110"
            title="Attach file"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
            </svg>
          </button>

          {/* Emoji Picker */}
          <div className="relative">
            <button
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              disabled={disabled}
              className="p-2.5 text-luxury-muted hover:text-luxury-accent hover:bg-luxury-card/80 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 rounded-lg hover:shadow-glow-sm hover:scale-110"
              title="Emoji"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z" />
              </svg>
            </button>

            {showEmojiPicker && (
              <div className="absolute bottom-full right-0 mb-2 bg-luxury-card border border-luxury-accent/40 rounded-xl shadow-luxury-lg z-10 p-3 grid grid-cols-6 gap-2 w-64 animate-scale-in backdrop-blur-sm">
                {commonEmojis.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => handleEmojiSelect(emoji)}
                    className="text-xl hover:scale-125 transition-all duration-300 hover:bg-luxury-surface rounded-lg p-1 hover:shadow-glow-sm active:scale-100"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Send Button */}
          <button
            onClick={handleSendMessage}
            disabled={!messageInput.trim() || disabled || uploading}
            className="px-5 py-2.5 bg-gradient-to-r from-luxury-accent to-luxury-accent-light hover:from-luxury-accent-light hover:to-luxury-accent disabled:bg-luxury-surface disabled:cursor-not-allowed text-black font-semibold rounded-lg transition-all duration-300 shadow-glow hover:shadow-glow-lg disabled:shadow-none active:scale-95 hover:scale-105 disabled:hover:scale-100 disabled:opacity-50"
          >
            {uploading ? (
              <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            ) : (
              'Send'
            )}
          </button>
        </div>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileSelect}
        className="hidden"
        accept="image/*,.pdf,.doc,.docx,.txt"
      />
    </div>
  );
}
