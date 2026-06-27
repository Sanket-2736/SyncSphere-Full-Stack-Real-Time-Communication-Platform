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
    <div className="flex h-screen bg-apple-bg">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-apple-border p-6">
        <button
          onClick={() => navigate('/chat')}
          className="mb-8 flex items-center gap-2 text-apple-secondary hover:text-apple-text transition-colors"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
          </svg>
          Back
        </button>

        <nav className="space-y-1">
          <button
            onClick={() => setActiveTab('profile')}
            className={`w-full text-left px-4 py-2.5 rounded-md transition-colors font-medium ${
              activeTab === 'profile'
                ? 'bg-apple-accent/10 text-apple-accent'
                : 'text-apple-secondary hover:text-apple-text hover:bg-apple-bg'
            }`}
          >
            Profile
          </button>
          <button
            onClick={() => setActiveTab('blocked')}
            className={`w-full text-left px-4 py-2.5 rounded-md transition-colors font-medium ${
              activeTab === 'blocked'
                ? 'bg-apple-accent/10 text-apple-accent'
                : 'text-apple-secondary hover:text-apple-text hover:bg-apple-bg'
            }`}
          >
            Blocked Users
          </button>
        </nav>

        <button
          onClick={logout}
          className="w-full mt-8 btn btn-danger"
        >
          Logout
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto p-8">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="slide-up">
              <h1 className="text-h2 text-apple-text mb-8">Profile Settings</h1>

              {error && (
                <div className="p-4 bg-apple-danger/10 border border-apple-danger/30 rounded-md text-apple-danger mb-6">
                  {error}
                </div>
              )}

              {success && (
                <div className="p-4 bg-apple-success/10 border border-apple-success/30 rounded-md text-apple-success mb-6">
                  {success}
                </div>
              )}

              {/* Avatar Preview */}
              <div className="mb-8 text-center">
                <Avatar user={{ ...user, avatarUrl }} size="lg" />
                <p className="text-apple-secondary text-sm mt-2">@{user?.username}</p>
              </div>

              {/* Form */}
              <div className="card p-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-apple-text mb-2">First Name</label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-apple-text mb-2">Last Name</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-apple-text mb-2">Avatar URL</label>
                  <input
                    type="text"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    placeholder="https://example.com/avatar.jpg"
                    className="w-full input"
                  />
                  <p className="text-xs text-apple-secondary/70 mt-1">Leave empty to use initials</p>
                </div>

                <button
                  onClick={handleUpdateProfile}
                  disabled={loading}
                  className="w-full btn btn-primary py-3 font-semibold"
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          )}

          {/* Blocked Users Tab */}
          {activeTab === 'blocked' && (
            <div className="slide-up">
              <h1 className="text-h2 text-apple-text mb-8">Blocked Users</h1>

              {blockedUsers.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-apple-secondary">No blocked users</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {blockedUsers.map((blockedUser) => (
                    <div key={blockedUser.id} className="card p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar user={blockedUser} size="sm" />
                        <div>
                          <p className="font-medium text-apple-text">
                            {blockedUser.firstName} {blockedUser.lastName}
                          </p>
                          <p className="text-sm text-apple-secondary">@{blockedUser.username}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleUnblockUser(blockedUser.id)}
                        className="btn btn-secondary text-sm"
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