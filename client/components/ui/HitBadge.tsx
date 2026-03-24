'use client';

interface HitBadgeProps {
  hitSource: 'pocket' | 'board' | null;
  size?: 'sm' | 'md';
}

export default function HitBadge({ hitSource, size = 'md' }: HitBadgeProps) {
  return (
    <span className="text-[9px] font-bold text-danger bg-danger-soft border border-danger/20 rounded-pill px-1.5 py-0.5 uppercase tracking-wider">
      HIT
    </span>
  );
}
