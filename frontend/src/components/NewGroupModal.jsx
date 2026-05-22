import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import Avatar from './Avatar';

export default function NewGroupModal({ isOpen, onClose }) {
  const navigate = useNavigate();
  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [availableUsers, setAvailableUsers] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setAvailableUsers([]);
      return;
    }

    const searchUsers = async () => {
      try {
        const { data } = await axiosInstance.get('/api/users/search', {
          params: { query: searchQuery },
        });
        // Filter out already selected members
        const filtered = (data || []).filter(
          (user) => !selectedMembers.find((m) => m.id === user.id)
        );
        setAvailableUsers(filtered);
      } catch (err) {
        console.error('Failed to search users:', err);
      }
    };

    const timer = setTimeout(searchUsers, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedMembers]);

  const handleAddMember = (user) => {
    setSelectedMembers([...selectedMembers, user]);
    setSearchQuery('');
  };

  const handleRemoveMember = (userId) => {
    setSelectedMembers(selectedMembers.filter((m) => m.id !== userId));
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      setError('Group name is required');
      return;
    }

    if (selectedMembers.length === 0) {
      setError('Add at least one member');
      return;
    }

    setLoading(true);
    try {
      const { data } = await axiosInstance.post('/api/chat/conversations/group', {
        name: groupName,
        description: description || null,
        avatarUrl: avatarUrl || null,
        memberIds: selectedMembers.map((m) => m.id),
      });
      navigate(`/chat/${data.id}`);
      onClose();
    } catch (err) {
      console.error('Failed to create group:', err);
      setError(err.response?.data?.message || 'Failed to create group');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-40">
      <div className="bg-slate-800 rounded-lg p-6 max-w-md w-full mx-4 max-h-96 flex flex-col overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">Create Group</h2>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
            </svg>
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-3 bg-red-900/30 border border-red-700 rounded text-red-400 text-sm mb-4">
            {error}
          </div>
        )}

        {/* Group Name */}
        <input
          type="text"
          placeholder="Group name"
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
          className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-3"
        />

        {/* Description */}
        <textarea
          placeholder="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-3 resize-none"
          rows="2"
        />

        {/* Avatar URL */}
        <input
          type="text"
          placeholder="Avatar URL (optional)"
          value={avatarUrl}
          onChange={(e) => setAvatarUrl(e.target.value)}
          className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-3"
        />

        {/* Selected Members */}
        {selectedMembers.length > 0 && (
          <div className="mb-3">
            <p className="text-xs text-slate-400 mb-2">Members ({selectedMembers.length})</p>
            <div className="flex flex-wrap gap-2">
              {selectedMembers.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center gap-2 px-3 py-1 bg-indigo-600 rounded-full text-sm text-white"
                >
                  <span>{member.firstName}</span>
                  <button
                    onClick={() => handleRemoveMember(member.id)}
                    className="text-white hover:text-slate-200"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* User Search */}
        <input
          type="text"
          placeholder="Search users to add..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-3"
        />

        {/* Available Users */}
        <div className="flex-1 overflow-y-auto mb-4">
          {availableUsers.length === 0 ? (
            <div className="text-center py-4 text-slate-400 text-sm">
              {searchQuery ? 'No users found' : 'Search to add members'}
            </div>
          ) : (
            <div className="space-y-2">
              {availableUsers.map((user) => (
                <button
                  key={user.id}
                  onClick={() => handleAddMember(user)}
                  className="w-full p-2 hover:bg-slate-700 rounded transition-colors flex items-center gap-2 text-left"
                >
                  <Avatar user={user} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-xs text-slate-400">@{user.username}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreateGroup}
            disabled={loading || !groupName.trim() || selectedMembers.length === 0}
            className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
          >
            {loading ? 'Creating...' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  );
}
