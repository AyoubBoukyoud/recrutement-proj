'use client';

import { useMemo } from 'react';
import { EmptyState, PageHeader, StatCard } from '@/components/amud/ui';
import { useCurrentCenter } from '@/lib/amud/currentCentre';
import { useCollection } from '@/lib/amud/storage/useCollection';
import { centerStudentsCollection } from '@/lib/amud/localCenterStudents';
import { centerStudentsSeed } from '@/data/amud/centerStudents';
import { centerTeachersCollection } from '@/lib/amud/localCenterTeachers';
import { centerTeachersSeed } from '@/data/amud/centerTeachers';
import { centerFormationsCollection } from '@/lib/amud/localCenterFormations';
import { centerFormationsSeed } from '@/data/amud/centerFormations';
import { centerGroupsCollection } from '@/lib/amud/localCenterGroups';
import { centerGroupsSeed } from '@/data/amud/centerGroups';
import { centerEnrollmentsCollection } from '@/lib/amud/localCenterEnrollments';
import { centerEnrollmentsSeed } from '@/data/amud/centerEnrollments';
import { centerSchedulesCollection } from '@/lib/amud/localCenterSchedules';
import { centerSchedulesSeed } from '@/data/amud/centerSchedules';
import { centerAttendanceCollection } from '@/lib/amud/localCenterAttendance';
import { centerAttendanceSeed } from '@/data/amud/centerAttendance';
import { centerStudentPaymentsCollection } from '@/lib/amud/localCenterStudentPayments';
import { centerStudentPaymentsSeed } from '@/data/amud/centerStudentPayments';
import { centerLeadsCollection } from '@/lib/amud/localCenterLeads';
import { centerLeadsSeed, LEAD_STATUSES, LEAD_STATUS_LABELS } from '@/data/amud/centerLeads';
import { computeCenterStats, computeAttendanceRates, todayIso } from '@/lib/amud/centerCalculations';

export default function CentreStatistiquesPage() {
  const { centerId } = useCurrentCenter();
  const [students] = useCollection(centerStudentsCollection, centerStudentsSeed);
  const [teachers] = useCollection(centerTeachersCollection, centerTeachersSeed);
  const [formations] = useCollection(centerFormationsCollection, centerFormationsSeed);
  const [groups] = useCollection(centerGroupsCollection, centerGroupsSeed);
  const [enrollments] = useCollection(centerEnrollmentsCollection, centerEnrollmentsSeed);
  const [schedules] = useCollection(centerSchedulesCollection, centerSchedulesSeed);
  const [attendance] = useCollection(centerAttendanceCollection, centerAttendanceSeed);
  const [payments] = useCollection(centerStudentPaymentsCollection, centerStudentPaymentsSeed);
  const [leads] = useCollection(centerLeadsCollection, centerLeadsSeed);
  const today = todayIso();

  const stats = useMemo(
    () => computeCenterStats(centerId, { students, teachers, formations, groups, schedules, attendance, studentPayments: payments, today }),
    [centerId, students, teachers, formations, groups, schedules, attendance, payments, today],
  );

  const scopedAttendance = attendance.filter((a) => a.centerId === centerId);
  const rates = computeAttendanceRates(scopedAttendance);
  const scopedLeads = leads.filter((l) => l.centerId === centerId);
  const leadsByStatus = LEAD_STATUSES;
  const scopedFormations = formations.filter((f) => f.centerId === centerId);
  const scopedGroups = groups.filter((g) => g.centerId === centerId);
  const scopedEnrollments = enrollments.filter((e) => e.centerId === centerId && e.statut === 'ACTIF');

  return (
    <div className="space-y-lg">
      <PageHeader title="Statistiques du centre" subtitle="Vue d’ensemble de l’activité, de l’assiduité et des finances." />

      <div className="grid grid-cols-2 gap-md lg:grid-cols-4">
        <StatCard label="Étudiants actifs" value={stats.activeStudents} icon="group" accent="bg-amud-primary" />
        <StatCard label="Enseignants" value={stats.totalTeachers} icon="cast_for_education" accent="bg-amud-primary-container" />
        <StatCard label="Formations actives" value={stats.activeFormations} icon="menu_book" accent="bg-amud-primary-fixed-dim" />
        <StatCard label="Groupes actifs" value={stats.activeGroups} icon="diversity_3" accent="bg-amud-secondary" />
      </div>

      <div className="grid grid-cols-1 gap-lg lg:grid-cols-2">
        <div className="rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-lg shadow-sm">
          <h2 className="mb-md text-title-lg text-amud-on-surface">Assiduité</h2>
          <div className="grid grid-cols-2 gap-sm">
            {[
              { label: 'Présence', value: rates.presenceRate },
              { label: 'Absence', value: rates.absenceRate },
              { label: 'Retard', value: rates.retardRate },
              { label: 'Excuse', value: rates.excuseRate },
            ].map((r) => (
              <div key={r.label} className="rounded-lg border border-amud-outline-variant p-md text-center">
                <div className="text-title-lg text-amud-primary">{r.value}%</div>
                <div className="text-label-sm text-amud-on-surface-variant">{r.label}</div>
              </div>
            ))}
          </div>
          <p className="mt-sm text-label-sm text-amud-on-surface-variant">Basé sur {rates.total} présence(s) enregistrée(s).</p>
        </div>

        <div className="rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-lg shadow-sm">
          <h2 className="mb-md text-title-lg text-amud-on-surface">Finances</h2>
          <dl className="space-y-sm text-body-md">
            <div className="flex justify-between"><dt className="text-amud-on-surface-variant">Revenus encaissés</dt><dd className="text-amud-on-surface">{stats.revenus.toLocaleString('fr-FR')} MAD</dd></div>
            <div className="flex justify-between"><dt className="text-amud-on-surface-variant">Paiements en attente</dt><dd className="text-amud-on-surface">{stats.paiementsEnAttente.toLocaleString('fr-FR')} MAD</dd></div>
            <div className="flex justify-between"><dt className="text-amud-on-surface-variant">Rémunérations dues</dt><dd className="text-amud-on-surface">{stats.remunerationsDues.toLocaleString('fr-FR')} MAD</dd></div>
          </dl>
        </div>

        <div className="rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-lg shadow-sm">
          <h2 className="mb-md text-title-lg text-amud-on-surface">Formations par niveau</h2>
          <div className="space-y-1">
            {scopedFormations.length === 0 ? (
              <EmptyState compact icon="menu_book" title="Aucune formation" description="Créez une formation pour suivre sa fréquentation." />
            ) : (
              scopedFormations.map((f) => (
                <div key={f.id} className="flex justify-between text-body-md">
                  <span className="text-amud-on-surface">{f.nom}</span>
                  <span className="text-amud-on-surface-variant">
                    {scopedEnrollments.filter((e) => scopedGroups.some((g) => g.id === e.groupId && g.formationId === f.id)).length} étudiant(s)
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-lg shadow-sm">
          <h2 className="mb-md text-title-lg text-amud-on-surface">Leads par statut</h2>
          <div className="space-y-1">
            {leadsByStatus.map((s) => (
              <div key={s} className="flex justify-between text-body-md">
                <span className="text-amud-on-surface">{LEAD_STATUS_LABELS[s]}</span>
                <span className="font-semibold text-amud-on-surface-variant">{scopedLeads.filter((l) => l.statut === s).length}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
