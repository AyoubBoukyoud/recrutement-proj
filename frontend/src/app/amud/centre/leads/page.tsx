'use client';

import { useMemo, useState } from 'react';
import { ConfirmDialog, SelectFilter, statusTone } from '@/components/amud/ui';
import { useToast } from '@/components/amud/Toast';
import { useCenterAccess } from '@/lib/amud/useCenterAccess';
import { useCollection } from '@/lib/amud/storage/useCollection';
import { useCrudSearch } from '@/lib/amud/useCrudSearch';
import { logAudit } from '@/lib/amud/storage/audit';
import { centerLeadsCollection } from '@/lib/amud/localCenterLeads';
import { centerLeadsSeed, LEAD_STATUSES, LEAD_STATUS_LABELS, type CenterLead } from '@/data/amud/centerLeads';
import { CenterCrudTable } from '@/components/amud/centre/CenterCrudTable';
import { LeadFormModal } from '@/components/amud/centre/LeadFormModal';
import { PERMISSION_DENIED_MESSAGE } from '@/lib/amud/centerPermissions';

export default function CentreLeadsPage() {
  const notify = useToast();
  const { centerId, role, allowed } = useCenterAccess('manage-leads');
  const [leads, { remove }] = useCollection(centerLeadsCollection, centerLeadsSeed);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<CenterLead | undefined>(undefined);
  const [deleting, setDeleting] = useState<CenterLead | null>(null);

  const scoped = useMemo(
    () => leads.filter((l) => l.centerId === centerId).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [leads, centerId],
  );

  const { search, setSearch, filters, setFilter, reset, activeFilterCount, results } = useCrudSearch(
    scoped,
    { statut: '' },
    {
      text: (l) => [l.nom, l.telephone, l.email, l.message],
      match: (l, f) => !f.statut || l.statut === f.statut,
    },
  );

  function openAdd() {
    if (!allowed) return notify(PERMISSION_DENIED_MESSAGE, 'error');
    setEditing(undefined);
    setModalOpen(true);
  }
  function openEdit(l: CenterLead) {
    if (!allowed) return notify(PERMISSION_DENIED_MESSAGE, 'error');
    setEditing(l);
    setModalOpen(true);
  }
  function handleDelete() {
    if (!deleting) return;
    if (!allowed) return notify(PERMISSION_DENIED_MESSAGE, 'error');
    remove(deleting.id);
    logAudit({ utilisateur: 'Centre (self-service)', role: 'Centre', action: `Suppression lead ${deleting.nom}`, actionType: 'delete', module: 'Centres de formation — Leads', reference: `${deleting.nom} (#${deleting.id})`, centerId });
    notify('Lead supprimé.', 'info');
    setDeleting(null);
  }

  return (
    <>
      <CenterCrudTable
        title="Leads"
        subtitle={`${results.length} lead(s) sur ${scoped.length} — demandes reçues via le site public ou saisies manuellement`}
        addLabel="Ajouter un lead"
        onAdd={openAdd}
        allowed={allowed}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Rechercher par nom, téléphone, email…"
        activeFilterCount={activeFilterCount}
        onResetFilters={reset}
        filters={
          <SelectFilter
            label="Statut"
            value={filters.statut}
            onChange={(v) => setFilter('statut', v)}
            options={LEAD_STATUSES.map((s) => ({ value: s, label: LEAD_STATUS_LABELS[s] }))}
          />
        }
        columns={['Nom', 'Contact', 'Niveau souhaité', 'Horaire préféré', 'Statut']}
        empty="Aucun lead"
        emptyIcon="person_add"
        emptyDescription="Les demandes d’inscription reçues depuis le site public arriveront ici."
        rows={results.map((l) => ({
          id: l.id,
          avatar: { initials: l.nom.charAt(0).toUpperCase() },
          badge: { label: LEAD_STATUS_LABELS[l.statut], tone: statusTone(LEAD_STATUS_LABELS[l.statut]) },
          cells: [l.nom, l.telephone || l.email || '—', l.niveauSouhaite, l.horairePrefere || '—', LEAD_STATUS_LABELS[l.statut]],
          onEdit: () => openEdit(l),
          onDelete: () => setDeleting(l),
        }))}
        cardHiddenColumns={[0, 4]}
      />
      <LeadFormModal open={modalOpen} onClose={() => setModalOpen(false)} centerId={centerId} lead={editing} actor={{ utilisateur: 'Centre (self-service)', role }} />
      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        title="Supprimer ce lead ?"
        description={deleting ? `Êtes-vous sûr de vouloir supprimer « ${deleting.nom} » ? Cette action est irréversible.` : undefined}
        confirmLabel="Supprimer"
      />
    </>
  );
}
