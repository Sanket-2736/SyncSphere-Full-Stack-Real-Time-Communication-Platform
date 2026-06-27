import { useState, useRef } from 'react';
import { useMessageStore } from '../store/messageStore';
import axiosInstance from '../api/axiosInstance';

export default function MessageInput({ conversationId, onSendMessage, onTyping, disabled = false }) {
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
    setShowEmojiPicker(false);
    clearTimeout(typingDebounceRef.current);
    onTyping?.(false);
    clearReplyingTo(conversationId);
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setMessageInput(value);
    clearTimeout(typingDebounceRef.current);
    if (value.length > 0) {
      typingDebounceRef.current = setTimeout(() => { onTyping?.(true); }, 300);
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
      const { data } = await axiosInstance.post('/api/chat/media/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const mediaType = file.type.startsWith('image/') ? 'IMAGE' : 'FILE';
      onSendMessage(`[${mediaType}]`, data.url, replyingTo?.id);
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
  };

  return (
    <div className="p-4 bg-white border-t border-apple-border space-y-3">
      {/* Reply Preview */}
      {replyingTo && (
        <div className="flex items-center justify-between p-3 bg-apple-bg rounded-md border-l-2 border-apple-accent slide-up">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-apple-secondary font-medium">Replying to {replyingTo.sender?.firstName}</p>
            <p className="text-sm text-apple-text truncate mt-1">{replyingTo.content || '(deleted message)'}</p>
          </div>
          <button onClick={() => clearReplyingTo(conversationId)} className="ml-2 btn-icon-sm">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" /></svg>
          </button>
        </div>
      )}

      {/* Input Area */}
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <textarea
            value={messageInput}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Message..."
            disabled={disabled || uploading}
            className="w-full input resize-none max-h-24 focus:ring-2"
            rows="1"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 pb-2.5">
          {/* File Upload */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || uploading}
            className="btn-icon"
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
              className="btn-icon"
              title="Emoji"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z" />
              </svg>
            </button>

            {showEmojiPicker && (
              <div className="absolute bottom-full right-0 mb-2 bg-white border border-apple-border rounded-md shadow-lg z-10 p-3 grid grid-cols-6 gap-2 w-64 scale-in">
                {commonEmojis.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => handleEmojiSelect(emoji)}
                    className="text-lg hover:scale-125 transition-all hover:bg-apple-bg rounded p-1 active:scale-100"
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
            className="btn btn-primary px-4"
          >
            {uploading ? (
              <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M16.6915026,12.4744748 L3.50612381,13.2599618 C3.19218622,13.2599618 3.03521743,13.4170592 3.03521743,13.5741566 L1.15159189,20.0151496 C0.8376543,20.8006365 0.99,21.89 1.77946707,22.52 C2.40,22.99 3.50612381,23.1 4.13399899,22.9429026 L21.714504,14.0454487 C22.6563168,13.5741566 23.1272231,12.6315722 22.9702544,11.6889879 L4.13399899,1.15159189 C3.34915502,0.9429026 2.40734557,1.00636533 1.77946707,1.4776575 C0.994623095,2.10604706 0.837654326,3.0486314 1.15159189,3.98722302 L3.03521743,10.4282160 C3.03521743,10.5853133 3.19218622,10.7424107 3.50612381,10.7424107 L16.6915026,11.5279055 C16.6915026,11.5279055 17.1624089,11.5279055 17.1624089,12.0033632 C17.1624089,12.4788265 17.1624089,12.4744748 16.6915026,12.4744748 Z" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Hidden File Input */}
      <input ref={fileInputRef} type="file" onChange={handleFileSelect} className="hidden" accept="image/*,.pdf,.doc,.docx,.txt" />
    </div>
  );
}