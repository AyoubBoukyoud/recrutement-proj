'use client';

import { useEffect, useState } from 'react';
import { Modal, ModalActions } from '@/components/amud/ui';
import { useToast } from '@/components/amud/Toast';
import { useCollection } from '@/lib/amud/storage/useCollection';
import { generateId } from '@/lib/amud/storage/ids';
import { logAudit } from '@/lib/amud/storage/audit';
import { logCenterActivity } from '@/lib/amud/localCenterActivities';
import { centerStudentPaymentsCollection } from '@/lib/amud/localCenterStudentPayments';
import { centerStudentPaymentsSeed, PAYMENT_MODES, type CenterStudentPayment } from '@/data/amud/centerStudentPayments';
import { centerStudentsCollection } from '@/lib/amud/localCenterStudents';
import { centerStudentsSeed } from '@/data/amud/centerStudents';
import { centerFormationsCollection } from '@/lib/amud/localCenterFormations';
import { centerFormationsSeed } from '@/data/amud/centerFormations';
import { computePaymentStatus } from '@/lib/amud/centerCalculations';

/**
 * Enregistre un paiement étudiant et fait enfin tourner
 * `computePaymentStatus()` (écrite mais jamais appelée jusqu'ici — les
 * statuts affichés venaient uniquement des données de démo pré-calculées).
 * Le statut EN_RETARD (au-delà du calcul PAYE/PARTIEL/IMPAYE) est marqué
 * manuellement via la case à cocher "en retard" quand le solde est impayé.
 */
export function StudentPaymentFormModal({
  open,
  onClose,
  centerId,
  payment,
  actor,
}: {
  open: boolean;
  onClose: () => void;
  centerId: string;
  payment?: CenterStudentPayment;
  actor: { utilisateur: string; role: string };
}) {
  const notify = useToast();
  const [, { add, update }] = useCollection(centerStudentPaymentsCollection, centerStudentPaymentsSeed);
  const [students] = useCollection(centerStudentsCollection, centerStudentsSeed);
  const [formations] = useCollection(centerFormationsCollection, centerFormationsSeed);
  const centerStudents = students.filter((s) => s.centerId === centerId);
  const centerFormations = formations.filter((f) => f.centerId === centerId);
  const isEdit = !!payment;

  const [studentId, setStudentId] = useState(centerStudents[0]?.id ?? '');
  const [formationId, setFormationId] = useState(centerFormations[0]?.id ?? '');
  const [prixTotal, setPrixTotal] = useState(0);
  const [montantPaye, setMontantPaye] = useState(0);
  const [date, setDate] = useState(() => new Date().toLocaleDateString('fr-FR'));
  const [mode, setMode] = useState<CenterStudentPayment['mode']>('Espèces');
  const [reference, setReference] = useState('');
  const [note, setNote] = useState('');
  const [enRetard, setEnRetard] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (payment) {
      setStudentId(payment.studentId);
      setFormationId(payment.formationId);
      setPrixTotal(payment.prixTotal);
      setMontantPaye(payment.montantPaye);
      setDate(payment.date);
      setMode(payment.mode);
      setReference(payment.reference ?? '');
      setNote(payment.note ?? '');
      setEnRetard(payment.statut === 'EN_RETARD');
    } else {
      const f = centerFormations[0];
      setStudentId(centerStudents[0]?.id ?? '');
      setFormationId(f?.id ?? '');
      setPrixTotal(f?.prix ?? 0);
      setMontantPaye(0);
      setDate(new Date().toLocaleDateString('fr-FR'));
      setMode('Espèces');
      setReference('');
      setNote('');
      setEnRetard(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, payment]);

  const computedStatus = computePaymentStatus(prixTotal, montantPaye);
  const finalStatus = computedStatus === 'IMPAYE' && enRetard ? 'EN_RETARD' : computedStatus;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!studentId || !formationId) return;
    const student = centerStudents.find((s) => s.id === studentId);
    if (isEdit && payment) {
      const patch = { studentId, formationId, prixTotal, montantPaye, date, mode, reference: reference.trim() || undefined, note: note.trim() || undefined, statut: finalStatus };
      update(payment.id, patch);
      logAudit({ utilisateur: actor.utilisateur, role: 'Centre', action: `Modification paiement ${student ? `${student.prenom} ${student.nom}` : ''}`, actionType: 'update', module: 'Centres de formation — Paiements étudiants', reference: `#${payment.id}`, centerId });
      notify('Paiement mis à jour.');
    } else {
      const created: CenterStudentPayment = {
        id: generateId('pay'),
        centerId,
        studentId,
        formationId,
        prixTotal,
        montantPaye,
        date,
        mode,
        reference: reference.trim() || undefined,
        note: note.trim() || undefined,
        statut: finalStatus,
      };
      add(created);
      logAudit({ utilisateur: actor.utilisateur, role: 'Centre', action: `Paiement enregistré ${student ? `${student.prenom} ${student.nom}` : ''}`, actionType: 'create', module: 'Centres de formation — Paiements étudiants', reference: `#${created.id}`, centerId });
      logCenterActivity({ centerId, type: 'PAYMENT_RECEIVED', message: `Paiement de ${montantPaye.toLocaleString('fr-FR')} MAD reçu${student ? ` de ${student.prenom} ${student.nom}` : ''}.`, utilisateur: actor.utilisateur, role: actor.role });
      notify('Paiement enregistré.');
    }
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Modifier le paiement' : 'Enregistrer un paiement'}
      footer={<ModalActions onCancel={onClose} form="payment-form" submitLabel={isEdit ? 'Enregistrer' : 'Ajouter'} />}
    >
      <form id="payment-form" onSubmit={handleSubmit} className="grid grid-cols-1 gap-md sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-label-md text-amud-on-surface-variant">Étudiant *</label>
          <select required value={studentId} onChange={(e) => setStudentId(e.target.value)} className="min-h-[44px] w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary">
            {centerStudents.map((s) => (
              <option key={s.id} value={s.id}>{s.prenom} {s.nom}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-label-md text-amud-on-surface-variant">Formation *</label>
          <select
            required
            value={formationId}
            onChange={(e) => {
              setFormationId(e.target.value);
              const f = centerFormations.find((x) => x.id === e.target.value);
              if (f && !isEdit) setPrixTotal(f.prix);
            }}
            className="min-h-[44px] w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary"
          >
            {centerFormations.map((f) => (
              <option key={f.id} value={f.id}>{f.nom}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-label-md text-amud-on-surface-variant">Prix total (MAD)</label>
          <input value={prixTotal} onChange={(e) => setPrixTotal(Number(e.target.value) || 0)} className="min-h-[44px] w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary" type="number" min={0} />
        </div>
        <div>
          <label className="mb-1 block text-label-md text-amud-on-surface-variant">Montant payé (MAD)</label>
          <input value={montantPaye} onChange={(e) => setMontantPaye(Number(e.target.value) || 0)} className="min-h-[44px] w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary" type="number" min={0} />
        </div>
        <div>
          <label className="mb-1 block text-label-md text-amud-on-surface-variant">Date</label>
          <input value={date} onChange={(e) => setDate(e.target.value)} className="min-h-[44px] w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary" type="text" placeholder="jj/mm/aaaa" />
        </div>
        <div>
          <label className="mb-1 block text-label-md text-amud-on-surface-variant">Mode de paiement</label>
          <select value={mode} onChange={(e) => setMode(e.target.value as CenterStudentPayment['mode'])} className="min-h-[44px] w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary">
            {PAYMENT_MODES.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-label-md text-amud-on-surface-variant">Référence</label>
          <input value={reference} onChange={(e) => setReference(e.target.value)} className="min-h-[44px] w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary" type="text" />
        </div>
        <div className="flex items-end">
          {computedStatus === 'IMPAYE' ? (
            <label className="flex items-center gap-2 text-label-md text-amud-on-surface">
              <input type="checkbox" checked={enRetard} onChange={(e) => setEnRetard(e.target.checked)} className="h-4 w-4 accent-amud-primary" />
              Marquer comme en retard
            </label>
          ) : null}
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-label-md text-amud-on-surface-variant">Note</label>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} className="min-h-[44px] w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary" />
        </div>
        <div className="sm:col-span-2 rounded-lg border border-amud-outline-variant bg-amud-surface-container-low px-md py-sm text-label-md text-amud-on-surface">
          Statut calculé automatiquement : <span className="font-semibold">{finalStatus}</span> (reste {Math.max(0, prixTotal - montantPaye).toLocaleString('fr-FR')} MAD)
        </div>
      </form>
    </Modal>
  );
}
