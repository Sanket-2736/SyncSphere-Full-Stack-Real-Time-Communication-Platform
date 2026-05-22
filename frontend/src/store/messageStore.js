import { create } from 'zustand';

export const useMessageStore = create((set, get) => ({
  messages: {},
  typingUsers: {},
  pinnedMessages: {},
  replyingTo: {},
  loading: false,
  error: null,
  hasMore: {},
  senderId: null,
  messageTimeouts: {},

  setMessages: (conversationId, messages) =>
    set((state) => ({
      messages: { ...state.messages, [conversationId]: messages },
    })),

  prependMessages: (conversationId, messages) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [conversationId]: [...messages, ...(state.messages[conversationId] || [])],
      },
    })),

  addMessage: (conversationId, message) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [conversationId]: [...(state.messages[conversationId] || []), message],
      },
    })),

  addOptimisticMessage: (conversationId, message) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [conversationId]: [
          ...(state.messages[conversationId] || []),
          { ...message, optimistic: true, status: 'SENDING' },
        ],
      },
    })),

  markMessageFailed: (conversationId, tempId) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [conversationId]: (state.messages[conversationId] || []).map((msg) =>
          msg.tempId === tempId ? { ...msg, optimistic: false, status: 'FAILED' } : msg
        ),
      },
    })),

  removeOptimisticMessage: (conversationId, tempId) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [conversationId]: (state.messages[conversationId] || []).filter(
          (msg) => msg.tempId !== tempId
        ),
      },
    })),

  updateMessage: (conversationId, messageId, updates) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [conversationId]: (state.messages[conversationId] || []).map((msg) =>
          msg.id === messageId ? { ...msg, ...updates } : msg
        ),
      },
    })),

  deleteMessage: (conversationId, messageId) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [conversationId]: (state.messages[conversationId] || []).map((msg) =>
          msg.id === messageId ? { ...msg, deleted: true, content: null } : msg
        ),
      },
    })),

  clearMessages: (conversationId) =>
    set((state) => ({
      messages: { ...state.messages, [conversationId]: [] },
    })),

  setTypingUsers: (conversationId, userIds) =>
    set((state) => ({
      typingUsers: { ...state.typingUsers, [conversationId]: userIds },
    })),

  addTypingUser: (conversationId, user) =>
    set((state) => {
      const current = state.typingUsers[conversationId] || [];
      const userId = typeof user === 'object' ? user.id : user;
      if (current.some((u) => (typeof u === 'object' ? u.id : u) === userId)) return state;
      return {
        typingUsers: {
          ...state.typingUsers,
          [conversationId]: [...current, user],
        },
      };
    }),

  removeTypingUser: (conversationId, userId) =>
    set((state) => ({
      typingUsers: {
        ...state.typingUsers,
        [conversationId]: (state.typingUsers[conversationId] || []).filter(
          (u) => (typeof u === 'object' ? u.id : u) !== userId
        ),
      },
    })),

  setPinnedMessages: (conversationId, messages) =>
    set((state) => ({
      pinnedMessages: { ...state.pinnedMessages, [conversationId]: messages },
    })),

  addPinnedMessage: (conversationId, message) =>
    set((state) => ({
      pinnedMessages: {
        ...state.pinnedMessages,
        [conversationId]: [...(state.pinnedMessages[conversationId] || []), message],
      },
    })),

  removePinnedMessage: (conversationId, messageId) =>
    set((state) => ({
      pinnedMessages: {
        ...state.pinnedMessages,
        [conversationId]: (state.pinnedMessages[conversationId] || []).filter(
          (msg) => msg.id !== messageId
        ),
      },
    })),

  setReplyingTo: (conversationId, message) =>
    set((state) => ({
      replyingTo: { ...state.replyingTo, [conversationId]: message },
    })),

  clearReplyingTo: (conversationId) =>
    set((state) => ({
      replyingTo: { ...state.replyingTo, [conversationId]: null },
    })),

  setHasMore: (conversationId, hasMore) =>
    set((state) => ({
      hasMore: { ...state.hasMore, [conversationId]: hasMore },
    })),

  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setSenderId: (senderId) => set({ senderId }),

  getMessages: (conversationId) => get().messages[conversationId] || [],
  getTypingUsers: (conversationId) => get().typingUsers[conversationId] || [],
  getPinnedMessages: (conversationId) => get().pinnedMessages[conversationId] || [],
  getReplyingTo: (conversationId) => get().replyingTo[conversationId] || null,
  getHasMore: (conversationId) => get().hasMore[conversationId] !== false,
  
  // Get latest message ID for read receipts
  getLatestMessageId: (conversationId) => {
    const messages = get().messages[conversationId] || [];
    return messages.length > 0 ? messages[messages.length - 1].id : null;
  },
}));
