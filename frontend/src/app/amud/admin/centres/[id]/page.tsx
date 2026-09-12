'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ConfirmDialog, CountUp, EmptyState, ResponsiveTable, StatCard } from '@/components/amud/ui';
import { useToast } from '@/components/amud/Toast';
import { useCollection } from '@/lib/amud/storage/useCollection';
import { logAudit } from '@/lib/amud/storage/audit';
import { canPerform, PERMISSION_DENIED_MESSAGE } from '@/lib/amud/centerPermissions';
import { centresCollection } from '@/lib/amud/localCentres';
import { centresSeed, PARTNERSHIP_CLASS, PARTNERSHIP_LABELS } from '@/data/amud/centres';
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
import { ATTENDANCE_CLASS, ATTENDANCE_LABELS } from '@/data/amud/centerAttendance';
import { centerStudentPaymentsCollection } from '@/lib/amud/localCenterStudentPayments';
import { centerStudentPaymentsSeed } from '@/data/amud/centerStudentPayments';
import { computeCenterStats, computeAttendanceRates, todayIso } from '@/lib/amud/centerCalculations';
import { CenterFormModal } from '@/components/amud/centre/CenterFormModal';
import { AdminCenterHeader, ADMIN_CENTER_ROUTE_TABS } from '@/components/amud/centre/AdminCenterHeader';
import { SimpleTable } from '@/components/amud/centre/SimpleTable';

export default function AmudAdminCenterDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const notify = useToast();
  const [active, setActive] = useState('general');
  const [editOpen, setEditOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  const [centres, { remove: removeCentre }] = useCollection(centresCollection, centresSeed);
  const [students] = useCollection(centerStudentsCollection, centerStudentsSeed);
  const [teachers] = useCollection(centerTeachersCollection, centerTeachersSeed);
  const [formations] = useCollection(centerFormationsCollection, centerFormationsSeed);
  const [groups] = useCollection(centerGroupsCollection, centerGroupsSeed);
  const [enrollments] = useCollection(centerEnrollmentsCollection, centerEnrollmentsSeed);
  const [schedules] = useCollection(centerSchedulesCollection, centerSchedulesSeed);
  const [attendance] = useCollection(centerAttendanceCollection, centerAttendanceSeed);
  const [payments] = useCollection(centerStudentPaymentsCollection, centerStudentPaymentsSeed);

  const centre = centres.find((c) => c.id === params.id);

  const today = todayIso();
  const stats = useMemo(() => {
    if (!centre) return null;
    return computeCenterStats(centre.id, { students, teachers, formations, groups, schedules, attendance, studentPayments: payments, today });
  }, [centre, students, teachers, formations, groups, schedules, attendance, payments, today]);

  const scoped = useMemo(() => {
    if (!centre) return null;
    return {
      students: students.filter((s) => s.centerId === centre.id),
      teachers: teachers.filter((t) => t.centerId === centre.id),
      formations: formations.filter((f) => f.centerId === centre.id),
      groups: groups.filter((g) => g.centerId === centre.id),
      enrollments: enrollments.filter((e) => e.centerId === centre.id && e.statut === 'ACTIF'),
      schedules: schedules.filter((s) => s.centerId === centre.id).sort((a, b) => a.date.localeCompare(b.date)),
      attendance: attendance.filter((a) => a.centerId === centre.id),
      payments: payments.filter((p) => p.centerId === centre.id),
    };
  }, [centre, students, teachers, formations, groups, enrollments, schedules, attendance, payments]);

  if (!centre || !stats || !scoped) {
    return (
      <div className="rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-xl text-center">
        <p className="text-body-md text-amud-on-surface-variant">Centre introuvable.</p>
        <Link href="/amud/admin/centres" className="mt-md inline-block text-label-md text-amud-primary hover:underline">
          Retour à la liste des centres
        </Link>
      </div>
    );
  }

  function handleDelete() {
    if (!centre) return;
    if (!canPerform('ADMIN', 'manage-centers')) {
      notify(PERMISSION_DENIED_MESSAGE, 'error');
      return;
    }
    removeCentre(centre.id);
    logAudit({ utilisateur: 'Administrateur', role: 'Admin', action: 'Suppression centre', actionType: 'delete', module: 'Centres de formation', reference: `${centre.nom} (#${centre.id})`, centerId: centre.id });
    notify('Centre supprimé.', 'info');
    router.push('/amud/admin/centres');
  }

  function handleTabChange(id: string) {
    if (!centre) return;
    if ((ADMIN_CENTER_ROUTE_TABS as readonly string[]).includes(id)) {
      router.push(`/amud/admin/centres/${centre.id}/${id}`);
      return;
    }
    setActive(id);
  }

  const presenceRates = computeAttendanceRates(scoped.attendance);

  return (
    <div>
      <AdminCenterHeader centre={centre} activeTab={active} onTabChange={handleTabChange} onEdit={() => setEditOpen(true)} onDelete={() => setConfirmDeleteOpen(true)} />

      {active === 'general' ? (
        <div className="space-y-lg">
          <div className="grid grid-cols-2 gap-lg lg:grid-cols-4">
            {[
              { label: 'Étudiants actifs', value: stats.activeStudents, icon: 'group' },
              { label: 'Enseignants', value: stats.totalTeachers, icon: 'school' },
              { label: 'Formations actives', value: stats.activeFormations, icon: 'menu_book' },
              { label: 'Groupes actifs', value: stats.activeGroups, icon: 'diversity_3' },
              { label: 'Cours aujourd’hui', value: stats.coursAujourdhui, icon: 'event' },
              { label: 'Taux de présence', value: stats.tauxPresence, icon: 'fact_check', suffix: '%' },
              { label: 'Revenus étudiants', value: stats.revenus, icon: 'payments', suffix: ' MAD' },
              { label: 'Paiements en attente', value: stats.paiementsEnAttente, icon: 'hourglass_empty', suffix: ' MAD' },
            ].map((kpi) => (
              <div key={kpi.label} className="rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-lg shadow-sm">
                <div className="mb-md flex items-start justify-between">
                  <span className="text-label-md text-amud-on-surface-variant">{kpi.label}</span>
                  <span className="material-symbols-outlined text-amud-primary">{kpi.icon}</span>
                </div>
                <div className="text-headline-lg text-amud-on-surface">
                  <CountUp value={kpi.value} formatter={(v) => `${Math.round(v).toLocaleString('fr-FR')}${kpi.suffix ?? ''}`} />
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-lg lg:grid-cols-2">
            <div className="rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-lg shadow-sm">
              <h3 className="mb-md text-title-lg text-amud-on-surface">Informations générales</h3>
              <p className="mb-md text-body-md text-amud-on-surface-variant">{centre.description}</p>
              <dl className="space-y-sm text-body-md">
                <div className="flex justify-between"><dt className="text-amud-on-surface-variant">Téléphone</dt><dd className="text-amud-on-surface">{centre.telephone}</dd></div>
                <div className="flex justify-between"><dt className="text-amud-on-surface-variant">Email</dt><dd className="text-amud-on-surface">{centre.email}</dd></div>
                <div className="flex justify-between"><dt className="text-amud-on-surface-variant">Site web</dt><dd className="text-amud-on-surface">{centre.siteWeb || '—'}</dd></div>
                <div className="flex justify-between"><dt className="text-amud-on-surface-variant">Adresse</dt><dd className="text-right text-amud-on-surface">{centre.adresse}</dd></div>
                <div className="flex justify-between"><dt className="text-amud-on-surface-variant">Contact</dt><dd className="text-amud-on-surface">{centre.contactNom}</dd></div>
              </dl>
            </div>
            <div className="rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-lg shadow-sm">
              <h3 className="mb-md text-title-lg text-amud-on-surface">Partenariat</h3>
              <dl className="space-y-sm text-body-md">
                <div className="flex justify-between"><dt className="text-amud-on-surface-variant">Statut</dt><dd><span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${PARTNERSHIP_CLASS[centre.partnershipStatus]}`}>{PARTNERSHIP_LABELS[centre.partnershipStatus]}</span></dd></div>
                <div className="flex justify-between"><dt className="text-amud-on-surface-variant">Début</dt><dd className="text-amud-on-surface">{centre.partnershipDateDebut}</dd></div>
                <div className="flex justify-between"><dt className="text-amud-on-surface-variant">Fin</dt><dd className="text-amud-on-surface">{centre.partnershipDateFin || '—'}</dd></div>
                <div className="flex justify-between"><dt className="text-amud-on-surface-variant">Commercial</dt><dd className="text-amud-on-surface">{centre.assignedCommercialNom || '—'}</dd></div>
                <div className="flex justify-between"><dt className="text-amud-on-surface-variant">Créé le</dt><dd className="text-amud-on-surface">{new Date(centre.createdAt).toLocaleDateString('fr-FR')}</dd></div>
              </dl>
            </div>
          </div>
        </div>
      ) : null}

      {active === 'etudiants' ? (
        <SimpleTable
          empty="Aucun étudiant."
          columns={['Nom', 'Niveau', 'Ville', 'Statut']}
          rows={scoped.students.map((s) => [`${s.prenom} ${s.nom}`, `${s.niveau} → ${s.niveauCible}`, s.ville, s.statut])}
        />
      ) : null}

      {active === 'enseignants' ? (
        <SimpleTable
          empty="Aucun enseignant."
          columns={['Nom', 'Spécialité', 'Contrat', 'Taux horaire']}
          rows={scoped.teachers.map((t) => [`${t.prenom} ${t.nom}`, t.specialite, t.typeContrat, `${t.tauxHoraire} MAD/h`])}
        />
      ) : null}

      {active === 'formations' ? (
        <SimpleTable
          empty="Aucune formation."
          columns={['Formation', 'Niveau', 'Durée', 'Prix', 'Statut']}
          rows={scoped.formations.map((f) => [f.nom, f.niveau, `${f.dureeSemaines} sem. · ${f.nombreHeures}h`, `${f.prix.toLocaleString('fr-FR')} MAD`, f.statut])}
        />
      ) : null}

      {active === 'groupes' ? (
        <SimpleTable
          empty="Aucun groupe."
          columns={['Groupe', 'Enseignant', 'Salle', 'Étudiants', 'Statut']}
          rows={scoped.groups.map((g) => {
            const teacher = scoped.teachers.find((t) => t.id === g.enseignantId);
            const enrolled = scoped.enrollments.filter((e) => e.groupId === g.id).length;
            return [g.nom, teacher ? `${teacher.prenom} ${teacher.nom}` : '—', g.salle, `${enrolled}/${g.capaciteMax}`, g.statut];
          })}
        />
      ) : null}

      {active === 'planning' ? (
        <SimpleTable
          empty="Aucun créneau planifié."
          columns={['Date', 'Jour', 'Horaire', 'Groupe', 'Salle']}
          rows={scoped.schedules.slice(0, 30).map((s) => {
            const group = scoped.groups.find((g) => g.id === s.groupId);
            return [s.date, s.jour, `${s.heureDebut} – ${s.heureFin}`, group?.nom ?? '—', s.salle];
          })}
        />
      ) : null}

      {active === 'presences' ? (
        <div className="space-y-lg">
          <div className="grid grid-cols-2 gap-md lg:grid-cols-4">
            <StatCard label="Taux de présence" value={presenceRates.presenceRate} suffix=" %" accent="bg-amud-primary" />
            <StatCard label="Taux d’absence" value={presenceRates.absenceRate} suffix=" %" accent="bg-amud-error" />
            <StatCard label="Taux de retard" value={presenceRates.retardRate} suffix=" %" accent="bg-amud-tertiary-fixed-dim" />
            <StatCard label="Taux d’excuse" value={presenceRates.excuseRate} suffix=" %" accent="bg-amud-primary-container" />
          </div>
          <ResponsiveTable
            caption="Présences enregistrées"
            columns={['Date', 'Étudiant', 'Statut']}
            empty={<EmptyState icon="fact_check" title="Aucune présence enregistrée" description="Les présences saisies par le centre apparaîtront ici." />}
            rows={scoped.attendance.slice(0, 30).map((a) => {
              const student = scoped.students.find((s) => s.id === a.studentId);
              return {
                id: a.id,
                cells: [
                  a.date,
                  student ? `${student.prenom} ${student.nom}` : '—',
                  <span key="s" className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${ATTENDANCE_CLASS[a.statut]}`}>{ATTENDANCE_LABELS[a.statut]}</span>,
                ],
              };
            })}
          />
        </div>
      ) : null}

      {active === 'parametres' ? (
        <div className="space-y-lg">
          <div className="rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-lg shadow-sm">
            <h3 className="mb-md text-title-lg text-amud-on-surface">Paramètres du centre</h3>
            <p className="mb-md text-body-md text-amud-on-surface-variant">Modifiez les informations générales, la localisation, le partenariat ou le site public de ce centre.</p>
            <button onClick={() => setEditOpen(true)} className="rounded-lg bg-amud-primary px-lg py-2 text-label-md font-medium text-white shadow-sm hover:bg-amud-primary-dark">
              Modifier le centre
            </button>
          </div>
          <div className="overflow-hidden rounded-xl border border-amud-error/40 bg-amud-surface-container-lowest shadow-sm">
            <div className="border-b border-amud-error/40 bg-amud-error-container/20 p-lg">
              <h3 className="text-title-lg text-amud-on-surface">Zone de danger</h3>
            </div>
            <div className="flex items-center justify-between p-lg">
              <p className="text-body-md text-amud-on-surface-variant">Supprimer définitivement ce centre et son accès au site public.</p>
              <button onClick={() => setConfirmDeleteOpen(true)} className="shrink-0 rounded-lg border border-amud-error px-md py-2 text-label-md text-amud-error hover:bg-amud-error-container/20">
                Supprimer
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <CenterFormModal open={editOpen} onClose={() => setEditOpen(false)} centre={centre} />
      <ConfirmDialog
        open={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Supprimer ce centre ?"
        description="Cette action est irréversible."
        confirmLabel="Supprimer"
      />
    </div>
  );
}
