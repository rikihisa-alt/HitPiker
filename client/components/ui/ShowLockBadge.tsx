'use client';

interface ShowLockBadgeProps {
  size?: 'sm' | 'md';
}

export default function ShowLockBadge({ size = 'md' }: ShowLockBadgeProps) {
  const sizeClass = size === 'sm' ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-1';

  return (
    <span className={`${sizeClass} font-semibold tracking-wide rounded-full bg-caution-muted text-caution border border-caution/20`}>
      SHOW
    </span>
  );
}
