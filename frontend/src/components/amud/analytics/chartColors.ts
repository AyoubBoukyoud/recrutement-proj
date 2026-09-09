/**
 * Palette de graphiques du module `/amud` — référence directement les
 * variables CSS `--amud-*` (tailwind.config.js) plutôt que des couleurs en
 * dur, pour que les graphiques repeignent automatiquement en dark mode via
 * `.dark` (globals.css), sans logique de thème dédiée aux charts.
 */
export const CHART_COLORS = [
  'var(--amud-primary)',
  'var(--amud-secondary)',
  'var(--amud-tertiary-fixed-dim)',
  'var(--amud-primary-fixed-dim)',
  'var(--amud-secondary-fixed-dim)',
  'var(--amud-error)',
  'var(--amud-outline)',
] as const;

export function colorAt(index: number): string {
  return CHART_COLORS[index % CHART_COLORS.length];
}
