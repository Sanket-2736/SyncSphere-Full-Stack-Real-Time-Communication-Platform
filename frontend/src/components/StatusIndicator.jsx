export default function StatusIndicator({ status, size = 'md' }) {
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
  };

  const statusColors = {
    ONLINE: 'bg-green-500',
    AWAY: 'bg-yellow-400',
    DO_NOT_DISTURB: 'bg-red-500',
    OFFLINE: 'bg-gray-400',
  };

  return (
    <div
      className={`${sizeClasses[size]} ${statusColors[status] || 'bg-gray-400'} rounded-full`}
      title={status}
    />
  );
}
