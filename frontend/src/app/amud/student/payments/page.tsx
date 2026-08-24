'use client';

import { useMemo } from 'react';
import { EmptyState, LoadingState } from '@/components/amud/ui';
import { useCurrentStudent } from '@/lib/amud/currentStudent';
import { useCollection } from '@/lib/amud/storage/useCollection';
import { centerStudentsCollection } from '@/lib/amud/localCenterStudents';
import { centerStudentsSeed } from '@/data/amud/centerStudents';
import { centerStudentPaymentsCollection } from '@/lib/amud/localCenterStudentPayments';
import { centerStudentPaymentsSeed } from '@/data/amud/centerStudentPayments';
import { centerFormationsCollection } from '@/lib/amud/localCenterFormations';
import { centerFormationsSeed } from '@/data/amud/centerFormations';
import { PAYMENT_STATUS_LABELS, PAYMENT_STATUS_CLASS } from '@/data/amud/centerTypes';

export default function StudentPaymentsPage() {
  const { studentId } = useCurrentStudent();
  const [students] = useCollection(centerStudentsCollection, centerStudentsSeed);
  const [payments] = useCollection(centerStudentPaymentsCollection, centerStudentPaymentsSeed);
  const [formations] = useCollection(centerFormationsCollection, centerFormationsSeed);

  const student = students.find((s) => s.id === studentId);
  const myPayments = useMemo(
    () => payments.filter((p) => p.studentId === studentId).sort((a, b) => b.date.localeCompare(a.date)),
    [payments, studentId],
  );

  const totals = useMemo(() => {
    const totalDu = myPayments.reduce((s, p) => s + p.prixTotal, 0);
    const totalPaye = myPayments.reduce((s, p) => s + p.montantPaye, 0);
    return { totalDu, totalPaye, restant: Math.max(0, totalDu - totalPaye) };
  }, [myPayments]);

  if (!student) return <LoadingState label="Chargement…" rows={3} />;

  return (
    <div className="space-y-lg">
      <h1 className="text-headline-md text-amud-on-surface">Mes paiements</h1>
      <p className="text-body-md text-amud-on-surface-variant">Consultation uniquement — pour toute modification, contactez votre centre.</p>

      {/* Résumé financier */}
      <div className="grid grid-cols-1 gap-md sm:grid-cols-3">
        {[
          { label: 'Total dû', value: totals.totalDu, color: 'text-amud-on-surface', bg: 'bg-amud-surface-container-lowest' },
          { label: 'Total payé', value: totals.totalPaye, color: 'text-amud-primary', bg: 'bg-amud-primary/5' },
          { label: 'Montant restant', value: totals.restant, color: totals.restant > 0 ? 'text-amud-error' : 'text-amud-primary', bg: totals.restant > 0 ? 'bg-amud-error-container' : 'bg-amud-primary/5' },
        ].map((s) => (
          <div key={s.label} className={`rounded-xl border border-amud-outline-variant ${s.bg} p-lg shadow-sm text-center`}>
            <p className="text-label-sm text-amud-on-surface-variant">{s.label}</p>
            <p className={`mt-1 text-title-xl font-bold ${s.color}`}>{s.value.toLocaleString('fr-FR')} MAD</p>
          </div>
        ))}
      </div>

      {/* Liste des paiements */}
      <div className="rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-lg shadow-sm">
        <h2 className="mb-md text-title-lg text-amud-on-surface">Historique des paiements</h2>
        {myPayments.length === 0 ? (
          <EmptyState compact icon="payments" title="Aucun paiement" description="Aucun paiement n'a encore été enregistré pour votre compte." />
        ) : (
          <div className="space-y-sm">
            {myPayments.map((p) => {
              const formation = formations.find((f) => f.id === p.formationId);
              const progress = p.prixTotal > 0 ? Math.min(100, Math.round((p.montantPaye / p.prixTotal) * 100)) : 0;
              return (
                <div key={p.id} className="rounded-xl border border-amud-outline-variant p-md">
                  <div className="flex flex-wrap items-start justify-between gap-sm">
                    <div>
                      <p className="text-body-md font-semibold text-amud-on-surface">{formation?.nom ?? 'Formation'}</p>
                      <p className="text-label-sm text-amud-on-surface-variant">
                        {new Date(p.date).toLocaleDateString('fr-FR')} · {p.mode}
                        {p.reference ? ` · Réf. ${p.reference}` : ''}
                      </p>
                    </div>
                    <span className={`rounded-full border px-3 py-0.5 text-label-sm font-medium ${PAYMENT_STATUS_CLASS[p.statut]}`}>
                      {PAYMENT_STATUS_LABELS[p.statut]}
                    </span>
                  </div>
                  <div className="mt-md grid grid-cols-3 gap-sm text-center">
                    {[
                      { label: 'Total', value: p.prixTotal },
                      { label: 'Payé', value: p.montantPaye },
                      { label: 'Restant', value: Math.max(0, p.prixTotal - p.montantPaye) },
                    ].map(({ label, value }) => (
                      <div key={label}>
                        <p className="text-label-sm text-amud-on-surface-variant">{label}</p>
                        <p className="text-body-md font-semibold text-amud-on-surface">{value.toLocaleString('fr-FR')} MAD</p>
                      </div>
                    ))}
                  </div>
                  {/* Barre de paiement */}
                  <div className="mt-sm h-2 overflow-hidden rounded-full bg-amud-surface-container-high">
                    <div className="h-full rounded-full bg-amud-primary" style={{ width: `${progress}%` }} />
                  </div>
                  {p.note && <p className="mt-1 text-label-sm text-amud-on-surface-variant">{p.note}</p>}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
