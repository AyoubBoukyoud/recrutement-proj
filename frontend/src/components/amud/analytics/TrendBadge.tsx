'use client';

import type { TrendComparison } from '@/lib/amud/analytics/period';

const TONE_CLASS: Record<TrendComparison['tone'], string> = {
  positive: 'text-amud-primary',
  negative: 'text-amud-error',
  neutral: 'text-amud-on-surface-variant',
};

const DIRECTION_ICON: Record<TrendComparison['direction'], string> = {
  up: 'trending_up',
  down: 'trending_down',
  flat: 'trending_flat',
};

/**
 * Puce de tendance période-sur-période (+12.4% / -5.2%). La tonalité vient
 * de `comparePeriods` (positif/négatif dépend du KPI, pas seulement du sens) —
 * ce composant ne fait qu'afficher `trend`, jamais recalculer le sens.
 */
export function TrendBadge({ trend, compact = false }: { trend: TrendComparison; compact?: boolean }) {
  if (trend.direction === 'flat' && trend.deltaPct === null) return null;

  const label =
    trend.deltaPct === null
      ? 'Nouveau'
      : `${trend.deltaPct > 0 ? '+' : ''}${trend.deltaPct}%`;

  return (
    <span className={`inline-flex items-center gap-0.5 text-label-sm font-semibold ${TONE_CLASS[trend.tone]}`}>
      <span className="material-symbols-outlined text-[14px]" aria-hidden="true">
        {DIRECTION_ICON[trend.direction]}
      </span>
      {!compact ? label : null}
    </span>
  );
}
