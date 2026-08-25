'use client';

import { SegmentedControl } from '@/components/amud/ui';
import { PERIOD_OPTIONS, type PeriodKey, type PeriodRange } from '@/lib/amud/analytics/period';

/** Sélecteur de période (Aujourd'hui / 7j / 30j / 3 mois / 6 mois / cette année / personnalisée). */
export function DateRangeFilter({
  value,
  onChange,
  customRange,
  onCustomRangeChange,
}: {
  value: PeriodKey;
  onChange: (next: PeriodKey) => void;
  customRange?: PeriodRange;
  onCustomRangeChange?: (next: PeriodRange) => void;
}) {
  return (
    <div className="flex flex-col gap-sm">
      <SegmentedControl label="Période" options={PERIOD_OPTIONS} value={value} onChange={onChange} />
      {value === 'custom' ? (
        <div className="flex flex-wrap items-center gap-sm">
          <input
            type="date"
            value={customRange?.start ?? ''}
            onChange={(e) => onCustomRangeChange?.({ start: e.target.value, end: customRange?.end ?? e.target.value })}
            className="min-h-[44px] rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md text-amud-on-surface focus:outline-none focus:ring-2 focus:ring-amud-primary"
            aria-label="Date de début"
          />
          <span className="text-label-md text-amud-on-surface-variant">à</span>
          <input
            type="date"
            value={customRange?.end ?? ''}
            onChange={(e) => onCustomRangeChange?.({ start: customRange?.start ?? e.target.value, end: e.target.value })}
            className="min-h-[44px] rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md text-amud-on-surface focus:outline-none focus:ring-2 focus:ring-amud-primary"
            aria-label="Date de fin"
          />
        </div>
      ) : null}
    </div>
  );
}
