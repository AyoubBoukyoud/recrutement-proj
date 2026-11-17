'use client';

import { useEffect, useState } from 'react';
import { Modal, ModalActions } from '@/components/amud/ui';
import { useToast } from '@/components/amud/Toast';
import { useCollection } from '@/lib/amud/storage/useCollection';
import { generateId } from '@/lib/amud/storage/ids';
import { logAudit } from '@/lib/amud/storage/audit';
import { centerTeacherPaymentsCollection } from '@/lib/amud/localCenterTeacherPayments';
import { centerTeacherPaymentsSeed, type CenterTeacherPayment } from '@/data/amud/centerTeacherPayments';
import { centerTeachersCollection } from '@/lib/amud/localCenterTeachers';
import { centerTeachersSeed } from '@/data/amud/centerTeachers';
import { centerSchedulesCollection } from '@/lib/amud/localCenterSchedules';
import { centerSchedulesSeed } from '@/data/amud/centerSchedules';
import { computeTeacherBalance, todayIso } from '@/lib/amud/centerCalculations';
import { parseFrDate } from '@/lib/amud/analytics/period';

/** Enregistre une rémunération versée à un enseignant — heures/montant pré-remplis depuis `computeTeacherRemuneration` (calcul réel, pas figé). */
export function TeacherPaymentFormModal({ open, onClose, centerId, teacherId, actor }: { open: boolean; onClose: () => void; centerId: string; teacherId?: string; actor: { utilisateur: string; role: string } }) {
  const notify = useToast();
  const [payments, { add }] = useCollection(centerTeacherPaymentsCollection, centerTeacherPaymentsSeed);
  const [teachers] = useCollection(centerTeachersCollection, centerTeachersSeed);
  const [schedules] = useCollection(centerSchedulesCollection, centerSchedulesSeed);
  const centerTeachers = teachers.filter((t) => t.centerId === centerId);

  const [enseignantId, setEnseignantId] = useState(teacherId ?? centerTeachers[0]?.id ?? '');
  const [periode, setPeriode] = useState('');
  const [date, setDate] = useState(() => new Date().toLocaleDateString('fr-FR'));
  const [statut, setStatut] = useState<CenterTeacherPayment['statut']>('PAYE');

  useEffect(() => {
    if (!open) return;
    setEnseignantId(teacherId ?? centerTeachers[0]?.id ?? '');
    setPeriode(new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }));
    setDate(new Date().toLocaleDateString('fr-FR'));
    setStatut('PAYE');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, teacherId]);

  const teacher = centerTeachers.find((t) => t.id === enseignantId);
  const balance = teacher
    ? computeTeacherBalance(teacher, schedules.filter((s) => s.centerId === centerId), payments.filter((p) => p.centerId === centerId), todayIso())
    : null;
  // Uniquement les heures pas encore couvertes par un versement saisi —
  // avant, chaque saisie reprenait toutes les heures depuis le début.
  const remuneration = balance?.aEnregistrer ?? { heures: 0, montant: 0 };

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!teacher) {
      notify('Sélectionnez un enseignant.', 'error');
      return;
    }
    if (remuneration.montant <= 0) {
      notify('Rien à verser : toutes les heures effectuées sont déjà couvertes par une rémunération.', 'error');
      return;
    }
    if (!parseFrDate(date)) {
      notify('Date invalide — format attendu : jj/mm/aaaa.', 'error');
      return;
    }
    const created: CenterTeacherPayment = {
      id: generateId('tpay'),
      centerId,
      enseignantId: teacher.id,
      periode: periode.trim(),
      nombreHeures: remuneration.heures,
      tauxHoraire: teacher.tauxHoraire,
      montant: remuneration.montant,
      date,
      statut,
    };
    add(created);
    logAudit({ utilisateur: actor.utilisateur, role: 'Centre', action: `Rémunération enregistrée — ${teacher.prenom} ${teacher.nom}`, actionType: 'create', module: 'Centres de formation — Rémunération', reference: `${teacher.prenom} ${teacher.nom} · ${periode}`, centerId });
    notify(`Rémunération de ${teacher.prenom} ${teacher.nom} enregistrée.`);
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Enregistrer une rémunération"
      footer={<ModalActions onCancel={onClose} form="teacher-payment-form" submitLabel="Enregistrer" disabled={!teacher || remuneration.montant <= 0} />}
    >
      <form id="teacher-payment-form" onSubmit={handleSubmit} className="grid grid-cols-1 gap-md sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="mb-1 block text-label-md text-amud-on-surface-variant">Enseignant *</label>
          <select required value={enseignantId} onChange={(e) => setEnseignantId(e.target.value)} className="min-h-[44px] w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary">
            {centerTeachers.map((t) => (
              <option key={t.id} value={t.id}>{t.prenom} {t.nom}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-label-md text-amud-on-surface-variant">Période</label>
          <input value={periode} onChange={(e) => setPeriode(e.target.value)} className="min-h-[44px] w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary" type="text" />
        </div>
        <div>
          <label className="mb-1 block text-label-md text-amud-on-surface-variant">Date</label>
          <input value={date} onChange={(e) => setDate(e.target.value)} className="min-h-[44px] w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary" type="text" placeholder="jj/mm/aaaa" />
        </div>
        <div>
          <label className="mb-1 block text-label-md text-amud-on-surface-variant">Statut</label>
          <select value={statut} onChange={(e) => setStatut(e.target.value as CenterTeacherPayment['statut'])} className="min-h-[44px] w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary">
            <option value="PAYE">Payé</option>
            <option value="EN_ATTENTE">En attente</option>
          </select>
        </div>
        <div className="sm:col-span-2 rounded-lg border border-amud-outline-variant bg-amud-surface-container-low px-md py-sm text-label-md text-amud-on-surface">
          {teacher ? (
            remuneration.montant > 0 ? (
              <>Reste à enregistrer : {remuneration.heures}h × {teacher.tauxHoraire} MAD/h = <span className="font-semibold">{remuneration.montant.toLocaleString('fr-FR')} MAD</span>{balance && balance.verse > 0 ? <> (déjà versé : {balance.verse.toLocaleString('fr-FR')} MAD)</> : null}</>
            ) : (
              'Toutes les heures effectuées sont déjà couvertes par une rémunération enregistrée.'
            )
          ) : (
            'Sélectionnez un enseignant.'
          )}
        </div>
      </form>
    </Modal>
  );
}
