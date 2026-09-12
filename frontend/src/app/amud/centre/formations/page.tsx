'use client';

import { useMemo, useState } from 'react';
import { ConfirmDialog, SelectFilter, statusTone } from '@/components/amud/ui';
import { useToast } from '@/components/amud/Toast';
import { useCenterAccess } from '@/lib/amud/useCenterAccess';
import { useCollection } from '@/lib/amud/storage/useCollection';
import { useCrudSearch, toOptions } from '@/lib/amud/useCrudSearch';
import { logAudit } from '@/lib/amud/storage/audit';
import { centerFormationsCollection } from '@/lib/amud/localCenterFormations';
import { centerFormationsSeed, type CenterFormation } from '@/data/amud/centerFormations';
import { FORMATION_STATUSES, GERMAN_LEVELS } from '@/data/amud/centerTypes';
import { CenterCrudTable } from '@/components/amud/centre/CenterCrudTable';
import { FormationFormModal } from '@/components/amud/centre/FormationFormModal';
import { PERMISSION_DENIED_MESSAGE } from '@/lib/amud/centerPermissions';

export default function CentreFormationsPage() {
  const notify = useToast();
  const { centerId, role, allowed } = useCenterAccess('manage-formations');
  const [formations, { remove }] = useCollection(centerFormationsCollection, centerFormationsSeed);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<CenterFormation | undefined>(undefined);
  const [deleting, setDeleting] = useState<CenterFormation | null>(null);

  const scoped = useMemo(() => formations.filter((f) => f.centerId === centerId), [formations, centerId]);

  const { search, setSearch, filters, setFilter, reset, activeFilterCount, results } = useCrudSearch(
    scoped,
    { statut: '', niveau: '' },
    {
      text: (f) => [f.nom, f.niveau, f.description],
      match: (f, fl) => (!fl.statut || f.statut === fl.statut) && (!fl.niveau || f.niveau === fl.niveau),
    },
  );

  function openAdd() {
    if (!allowed) return notify(PERMISSION_DENIED_MESSAGE, 'error');
    setEditing(undefined);
    setModalOpen(true);
  }
  function openEdit(f: CenterFormation) {
    if (!allowed) return notify(PERMISSION_DENIED_MESSAGE, 'error');
    setEditing(f);
    setModalOpen(true);
  }
  function handleDelete() {
    if (!deleting) return;
    if (!allowed) return notify(PERMISSION_DENIED_MESSAGE, 'error');
    remove(deleting.id);
    logAudit({ utilisateur: 'Centre (self-service)', role: 'Centre', action: `Suppression formation ${deleting.nom}`, actionType: 'delete', module: 'Centres de formation — Formations', reference: `${deleting.nom} (#${deleting.id})`, centerId });
    notify('Formation supprimée.', 'info');
    setDeleting(null);
  }

  return (
    <>
      <CenterCrudTable
        title="Formations"
        subtitle={`${results.length} formation(s) sur ${scoped.length}`}
        addLabel="Ajouter une formation"
        onAdd={openAdd}
        allowed={allowed}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Rechercher une formation…"
        activeFilterCount={activeFilterCount}
        onResetFilters={reset}
        filters={
          <>
            <SelectFilter label="Statut" value={filters.statut} onChange={(v) => setFilter('statut', v)} options={toOptions(FORMATION_STATUSES)} />
            <SelectFilter label="Niveau" value={filters.niveau} onChange={(v) => setFilter('niveau', v)} options={toOptions(GERMAN_LEVELS)} />
          </>
        }
        columns={['Formation', 'Niveau', 'Durée', 'Séances', 'Prix', 'Statut']}
        empty="Aucune formation"
        emptyIcon="menu_book"
        emptyDescription="Créez une formation pour ouvrir des groupes et publier vos tarifs."
        rows={results.map((f) => ({
          id: f.id,
          cardSubtitle: f.description,
          badge: { label: f.statut, tone: statusTone(f.statut) },
          cells: [
            f.nom,
            f.niveau,
            `${f.dureeSemaines} sem. · ${f.nombreHeures}h`,
            `${f.nombreSeances} séances`,
            `${f.prix.toLocaleString('fr-FR')} MAD`,
            f.statut,
          ],
          onEdit: () => openEdit(f),
          onDelete: () => setDeleting(f),
        }))}
        cardHiddenColumns={[0, 5]}
      />
      <FormationFormModal open={modalOpen} onClose={() => setModalOpen(false)} centerId={centerId} formation={editing} actor={{ utilisateur: 'Centre (self-service)', role }} />
      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        title="Supprimer cette formation ?"
        description={deleting ? `Êtes-vous sûr de vouloir supprimer « ${deleting.nom} » ? Cette action est irréversible.` : undefined}
        confirmLabel="Supprimer"
      />
    </>
  );
}
