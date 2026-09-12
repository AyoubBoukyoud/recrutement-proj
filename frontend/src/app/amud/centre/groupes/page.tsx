'use client';

import { useMemo, useState } from 'react';
import { ConfirmDialog, SelectFilter, statusTone } from '@/components/amud/ui';
import { useToast } from '@/components/amud/Toast';
import { useCenterAccess } from '@/lib/amud/useCenterAccess';
import { useCollection } from '@/lib/amud/storage/useCollection';
import { useCrudSearch, toOptions } from '@/lib/amud/useCrudSearch';
import { logAudit } from '@/lib/amud/storage/audit';
import { centerGroupsCollection } from '@/lib/amud/localCenterGroups';
import { centerGroupsSeed, type CenterGroup } from '@/data/amud/centerGroups';
import { GROUP_STATUSES, GERMAN_LEVELS } from '@/data/amud/centerTypes';
import { centerTeachersCollection } from '@/lib/amud/localCenterTeachers';
import { centerTeachersSeed } from '@/data/amud/centerTeachers';
import { centerFormationsCollection } from '@/lib/amud/localCenterFormations';
import { centerFormationsSeed } from '@/data/amud/centerFormations';
import { centerEnrollmentsCollection } from '@/lib/amud/localCenterEnrollments';
import { centerEnrollmentsSeed } from '@/data/amud/centerEnrollments';
import { CenterCrudTable } from '@/components/amud/centre/CenterCrudTable';
import { GroupFormModal } from '@/components/amud/centre/GroupFormModal';
import { PERMISSION_DENIED_MESSAGE } from '@/lib/amud/centerPermissions';

export default function CentreGroupesPage() {
  const notify = useToast();
  const { centerId, role, allowed } = useCenterAccess('manage-groups');
  const [groups, { remove }] = useCollection(centerGroupsCollection, centerGroupsSeed);
  const [teachers] = useCollection(centerTeachersCollection, centerTeachersSeed);
  const [formations] = useCollection(centerFormationsCollection, centerFormationsSeed);
  const [enrollments] = useCollection(centerEnrollmentsCollection, centerEnrollmentsSeed);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<CenterGroup | undefined>(undefined);
  const [deleting, setDeleting] = useState<CenterGroup | null>(null);

  const scoped = useMemo(() => groups.filter((g) => g.centerId === centerId), [groups, centerId]);

  const teacherName = (id: string) => {
    const t = teachers.find((x) => x.id === id);
    return t ? `${t.prenom} ${t.nom}` : '—';
  };
  const formationName = (id: string) => formations.find((f) => f.id === id)?.nom ?? '—';
  const enrolledCount = (groupId: string) => enrollments.filter((e) => e.groupId === groupId && e.statut === 'ACTIF').length;

  const { search, setSearch, filters, setFilter, reset, activeFilterCount, results } = useCrudSearch(
    scoped,
    { statut: '', niveau: '' },
    {
      text: (g) => [g.nom, g.salle, formationName(g.formationId), teacherName(g.enseignantId)],
      match: (g, f) => (!f.statut || g.statut === f.statut) && (!f.niveau || g.niveau === f.niveau),
    },
  );

  function openAdd() {
    if (!allowed) return notify(PERMISSION_DENIED_MESSAGE, 'error');
    setEditing(undefined);
    setModalOpen(true);
  }
  function openEdit(g: CenterGroup) {
    if (!allowed) return notify(PERMISSION_DENIED_MESSAGE, 'error');
    setEditing(g);
    setModalOpen(true);
  }
  function handleDelete() {
    if (!deleting) return;
    if (!allowed) return notify(PERMISSION_DENIED_MESSAGE, 'error');
    remove(deleting.id);
    logAudit({ utilisateur: 'Centre (self-service)', role: 'Centre', action: `Suppression groupe ${deleting.nom}`, actionType: 'delete', module: 'Centres de formation — Groupes', reference: `${deleting.nom} (#${deleting.id})`, centerId });
    notify('Groupe supprimé.', 'info');
    setDeleting(null);
  }

  return (
    <>
      <CenterCrudTable
        title="Groupes"
        subtitle={`${results.length} groupe(s) sur ${scoped.length}`}
        addLabel="Ajouter un groupe"
        onAdd={openAdd}
        allowed={allowed}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Rechercher par groupe, formation, enseignant, salle…"
        activeFilterCount={activeFilterCount}
        onResetFilters={reset}
        filters={
          <>
            <SelectFilter label="Statut" value={filters.statut} onChange={(v) => setFilter('statut', v)} options={toOptions(GROUP_STATUSES)} />
            <SelectFilter label="Niveau" value={filters.niveau} onChange={(v) => setFilter('niveau', v)} options={toOptions(GERMAN_LEVELS)} />
          </>
        }
        columns={['Groupe', 'Formation', 'Enseignant', 'Salle', 'Étudiants', 'Statut']}
        empty="Aucun groupe"
        emptyIcon="diversity_3"
        emptyDescription="Créez un groupe pour rassembler des étudiants autour d’une formation et d’un enseignant."
        rows={results.map((g) => ({
          id: g.id,
          badge: { label: g.statut, tone: statusTone(g.statut) },
          cells: [g.nom, formationName(g.formationId), teacherName(g.enseignantId), g.salle, `${enrolledCount(g.id)}/${g.capaciteMax}`, g.statut],
          onEdit: () => openEdit(g),
          onDelete: () => setDeleting(g),
        }))}
        cardHiddenColumns={[0, 5]}
      />
      <GroupFormModal open={modalOpen} onClose={() => setModalOpen(false)} centerId={centerId} group={editing} actor={{ utilisateur: 'Centre (self-service)', role }} />
      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        title="Supprimer ce groupe ?"
        description={deleting ? `Êtes-vous sûr de vouloir supprimer « ${deleting.nom} » ? Cette action est irréversible.` : undefined}
        confirmLabel="Supprimer"
      />
    </>
  );
}
