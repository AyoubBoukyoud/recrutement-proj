'use client';

import { useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ConfirmDialog, StatCard } from '@/components/amud/ui';
import { useToast } from '@/components/amud/Toast';
import { useCollection } from '@/lib/amud/storage/useCollection';
import { logAudit } from '@/lib/amud/storage/audit';
import { canPerform, PERMISSION_DENIED_MESSAGE } from '@/lib/amud/centerPermissions';
import { centresCollection } from '@/lib/amud/localCentres';
import { centresSeed } from '@/data/amud/centres';
import { centerStudentsCollection } from '@/lib/amud/localCenterStudents';
import { centerStudentsSeed } from '@/data/amud/centerStudents';
import { centerTeachersCollection } from '@/lib/amud/localCenterTeachers';
import { centerTeachersSeed } from '@/data/amud/centerTeachers';
import { centerFormationsCollection } from '@/lib/amud/localCenterFormations';
import { centerFormationsSeed } from '@/data/amud/centerFormations';
import { centerGroupsCollection } from '@/lib/amud/localCenterGroups';
import { centerGroupsSeed } from '@/data/amud/centerGroups';
import { centerSchedulesCollection } from '@/lib/amud/localCenterSchedules';
import { centerSchedulesSeed } from '@/data/amud/centerSchedules';
import { centerAttendanceCollection } from '@/lib/amud/localCenterAttendance';
import { centerAttendanceSeed } from '@/data/amud/centerAttendance';
import { centerStudentPaymentsCollection } from '@/lib/amud/localCenterStudentPayments';
import { centerStudentPaymentsSeed } from '@/data/amud/centerStudentPayments';
import { PAYMENT_STATUS_CLASS, PAYMENT_STATUS_LABELS } from '@/data/amud/centerStudentPayments';
import { computeCenterStats, computeTeacherRemuneration, todayIso } from '@/lib/amud/centerCalculations';
import { CenterFormModal } from '@/components/amud/centre/CenterFormModal';
import { AdminCenterHeader, ADMIN_CENTER_ROUTE_TABS } from '@/components/amud/centre/AdminCenterHeader';
import { SimpleTable } from '@/components/amud/centre/SimpleTable';

/** Route dédiée `/amud/admin/centres/:id/finance` (cahier des charges §1). */
export default function AmudAdminCenterFinancePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const notify = useToast();
  const [editOpen, setEditOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  const [centres, { remove: removeCentre }] = useCollection(centresCollection, centresSeed);
  const [students] = useCollection(centerStudentsCollection, centerStudentsSeed);
  const [teachers] = useCollection(centerTeachersCollection, centerTeachersSeed);
  const [formations] = useCollection(centerFormationsCollection, centerFormationsSeed);
  const [groups] = useCollection(centerGroupsCollection, centerGroupsSeed);
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
      teachers: teachers.filter((t) => t.centerId === centre.id),
      students: students.filter((s) => s.centerId === centre.id),
      schedules: schedules.filter((s) => s.centerId === centre.id),
      payments: payments.filter((p) => p.centerId === centre.id),
    };
  }, [centre, teachers, students, schedules, payments]);

  if (!centre || !stats || !scoped) {
    return <p className="rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-lg text-center text-body-md text-amud-on-surface-variant">Centre introuvable.</p>;
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
    if ((ADMIN_CENTER_ROUTE_TABS as readonly string[]).includes(id) && id !== 'finance') {
      router.push(`/amud/admin/centres/${centre.id}/${id}`);
      return;
    }
    if (id !== 'finance') router.push(`/amud/admin/centres/${centre.id}`);
  }

  return (
    <div>
      <AdminCenterHeader centre={centre} activeTab="finance" onTabChange={handleTabChange} onEdit={() => setEditOpen(true)} onDelete={() => setConfirmDeleteOpen(true)} />

      <div className="space-y-lg">
        <div className="grid grid-cols-1 gap-lg sm:grid-cols-3">
          <StatCard label="Revenus étudiants" value={stats.revenus} suffix=" MAD" accent="bg-amud-primary" />
          <StatCard label="Paiements en attente" value={stats.paiementsEnAttente} suffix=" MAD" accent="bg-amud-secondary" />
          <StatCard label="Rémunérations enseignants" value={stats.remunerationsDues} suffix=" MAD" />
        </div>
        <SimpleTable
          empty="Aucun paiement enregistré."
          columns={['Étudiant', 'Montant total', 'Payé', 'Reste', 'Statut']}
          rows={scoped.payments.map((p) => {
            const student = scoped.students.find((s) => s.id === p.studentId);
            return [
              student ? `${student.prenom} ${student.nom}` : '—',
              `${p.prixTotal.toLocaleString('fr-FR')} MAD`,
              `${p.montantPaye.toLocaleString('fr-FR')} MAD`,
              `${Math.max(0, p.prixTotal - p.montantPaye).toLocaleString('fr-FR')} MAD`,
              <span key="s" className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${PAYMENT_STATUS_CLASS[p.statut]}`}>{PAYMENT_STATUS_LABELS[p.statut]}</span>,
            ];
          })}
        />
        <div>
          <h3 className="mb-md text-title-lg text-amud-on-surface">Rémunération des enseignants</h3>
          <SimpleTable
            empty="Aucun enseignant."
            columns={['Enseignant', 'Heures', 'Taux', 'Montant dû']}
            rows={scoped.teachers.map((t) => {
              const r = computeTeacherRemuneration(t, scoped.schedules, today);
              return [`${t.prenom} ${t.nom}`, `${r.heures}h`, `${t.tauxHoraire} MAD/h`, `${r.montant.toLocaleString('fr-FR')} MAD`];
            })}
          />
        </div>
      </div>

      <CenterFormModal open={editOpen} onClose={() => setEditOpen(false)} centre={centre} />
      <ConfirmDialog open={confirmDeleteOpen} onClose={() => setConfirmDeleteOpen(false)} onConfirm={handleDelete} title="Supprimer ce centre ?" description="Cette action est irréversible." confirmLabel="Supprimer" />
    </div>
  );
}
