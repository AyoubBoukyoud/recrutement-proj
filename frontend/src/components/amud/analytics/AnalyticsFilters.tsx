'use client';

import type { ReactNode } from 'react';
import type { PeriodKey, PeriodRange } from '@/lib/amud/analytics/period';
import { DateRangeFilter } from './DateRangeFilter';

/**
 * Barre de filtres analytics — période + filtres additionnels (ville, centre,
 * formation, statut...) passés en `children` (généralement des
 * `SelectFilter` de `ui.tsx`). Même carte que `FilterBar`, sans le champ de
 * recherche qui n'a pas de sens sur un dashboard.
 */
export function AnalyticsFilters({
  period,
  onPeriodChange,
  customRange,
  onCustomRangeChange,
  children,
}: {
  period: PeriodKey;
  onPeriodChange: (next: PeriodKey) => void;
  customRange?: PeriodRange;
  onCustomRangeChange?: (next: PeriodRange) => void;
  children?: ReactNode;
}) {
  return (
    <div className="mb-lg flex flex-col gap-md rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-md shadow-sm sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
      <DateRangeFilter value={period} onChange={onPeriodChange} customRange={customRange} onCustomRangeChange={onCustomRangeChange} />
      {children ? <div className="flex flex-wrap items-center gap-sm">{children}</div> : null}
    </div>
  );
}
