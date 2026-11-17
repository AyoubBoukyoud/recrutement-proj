'use client';

import { EmptyState, PageHeader } from '@/components/amud/ui';

/**
 * Écran affiché quand le rôle simulé n'a pas le droit de consulter une page
 * financière (`view-financials`) — la matrice de permissions déclarait ce
 * droit, mais aucune page ne le vérifiait : un coordinateur ou un enseignant
 * voyait encaissements, impayés et rémunérations.
 */
export function RestrictedAccess({ title }: { title: string }) {
  return (
    <div className="space-y-lg">
      <PageHeader title={title} />
      <div className="rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest shadow-sm">
        <EmptyState
          icon="lock"
          title="Accès réservé"
          description="Les données financières du centre sont réservées au propriétaire, à l’administrateur du centre et au comptable."
        />
      </div>
    </div>
  );
}
