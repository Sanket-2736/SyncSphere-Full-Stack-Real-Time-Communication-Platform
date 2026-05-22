import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useWebSocket } from '../context/WebSocketContext';
import { usePresence } from '../hooks/usePresence';
import { useCallStore } from '../store/callStore';
import axiosInstance from '../api/axiosInstance';
import Sidebar from '../components/Sidebar';
import ConversationPanel from '../components/ConversationPanel';
import InfoPanel from '../components/InfoPanel';

export default function ChatPage() {
  const { conversationId } = useParams();
  const { isAuthenticated } = useAuth();
  const { isConnected } = useWebSocket();
  usePresence(); // Initialize presence tracking

  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(conversationId || null);
  const [activeConversationName, setActiveConversationName] = useState('');
  const [isInfoPanelOpen, setIsInfoPanelOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const setCallState = useCallStore((s) => s.setCallState);
  const setActiveCallInfo = useCallStore((s) => s.setActiveCallInfo);
  const setIsRestoringCall = useCallStore((s) => s.setIsRestoringCall);

  // Restore call state on page load
  useEffect(() => {
    const restoreCallState = async () => {
      try {
        setIsRestoringCall(true);
        
        // Check for active audio call
        try {
          const { data: audioCall } = await axiosInstance.get('/api/audio-calls/status');
          if (audioCall && audioCall.status === 'ACTIVE') {
            setCallState('active');
            setActiveCallInfo({
              callId: audioCall.callId,
              targetUserId: audioCall.targetUserId,
              targetUsername: audioCall.targetUsername,
              type: 'audio',
              direction: audioCall.direction,
            });
            return;
          }
        } catch (error) {
          // No active audio call
        }
        
        // Check for active video call
        try {
          const { data: videoCall } = await axiosInstance.get('/api/video-calls/status');
          if (videoCall && videoCall.status === 'ACTIVE') {
            setCallState('active');
            setActiveCallInfo({
              callId: videoCall.callId,
              targetUserId: videoCall.targetUserId,
              targetUsername: videoCall.targetUsername,
              type: 'video',
              direction: videoCall.direction,
            });
            return;
          }
        } catch (error) {
          // No active video call
        }
      } catch (error) {
        console.error('Failed to restore call state:', error);
      } finally {
        setIsRestoringCall(false);
      }
    };

    if (isAuthenticated && isConnected) {
      restoreCallState();
    }
  }, [isAuthenticated, isConnected, setCallState, setActiveCallInfo, setIsRestoringCall]);

  // Fetch conversations
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const { data } = await axiosInstance.get('/api/chat/conversations');
        // Normalize conversation data to include 'name' field
        const normalized = (data || []).map(conv => ({
          ...conv,
          name: conv.type === 'DIRECT' ? conv.otherUsername : conv.groupName,
          targetUserId: conv.type === 'DIRECT' ? conv.otherUserId : null,
          isGroup: conv.type === 'GROUP',
        }));
        setConversations(normalized);
      } catch (error) {
        console.error('Failed to fetch conversations:', error);
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchConversations();
    }
  }, [isAuthenticated]);

  const refreshConversations = async (newConversation = null) => {
    try {
      // If a new conversation is provided, add it immediately
      if (newConversation) {
        setConversations(prev => {
          // Check if conversation already exists
          const exists = prev.some(c => c.id === newConversation.id);
          if (exists) {
            return prev;
          }
          // Add new conversation to the beginning of the list
          return [newConversation, ...prev];
        });
      }
      
      // Optionally refresh the full list in background (but don't fail if it errors)
      try {
        const { data } = await axiosInstance.get('/api/chat/conversations');
        const normalized = (data || []).map(conv => ({
          ...conv,
          name: conv.type === 'DIRECT' ? conv.otherUsername : conv.groupName,
          targetUserId: conv.type === 'DIRECT' ? conv.otherUserId : null,
          isGroup: conv.type === 'GROUP',
        }));
        setConversations(normalized);
      } catch (error) {
        console.error('Failed to refresh conversations list:', error);
        // Don't throw - we already added the new conversation
      }
    } catch (error) {
      console.error('Failed to refresh conversations:', error);
    }
  };

  const handleSelectConversation = (id) => {
    setActiveConversationId(id);
    // Find and set the conversation name
    const conv = conversations.find((c) => c.id === id);
    if (conv) {
      setActiveConversationName(conv.name || '');
    } else {
      // If conversation not found in list yet, set a loading name
      // It will be updated once the list is refreshed
      setActiveConversationName('Loading...');
    }
  };

  // Update conversation name when conversations list changes
  useEffect(() => {
    if (activeConversationId) {
      const conv = conversations.find((c) => c.id === activeConversationId);
      if (conv) {
        setActiveConversationName(conv.name || '');
      }
    }
  }, [conversations, activeConversationId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Loading conversations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-900">
      {/* Connection Status Indicator */}
      {!isConnected && (
        <div className="fixed top-0 left-0 right-0 bg-yellow-600 text-white text-sm py-2 px-4 text-center z-50">
          Connecting to server...
        </div>
      )}

      {/* Sidebar */}
      <Sidebar
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelectConversation={handleSelectConversation}
        onConversationCreated={refreshConversations}
      />

      {/* Conversation Panel */}
      <ConversationPanel
        conversationId={activeConversationId}
        conversationName={activeConversationName}
        isGroupChat={conversations.find((c) => c.id === activeConversationId)?.isGroup || false}
        targetUserId={conversations.find((c) => c.id === activeConversationId)?.targetUserId}
      />

      {/* Info Panel */}
      <InfoPanel
        conversationId={activeConversationId}
        isOpen={isInfoPanelOpen}
        onClose={() => setIsInfoPanelOpen(false)}
      />
    </div>
  );
}
