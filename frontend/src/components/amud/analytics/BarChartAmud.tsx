'use client';

import { BarPlot } from './lazyPlots';
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
  stacked = false,
  unit,
  showLegend = true,
}: {
  data: Record<string, string | number>[];
  series?: BarSeries[];
  xKey?: string;
  height?: number;
  ariaLabel: string;
  /** Barres horizontales — utile pour de longs libellés (villes, postes). */
  horizontal?: boolean;
  /** Empile les séries (ex. inscrits + places libres = capacité d'un groupe). */
  stacked?: boolean;
  /** Suffixe affiché dans le tooltip (ex. ` MAD`). */
  unit?: string;
  /** Une seule série : le titre de la carte la nomme déjà, la légende par barre devient du bruit. */
  showLegend?: boolean;
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
      <BarPlot data={data} series={colored} xKey={xKey} height={height} horizontal={horizontal} stacked={stacked} unit={unit} />
      {showLegend ? <ChartLegend items={legendItems} /> : null}
    </div>
  );
}
