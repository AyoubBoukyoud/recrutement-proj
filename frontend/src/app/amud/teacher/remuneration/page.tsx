'use client';

import { useMemo } from 'react';
import { EmptyState, LoadingState } from '@/components/amud/ui';
import { useCurrentTeacher } from '@/lib/amud/currentTeacher';
import { useCollection } from '@/lib/amud/storage/useCollection';
import { centerTeachersCollection } from '@/lib/amud/localCenterTeachers';
import { centerTeachersSeed } from '@/data/amud/centerTeachers';
import { centerTeacherPaymentsCollection } from '@/lib/amud/localCenterTeacherPayments';
import { centerTeacherPaymentsSeed } from '@/data/amud/centerTeacherPayments';
import { centerSchedulesCollection } from '@/lib/amud/localCenterSchedules';
import { centerSchedulesSeed } from '@/data/amud/centerSchedules';
import { TEACHER_PAYMENT_STATUS_LABELS, TEACHER_PAYMENT_STATUS_CLASS } from '@/data/amud/centerTypes';
import { parseAnyDate } from '@/lib/amud/analytics/period';

function calcDuration(start: string, end: string): number {
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  return (eh * 60 + em - (sh * 60 + sm)) / 60;
}

export default function TeacherRemunerationPage() {
  const { teacherId } = useCurrentTeacher();
  const [teachers] = useCollection(centerTeachersCollection, centerTeachersSeed);
  const [payments] = useCollection(centerTeacherPaymentsCollection, centerTeacherPaymentsSeed);
  const [schedules] = useCollection(centerSchedulesCollection, centerSchedulesSeed);

  const teacher = teachers.find((t) => t.id === teacherId);
  const myPayments = useMemo(
    () => payments.filter((p) => p.enseignantId === teacherId).sort((a, b) => b.date.localeCompare(a.date)),
    [payments, teacherId],
  );

  const today = new Date().toISOString().slice(0, 10);
  const mySchedules = useMemo(
    () => schedules.filter((s) => s.enseignantId === teacherId && s.date <= today),
    [schedules, teacherId, today],
  );

  const totalHours = useMemo(
    () => mySchedules.reduce((sum, s) => sum + calcDuration(s.heureDebut, s.heureFin), 0),
    [mySchedules],
  );

  const totalPaye = myPayments.filter((p) => p.statut === 'PAYE').reduce((s, p) => s + p.montant, 0);
  const totalAttente = myPayments.filter((p) => p.statut === 'EN_ATTENTE').reduce((s, p) => s + p.montant, 0);
  const tauxHoraire = teacher?.tauxHoraire ?? 0;
  const montantTotal = Math.round(totalHours * tauxHoraire);

  if (!teacher) return <LoadingState label="Chargement…" rows={3} />;

  return (
    <div className="space-y-lg">
      <h1 className="text-headline-md text-amud-on-surface">Rémunération</h1>
      <p className="text-body-md text-amud-on-surface-variant">Consultation uniquement — les paiements sont gérés par le centre.</p>

      {/* Résumé financier */}
      <div className="grid grid-cols-1 gap-md sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Taux horaire', value: `${tauxHoraire} MAD/h`, icon: 'sell', color: 'text-amud-on-surface' },
          { label: 'Heures effectuées', value: `${totalHours.toFixed(1)}h`, icon: 'schedule', color: 'text-amud-on-surface' },
          { label: 'Total payé', value: `${totalPaye.toLocaleString('fr-FR')} MAD`, icon: 'check_circle', color: 'text-amud-primary' },
          { label: 'En attente', value: `${totalAttente.toLocaleString('fr-FR')} MAD`, icon: 'hourglass_empty', color: 'text-amud-secondary' },
        ].map(({ label, value, icon, color }) => (
          <div key={label} className="rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-lg text-center shadow-sm">
            <span className={`material-symbols-outlined ${color}`}>{icon}</span>
            <p className={`mt-1 text-title-lg font-bold ${color}`}>{value}</p>
            <p className="text-label-sm text-amud-on-surface-variant">{label}</p>
          </div>
        ))}
      </div>

      {/* Estimation */}
      <div className="rounded-xl border border-amud-primary/30 bg-amud-primary/5 p-lg shadow-sm">
        <p className="text-label-md text-amud-on-surface-variant">Estimation totale (heures × taux)</p>
        <p className="text-display-sm font-bold text-amud-primary">{montantTotal.toLocaleString('fr-FR')} MAD</p>
        <p className="text-label-sm text-amud-on-surface-variant">
          {totalHours.toFixed(1)}h × {tauxHoraire} MAD/h
        </p>
      </div>

      {/* Historique des versements */}
      <div className="rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-lg shadow-sm">
        <h2 className="mb-md text-title-lg text-amud-on-surface">Historique des versements</h2>
        {myPayments.length === 0 ? (
          <EmptyState compact icon="account_balance_wallet" title="Aucun versement" description="Vos versements apparaîtront ici." />
        ) : (
          <div className="space-y-sm">
            {myPayments.map((p) => (
              <div key={p.id} className="flex flex-wrap items-center justify-between gap-md rounded-lg border border-amud-outline-variant px-md py-sm">
                <div>
                  <p className="text-body-md font-semibold text-amud-on-surface">
                    {parseAnyDate(p.date)?.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) ?? p.date}
                  </p>
                  <p className="text-label-sm text-amud-on-surface-variant">
                    {p.periode}
                    {p.nombreHeures ? ` · ${p.nombreHeures}h` : ''}
                    {p.tauxHoraire ? ` (${p.tauxHoraire} MAD/h)` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-sm">
                  <span className="text-title-md font-bold text-amud-on-surface">{p.montant.toLocaleString('fr-FR')} MAD</span>
                  <span className={`rounded-full border px-2 py-0.5 text-label-sm font-medium ${TEACHER_PAYMENT_STATUS_CLASS[p.statut]}`}>
                    {TEACHER_PAYMENT_STATUS_LABELS[p.statut]}
                  </span>
                </div>
              </div>

            ))}
          </div>
        )}
      </div>
    </div>
  );
}
