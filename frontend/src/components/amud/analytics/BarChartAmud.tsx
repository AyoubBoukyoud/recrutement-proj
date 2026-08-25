'use client';

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ChartTooltip } from './ChartTooltip';
import { ChartLegend } from './ChartLegend';
import { EmptyChartState } from './EmptyChartState';
import { colorAt } from './chartColors';

export type BarSeries = { key: string; label: string; color?: string };

/**
 * Bar chart générique (une seule "forme" réutilisée partout) — sert
 * "candidats par ville", "candidatures par offre", "étudiants par niveau",
 * "heures enseignées", "activité commerciale", etc. Une seule série par
 * défaut (`data: {label,value}[]`), ou plusieurs via `series` (barres
 * groupées, ex. appels/contacts/RDV/partenariats sur le même histogramme).
 */
export function BarChartAmud({
  data,
  series,
  xKey = 'label',
  height = 240,
  ariaLabel,
  horizontal = false,
}: {
  data: Record<string, string | number>[];
  series?: BarSeries[];
  xKey?: string;
  height?: number;
  ariaLabel: string;
  /** Barres horizontales — utile pour de longs libellés (villes, postes). */
  horizontal?: boolean;
}) {
  const resolvedSeries = series ?? [{ key: 'value', label: ariaLabel }];
  if (data.length === 0) return <EmptyChartState />;

  const colored = resolvedSeries.map((s, i) => ({ ...s, color: s.color ?? colorAt(i) }));
  const legendItems =
    colored.length > 1
      ? colored.map((s) => ({ label: s.label, color: s.color }))
      : data.map((row, i) => ({ label: String(row[xKey]), color: colored[0].color, value: row[colored[0].key] }));

  return (
    <div role="img" aria-label={ariaLabel}>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} layout={horizontal ? 'vertical' : 'horizontal'} margin={{ top: 8, right: 8, left: horizontal ? 8 : -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--amud-outline-variant)" horizontal={!horizontal} vertical={horizontal} />
          {horizontal ? (
            <>
              <XAxis type="number" tick={{ fill: 'var(--amud-on-surface-variant)', fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <YAxis type="category" dataKey={xKey} width={90} tick={{ fill: 'var(--amud-on-surface-variant)', fontSize: 12 }} axisLine={false} tickLine={false} />
            </>
          ) : (
            <>
              <XAxis dataKey={xKey} tick={{ fill: 'var(--amud-on-surface-variant)', fontSize: 12 }} axisLine={{ stroke: 'var(--amud-outline-variant)' }} tickLine={false} interval={0} angle={data.length > 6 ? -25 : 0} textAnchor={data.length > 6 ? 'end' : 'middle'} height={data.length > 6 ? 46 : 24} />
              <YAxis tick={{ fill: 'var(--amud-on-surface-variant)', fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} width={32} />
            </>
          )}
          <Tooltip content={<ChartTooltip />} cursor={{ fill: 'var(--amud-surface-container-high)' }} />
          {colored.map((s) => (
            <Bar key={s.key} dataKey={s.key} name={s.label} fill={s.color} radius={[4, 4, 0, 0]} maxBarSize={40} />
          ))}
        </BarChart>
      </ResponsiveContainer>
      <ChartLegend items={legendItems} />
    </div>
  );
}
