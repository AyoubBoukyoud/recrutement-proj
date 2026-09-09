'use client';

import { useMemo, useState } from 'react';
import { ConfirmDialog, SelectFilter, StatCard } from '@/components/amud/ui';
import { useToast } from '@/components/amud/Toast';
import { useCenterAccess } from '@/lib/amud/useCenterAccess';
import { useCollection } from '@/lib/amud/storage/useCollection';
import { useCrudSearch, toOptions } from '@/lib/amud/useCrudSearch';
import { logAudit } from '@/lib/amud/storage/audit';
import { centerStudentPaymentsCollection } from '@/lib/amud/localCenterStudentPayments';
import { centerStudentPaymentsSeed, PAYMENT_STATUS_LABELS, type CenterStudentPayment } from '@/data/amud/centerStudentPayments';
import { PAYMENT_MODES, type PaymentStatus } from '@/data/amud/centerTypes';
import { centerStudentsCollection } from '@/lib/amud/localCenterStudents';
import { centerStudentsSeed } from '@/data/amud/centerStudents';
import { CenterCrudTable } from '@/components/amud/centre/CenterCrudTable';
import { StudentPaymentFormModal } from '@/components/amud/centre/StudentPaymentFormModal';
import { PERMISSION_DENIED_MESSAGE } from '@/lib/amud/centerPermissions';

const STATUS_TONE: Record<PaymentStatus, 'success' | 'warning' | 'danger'> = {
  PAYE: 'success',
  PARTIEL: 'warning',
  IMPAYE: 'danger',
  EN_RETARD: 'danger',
};

export default function CentrePaiementsEtudiantsPage() {
  const notify = useToast();
  const { centerId, role, allowed } = useCenterAccess('manage-student-payments');
  const [payments, { remove }] = useCollection(centerStudentPaymentsCollection, centerStudentPaymentsSeed);
  const [students] = useCollection(centerStudentsCollection, centerStudentsSeed);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<CenterStudentPayment | undefined>(undefined);
  const [deleting, setDeleting] = useState<CenterStudentPayment | null>(null);

  const scoped = useMemo(() => payments.filter((p) => p.centerId === centerId), [payments, centerId]);
  const totalRevenu = scoped.reduce((sum, p) => sum + p.montantPaye, 0);
  const totalAttente = scoped.reduce((sum, p) => sum + Math.max(0, p.prixTotal - p.montantPaye), 0);

  const studentName = (id: string) => {
    const s = students.find((x) => x.id === id);
    return s ? `${s.prenom} ${s.nom}` : '—';
  };

  const { search, setSearch, filters, setFilter, reset, activeFilterCount, results } = useCrudSearch(
    scoped,
    { statut: '', mode: '' },
    {
      text: (p) => [studentName(p.studentId), p.reference, p.note, p.mode],
      match: (p, f) => (!f.statut || p.statut === f.statut) && (!f.mode || p.mode === f.mode),
    },
  );

  function openAdd() {
    if (!allowed) return notify(PERMISSION_DENIED_MESSAGE, 'error');
    setEditing(undefined);
    setModalOpen(true);
  }
  function openEdit(p: CenterStudentPayment) {
    if (!allowed) return notify(PERMISSION_DENIED_MESSAGE, 'error');
    setEditing(p);
    setModalOpen(true);
  }
  function handleDelete() {
    if (!deleting) return;
    if (!allowed) return notify(PERMISSION_DENIED_MESSAGE, 'error');
    remove(deleting.id);
    logAudit({ utilisateur: 'Centre (self-service)', role: 'Centre', action: `Suppression paiement ${studentName(deleting.studentId)}`, actionType: 'delete', module: 'Centres de formation — Paiements', reference: `#${deleting.id}`, centerId });
    notify('Paiement supprimé.', 'info');
    setDeleting(null);
  }

  return (
    <>
      <CenterCrudTable
        title="Paiements étudiants"
        subtitle={`${results.length} paiement(s) sur ${scoped.length}`}
        addLabel="Enregistrer un paiement"
        onAdd={openAdd}
        allowed={allowed}
        stats={
          <>
            <StatCard label="Total encaissé" value={totalRevenu} suffix=" MAD" icon="payments" accent="bg-amud-primary" />
            <StatCard label="Total en attente" value={totalAttente} suffix=" MAD" icon="hourglass_empty" accent="bg-amud-secondary" />
          </>
        }
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Rechercher par étudiant, référence…"
        activeFilterCount={activeFilterCount}
        onResetFilters={reset}
        filters={
          <>
            <SelectFilter
              label="Statut"
              value={filters.statut}
              onChange={(v) => setFilter('statut', v)}
              options={(Object.keys(PAYMENT_STATUS_LABELS) as PaymentStatus[]).map((s) => ({ value: s, label: PAYMENT_STATUS_LABELS[s] }))}
            />
            <SelectFilter label="Mode" value={filters.mode} onChange={(v) => setFilter('mode', v)} options={toOptions(PAYMENT_MODES)} />
          </>
        }
        columns={['Étudiant', 'Date', 'Total', 'Payé', 'Reste', 'Mode', 'Statut']}
        empty="Aucun paiement enregistré"
        emptyIcon="payments"
        emptyDescription="Enregistrez un premier paiement pour suivre les encaissements du centre."
        rows={results.map((p) => ({
          id: p.id,
          avatar: { initials: studentName(p.studentId).charAt(0).toUpperCase() },
          badge: { label: PAYMENT_STATUS_LABELS[p.statut], tone: STATUS_TONE[p.statut] },
          cells: [
            studentName(p.studentId),
            p.date,
            `${p.prixTotal.toLocaleString('fr-FR')} MAD`,
            `${p.montantPaye.toLocaleString('fr-FR')} MAD`,
            `${Math.max(0, p.prixTotal - p.montantPaye).toLocaleString('fr-FR')} MAD`,
            p.mode,
            PAYMENT_STATUS_LABELS[p.statut],
          ],
          onEdit: () => openEdit(p),
          onDelete: () => setDeleting(p),
        }))}
        cardHiddenColumns={[0, 6]}
      />
      <StudentPaymentFormModal open={modalOpen} onClose={() => setModalOpen(false)} centerId={centerId} payment={editing} actor={{ utilisateur: 'Centre (self-service)', role }} />
      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        title="Supprimer ce paiement ?"
        description={deleting ? `Êtes-vous sûr de vouloir supprimer le paiement de « ${studentName(deleting.studentId)} » ? Cette action est irréversible.` : undefined}
        confirmLabel="Supprimer"
      />
    </>
  );
}
