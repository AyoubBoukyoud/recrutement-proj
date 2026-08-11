import Link from 'next/link';

interface ChecklistItemProps {
  label: string;
  description?: string;
  status: 'done' | 'pending' | 'locked';
  href?: string;
  actionLabel?: string;
}

export function ChecklistItem({ label, description, status, href, actionLabel = 'Ajouter' }: ChecklistItemProps) {
  const icon =
    status === 'done' ? (
      <span className="material-symbols-outlined fill text-primary" style={{ fontSize: 22 }}>
        check_circle
      </span>
    ) : status === 'locked' ? (
      <span className="material-symbols-outlined text-outline-variant" style={{ fontSize: 22 }}>
        lock
      </span>
    ) : (
      <span className="material-symbols-outlined text-outline" style={{ fontSize: 22 }}>
        radio_button_unchecked
      </span>
    );

  return (
    <div
      className={`flex items-center justify-between gap-3 border-b border-surface-low bg-surface-lowest p-3.5 last:border-b-0 ${
        status === 'locked' ? 'opacity-60' : ''
      }`}
    >
      <div className="flex min-w-0 items-center gap-3">
        {icon}
        <div className="min-w-0">
          <div className={`text-sm font-medium text-onSurface ${status === 'done' ? 'line-through opacity-60' : ''}`}>
            {label}
          </div>
          {description && <div className="mt-0.5 truncate text-xs text-onSurface-variant">{description}</div>}
        </div>
      </div>
      {status === 'pending' && href && (
        <Link
          href={href}
          className="shrink-0 rounded-lg bg-primary px-4 py-1.5 text-xs font-semibold text-onPrimary shadow-sm transition-all hover:bg-primary/90 active:scale-95"
        >
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
