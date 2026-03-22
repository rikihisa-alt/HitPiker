'use client';

interface ShowLockBadgeProps {
  size?: 'sm' | 'md';
}

export default function ShowLockBadge({ size = 'md' }: ShowLockBadgeProps) {
  const sizeClass = size === 'sm' ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-1';

  return (
    <span className={`${sizeClass} font-bold tracking-wide rounded-full
      bg-gradient-to-r from-yellow-600 to-yellow-800 text-yellow-100
      border border-yellow-500 shadow-md`}>
      🔒 SHOW LOCK
    </span>
  );
}
