'use client';

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ChartTooltip } from './ChartTooltip';
import { ChartLegend } from './ChartLegend';
import { EmptyChartState } from './EmptyChartState';
import { colorAt } from './chartColors';

export type AreaSeries = { key: string; label: string; color?: string };

/** Area chart générique — sert notamment "revenus mensuels" (centre) avec période courante/précédente en 2 séries. */
export function AreaChartAmud({
  data,
  series,
  xKey = 'label',
  height = 240,
  ariaLabel,
}: {
  data: Record<string, string | number>[];
  series: AreaSeries[];
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
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <defs>
            {resolved.map((s) => (
              <linearGradient key={s.key} id={`amud-area-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={s.color} stopOpacity={0.35} />
                <stop offset="95%" stopColor={s.color} stopOpacity={0.02} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--amud-outline-variant)" vertical={false} />
          <XAxis dataKey={xKey} tick={{ fill: 'var(--amud-on-surface-variant)', fontSize: 12 }} axisLine={{ stroke: 'var(--amud-outline-variant)' }} tickLine={false} />
          <YAxis tick={{ fill: 'var(--amud-on-surface-variant)', fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} width={32} />
          <Tooltip content={<ChartTooltip />} />
          {resolved.map((s) => (
            <Area
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.label}
              stroke={s.color}
              strokeWidth={2}
              fill={`url(#amud-area-${s.key})`}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
      <ChartLegend items={lastValues.map((v) => ({ label: v.label, color: v.color, value: v.value }))} />
    </div>
  );
}
