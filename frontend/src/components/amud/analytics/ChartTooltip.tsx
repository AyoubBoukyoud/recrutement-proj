'use client';

/**
 * Tooltip recharts partagé, restylé pour matcher le design system `/amud`
 * (carte `amud-surface-container-lowest`, bordure `amud-outline-variant`)
 * plutôt que le tooltip blanc par défaut de recharts.
 */
type ChartTooltipPayloadItem = {
  name?: string;
  value?: number | string;
  color?: string;
  dataKey?: string | number;
  unit?: string;
};

export function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: ChartTooltipPayloadItem[];
  label?: string | number;
}) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="rounded-lg border border-amud-outline-variant bg-amud-surface-container-lowest px-md py-sm text-label-md shadow-lg">
      {label !== undefined ? <p className="mb-1 font-semibold text-amud-on-surface">{label}</p> : null}
      <ul className="space-y-0.5">
        {payload.map((entry) => (
          <li key={String(entry.dataKey ?? entry.name)} className="flex items-center gap-2 text-amud-on-surface-variant">
            <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: entry.color }} aria-hidden="true" />
            <span>{entry.name}</span>
            <span className="ml-auto font-semibold text-amud-on-surface">
              {typeof entry.value === 'number' ? entry.value.toLocaleString('fr-FR') : entry.value}
              {entry.unit ?? ''}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
