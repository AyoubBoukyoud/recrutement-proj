'use client';

import { Cell, Funnel, FunnelChart, LabelList, ResponsiveContainer, Tooltip } from 'recharts';
import { ChartTooltip } from './ChartTooltip';
import { ChartLegend } from './ChartLegend';
import { EmptyChartState } from './EmptyChartState';
import { colorAt } from './chartColors';

export type FunnelStage = { label: string; value: number; color?: string };

/**
 * Funnel générique — sert le funnel de recrutement (admin + recruteur :
 * Candidatures → Présélection → Entretiens → Finalistes → Recrutements) et
 * le funnel commercial (Prospects → Contactés → Intéressés → RDV →
 * Partenaires). Les valeurs restent lisibles en légende texte, pas seulement
 * dans la forme du funnel.
 */
export function FunnelChartAmud({
  stages,
  height = 260,
  ariaLabel,
}: {
  stages: FunnelStage[];
  height?: number;
  ariaLabel: string;
}) {
  if (stages.length === 0 || stages.every((s) => s.value === 0)) return <EmptyChartState icon="filter_alt" />;

  const colored = stages.map((s, i) => ({ ...s, color: s.color ?? colorAt(i) }));

  return (
    <div role="img" aria-label={ariaLabel}>
      <ResponsiveContainer width="100%" height={height}>
        <FunnelChart>
          <Tooltip content={<ChartTooltip />} />
          <Funnel dataKey="value" data={colored} isAnimationActive>
            {colored.map((entry) => (
              <Cell key={entry.label} fill={entry.color} />
            ))}
            <LabelList position="right" dataKey="label" fill="var(--amud-on-surface-variant)" stroke="none" fontSize={12} />
            <LabelList position="center" dataKey="value" fill="#ffffff" stroke="none" fontSize={13} fontWeight={700} />
          </Funnel>
        </FunnelChart>
      </ResponsiveContainer>
      <ChartLegend
        items={colored.map((s, i) => {
          const conversion = i === 0 || colored[0].value === 0 ? null : Math.round((s.value / colored[0].value) * 100);
          return { label: s.label, color: s.color, value: conversion !== null ? `${s.value} (${conversion}%)` : s.value };
        })}
      />
    </div>
  );
}
