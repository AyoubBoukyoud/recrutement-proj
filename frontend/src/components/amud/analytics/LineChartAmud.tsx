'use client';

import { LinePlot } from './lazyPlots';
import { ChartLegend } from './ChartLegend';
import { EmptyChartState } from './EmptyChartState';
import { colorAt } from './chartColors';

export type LineSeries = { key: string; label: string; color?: string };

/**
 * Line chart générique — une instance sert "évolution des inscriptions"
 * (admin), "évolution des étudiants" (centre), "évolution des candidatures"
 * (recruteur), "évolution des notes" (étudiant), etc. via `series`/`data`.
 */
export function LineChartAmud({
  data,
  series,
  xKey = 'label',
  height = 240,
  ariaLabel,
  unit,
  yDomain,
}: {
  data: Record<string, string | number>[];
  series: LineSeries[];
  xKey?: string;
  height?: number;
  ariaLabel: string;
  /** Suffixe affiché dans le tooltip et la légende (ex. ` %`). */
  unit?: string;
  /** Bornes fixes de l'axe Y (ex. `[0, 100]` pour un taux). */
  yDomain?: [number, number];
}) {
  if (data.length === 0 || series.length === 0) return <EmptyChartState />;

  const resolved = series.map((s, i) => ({ ...s, color: s.color ?? colorAt(i) }));
  const lastValues = resolved.map((s) => ({
    label: s.label,
    color: s.color,
    value: data.length > 0 ? `${data[data.length - 1][s.key]}${unit ?? ''}` : undefined,
  }));

  return (
    <div role="img" aria-label={ariaLabel}>
      <LinePlot data={data} series={resolved} xKey={xKey} height={height} unit={unit} yDomain={yDomain} />
      <ChartLegend items={lastValues.map((v) => ({ label: v.label, color: v.color, value: v.value }))} />
    </div>
  );
}
