import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../api/axiosInstance';
import Avatar from './Avatar';
import StatusIndicator from './StatusIndicator';

export default function UserProfilePopover({ user, isOpen, onClose, position }) {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();

  if (!isOpen || !user) return null;

  const handleMessage = async () => {
    try {
      const { data } = await axiosInstance.post('/api/chat/conversations/direct', {
        targetUserId: user.id,
      });
      navigate(`/chat/${data.id}`);
      onClose();
    } catch (error) {
      console.error('Failed to create conversation:', error);
    }
  };

  const isOwnProfile = currentUser?.id === user.id;

  return (
    <div
      className="fixed bg-slate-800 border border-slate-700 rounded-lg shadow-lg z-50 p-4 w-80"
      style={{
        left: `${position?.x || 0}px`,
        top: `${position?.y || 0}px`,
      }}
    >
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-2 right-2 p-1 text-slate-400 hover:text-white transition-colors"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
        </svg>
      </button>

      {/* Avatar */}
      <div className="flex justify-center mb-4">
        <div className="relative">
          <Avatar user={user} size="lg" />
          {user.status && (
            <div className="absolute bottom-0 right-0">
              <StatusIndicator status={user.status} size="md" />
            </div>
          )}
        </div>
      </div>

      {/* User Info */}
      <div className="text-center mb-4">
        <h3 className="text-lg font-bold text-white">
          {user.firstName} {user.lastName}
        </h3>
        <p className="text-sm text-slate-400">@{user.username}</p>
        {user.status && (
          <p className="text-xs text-slate-500 mt-1">
            {user.status === 'ONLINE' && '🟢 Online'}
            {user.status === 'AWAY' && '🟡 Away'}
            {user.status === 'DO_NOT_DISTURB' && '🔴 Do Not Disturb'}
            {user.status === 'OFFLINE' && '⚫ Offline'}
          </p>
        )}
      </div>

      {/* Message Button */}
      {!isOwnProfile && (
        <button
          onClick={handleMessage}
          className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors mb-3 flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
          </svg>
          Message
        </button>
      )}

      {/* View Profile Link */}
      {isOwnProfile && (
        <button
          onClick={() => {
            navigate('/settings');
            onClose();
          }}
          className="w-full px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
          </svg>
          View Profile
        </button>
      )}
    </div>
  );
}
