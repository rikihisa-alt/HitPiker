'use client';

interface HitBadgeProps {
  hitSource: 'pocket' | 'board' | null;
  size?: 'sm' | 'md';
}

export default function HitBadge({ hitSource, size = 'md' }: HitBadgeProps) {
  const sizeClass = size === 'sm' ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-1';

  return (
    <span className={`${sizeClass} font-black tracking-wider rounded-full animate-pulse
      bg-gradient-to-r from-red-600 to-amber-500 text-white
      shadow-[0_0_12px_rgba(239,68,68,0.6)] border border-red-400`}>
      HIT {hitSource === 'pocket' ? '🔴' : '🟡'}
    </span>
  );
}
