import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../api/axiosInstance';
import Avatar from '../components/Avatar';

export default function SettingsPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [activeTab, setActiveTab] = useState('profile');

  useEffect(() => {
    loadUserProfile();
    loadBlockedUsers();
  }, []);

  const loadUserProfile = async () => {
    try {
      const { data } = await axiosInstance.get('/api/users/profile');
      setFirstName(data.firstName || '');
      setLastName(data.lastName || '');
      setAvatarUrl(data.avatarUrl || '');
    } catch (error) {
      console.error('Failed to load profile:', error);
      // Fallback to current user from context
      if (user) {
        setFirstName(user.firstName || '');
        setLastName(user.lastName || '');
        setAvatarUrl(user.avatarUrl || '');
      }
    }
  };

  const loadBlockedUsers = async () => {
    try {
      const { data } = await axiosInstance.get('/api/users/blocked');
      setBlockedUsers(data || []);
    } catch (error) {
      console.error('Failed to load blocked users:', error);
    }
  };

  const handleUpdateProfile = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await axiosInstance.put('/api/users/profile', {
        firstName,
        lastName,
        avatarUrl: avatarUrl || null,
      });
      setSuccess('Profile updated successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Failed to update profile:', err);
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleUnblockUser = async (userId) => {
    try {
      await axiosInstance.post(`/api/users/${userId}/unblock`);
      setBlockedUsers(blockedUsers.filter((u) => u.id !== userId));
    } catch (error) {
      console.error('Failed to unblock user:', error);
    }
  };

  return (
    <div className="flex h-screen bg-slate-900">
      {/* Sidebar */}
      <div className="w-64 bg-slate-800 border-r border-slate-700 p-6">
        <button
          onClick={() => navigate('/chat')}
          className="mb-8 flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
          </svg>
          Back to Chat
        </button>

        <nav className="space-y-2">
          <button
            onClick={() => setActiveTab('profile')}
            className={`w-full text-left px-4 py-2 rounded transition-colors ${
              activeTab === 'profile'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            Profile
          </button>
          <button
            onClick={() => setActiveTab('blocked')}
            className={`w-full text-left px-4 py-2 rounded transition-colors ${
              activeTab === 'blocked'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            Blocked Users
          </button>
        </nav>

        {/* Logout Button */}
        <button
          onClick={logout}
          className="w-full mt-8 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
        >
          Logout
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto p-8">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div>
              <h1 className="text-3xl font-bold text-white mb-8">Profile Settings</h1>

              {error && (
                <div className="p-4 bg-red-900/30 border border-red-700 rounded text-red-400 mb-6">
                  {error}
                </div>
              )}

              {success && (
                <div className="p-4 bg-green-900/30 border border-green-700 rounded text-green-400 mb-6">
                  {success}
                </div>
              )}

              {/* Avatar Preview */}
              <div className="mb-8 text-center">
                <Avatar user={{ ...user, avatarUrl }} size="lg" />
                <p className="text-slate-400 text-sm mt-2">{user?.username}</p>
              </div>

              {/* Form */}
              <div className="space-y-6">
                {/* First Name */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Last Name */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Avatar URL */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Avatar URL
                  </label>
                  <input
                    type="text"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    placeholder="https://example.com/avatar.jpg"
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Leave empty to use initials
                  </p>
                </div>

                {/* Save Button */}
                <button
                  onClick={handleUpdateProfile}
                  disabled={loading}
                  className="w-full px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium"
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          )}

          {/* Blocked Users Tab */}
          {activeTab === 'blocked' && (
            <div>
              <h1 className="text-3xl font-bold text-white mb-8">Blocked Users</h1>

              {blockedUsers.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-slate-400">No blocked users</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {blockedUsers.map((blockedUser) => (
                    <div
                      key={blockedUser.id}
                      className="flex items-center justify-between p-4 bg-slate-800 border border-slate-700 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar user={blockedUser} size="sm" />
                        <div>
                          <p className="font-medium text-white">
                            {blockedUser.firstName} {blockedUser.lastName}
                          </p>
                          <p className="text-sm text-slate-400">
                            @{blockedUser.username}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleUnblockUser(blockedUser.id)}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-lg transition-colors"
                      >
                        Unblock
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
