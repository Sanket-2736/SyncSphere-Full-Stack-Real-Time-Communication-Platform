import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useMessages } from '../hooks/useMessages';
import { useMessageStore } from '../store/messageStore';
import { useCallStore } from '../store/callStore';
import { useWebRTC } from '../hooks/useWebRTC';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
import PinnedMessagesBanner from './PinnedMessagesBanner';
import IncomingCallModal from './IncomingCallModal';
import CallingModal from './CallingModal';
import ActiveCallOverlay from './ActiveCallOverlay';
import VideoCallOverlay from './VideoCallOverlay';

export default function ConversationPanel({
  conversationId,
  conversationName,
  isGroupChat = false,
  targetUserId = null,
}) {
  const { user } = useAuth();
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const [scrollToMessageId, setScrollToMessageId] = useState(null);

  const messages = useMessageStore((s) => s.getMessages(conversationId));
  const typingUsers = useMessageStore((s) => s.getTypingUsers(conversationId));
  const pinnedMessages = useMessageStore((s) => s.getPinnedMessages(conversationId));
  const loading = useMessageStore((s) => s.loading);
  const error = useMessageStore((s) => s.error);
  const hasMore = useMessageStore((s) => s.getHasMore(conversationId));

  const setReplyingTo = useMessageStore((s) => s.setReplyingTo);

  const callState = useCallStore((s) => s.callState);
  const activeCallInfo = useCallStore((s) => s.getActiveCallInfo());
  const isMuted = useCallStore((s) => s.getIsMuted());
  const isCameraOff = useCallStore((s) => s.getIsCameraOff());
  const toggleMute = useCallStore((s) => s.toggleMute);
  const toggleCamera = useCallStore((s) => s.toggleCamera);

  const {
    sendMessage,
    markAsRead,
    sendTypingIndicator,
    editMessage,
    deleteMessage,
    pinMessage,
    unpinMessage,
    toggleReaction,
    loadOlderMessages,
    retryMessage,
  } = useMessages(conversationId);

  const {
    startAudioCall,
    startVideoCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleMute: toggleMuteWebRTC,
    toggleCamera: toggleCameraWebRTC,
  } = useWebRTC(conversationId);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollToMessageId) {
      const element = document.getElementById(`message-${scrollToMessageId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setScrollToMessageId(null);
      }
    } else {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, scrollToMessageId]);

  // Mark as read when conversation changes
  useEffect(() => {
    if (conversationId) {
      markAsRead();
    }
  }, [conversationId, markAsRead]);

  const handleSendMessage = (content, mediaUrl, replyToId) => {
    if (!content.trim() && !mediaUrl) return;
    sendMessage(content, mediaUrl, replyToId);
  };

  const handleScroll = (e) => {
    const container = messagesContainerRef.current;
    if (!container) return;

    // Load older messages when scrolling to top
    if (container.scrollTop === 0 && hasMore && !loading) {
      loadOlderMessages();
    }
  };

  const handleScrollToMessage = (messageId) => {
    setScrollToMessageId(messageId);
  };

  const handleReply = (message) => {
    setReplyingTo(conversationId, message);
  };

  const handleTyping = (isTyping) => {
    sendTypingIndicator(isTyping);
  };

  if (!conversationId) {
    return (
      <div className="flex-1 bg-white flex flex-col items-center justify-center">
        <svg
          className="w-16 h-16 mb-4 opacity-30 text-apple-secondary"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
        <p className="text-apple-secondary">Select a conversation to start messaging</p>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-white flex flex-col">
      {/* Pinned Messages Banner */}
      <PinnedMessagesBanner
        pinnedMessages={pinnedMessages}
        onScroll={handleScrollToMessage}
      />

      {/* Header */}
      <div className="h-16 bg-white border-b border-apple-accent/10 flex items-center justify-between px-6 shadow-lg">
        <h2 className="text-lg font-sans font-semibold text-apple-text">
          {conversationName || `Conversation ${conversationId}`}
        </h2>
        <div className="flex items-center gap-1">
          {/* Audio Call Button (Direct conversations only) */}
          {!isGroupChat && targetUserId ? (
            <button
              onClick={() => {
                if (!user || (!user.id && !user.userId)) {
                  console.error('❌ User not authenticated yet');
                  alert('Please wait for authentication to complete');
                  return;
                }
                console.log('🔵 [UI] Audio call button clicked');
                startAudioCall(targetUserId, conversationName);
              }}
              disabled={!user || (!user.id && !user.userId)}
              className="p-2.5 text-apple-secondary hover:text-apple-accent hover:bg-apple-card rounded-lg transition-all hover:shadow-md-sm disabled:opacity-50 disabled:cursor-not-allowed"
              title="Audio call"
            >
              <svg
                className="w-5 h-5"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
              </svg>
            </button>
          ) : null}

          {/* Video Call Button (Direct conversations only) */}
          {!isGroupChat && targetUserId ? (
            <button
              onClick={() => {
                if (!user || (!user.id && !user.userId)) {
                  console.error('❌ User not authenticated yet');
                  alert('Please wait for authentication to complete');
                  return;
                }
                console.log('🔵 [UI] Video call button clicked');
                startVideoCall(targetUserId, conversationName);
              }}
              disabled={!user || (!user.id && !user.userId)}
              className="p-2.5 text-apple-secondary hover:text-apple-accent hover:bg-apple-card rounded-lg transition-all hover:shadow-md-sm disabled:opacity-50 disabled:cursor-not-allowed"
              title="Video call"
            >
              <svg
                className="w-5 h-5"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z" />
              </svg>
            </button>
          ) : null}

          {/* Search Button */}
          <button className="p-2.5 text-apple-secondary hover:text-apple-accent transition-all hover:bg-apple-card rounded-lg hover:shadow-md-sm">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </button>

          {/* Info Button */}
          <button className="p-2.5 text-apple-secondary hover:text-apple-accent transition-all hover:bg-apple-card rounded-lg hover:shadow-md-sm">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5A2.25 2.25 0 008.25 22.5h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 5.25h3m-3 3.75h3m-3 3.75h3M9 22.5h6"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-6 space-y-4 bg-white"
      >
        {loading && messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-apple-accent mx-auto mb-2"></div>
              <p className="text-apple-secondary text-sm">Loading messages...</p>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-apple-secondary">
            <p className="text-center">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          <>
            {/* Load More Button */}
            {hasMore && (
              <button
                onClick={loadOlderMessages}
                disabled={loading}
                className="w-full py-2 text-sm text-apple-secondary hover:text-apple-accent disabled:opacity-50 transition-colors font-medium"
              >
                {loading ? 'Loading...' : 'Load older messages'}
              </button>
            )}

            {/* Messages */}
            {messages.map((message) => (
              <div key={message.id} id={`message-${message.id}`}>
                <MessageBubble
                  message={message}
                  isOwn={message.senderId === user?.id}
                  isGroupChat={isGroupChat}
                  onEdit={editMessage}
                  onDelete={deleteMessage}
                  onReact={toggleReaction}
                  onReply={handleReply}
                  onPin={pinMessage}
                  onScroll={handleScrollToMessage}
                  onRetry={retryMessage}
                />
              </div>
            ))}

            {/* Typing Indicator */}
            {typingUsers.length > 0 && (
              <div className="flex gap-3 mb-4 animate-fade-in">
                <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-apple-accent/20 shadow-md-sm">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-apple-accent rounded-full animate-bounce"></div>
                    <div
                      className="w-2 h-2 bg-apple-accent rounded-full animate-bounce"
                      style={{ animationDelay: '0.1s' }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-apple-accent rounded-full animate-bounce"
                      style={{ animationDelay: '0.2s' }}
                    ></div>
                  </div>
                  <span className="text-xs text-apple-secondary ml-2 font-medium">
                    {typingUsers.length === 1
                      ? `${typingUsers[0]?.firstName || 'Someone'} is typing...`
                      : `${typingUsers.length} people are typing...`}
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </>
        )}

        {error && (
          <div className="mt-4 p-3 bg-rose-900/30 border border-rose-700/50 rounded-lg text-rose-400 text-sm">
            {error}
          </div>
        )}
      </div>

      {/* Input Area */}
      <MessageInput
        conversationId={conversationId}
        onSendMessage={handleSendMessage}
        onTyping={handleTyping}
        disabled={!conversationId}
      />

      {/* Call Modals and Overlays */}
      {callState === 'incoming' && (
        <IncomingCallModal
          onAccept={acceptCall}
          onDecline={rejectCall}
        />
      )}

      {callState === 'calling' && (
        <CallingModal onCancel={endCall} />
      )}

      {callState === 'active' && activeCallInfo?.type === 'audio' && (
        <ActiveCallOverlay
          onEndCall={endCall}
          onToggleMute={toggleMuteWebRTC}
          onToggleCamera={toggleCameraWebRTC}
        />
      )}

      {callState === 'active' && activeCallInfo?.type === 'video' && (
        <VideoCallOverlay
          onEndCall={endCall}
          onToggleMute={toggleMuteWebRTC}
          onToggleCamera={toggleCameraWebRTC}
        />
      )}
    </div>
  );
}
