'use client';

import { useMemo, useState } from 'react';
import { ConfirmDialog, SelectFilter, statusTone } from '@/components/amud/ui';
import { useToast } from '@/components/amud/Toast';
import { useCenterAccess } from '@/lib/amud/useCenterAccess';
import { useCollection } from '@/lib/amud/storage/useCollection';
import { useCrudSearch, toOptions } from '@/lib/amud/useCrudSearch';
import { logAudit } from '@/lib/amud/storage/audit';
import { centerStudentsCollection } from '@/lib/amud/localCenterStudents';
import { centerStudentsSeed, STUDENT_STATUSES, GERMAN_LEVELS, type CenterStudent } from '@/data/amud/centerStudents';
import { CenterCrudTable } from '@/components/amud/centre/CenterCrudTable';
import { StudentFormModal } from '@/components/amud/centre/StudentFormModal';
import { PERMISSION_DENIED_MESSAGE } from '@/lib/amud/centerPermissions';

export default function CentreEtudiantsPage() {
  const notify = useToast();
  const { centerId, role, allowed } = useCenterAccess('manage-students');
  const [students, { remove }] = useCollection(centerStudentsCollection, centerStudentsSeed);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<CenterStudent | undefined>(undefined);
  const [deleting, setDeleting] = useState<CenterStudent | null>(null);

  const scoped = useMemo(() => students.filter((s) => s.centerId === centerId), [students, centerId]);

  const { search, setSearch, filters, setFilter, reset, activeFilterCount, results } = useCrudSearch(
    scoped,
    { statut: '', niveau: '' },
    {
      text: (s) => [s.prenom, s.nom, s.telephone, s.email, s.ville],
      match: (s, f) => (!f.statut || s.statut === f.statut) && (!f.niveau || s.niveau === f.niveau),
    },
  );

  function openAdd() {
    if (!allowed) return notify(PERMISSION_DENIED_MESSAGE, 'error');
    setEditing(undefined);
    setModalOpen(true);
  }
  function openEdit(s: CenterStudent) {
    if (!allowed) return notify(PERMISSION_DENIED_MESSAGE, 'error');
    setEditing(s);
    setModalOpen(true);
  }
  function handleDelete() {
    if (!deleting) return;
    if (!allowed) return notify(PERMISSION_DENIED_MESSAGE, 'error');
    remove(deleting.id);
    logAudit({ utilisateur: 'Centre (self-service)', role: 'Centre', action: `Suppression étudiant ${deleting.prenom} ${deleting.nom}`, actionType: 'delete', module: 'Centres de formation — Étudiants', reference: `${deleting.prenom} ${deleting.nom} (#${deleting.id})`, centerId });
    notify('Étudiant supprimé.', 'info');
    setDeleting(null);
  }

  return (
    <>
      <CenterCrudTable
        title="Étudiants"
        subtitle={`${results.length} étudiant(s) sur ${scoped.length}`}
        addLabel="Ajouter un étudiant"
        onAdd={openAdd}
        allowed={allowed}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Rechercher par nom, téléphone, email, ville…"
        activeFilterCount={activeFilterCount}
        onResetFilters={reset}
        filters={
          <>
            <SelectFilter label="Statut" value={filters.statut} onChange={(v) => setFilter('statut', v)} options={toOptions(STUDENT_STATUSES)} />
            <SelectFilter label="Niveau" value={filters.niveau} onChange={(v) => setFilter('niveau', v)} options={toOptions(GERMAN_LEVELS)} />
          </>
        }
        columns={['Nom', 'Contact', 'Niveau', 'Ville', 'Inscription', 'Statut']}
        empty="Aucun étudiant"
        emptyIcon="group"
        emptyDescription="Les étudiants inscrits dans ce centre apparaîtront ici."
        rows={results.map((s) => ({
          id: s.id,
          avatar: { photo: s.photo, initials: `${s.prenom.charAt(0)}${s.nom.charAt(0)}`.toUpperCase() },
          badge: { label: s.statut, tone: statusTone(s.statut) },
          cells: [
            `${s.prenom} ${s.nom}`,
            s.telephone || s.email || '—',
            `${s.niveau} → ${s.niveauCible}`,
            s.ville,
            s.dateInscription,
            s.statut,
          ],
          onEdit: () => openEdit(s),
          onDelete: () => setDeleting(s),
        }))}
        cardHiddenColumns={[0, 1, 5]}
      />
      <StudentFormModal open={modalOpen} onClose={() => setModalOpen(false)} centerId={centerId} student={editing} actor={{ utilisateur: 'Centre (self-service)', role }} />
      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        title="Supprimer cet étudiant ?"
        description={deleting ? `Êtes-vous sûr de vouloir supprimer « ${deleting.prenom} ${deleting.nom} » ? Cette action est irréversible.` : undefined}
        confirmLabel="Supprimer"
      />
    </>
  );
}
