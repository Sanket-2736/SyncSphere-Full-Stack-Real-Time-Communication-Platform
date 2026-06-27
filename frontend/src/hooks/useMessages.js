import { useEffect, useRef } from 'react';
import { useWebSocket } from '../context/WebSocketContext';
import { useMessageStore } from '../store/messageStore';
import axiosInstance from '../api/axiosInstance';

export function useMessages(conversationId) {
  const { isConnected, subscribe, publish, unsubscribe } = useWebSocket();
  const subscriptionRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const currentPageRef = useRef(0);

  const setMessages = useMessageStore((s) => s.setMessages);
  const prependMessages = useMessageStore((s) => s.prependMessages);
  const addMessage = useMessageStore((s) => s.addMessage);
  const updateMessage = useMessageStore((s) => s.updateMessage);
  const deleteMessage = useMessageStore((s) => s.deleteMessage);
  const addTypingUser = useMessageStore((s) => s.addTypingUser);
  const removeTypingUser = useMessageStore((s) => s.removeTypingUser);
  const setPinnedMessages = useMessageStore((s) => s.setPinnedMessages);
  const setLoading = useMessageStore((s) => s.setLoading);
  const setError = useMessageStore((s) => s.setError);
  const setHasMore = useMessageStore((s) => s.setHasMore);

  useEffect(() => {
    if (!conversationId) return;
    const loadMessages = async () => {
      setLoading(true);
      currentPageRef.current = 0;
      try {
        const { data } = await axiosInstance.get(
          `/api/chat/conversations/${conversationId}/messages`,
          { params: { page: 0, size: 50 } }
        );
        setMessages(conversationId, data.content || []);
        setHasMore(conversationId, data.totalPages > 1);
        setError(null);
      } catch (error) {
        console.error('Failed to load messages:', error);
        setError('Failed to load messages');
      } finally {
        setLoading(false);
      }
    };
    loadMessages();
  }, [conversationId, setMessages, setLoading, setError, setHasMore]);

  useEffect(() => {
    if (!conversationId) return;
    const loadPinnedMessages = async () => {
      try {
        const { data } = await axiosInstance.get(
          `/api/chat/conversations/${conversationId}/pins`
        );
        setPinnedMessages(conversationId, data || []);
      } catch (error) {
        console.error('Failed to load pinned messages:', error);
      }
    };
    loadPinnedMessages();
  }, [conversationId, setPinnedMessages]);

  useEffect(() => {
    if (!isConnected || !conversationId) return;
    if (subscriptionRef.current) {
      unsubscribe('/user/queue/messages');
      subscriptionRef.current = null;
    }
    subscriptionRef.current = subscribe('/user/queue/messages', (message) => {
      if (message.conversationId === conversationId) {
        addMessage(conversationId, message);
      }
    });
    const typingDestination = `/topic/conversation/${conversationId}/typing`;
    subscribe(typingDestination, (data) => {
      if (data.typing) {
        addTypingUser(conversationId, data.user || { id: data.userId, firstName: data.userName });
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
          removeTypingUser(conversationId, data.userId);
        }, 3000);
      } else {
        removeTypingUser(conversationId, data.userId);
      }
    });
    const updateDestination = `/topic/conversation/${conversationId}/updates`;
    subscribe(updateDestination, (update) => {
      if (update.type === 'message-edited') {
        updateMessage(conversationId, update.messageId, { content: update.content, edited: true });
      } else if (update.type === 'message-deleted') {
        deleteMessage(conversationId, update.messageId);
      } else if (update.type === 'reaction-added') {
        const msg = useMessageStore.getState().getMessages(conversationId).find(m => m.id === update.messageId);
        if (msg) {
          const reactions = msg.reactions || [];
          const existingReaction = reactions.find(r => r.emoji === update.emoji);
          if (existingReaction) {
            existingReaction.count += 1;
          } else {
            reactions.push({ emoji: update.emoji, count: 1 });
          }
          updateMessage(conversationId, update.messageId, { reactions });
        }
      }
    });
    return () => {
      if (subscriptionRef.current) {
        unsubscribe('/user/queue/messages');
        subscriptionRef.current = null;
      }
      unsubscribe(typingDestination);
      unsubscribe(updateDestination);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [isConnected, conversationId, subscribe, unsubscribe, addMessage, addTypingUser, removeTypingUser, updateMessage, deleteMessage]);

  const loadOlderMessages = async () => {
    if (!conversationId) return;
    try {
      const nextPage = currentPageRef.current + 1;
      const { data } = await axiosInstance.get(
        `/api/chat/conversations/${conversationId}/messages`,
        { params: { page: nextPage, size: 50 } }
      );
      if (data.content && data.content.length > 0) {
        prependMessages(conversationId, data.content);
        currentPageRef.current = nextPage;
        setHasMore(conversationId, data.totalPages > nextPage + 1);
      }
    } catch (error) {
      console.error('Failed to load older messages:', error);
      setError('Failed to load older messages');
    }
  };

  const sendMessage = (content, mediaUrl = null, replyToId = null) => {
    if (!isConnected) {
      setError('Not connected to server');
      return;
    }
    try {
      // Generate temporary ID for optimistic UI
      const tempId = `temp-${Date.now()}-${Math.random()}`;
      
      // Add optimistic message immediately
      const { getState } = useMessageStore;
      const { addOptimisticMessage, markMessageFailed } = getState();
      
      addOptimisticMessage(conversationId, {
        tempId,
        id: tempId,
        content,
        mediaUrl,
        mediaType: mediaUrl ? (mediaUrl.includes('image') ? 'IMAGE' : 'FILE') : null,
        replyToId,
        senderId: useMessageStore.getState().senderId || null,
        sender: { firstName: 'You', lastName: '' },
        createdAt: new Date().toISOString(),
        status: 'SENDING',
        optimistic: true,
      });

      // Publish to server
      publish('/app/chat.send', {
        conversationId,
        content,
        mediaUrl,
        replyToId,
        tempId, // Include tempId so server can match response
      });

      // Set timeout to mark as failed if no response
      const failureTimeout = setTimeout(() => {
        markMessageFailed(conversationId, tempId);
      }, 10000);

      // Store timeout for cleanup
      if (!useMessageStore.getState().messageTimeouts) {
        useMessageStore.setState({ messageTimeouts: {} });
      }
      useMessageStore.getState().messageTimeouts[tempId] = failureTimeout;
    } catch (error) {
      console.error('Failed to send message:', error);
      setError('Failed to send message');
    }
  };

  const markAsRead = () => {
    if (!isConnected) return;
    try {
      const latestMessageId = useMessageStore.getState().getLatestMessageId(conversationId);
      if (latestMessageId) {
        publish('/app/chat.read', {
          conversationId,
          messageId: latestMessageId,
        });
      }
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const sendTypingIndicator = (typing = true) => {
    if (!isConnected) return;
    try {
      publish('/app/chat.typing', {
        conversationId,
        typing,
      });
    } catch (error) {
      console.error('Failed to send typing indicator:', error);
    }
  };

  const retryMessage = async (tempId) => {
    const { getState } = useMessageStore;
    const messages = getState().getMessages(conversationId);
    const failedMessage = messages.find((m) => m.tempId === tempId);

    if (!failedMessage) return;

    try {
      // Remove the failed message
      const { removeOptimisticMessage } = getState();
      removeOptimisticMessage(conversationId, tempId);

      // Resend
      sendMessage(failedMessage.content, failedMessage.mediaUrl, failedMessage.replyToId);
    } catch (error) {
      console.error('Failed to retry message:', error);
      setError('Failed to retry message');
    }
  };

  const editMessage = async (messageId, content) => {
    try {
      const { data } = await axiosInstance.put(
        `/api/chat/messages/${messageId}`,
        { content }
      );
      updateMessage(conversationId, messageId, { content: data.content, edited: true });
      setError(null);
    } catch (error) {
      console.error('Failed to edit message:', error);
      setError('Failed to edit message');
    }
  };

  const deleteMessageFn = async (messageId) => {
    try {
      console.log('🗑️ [DELETE] Attempting to delete message:', messageId);
      const response = await axiosInstance.delete(`/api/chat/messages/${messageId}`);
      console.log('🗑️ [DELETE] Delete response:', response.data);
      
      // Mark message as deleted in store
      deleteMessage(conversationId, messageId);
      console.log('✅ [DELETE] Message marked as deleted in store');
      
      setError(null);
    } catch (error) {
      console.error('❌ [DELETE] Failed to delete message:', error);
      console.error('❌ [DELETE] Error response:', error.response?.data);
      setError('Failed to delete message: ' + (error.response?.data?.message || error.message));
    }
  };

  const pinMessage = async (messageId) => {
    try {
      const { data } = await axiosInstance.post(
        `/api/chat/messages/${messageId}/pin`
      );
      useMessageStore.getState().addPinnedMessage(conversationId, data);
      setError(null);
    } catch (error) {
      console.error('Failed to pin message:', error);
      setError('Failed to pin message');
    }
  };

  const unpinMessage = async (messageId) => {
    try {
      await axiosInstance.delete(`/api/chat/messages/${messageId}/pin`);
      useMessageStore.getState().removePinnedMessage(conversationId, messageId);
      setError(null);
    } catch (error) {
      console.error('Failed to unpin message:', error);
      setError('Failed to unpin message');
    }
  };

  const toggleReaction = async (messageId, emoji) => {
    try {
      console.log('😊 [REACTION] Adding reaction:', { messageId, emoji });
      
      // Prevent reactions on temporary messages
      if (messageId && String(messageId).startsWith('temp-')) {
        console.warn('⚠️ [REACTION] Cannot add reaction to unsent message:', messageId);
        setError('Cannot add reaction to unsent messages');
        return;
      }
      
      const { data } = await axiosInstance.post(
        `/api/chat/messages/${messageId}/reactions`,
        { emoji }
      );
      console.log('✅ [REACTION] Reaction added successfully:', data);
      updateMessage(conversationId, messageId, { reactions: data.reactions });
      setError(null);
    } catch (error) {
      console.error('❌ [REACTION] Failed to toggle reaction:', error);
      console.error('❌ [REACTION] Error response:', error.response?.data);
      setError('Failed to add reaction: ' + (error.response?.data?.message || error.message));
    }
  };

  return {
    sendMessage,
    markAsRead,
    sendTypingIndicator,
    editMessage,
    deleteMessage: deleteMessageFn,
    pinMessage,
    unpinMessage,
    toggleReaction,
    loadOlderMessages,
    retryMessage,
  };
}
