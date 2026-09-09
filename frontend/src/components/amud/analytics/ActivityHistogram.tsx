'use client';

import { BarChartAmud } from './BarChartAmud';

/**
 * Histogramme d'activité (jour de semaine ou heure de la journée) — fine
 * spécialisation de `BarChartAmud` pour les données déjà bucketées par
 * `bucketByWeekday`/`bucketByHour` (`lib/amud/analytics/period.ts`).
 */
export function ActivityHistogram({
  data,
  ariaLabel,
  color,
  height = 220,
}: {
  data: { label: string; value: number }[];
  ariaLabel: string;
  color?: string;
  height?: number;
}) {
  return <BarChartAmud data={data} series={[{ key: 'value', label: ariaLabel, color }]} ariaLabel={ariaLabel} height={height} />;
}
