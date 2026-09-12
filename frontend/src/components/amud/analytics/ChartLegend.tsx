'use client';

/**
 * Légende texte sous chaque graphique — les valeurs principales restent
 * compréhensibles sans les couleurs (cahier des charges §17, accessibilité :
 * "ne pas dépendre uniquement de la couleur").
 */
export function ChartLegend({
  items,
}: {
  items: { label: string; value?: string | number; color: string }[];
}) {
  if (items.length === 0) return null;
  return (
    <ul className="mt-md flex flex-wrap gap-x-lg gap-y-sm">
      {items.map((item) => (
        <li key={item.label} className="flex items-center gap-2 text-label-md text-amud-on-surface-variant">
          <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: item.color }} aria-hidden="true" />
          <span>{item.label}</span>
          {item.value !== undefined ? <span className="font-semibold text-amud-on-surface">{item.value}</span> : null}
        </li>
      ))}
    </ul>
  );
}
