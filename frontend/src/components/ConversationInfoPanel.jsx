import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../api/axiosInstance';
import Avatar from './Avatar';
import StatusIndicator from './StatusIndicator';

export default function ConversationInfoPanel({
  conversationId,
  isOpen,
  onClose,
  isGroupChat,
  targetUser,
  groupInfo,
}) {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [groupName, setGroupName] = useState(groupInfo?.name || '');

  useEffect(() => {
    if (!isOpen || !conversationId) return;

    if (isGroupChat) {
      loadGroupMembers();
    } else if (targetUser) {
      checkBlockStatus();
    }
  }, [isOpen, conversationId, isGroupChat, targetUser]);

  const loadGroupMembers = async () => {
    setLoading(true);
    try {
      const { data } = await axiosInstance.get(
        `/api/chat/conversations/${conversationId}/members`
      );
      setMembers(data || []);
    } catch (error) {
      console.error('Failed to load members:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkBlockStatus = async () => {
    if (!targetUser) return;
    try {
      const { data } = await axiosInstance.get('/api/users/blocked');
      setIsBlocked(data.some((u) => u.id === targetUser.id));
    } catch (error) {
      console.error('Failed to check block status:', error);
    }
  };

  const handleToggleBlock = async () => {
    if (!targetUser) return;

    try {
      if (isBlocked) {
        await axiosInstance.post(`/api/users/${targetUser.id}/unblock`);
      } else {
        await axiosInstance.post(`/api/users/${targetUser.id}/block`);
      }
      setIsBlocked(!isBlocked);
    } catch (error) {
      console.error('Failed to toggle block:', error);
    }
  };

  const handleUpdateGroupName = async () => {
    if (!groupName.trim()) return;

    try {
      await axiosInstance.put(`/api/chat/conversations/${conversationId}/group-info`, {
        name: groupName,
      });
      setEditingName(false);
    } catch (error) {
      console.error('Failed to update group name:', error);
    }
  };

  const handleRemoveMember = async (memberId) => {
    try {
      await axiosInstance.delete(
        `/api/chat/conversations/${conversationId}/members/${memberId}`
      );
      setMembers(members.filter((m) => m.id !== memberId));
    } catch (error) {
      console.error('Failed to remove member:', error);
    }
  };

  const handleLeaveGroup = async () => {
    if (!window.confirm('Leave this group?')) return;

    try {
      await axiosInstance.delete(`/api/chat/conversations/${conversationId}/leave`);
      navigate('/chat');
      onClose();
    } catch (error) {
      console.error('Failed to leave group:', error);
    }
  };

  const handlePromoteMember = async (memberId, newRole) => {
    try {
      await axiosInstance.put(
        `/api/chat/conversations/${conversationId}/members/${memberId}/role`,
        { role: newRole }
      );
      loadGroupMembers();
    } catch (error) {
      console.error('Failed to update member role:', error);
    }
  };

  const isGroupOwner = groupInfo?.ownerUserId === currentUser?.id;
  const isGroupAdmin = isGroupOwner || groupInfo?.adminUserIds?.includes(currentUser?.id);

  if (!isOpen) return null;

  return (
    <div className="w-80 bg-slate-800 border-l border-slate-700 flex flex-col h-screen overflow-y-auto">
      {/* Header */}
      <div className="h-16 bg-slate-800 border-b border-slate-700 flex items-center justify-between px-6">
        <h3 className="font-semibold text-white">Details</h3>
        <button
          onClick={onClose}
          className="p-2 text-slate-400 hover:text-white transition-colors"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 space-y-6">
        {isGroupChat ? (
          <>
            {/* Group Info */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold text-slate-400">GROUP NAME</h4>
                {isGroupOwner && (
                  <button
                    onClick={() => setEditingName(!editingName)}
                    className="text-xs text-indigo-400 hover:text-indigo-300"
                  >
                    {editingName ? 'Cancel' : 'Edit'}
                  </button>
                )}
              </div>
              {editingName ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    onClick={handleUpdateGroupName}
                    className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded transition-colors"
                  >
                    Save
                  </button>
                </div>
              ) : (
                <p className="text-white">{groupInfo?.name}</p>
              )}
            </div>

            {/* Members */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-slate-400">
                  MEMBERS ({members.length})
                </h4>
                {isGroupAdmin && (
                  <button className="text-xs text-indigo-400 hover:text-indigo-300">
                    Add
                  </button>
                )}
              </div>

              {loading ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-500 mx-auto"></div>
                </div>
              ) : (
                <div className="space-y-2">
                  {members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-3 bg-slate-700 rounded"
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <Avatar user={member} size="sm" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">
                            {member.firstName} {member.lastName}
                          </p>
                          <div className="flex items-center gap-1">
                            {member.role === 'OWNER' && (
                              <span title="Owner">👑</span>
                            )}
                            {member.role === 'ADMIN' && (
                              <span title="Admin">🛡️</span>
                            )}
                            <p className="text-xs text-slate-400">{member.role}</p>
                          </div>
                        </div>
                      </div>

                      {/* Member Actions */}
                      {isGroupAdmin && member.id !== currentUser?.id && (
                        <div className="flex items-center gap-1">
                          {member.role !== 'OWNER' && (
                            <button
                              onClick={() =>
                                handlePromoteMember(
                                  member.id,
                                  member.role === 'ADMIN' ? 'MEMBER' : 'ADMIN'
                                )
                              }
                              className="p-1 text-slate-400 hover:text-white transition-colors"
                              title={member.role === 'ADMIN' ? 'Demote' : 'Promote'}
                            >
                              {member.role === 'ADMIN' ? '⬇️' : '⬆️'}
                            </button>
                          )}
                          <button
                            onClick={() => handleRemoveMember(member.id)}
                            className="p-1 text-red-400 hover:text-red-300 transition-colors"
                            title="Remove"
                          >
                            ✕
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Leave Group Button */}
            <button
              onClick={handleLeaveGroup}
              className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            >
              Leave Group
            </button>
          </>
        ) : (
          <>
            {/* Direct Conversation Info */}
            {targetUser && (
              <>
                <div className="text-center">
                  <Avatar user={targetUser} size="lg" />
                  <h3 className="text-lg font-bold text-white mt-3">
                    {targetUser.firstName} {targetUser.lastName}
                  </h3>
                  <p className="text-sm text-slate-400">@{targetUser.username}</p>
                  {targetUser.status && (
                    <div className="flex items-center justify-center gap-2 mt-2">
                      <StatusIndicator status={targetUser.status} size="sm" />
                      <p className="text-xs text-slate-500">
                        {targetUser.status === 'ONLINE' && 'Online'}
                        {targetUser.status === 'AWAY' && 'Away'}
                        {targetUser.status === 'DO_NOT_DISTURB' && 'Do Not Disturb'}
                        {targetUser.status === 'OFFLINE' && 'Offline'}
                      </p>
                    </div>
                  )}
                </div>

                {/* Block Button */}
                <button
                  onClick={handleToggleBlock}
                  className={`w-full px-4 py-2 rounded-lg transition-colors ${
                    isBlocked
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : 'bg-red-600 hover:bg-red-700 text-white'
                  }`}
                >
                  {isBlocked ? 'Unblock' : 'Block'}
                </button>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
