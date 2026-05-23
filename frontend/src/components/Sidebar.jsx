import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../api/axiosInstance';
import Avatar from './Avatar';
import NotificationBell from './NotificationBell';
import NewDirectMessageModal from './NewDirectMessageModal';
import NewGroupModal from './NewGroupModal';

export default function Sidebar({ conversations, activeConversationId, onSelectConversation, onConversationCreated }) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [status, setStatus] = useState('ONLINE');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showNewDM, setShowNewDM] = useState(false);
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const handleStatusChange = async (newStatus) => {
    try {
      await axiosInstance.put('/api/users/status', { status: newStatus });
      setStatus(newStatus);
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const { data } = await axiosInstance.get('/api/users/search', {
        params: { query },
      });
      setSearchResults(data || []);
    } catch (error) {
      console.error('Failed to search users:', error);
    }
  };

  const handleSelectSearchResult = async (selectedUser) => {
    try {
      // Create or get direct message conversation
      const { data: conversation } = await axiosInstance.post('/api/chat/conversations/direct', {
        targetUserId: selectedUser.id,
      });
      
      // Normalize the conversation data
      const normalizedConv = {
        ...conversation,
        name: conversation.type === 'DIRECT' ? conversation.otherUsername : conversation.groupName,
        targetUserId: conversation.type === 'DIRECT' ? conversation.otherUserId : null,
        isGroup: conversation.type === 'GROUP',
      };
      
      // Clear search immediately
      setSearchQuery('');
      setSearchResults([]);
      
      // Select conversation immediately with the data we got from API
      onSelectConversation(conversation.id);
      
      // Notify parent to add this conversation to the list immediately
      if (onConversationCreated) {
        onConversationCreated(normalizedConv);
      }
    } catch (error) {
      console.error('Failed to create/open direct message:', error);
    }
  };

  const handleDeleteConversation = async (conversationId) => {
    setDeleting(true);
    try {
      await axiosInstance.delete(`/api/chat/conversations/${conversationId}`);
      setDeleteConfirm(null);
      // Refresh conversations
      if (onConversationCreated) {
        onConversationCreated();
      }
      // Clear selection if deleted conversation was active
      if (activeConversationId === conversationId) {
        onSelectConversation(null);
      }
    } catch (error) {
      console.error('Failed to delete conversation:', error);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="w-80 bg-luxury-bg border-r border-luxury-accent/15 flex flex-col h-screen shadow-luxury-xl">
      {/* Header */}
      <div className="sidebar-header p-4 space-y-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Avatar user={user} status={status} size="md" />
              <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-luxury-bg ${
                status === 'ONLINE' ? 'status-online' :
                status === 'AWAY' ? 'status-away' :
                status === 'DO_NOT_DISTURB' ? 'status-dnd' :
                'status-offline'
              }`}></div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-luxury-text truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-luxury-muted">@{user?.username}</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/settings')}
            className="p-2 text-luxury-muted hover:text-luxury-accent hover:bg-luxury-surface rounded-lg transition-all duration-300 glow-accent hover:scale-110"
            title="Settings"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.62l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.48.1.62l2.03 1.58c-.05.3-.07.62-.07.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.62l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.48-.1-.62l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
            </svg>
          </button>
          <NotificationBell />
        </div>

        {/* Status Dropdown */}
        <div className="flex items-center gap-2">
          <select
            value={status}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="flex-1 px-3 py-2.5 bg-luxury-card border border-luxury-accent/25 rounded-lg text-sm text-luxury-text focus:ring-2 focus:ring-luxury-accent/50 transition-all duration-300 hover:border-luxury-accent/50 font-medium"
          >
            <option value="ONLINE">🟢 Online</option>
            <option value="AWAY">🟡 Away</option>
            <option value="DO_NOT_DISTURB">🔴 Do Not Disturb</option>
            <option value="OFFLINE">⚫ Offline</option>
          </select>
          <button
            onClick={logout}
            className="px-3 py-2.5 bg-rose-600/80 hover:bg-rose-700 text-white text-sm rounded-lg transition-all duration-300 font-medium shadow-lg hover:shadow-rose-500/40 active:scale-95 hover:scale-105"
            title="Logout"
          >
            ↪
          </button>
        </div>

        {/* New Conversation Buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => setShowNewDM(true)}
            className="flex-1 px-3 py-2.5 bg-gradient-to-r from-luxury-accent to-luxury-accent-light hover:from-luxury-accent-light hover:to-luxury-accent text-black text-sm rounded-lg transition-all duration-300 flex items-center justify-center gap-2 font-semibold shadow-glow hover:shadow-glow-lg active:scale-95 hover:scale-105"
            title="New Direct Message"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
            </svg>
            DM
          </button>
          <button
            onClick={() => setShowNewGroup(true)}
            className="flex-1 px-3 py-2.5 bg-luxury-surface border border-luxury-accent/40 hover:border-luxury-accent/60 text-luxury-accent text-sm rounded-lg transition-all duration-300 flex items-center justify-center gap-2 font-semibold hover:shadow-glow active:scale-95 hover:scale-105"
            title="New Group"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
            </svg>
            Group
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="p-4 border-b border-luxury-accent/10">
        <div className="relative">
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full px-4 py-2.5 bg-luxury-card border border-luxury-accent/20 rounded-lg text-sm text-luxury-text placeholder-luxury-muted/60 focus:ring-2 focus:ring-luxury-accent/50 transition-all hover:border-luxury-accent/40"
          />
          <svg className="absolute right-3 top-3 w-4 h-4 text-luxury-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {searchQuery && searchResults.length === 0 ? (
          <div className="p-8 text-center">
            <svg className="w-12 h-12 mx-auto mb-3 opacity-30 text-luxury-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <p className="text-luxury-muted text-sm font-medium">No users found</p>
            <p className="text-luxury-muted/60 text-xs mt-1">Try a different search term</p>
          </div>
        ) : searchQuery && searchResults.length > 0 ? (
          <div className="p-2">
            <p className="text-xs text-luxury-muted px-2 py-1 font-semibold uppercase tracking-wide">Search Results</p>
            {searchResults.map((result) => (
              <div
                key={result.id}
                onClick={() => handleSelectSearchResult(result)}
                className="p-3 hover:bg-luxury-surface/50 cursor-pointer rounded-lg transition-all m-1 border border-transparent hover:border-luxury-accent/20"
              >
                <div className="flex items-center gap-3">
                  <Avatar user={result} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-luxury-text truncate">
                      {result.firstName} {result.lastName}
                    </p>
                    <p className="text-xs text-luxury-muted">@{result.username}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-2">
            {conversations.length === 0 ? (
              <div className="p-8 text-center">
                <svg className="w-12 h-12 mx-auto mb-3 opacity-30 text-luxury-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <p className="text-luxury-muted text-sm font-medium mb-2">No conversations yet</p>
                <p className="text-luxury-muted/60 text-xs">Start a new conversation using the buttons above</p>
              </div>
            ) : (
              conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className={`conversation-item p-3 rounded-lg cursor-pointer transition-all m-1 group relative border ${
                    activeConversationId === conversation.id
                      ? 'bg-gradient-to-r from-luxury-accent/20 to-luxury-accent-light/10 border-luxury-accent/40 shadow-glow'
                      : 'border-transparent hover:bg-luxury-surface/30 hover:border-luxury-accent/20'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Avatar user={conversation} size="sm" />
                    <div className="flex-1 min-w-0" onClick={() => onSelectConversation(conversation.id)}>
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-luxury-text truncate">
                          {conversation.name}
                        </p>
                        {conversation.unreadCount > 0 && (
                          <span className="bg-gradient-to-r from-luxury-accent to-luxury-accent-light text-black text-xs rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 ml-2 font-bold shadow-glow text-center">
                            {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-luxury-muted truncate mt-1">
                        {conversation.lastMessage?.content || 'No messages yet'}
                      </p>
                      <p className="text-xs text-luxury-muted/50 mt-1">
                        {conversation.lastMessageAt ? new Date(conversation.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      </p>
                    </div>
                    
                    {/* Delete Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteConfirm(conversation.id);
                      }}
                      className="p-1.5 text-luxury-muted hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-all hover:bg-rose-500/10 rounded-lg"
                      title="Delete conversation"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-luxury-card rounded-2xl shadow-luxury-lg p-6 max-w-sm mx-4 border border-luxury-accent/30 animate-scale-in">
            <h3 className="text-lg font-serif font-bold text-luxury-text mb-2">Delete Conversation?</h3>
            <p className="text-luxury-muted text-sm mb-6">This action cannot be undone. All messages will be permanently deleted.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                disabled={deleting}
                className="flex-1 px-4 py-2.5 bg-luxury-surface hover:bg-luxury-card text-luxury-text rounded-lg transition-all disabled:opacity-50 border border-luxury-accent/20 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteConversation(deleteConfirm)}
                disabled={deleting}
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white rounded-lg transition-all disabled:opacity-50 font-medium shadow-lg hover:shadow-rose-500/30 active:scale-95"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <NewDirectMessageModal isOpen={showNewDM} onClose={() => setShowNewDM(false)} />
      <NewGroupModal isOpen={showNewGroup} onClose={() => setShowNewGroup(false)} />
    </div>
  );
}
