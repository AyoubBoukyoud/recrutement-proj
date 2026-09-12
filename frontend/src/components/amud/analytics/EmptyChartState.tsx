'use client';

import { EmptyState } from '@/components/amud/ui';

/**
 * État vide pour un emplacement de graphique — jamais un graphique vide ou
 * trompeur (cahier des charges §14). Fine enveloppe de `EmptyState` en
 * variante compacte, dimensionnée pour tenir dans une `AnalyticsCard`.
 */
export function EmptyChartState({
  title = 'Aucune donnée disponible',
  description = 'Les statistiques apparaîtront lorsque des activités seront enregistrées.',
  icon = 'bar_chart',
}: {
  title?: string;
  description?: string;
  icon?: string;
}) {
  return <EmptyState icon={icon} title={title} description={description} compact />;
}
