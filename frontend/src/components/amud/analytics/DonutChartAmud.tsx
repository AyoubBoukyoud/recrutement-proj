'use client';

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { ChartTooltip } from './ChartTooltip';
import { ChartLegend } from './ChartLegend';
import { EmptyChartState } from './EmptyChartState';
import { colorAt } from './chartColors';

export type DonutSlice = { label: string; value: number; color?: string };

/**
 * Donut chart générique — sert "répartition des centres", "résultat des
 * appels", "paiements", "présence", "niveaux linguistiques", etc.
 * `centerLabel` affiche le total au centre (le texte reste lisible sans
 * dépendre des couleurs des parts).
 */
export function DonutChartAmud({
  data,
  height = 220,
  ariaLabel,
  centerLabel,
}: {
  data: DonutSlice[];
  height?: number;
  ariaLabel: string;
  centerLabel?: string;
}) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  if (data.length === 0 || total === 0) return <EmptyChartState />;

  const colored = data.map((d, i) => ({ ...d, color: d.color ?? colorAt(i) }));

  return (
    <div role="img" aria-label={ariaLabel}>
      <div className="relative">
        <ResponsiveContainer width="100%" height={height}>
          <PieChart>
            <Pie data={colored} dataKey="value" nameKey="label" innerRadius="62%" outerRadius="90%" paddingAngle={2} stroke="var(--amud-surface-container-lowest)" strokeWidth={2}>
              {colored.map((entry) => (
                <Cell key={entry.label} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<ChartTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        {centerLabel ? (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-headline-md text-amud-on-surface">{centerLabel}</span>
          </div>
        ) : null}
      </div>
      <ChartLegend items={colored.map((d) => ({ label: d.label, color: d.color, value: `${d.value} (${total > 0 ? Math.round((d.value / total) * 100) : 0}%)` }))} />
    </div>
  );
}
