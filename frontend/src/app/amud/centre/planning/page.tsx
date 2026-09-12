'use client';

import { useMemo, useState } from 'react';
import { ConfirmDialog, SegmentedControl, SelectFilter } from '@/components/amud/ui';
import { useToast } from '@/components/amud/Toast';
import { useCenterAccess } from '@/lib/amud/useCenterAccess';
import { useCollection } from '@/lib/amud/storage/useCollection';
import { logAudit } from '@/lib/amud/storage/audit';
import { centerSchedulesCollection } from '@/lib/amud/localCenterSchedules';
import { centerSchedulesSeed, type CenterSchedule } from '@/data/amud/centerSchedules';
import { centerGroupsCollection } from '@/lib/amud/localCenterGroups';
import { centerGroupsSeed } from '@/data/amud/centerGroups';
import { centerTeachersCollection } from '@/lib/amud/localCenterTeachers';
import { centerTeachersSeed } from '@/data/amud/centerTeachers';
import { useCrudSearch } from '@/lib/amud/useCrudSearch';
import { CenterCrudTable } from '@/components/amud/centre/CenterCrudTable';
import { ScheduleFormModal } from '@/components/amud/centre/ScheduleFormModal';
import { PERMISSION_DENIED_MESSAGE } from '@/lib/amud/centerPermissions';
import { todayIso } from '@/lib/amud/centerCalculations';

type ViewMode = 'jour' | 'semaine' | 'mois';

export default function CentrePlanningPage() {
  const notify = useToast();
  const { centerId, role, allowed } = useCenterAccess('manage-schedule');
  const [schedules, { remove }] = useCollection(centerSchedulesCollection, centerSchedulesSeed);
  const [groups] = useCollection(centerGroupsCollection, centerGroupsSeed);
  const [teachers] = useCollection(centerTeachersCollection, centerTeachersSeed);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<CenterSchedule | undefined>(undefined);
  const [deleting, setDeleting] = useState<CenterSchedule | null>(null);
  const [view, setView] = useState<ViewMode>('semaine');
  const today = todayIso();

  const groupName = (id: string) => groups.find((g) => g.id === id)?.nom ?? '—';
  const teacherName = (id: string) => {
    const t = teachers.find((x) => x.id === id);
    return t ? `${t.prenom} ${t.nom}` : '—';
  };

  const scoped = useMemo(() => {
    const all = schedules.filter((s) => s.centerId === centerId).sort((a, b) => `${a.date} ${a.heureDebut}`.localeCompare(`${b.date} ${b.heureDebut}`));
    if (view === 'jour') return all.filter((s) => s.date === today);
    if (view === 'semaine') {
      const now = new Date(`${today}T00:00:00`);
      const in7 = new Date(now);
      in7.setDate(in7.getDate() + 7);
      return all.filter((s) => s.date >= today && s.date <= in7.toISOString().slice(0, 10));
    }
    return all;
  }, [schedules, centerId, view, today]);

  const salles = useMemo(() => Array.from(new Set(scoped.map((s) => s.salle))).sort(), [scoped]);

  const { search, setSearch, filters, setFilter, reset, activeFilterCount, results } = useCrudSearch(
    scoped,
    { salle: '' },
    {
      text: (s) => [s.jour, s.date, s.salle, groupName(s.groupId), teacherName(s.enseignantId)],
      match: (s, f) => !f.salle || s.salle === f.salle,
    },
  );

  function openAdd() {
    if (!allowed) return notify(PERMISSION_DENIED_MESSAGE, 'error');
    setEditing(undefined);
    setModalOpen(true);
  }
  function openEdit(s: CenterSchedule) {
    if (!allowed) return notify(PERMISSION_DENIED_MESSAGE, 'error');
    setEditing(s);
    setModalOpen(true);
  }
  function handleDelete() {
    if (!deleting) return;
    if (!allowed) return notify(PERMISSION_DENIED_MESSAGE, 'error');
    remove(deleting.id);
    logAudit({ utilisateur: 'Centre (self-service)', role: 'Centre', action: 'Suppression créneau planning', actionType: 'delete', module: 'Centres de formation — Planning', reference: `${deleting.jour} ${deleting.date} · #${deleting.id}`, centerId });
    notify('Créneau supprimé.', 'info');
    setDeleting(null);
  }

  return (
    <>
      <div className="mb-md">
        <SegmentedControl
          label="Période affichée"
          value={view}
          onChange={setView}
          options={[
            { value: 'jour', label: 'Jour' },
            { value: 'semaine', label: 'Semaine' },
            { value: 'mois', label: 'Tout' },
          ]}
        />
      </div>
      <CenterCrudTable
        title="Planning"
        subtitle={`${results.length} créneau(x) — vue : ${view}`}
        addLabel="Ajouter un cours"
        onAdd={openAdd}
        allowed={allowed}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Rechercher par groupe, enseignant, salle…"
        activeFilterCount={activeFilterCount}
        onResetFilters={reset}
        filters={
          <SelectFilter
            label="Salle"
            value={filters.salle}
            onChange={(v) => setFilter('salle', v)}
            options={salles.map((s) => ({ value: s, label: s }))}
          />
        }
        columns={['Date', 'Jour', 'Horaire', 'Groupe', 'Enseignant', 'Salle']}
        empty="Aucun planning"
        emptyIcon="calendar_month"
        emptyDescription="Aucun cours n’est programmé sur cette période."
        rows={results.map((s) => ({
          id: s.id,
          cardTitle: `${groupName(s.groupId)} · ${s.heureDebut} – ${s.heureFin}`,
          cardSubtitle: `${s.jour} ${s.date}`,
          cells: [s.date, s.jour, `${s.heureDebut} – ${s.heureFin}`, groupName(s.groupId), teacherName(s.enseignantId), s.salle],
          onEdit: () => openEdit(s),
          onDelete: () => setDeleting(s),
        }))}
        cardHiddenColumns={[0, 1, 2, 3]}
      />
      <ScheduleFormModal open={modalOpen} onClose={() => setModalOpen(false)} centerId={centerId} schedule={editing} actor={{ utilisateur: 'Centre (self-service)', role }} />
      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        title="Supprimer ce cours ?"
        description={deleting ? `Êtes-vous sûr de vouloir supprimer le cours du ${deleting.date} (${deleting.heureDebut} – ${deleting.heureFin}) ?` : undefined}
        confirmLabel="Supprimer"
      />
    </>
  );
}
