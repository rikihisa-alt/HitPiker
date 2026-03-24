'use client';

interface ShowLockBadgeProps {
  size?: 'sm' | 'md';
}

export default function ShowLockBadge({ size = 'md' }: ShowLockBadgeProps) {
  return (
    <span className="text-[9px] font-bold text-caution bg-caution-soft border border-caution/20 rounded-pill px-1.5 py-0.5 uppercase tracking-wider">
      SHOW
    </span>
  );
}
