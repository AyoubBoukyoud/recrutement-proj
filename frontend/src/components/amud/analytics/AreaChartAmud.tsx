'use client';

import { AreaPlot } from './lazyPlots';
import { ChartLegend } from './ChartLegend';
import { EmptyChartState } from './EmptyChartState';
import { colorAt } from './chartColors';
import { useId } from 'react';

export type AreaSeries = { key: string; label: string; color?: string };

/** Area chart générique — sert notamment "revenus mensuels" (centre) avec période courante/précédente en 2 séries. */
export function AreaChartAmud({
  data,
  series,
  xKey = 'label',
  height = 240,
  ariaLabel,
  unit,
}: {
  data: Record<string, string | number>[];
  series: AreaSeries[];
  xKey?: string;
  height?: number;
  ariaLabel: string;
  /** Suffixe affiché dans le tooltip (ex. ` MAD`). */
  unit?: string;
}) {
  // Identifiant unique par instance : deux area charts sur la même page
  // partageaient l'id de dégradé `amud-area-value`.
  const gradientPrefix = `amud-area-${useId().replace(/:/g, '')}`;
  if (data.length === 0 || series.length === 0) return <EmptyChartState />;

  const resolved = series.map((s, i) => ({ ...s, color: s.color ?? colorAt(i) }));
  const lastValues = resolved.map((s) => ({
    label: s.label,
    color: s.color,
    value: data.length > 0 ? `${Number(data[data.length - 1][s.key]).toLocaleString('fr-FR')}${unit ?? ''}` : undefined,
  }));

  return (
    <div role="img" aria-label={ariaLabel}>
      <AreaPlot data={data} series={resolved} xKey={xKey} height={height} unit={unit} gradientPrefix={gradientPrefix} />
      <ChartLegend items={lastValues.map((v) => ({ label: v.label, color: v.color, value: v.value }))} />
    </div>
  );
}
