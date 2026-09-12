'use client';

import { useMemo, useState } from 'react';
import { EmptyState, PageHeader, ResponsiveTable, StatCard } from '@/components/amud/ui';
import { useToast } from '@/components/amud/Toast';
import { useCenterAccess } from '@/lib/amud/useCenterAccess';
import { useCollection } from '@/lib/amud/storage/useCollection';
import { centerTeachersCollection } from '@/lib/amud/localCenterTeachers';
import { centerTeachersSeed } from '@/data/amud/centerTeachers';
import { centerSchedulesCollection } from '@/lib/amud/localCenterSchedules';
import { centerSchedulesSeed } from '@/data/amud/centerSchedules';
import { centerTeacherPaymentsCollection } from '@/lib/amud/localCenterTeacherPayments';
import { centerTeacherPaymentsSeed } from '@/data/amud/centerTeacherPayments';
import { computeTeacherRemuneration, todayIso } from '@/lib/amud/centerCalculations';
import { TeacherPaymentFormModal } from '@/components/amud/centre/TeacherPaymentFormModal';
import { PERMISSION_DENIED_MESSAGE } from '@/lib/amud/centerPermissions';

export default function CentreRemunerationPage() {
  const notify = useToast();
  const { centerId, role, allowed } = useCenterAccess('manage-teacher-payments');
  const [teachers] = useCollection(centerTeachersCollection, centerTeachersSeed);
  const [schedules] = useCollection(centerSchedulesCollection, centerSchedulesSeed);
  const [payments] = useCollection(centerTeacherPaymentsCollection, centerTeacherPaymentsSeed);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string | undefined>(undefined);
  const today = todayIso();

  const centerTeachers = useMemo(() => teachers.filter((t) => t.centerId === centerId), [teachers, centerId]);
  const centerSchedules = useMemo(() => schedules.filter((s) => s.centerId === centerId), [schedules, centerId]);
  const centerPayments = useMemo(() => payments.filter((p) => p.centerId === centerId).sort((a, b) => b.date.localeCompare(a.date)), [payments, centerId]);

  const totalDue = centerTeachers.reduce((sum, t) => sum + computeTeacherRemuneration(t, centerSchedules, today).montant, 0);

  function openPayment(teacherId?: string) {
    if (!allowed) return notify(PERMISSION_DENIED_MESSAGE, 'error');
    setSelectedTeacherId(teacherId);
    setModalOpen(true);
  }

  return (
    <div className="space-y-lg pb-20 md:pb-0">
      <PageHeader
        title="Rémunération des enseignants"
        subtitle="Montants calculés à partir des heures réellement planifiées."
        actionLabel={allowed ? 'Enregistrer une rémunération' : undefined}
        onAction={allowed ? () => openPayment(undefined) : undefined}
      />

      <div className="grid grid-cols-2 gap-md lg:grid-cols-4">
        <StatCard label="Total dû" value={totalDue} suffix=" MAD" icon="account_balance_wallet" accent="bg-amud-secondary" />
        <StatCard label="Enseignants" value={centerTeachers.length} icon="cast_for_education" accent="bg-amud-primary" />
        <StatCard label="Versements" value={centerPayments.length} icon="receipt_long" accent="bg-amud-primary-container" />
        <StatCard
          label="Déjà versé"
          value={centerPayments.filter((p) => p.statut === 'PAYE').reduce((sum, p) => sum + p.montant, 0)}
          suffix=" MAD"
          icon="paid"
          accent="bg-amud-primary-fixed-dim"
        />
      </div>

      <section>
        <h2 className="mb-md text-title-lg text-amud-on-surface">À payer</h2>
        <ResponsiveTable
          caption="Rémunération due par enseignant"
          columns={['Enseignant', 'Heures effectuées', 'Taux', 'Montant dû']}
          empty={<EmptyState icon="cast_for_education" title="Aucun enseignant" description="Ajoutez des enseignants pour suivre leur rémunération." />}
          rows={centerTeachers.map((t) => {
            const r = computeTeacherRemuneration(t, centerSchedules, today);
            return {
              id: t.id,
              cells: [`${t.prenom} ${t.nom}`, `${r.heures}h`, `${t.tauxHoraire} MAD/h`, `${r.montant.toLocaleString('fr-FR')} MAD`],
              action: allowed ? (
                <button
                  onClick={() => openPayment(t.id)}
                  className="min-h-[44px] w-full rounded-lg border border-amud-outline-variant px-4 text-label-md font-medium text-amud-primary transition-colors hover:bg-amud-surface-container-low md:w-auto"
                >
                  Payer
                </button>
              ) : undefined,
            };
          })}
        />
      </section>

      <section>
        <h2 className="mb-md text-title-lg text-amud-on-surface">Historique des rémunérations versées</h2>
        <ResponsiveTable
          caption="Historique des rémunérations versées"
          columns={['Enseignant', 'Période', 'Montant', 'Date']}
          empty={<EmptyState icon="receipt_long" title="Aucune rémunération versée" description="Les versements enregistrés apparaîtront ici." />}
          rows={centerPayments.map((p) => {
            const t = centerTeachers.find((x) => x.id === p.enseignantId);
            return {
              id: p.id,
              badge: p.statut === 'PAYE' ? { label: 'Payé', tone: 'success' as const } : { label: 'En attente', tone: 'warning' as const },
              cells: [t ? `${t.prenom} ${t.nom}` : '—', p.periode, `${p.montant.toLocaleString('fr-FR')} MAD`, p.date],
            };
          })}
        />
      </section>

      <TeacherPaymentFormModal open={modalOpen} onClose={() => setModalOpen(false)} centerId={centerId} teacherId={selectedTeacherId} actor={{ utilisateur: 'Centre (self-service)', role }} />
    </div>
  );
}
