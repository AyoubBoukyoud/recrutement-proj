'use client';

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ChartTooltip } from './ChartTooltip';
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
}: {
  data: Record<string, string | number>[];
  series: LineSeries[];
  xKey?: string;
  height?: number;
  ariaLabel: string;
}) {
  if (data.length === 0 || series.length === 0) return <EmptyChartState />;

  const resolved = series.map((s, i) => ({ ...s, color: s.color ?? colorAt(i) }));
  const lastValues = resolved.map((s) => ({
    label: s.label,
    color: s.color,
    value: data.length > 0 ? data[data.length - 1][s.key] : undefined,
  }));

  return (
    <div role="img" aria-label={ariaLabel}>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--amud-outline-variant)" vertical={false} />
          <XAxis dataKey={xKey} tick={{ fill: 'var(--amud-on-surface-variant)', fontSize: 12 }} axisLine={{ stroke: 'var(--amud-outline-variant)' }} tickLine={false} />
          <YAxis tick={{ fill: 'var(--amud-on-surface-variant)', fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} width={32} />
          <Tooltip content={<ChartTooltip />} />
          {resolved.map((s) => (
            <Line key={s.key} type="monotone" dataKey={s.key} name={s.label} stroke={s.color} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
          ))}
        </LineChart>
      </ResponsiveContainer>
      <ChartLegend items={lastValues.map((v) => ({ label: v.label, color: v.color, value: v.value }))} />
    </div>
  );
}
