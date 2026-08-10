interface SkeletonLoaderProps {
  variant?: 'text' | 'card' | 'avatar' | 'list';
  count?: number;
  className?: string;
}

export function SkeletonLoader({ variant = 'text', count = 1, className = '' }: SkeletonLoaderProps) {
  const items = Array.from({ length: count });

  if (variant === 'card') {
    return (
      <div className="space-y-3">
        {items.map((_, i) => (
          <div key={i} className={`h-24 w-full animate-pulse rounded-xl bg-surface-container ${className}`} />
        ))}
      </div>
    );
  }

  if (variant === 'avatar') {
    return (
      <div className="flex gap-3">
        {items.map((_, i) => (
          <div key={i} className={`h-12 w-12 animate-pulse rounded-full bg-surface-container ${className}`} />
        ))}
      </div>
    );
  }

  if (variant === 'list') {
    return (
      <div className="space-y-2.5">
        {items.map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="h-10 w-10 shrink-0 animate-pulse rounded-lg bg-surface-container" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3 w-2/3 animate-pulse rounded bg-surface-container" />
              <div className="h-2.5 w-1/3 animate-pulse rounded bg-surface-container" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {items.map((_, i) => (
        <div key={i} className={`h-3 w-full animate-pulse rounded bg-surface-container ${className}`} />
      ))}
    </div>
  );
}
