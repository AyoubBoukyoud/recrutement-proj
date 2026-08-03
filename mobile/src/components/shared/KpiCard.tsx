interface KpiCardProps {
  label: string;
  value: string | number;
  icon?: string; // Material Symbols icon name
  trend?: { value: number; direction: 'up' | 'down' };
}

export function KpiCard({ label, value, icon, trend }: KpiCardProps) {
  return (
    <div className="rounded-xl border border-outline-variant bg-surface-lowest p-4 shadow-soft transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between">
        <span className="text-xs font-semibold text-onSurface-variant">{label}</span>
        {icon && (
          <span className="rounded-lg bg-primary-light p-1.5 text-primary">
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
              {icon}
            </span>
          </span>
        )}
      </div>
      <div className="mt-2 text-2xl font-bold text-onSurface">{value}</div>
      {trend && (
        <div
          className={`mt-1.5 inline-flex items-center gap-1 text-xs font-semibold ${
            trend.direction === 'up' ? 'text-primary' : 'text-error'
          }`}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
            {trend.direction === 'up' ? 'trending_up' : 'trending_down'}
          </span>
          {trend.value}%
        </div>
      )}
    </div>
  );
}
