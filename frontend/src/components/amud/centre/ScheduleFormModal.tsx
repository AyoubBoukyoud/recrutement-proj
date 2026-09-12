'use client';

import { useEffect, useMemo, useState } from 'react';
import { Modal, ModalActions } from '@/components/amud/ui';
import { useToast } from '@/components/amud/Toast';
import { useCollection } from '@/lib/amud/storage/useCollection';
import { generateId } from '@/lib/amud/storage/ids';
import { logAudit } from '@/lib/amud/storage/audit';
import { logCenterActivity } from '@/lib/amud/localCenterActivities';
import { centerSchedulesCollection } from '@/lib/amud/localCenterSchedules';
import { centerSchedulesSeed, type CenterSchedule } from '@/data/amud/centerSchedules';
import { centerGroupsCollection } from '@/lib/amud/localCenterGroups';
import { centerGroupsSeed } from '@/data/amud/centerGroups';
import { findScheduleConflicts } from '@/lib/amud/centerScheduleConflicts';

const FR_DAYS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
function frDayOf(dateIso: string): string {
  const d = new Date(`${dateIso}T00:00:00`);
  return FR_DAYS[d.getDay()] ?? '';
}

/**
 * Crée/modifie un créneau de planning et fait enfin tourner
 * `findScheduleConflicts()` (jusqu'ici écrite mais jamais appelée, cf. audit
 * — aucun formulaire de planning n'existait) : les conflits enseignant/
 * salle/groupe détectés sont affichés et bloquent l'enregistrement tant
 * qu'ils ne sont pas résolus (cahier des charges §62/§85).
 */
export function ScheduleFormModal({
  open,
  onClose,
  centerId,
  schedule,
  actor,
}: {
  open: boolean;
  onClose: () => void;
  centerId: string;
  schedule?: CenterSchedule;
  actor: { utilisateur: string; role: string };
}) {
  const notify = useToast();
  const [schedules, { add, update }] = useCollection(centerSchedulesCollection, centerSchedulesSeed);
  const [groups] = useCollection(centerGroupsCollection, centerGroupsSeed);
  const centerGroups = groups.filter((g) => g.centerId === centerId);
  const isEdit = !!schedule;

  const [groupId, setGroupId] = useState(centerGroups[0]?.id ?? '');
  const [salle, setSalle] = useState('');
  const [date, setDate] = useState('');
  const [heureDebut, setHeureDebut] = useState('17:00');
  const [heureFin, setHeureFin] = useState('19:00');

  useEffect(() => {
    if (!open) return;
    if (schedule) {
      setGroupId(schedule.groupId);
      setSalle(schedule.salle);
      setDate(schedule.date);
      setHeureDebut(schedule.heureDebut);
      setHeureFin(schedule.heureFin);
    } else {
      setGroupId(centerGroups[0]?.id ?? '');
      setSalle(centerGroups[0]?.salle ?? '');
      setDate('');
      setHeureDebut('17:00');
      setHeureFin('19:00');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, schedule]);

  const selectedGroup = centerGroups.find((g) => g.id === groupId);

  const conflicts = useMemo(() => {
    if (!selectedGroup || !date || !heureDebut || !heureFin) return [];
    return findScheduleConflicts(
      { centerId, date, heureDebut, heureFin, enseignantId: selectedGroup.enseignantId, salle, groupId },
      schedules,
      schedule?.id,
    );
  }, [selectedGroup, date, heureDebut, heureFin, centerId, salle, groupId, schedules, schedule?.id]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedGroup || !date || conflicts.length > 0) return;
    if (isEdit && schedule) {
      const patch = { formationId: selectedGroup.formationId, groupId, enseignantId: selectedGroup.enseignantId, salle: salle.trim(), date, jour: frDayOf(date), heureDebut, heureFin };
      update(schedule.id, patch);
      logAudit({ utilisateur: actor.utilisateur, role: 'Centre', action: `Modification créneau ${selectedGroup.nom}`, actionType: 'update', module: 'Centres de formation — Planning', reference: `${selectedGroup.nom} · ${date}`, centerId });
      notify('Créneau mis à jour.');
    } else {
      const created: CenterSchedule = {
        id: generateId('sch'),
        centerId,
        formationId: selectedGroup.formationId,
        groupId,
        enseignantId: selectedGroup.enseignantId,
        salle: salle.trim(),
        date,
        jour: frDayOf(date),
        heureDebut,
        heureFin,
      };
      add(created);
      logAudit({ utilisateur: actor.utilisateur, role: 'Centre', action: `Ajout créneau ${selectedGroup.nom}`, actionType: 'create', module: 'Centres de formation — Planning', reference: `${selectedGroup.nom} · ${date}`, centerId });
      logCenterActivity({ centerId, type: 'SCHEDULE_CREATED', message: `Créneau ajouté pour ${selectedGroup.nom} le ${date}.`, utilisateur: actor.utilisateur, role: actor.role });
      notify('Créneau ajouté au planning.');
    }
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Modifier le créneau' : 'Ajouter un créneau'}
      footer={<ModalActions onCancel={onClose} form="schedule-form" submitLabel={isEdit ? 'Enregistrer' : 'Ajouter'} disabled={conflicts.length > 0} />}
    >
      <form id="schedule-form" onSubmit={handleSubmit} className="flex flex-col gap-md">
        <div>
          <label className="mb-1 block text-label-md text-amud-on-surface-variant">Groupe *</label>
          <select value={groupId} onChange={(e) => { setGroupId(e.target.value); const g = centerGroups.find((x) => x.id === e.target.value); if (g) setSalle(g.salle); }} className="min-h-[44px] w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary">
            {centerGroups.length === 0 ? <option value="">Aucun groupe</option> : null}
            {centerGroups.map((g) => (
              <option key={g.id} value={g.id}>{g.nom}</option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-1 gap-md sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-label-md text-amud-on-surface-variant">Date *</label>
            <input required value={date} onChange={(e) => setDate(e.target.value)} className="min-h-[44px] w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary" type="date" />
          </div>
          <div>
            <label className="mb-1 block text-label-md text-amud-on-surface-variant">Salle</label>
            <input value={salle} onChange={(e) => setSalle(e.target.value)} className="min-h-[44px] w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary" type="text" />
          </div>
          <div>
            <label className="mb-1 block text-label-md text-amud-on-surface-variant">Heure de début</label>
            <input value={heureDebut} onChange={(e) => setHeureDebut(e.target.value)} className="min-h-[44px] w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary" type="time" />
          </div>
          <div>
            <label className="mb-1 block text-label-md text-amud-on-surface-variant">Heure de fin</label>
            <input value={heureFin} onChange={(e) => setHeureFin(e.target.value)} className="min-h-[44px] w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary" type="time" />
          </div>
        </div>
        {conflicts.length > 0 ? (
          <div className="rounded-lg border border-amud-error/40 bg-amud-error-container/20 p-md">
            <p className="mb-1 text-label-md font-semibold text-amud-on-error-container">Conflit de planning détecté :</p>
            <ul className="list-inside list-disc space-y-1 text-body-md text-amud-on-error-container">
              {conflicts.map((c, i) => (
                <li key={i}>{c.message}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </form>
    </Modal>
  );
}
