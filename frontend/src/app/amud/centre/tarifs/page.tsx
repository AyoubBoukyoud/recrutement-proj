'use client';

import { useMemo, useState } from 'react';
import { ConfirmDialog, SelectFilter } from '@/components/amud/ui';
import { useToast } from '@/components/amud/Toast';
import { useCenterAccess } from '@/lib/amud/useCenterAccess';
import { useCollection } from '@/lib/amud/storage/useCollection';
import { useCrudSearch, toOptions } from '@/lib/amud/useCrudSearch';
import { logAudit } from '@/lib/amud/storage/audit';
import { centerTarifsCollection } from '@/lib/amud/localCenterTarifs';
import { centerTarifsSeed, type CenterTarif } from '@/data/amud/centerTarifs';
import { GERMAN_LEVELS } from '@/data/amud/centerTypes';
import { centerFormationsCollection } from '@/lib/amud/localCenterFormations';
import { centerFormationsSeed } from '@/data/amud/centerFormations';
import { CenterCrudTable } from '@/components/amud/centre/CenterCrudTable';
import { TarifFormModal } from '@/components/amud/centre/TarifFormModal';
import { PERMISSION_DENIED_MESSAGE } from '@/lib/amud/centerPermissions';

export default function CentreTarifsPage() {
  const notify = useToast();
  const { centerId, role, allowed } = useCenterAccess('manage-tarifs');
  const [tarifs, { remove }] = useCollection(centerTarifsCollection, centerTarifsSeed);
  const [formations] = useCollection(centerFormationsCollection, centerFormationsSeed);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<CenterTarif | undefined>(undefined);
  const [deleting, setDeleting] = useState<CenterTarif | null>(null);

  const scoped = useMemo(() => tarifs.filter((t) => t.centerId === centerId), [tarifs, centerId]);
  const formationName = (id: string) => formations.find((f) => f.id === id)?.nom ?? '—';

  const { search, setSearch, filters, setFilter, reset, activeFilterCount, results } = useCrudSearch(
    scoped,
    { niveau: '' },
    {
      text: (t) => [formationName(t.formationId), t.niveau, t.promotion],
      match: (t, f) => !f.niveau || t.niveau === f.niveau,
    },
  );

  function openAdd() {
    if (!allowed) return notify(PERMISSION_DENIED_MESSAGE, 'error');
    setEditing(undefined);
    setModalOpen(true);
  }
  function openEdit(t: CenterTarif) {
    if (!allowed) return notify(PERMISSION_DENIED_MESSAGE, 'error');
    setEditing(t);
    setModalOpen(true);
  }
  function handleDelete() {
    if (!deleting) return;
    if (!allowed) return notify(PERMISSION_DENIED_MESSAGE, 'error');
    remove(deleting.id);
    logAudit({ utilisateur: 'Centre (self-service)', role: 'Centre', action: 'Suppression tarif', actionType: 'delete', module: 'Centres de formation — Tarifs', reference: `#${deleting.id}`, centerId });
    notify('Tarif supprimé.', 'info');
    setDeleting(null);
  }

  return (
    <>
      <CenterCrudTable
        title="Tarifs"
        subtitle="Grille tarifaire — affichée sur le site public du centre"
        addLabel="Ajouter un tarif"
        onAdd={openAdd}
        allowed={allowed}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Rechercher par formation, promotion…"
        activeFilterCount={activeFilterCount}
        onResetFilters={reset}
        filters={<SelectFilter label="Niveau" value={filters.niveau} onChange={(v) => setFilter('niveau', v)} options={toOptions(GERMAN_LEVELS)} />}
        columns={['Formation', 'Niveau', 'Prix', 'Frais d’inscription', 'Mensualité', 'Promotion']}
        empty="Aucun tarif défini"
        emptyIcon="sell"
        emptyDescription="Publiez une grille tarifaire pour l’afficher automatiquement sur votre site public."
        rows={results.map((t) => ({
          id: t.id,
          cardSubtitle: t.niveau,
          badge: t.promotion ? { label: t.promotion, tone: 'info' as const } : undefined,
          cells: [
            formationName(t.formationId),
            t.niveau,
            `${t.prix.toLocaleString('fr-FR')} MAD`,
            `${t.fraisInscription.toLocaleString('fr-FR')} MAD`,
            t.mensualite ? `${t.mensualite.toLocaleString('fr-FR')} MAD/mois` : '—',
            t.promotion ?? '—',
          ],
          onEdit: () => openEdit(t),
          onDelete: () => setDeleting(t),
        }))}
        cardHiddenColumns={[0, 1, 5]}
      />
      <TarifFormModal open={modalOpen} onClose={() => setModalOpen(false)} centerId={centerId} tarif={editing} actor={{ utilisateur: 'Centre (self-service)', role }} />
      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        title="Supprimer ce tarif ?"
        description="Êtes-vous sûr de vouloir supprimer ce tarif ? Il disparaîtra également du site public."
        confirmLabel="Supprimer"
      />
    </>
  );
}
