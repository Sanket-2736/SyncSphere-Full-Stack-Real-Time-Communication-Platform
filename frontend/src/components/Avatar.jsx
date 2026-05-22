import StatusIndicator from './StatusIndicator';

export default function Avatar({ user, status, size = 'md' }) {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
  };

  const initials = `${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}`.toUpperCase();

  return (
    <div className="relative inline-block">
      <div
        className={`${sizeClasses[size]} rounded-full bg-indigo-600 flex items-center justify-center text-white font-semibold`}
      >
        {user?.avatarUrl ? (
          <img
            src={user.avatarUrl}
            alt={user.firstName}
            className="w-full h-full rounded-full object-cover"
          />
        ) : (
          initials
        )}
      </div>
      {status && (
        <div className="absolute bottom-0 right-0">
          <StatusIndicator status={status} size="sm" />
        </div>
      )}
    </div>
  );
}
