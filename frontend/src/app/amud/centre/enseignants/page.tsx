'use client';

import { useMemo, useState } from 'react';
import { ConfirmDialog, SelectFilter, statusTone } from '@/components/amud/ui';
import { useToast } from '@/components/amud/Toast';
import { useCenterAccess } from '@/lib/amud/useCenterAccess';
import { useCollection } from '@/lib/amud/storage/useCollection';
import { useCrudSearch, toOptions } from '@/lib/amud/useCrudSearch';
import { logAudit } from '@/lib/amud/storage/audit';
import { centerTeachersCollection } from '@/lib/amud/localCenterTeachers';
import { centerTeachersSeed, CONTRACT_TYPES, type CenterTeacher } from '@/data/amud/centerTeachers';
import { CenterCrudTable } from '@/components/amud/centre/CenterCrudTable';
import { TeacherFormModal } from '@/components/amud/centre/TeacherFormModal';
import { PERMISSION_DENIED_MESSAGE } from '@/lib/amud/centerPermissions';

export default function CentreEnseignantsPage() {
  const notify = useToast();
  const { centerId, role, allowed } = useCenterAccess('manage-teachers');
  const [teachers, { remove }] = useCollection(centerTeachersCollection, centerTeachersSeed);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<CenterTeacher | undefined>(undefined);
  const [deleting, setDeleting] = useState<CenterTeacher | null>(null);

  const scoped = useMemo(() => teachers.filter((t) => t.centerId === centerId), [teachers, centerId]);

  const { search, setSearch, filters, setFilter, reset, activeFilterCount, results } = useCrudSearch(
    scoped,
    { statut: '', contrat: '' },
    {
      text: (t) => [t.prenom, t.nom, t.email, t.telephone, t.specialite, t.niveauxEnseignes.join(' ')],
      match: (t, f) => (!f.statut || t.statut === f.statut) && (!f.contrat || t.typeContrat === f.contrat),
    },
  );

  function openAdd() {
    if (!allowed) return notify(PERMISSION_DENIED_MESSAGE, 'error');
    setEditing(undefined);
    setModalOpen(true);
  }
  function openEdit(t: CenterTeacher) {
    if (!allowed) return notify(PERMISSION_DENIED_MESSAGE, 'error');
    setEditing(t);
    setModalOpen(true);
  }
  function handleDelete() {
    if (!deleting) return;
    if (!allowed) return notify(PERMISSION_DENIED_MESSAGE, 'error');
    remove(deleting.id);
    logAudit({ utilisateur: 'Centre (self-service)', role: 'Centre', action: `Suppression enseignant ${deleting.prenom} ${deleting.nom}`, actionType: 'delete', module: 'Centres de formation — Enseignants', reference: `${deleting.prenom} ${deleting.nom} (#${deleting.id})`, centerId });
    notify('Enseignant supprimé.', 'info');
    setDeleting(null);
  }

  return (
    <>
      <CenterCrudTable
        title="Enseignants"
        subtitle={`${results.length} enseignant(s) sur ${scoped.length}`}
        addLabel="Ajouter un enseignant"
        onAdd={openAdd}
        allowed={allowed}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Rechercher par nom, email, spécialité…"
        activeFilterCount={activeFilterCount}
        onResetFilters={reset}
        filters={
          <>
            <SelectFilter label="Statut" value={filters.statut} onChange={(v) => setFilter('statut', v)} options={toOptions(['Actif', 'Inactif'])} />
            <SelectFilter label="Contrat" value={filters.contrat} onChange={(v) => setFilter('contrat', v)} options={toOptions(CONTRACT_TYPES)} />
          </>
        }
        columns={['Nom', 'Spécialité', 'Niveaux', 'Contrat', 'Taux horaire', 'Statut']}
        empty="Aucun enseignant"
        emptyIcon="cast_for_education"
        emptyDescription="Ajoutez les enseignants du centre pour pouvoir les affecter à des groupes."
        rows={results.map((t) => ({
          id: t.id,
          avatar: { photo: t.photo, initials: `${t.prenom.charAt(0)}${t.nom.charAt(0)}`.toUpperCase() },
          badge: { label: t.statut, tone: statusTone(t.statut) },
          cells: [`${t.prenom} ${t.nom}`, t.specialite, t.niveauxEnseignes.join(', '), t.typeContrat, `${t.tauxHoraire} MAD/h`, t.statut],
          onEdit: () => openEdit(t),
          onDelete: () => setDeleting(t),
        }))}
        cardHiddenColumns={[0, 1, 5]}
      />
      <TeacherFormModal open={modalOpen} onClose={() => setModalOpen(false)} centerId={centerId} teacher={editing} actor={{ utilisateur: 'Centre (self-service)', role }} />
      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        title="Supprimer cet enseignant ?"
        description={deleting ? `Êtes-vous sûr de vouloir supprimer « ${deleting.prenom} ${deleting.nom} » ? Cette action est irréversible.` : undefined}
        confirmLabel="Supprimer"
      />
    </>
  );
}
