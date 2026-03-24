'use client';

interface HitBadgeProps {
  hitSource: 'pocket' | 'board' | null;
  size?: 'sm' | 'md' | 'lg';
  blink?: boolean;
}

export default function HitBadge({ hitSource, size = 'md', blink = false }: HitBadgeProps) {
  const sizeClasses = {
    sm: 'text-[8px] px-1.5 py-0.5',
    md: 'text-[10px] px-2.5 py-0.5',
    lg: 'text-xs px-3.5 py-1',
  };

  return (
    <span
      className={`${sizeClasses[size]} font-extrabold text-white bg-danger rounded-md
        uppercase tracking-widest inline-flex items-center gap-1
        ${blink ? 'animate-hit-glow' : ''}`}
      style={{
        boxShadow: blink
          ? undefined // animation handles it
          : '0 0 4px rgba(224, 84, 84, 0.3)',
        letterSpacing: '0.12em',
      }}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-white/80" />
      HIT
    </span>
  );
}
