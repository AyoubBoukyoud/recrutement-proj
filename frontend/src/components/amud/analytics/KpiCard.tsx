'use client';

import { StatCard } from '@/components/amud/ui';
import type { TrendComparison } from '@/lib/amud/analytics/period';
import { TrendBadge } from './TrendBadge';

/**
 * KPI avec tendance période-sur-période — fine enveloppe de `StatCard`
 * (module `ui.tsx`) plutôt qu'un nouveau composant carte, pour garder les
 * KPI "simples" (sans historique disponible) visuellement identiques.
 */
export function KpiCard({
  label,
  value,
  icon,
  href,
  suffix,
  trend,
}: {
  label: string;
  value: number;
  icon?: string;
  href?: string;
  suffix?: string;
  trend?: TrendComparison;
}) {
  return <StatCard label={label} value={value} icon={icon} href={href} suffix={suffix} trend={trend ? <TrendBadge trend={trend} /> : undefined} />;
}
