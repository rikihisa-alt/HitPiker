'use client';

interface HitBadgeProps {
  hitSource: 'pocket' | 'board' | null;
  size?: 'sm' | 'md' | 'lg';
  blink?: boolean;
}

export default function HitBadge({ hitSource, size = 'md', blink = false }: HitBadgeProps) {
  const sizeClasses = {
    sm: 'text-[9px] px-1.5 py-0.5',
    md: 'text-[11px] px-2 py-0.5',
    lg: 'text-sm px-3 py-1',
  };

  return (
    <span className={`${sizeClasses[size]} font-bold text-white bg-danger rounded-pill uppercase tracking-wider
      inline-flex items-center gap-1 shadow-sm
      ${blink ? 'animate-hit-blink' : ''}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-white/80" />
      HIT
    </span>
  );
}
