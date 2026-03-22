'use client';

interface HitBadgeProps {
  hitSource: 'pocket' | 'board' | null;
  size?: 'sm' | 'md';
}

export default function HitBadge({ hitSource, size = 'md' }: HitBadgeProps) {
  const sizeClass = size === 'sm' ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-1';

  return (
    <span className={`${sizeClass} font-semibold tracking-wide rounded-full bg-danger text-white`}>
      HIT
    </span>
  );
}
