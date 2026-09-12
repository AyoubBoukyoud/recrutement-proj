'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ConfirmDialog, SelectFilter } from '@/components/amud/ui';
import { useToast } from '@/components/amud/Toast';
import { useCenterAccess } from '@/lib/amud/useCenterAccess';
import { useCollection } from '@/lib/amud/storage/useCollection';
import { logAudit } from '@/lib/amud/storage/audit';
import { centerUsersCollection } from '@/lib/amud/localCenterUsers';
import { centerUsersSeed, type CenterUser } from '@/data/amud/centerUsers';
import { CENTER_ROLES, CENTER_ROLE_LABELS } from '@/data/amud/centerTypes';
import { useCrudSearch } from '@/lib/amud/useCrudSearch';
import { CenterCrudTable } from '@/components/amud/centre/CenterCrudTable';
import { CenterUserFormModal } from '@/components/amud/centre/CenterUserFormModal';
import { PERMISSION_DENIED_MESSAGE } from '@/lib/amud/centerPermissions';

/**
 * Répertoire d'équipe du centre (clé `amud_center_users`, jusqu'ici
 * inexistante — cf. audit) : `CENTER_OWNER`/`CENTER_ADMIN` y gèrent qui a
 * accès à l'espace self-service et avec quel rôle. Ne remplace pas le
 * sélecteur "rôle simulé" du header (aucune vraie authentification dans
 * `/amud`), mais rend la notion d'équipe/rôles réelle plutôt que purement
 * déclarative.
 */
export default function CentreParametresPage() {
  const notify = useToast();
  const { centerId, role, allowed } = useCenterAccess('manage-profile');
  const [users, { remove }] = useCollection(centerUsersCollection, centerUsersSeed);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<CenterUser | undefined>(undefined);
  const [deleting, setDeleting] = useState<CenterUser | null>(null);

  const scoped = useMemo(() => users.filter((u) => u.centerId === centerId), [users, centerId]);

  const { search, setSearch, filters, setFilter, reset, activeFilterCount, results } = useCrudSearch(
    scoped,
    { role: '' },
    {
      text: (u) => [u.nom, u.email, CENTER_ROLE_LABELS[u.role]],
      match: (u, f) => !f.role || u.role === f.role,
    },
  );

  function openAdd() {
    if (!allowed) return notify(PERMISSION_DENIED_MESSAGE, 'error');
    setEditing(undefined);
    setModalOpen(true);
  }
  function openEdit(u: CenterUser) {
    if (!allowed) return notify(PERMISSION_DENIED_MESSAGE, 'error');
    setEditing(u);
    setModalOpen(true);
  }
  function handleDelete() {
    if (!deleting) return;
    if (!allowed) return notify(PERMISSION_DENIED_MESSAGE, 'error');
    remove(deleting.id);
    logAudit({ utilisateur: 'Centre (self-service)', role: 'Centre', action: `Retrait membre d'équipe ${deleting.nom}`, actionType: 'delete', module: 'Centres de formation — Équipe', reference: `${deleting.nom} (#${deleting.id})`, centerId });
    notify('Membre retiré de l’équipe.', 'info');
    setDeleting(null);
  }

  return (
    <div className="space-y-lg">
      <div>
        <h1 className="text-headline-md text-amud-on-surface">Paramètres</h1>
        <p className="text-body-md text-amud-on-surface-variant">
          Équipe du centre et accès. Pour modifier les informations générales, rendez-vous sur{' '}
          <Link href="/amud/centre/profil" className="text-amud-primary hover:underline">le profil du centre</Link>.
        </p>
      </div>
      <CenterCrudTable
        title="Équipe"
        subtitle={`${results.length} membre(s) sur ${scoped.length}`}
        addLabel="Ajouter un membre"
        onAdd={openAdd}
        allowed={allowed}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Rechercher un membre…"
        activeFilterCount={activeFilterCount}
        onResetFilters={reset}
        filters={
          <SelectFilter
            label="Rôle"
            value={filters.role}
            onChange={(v) => setFilter('role', v)}
            options={CENTER_ROLES.map((r) => ({ value: r, label: CENTER_ROLE_LABELS[r] }))}
          />
        }
        columns={['Nom', 'Email', 'Rôle', 'Statut']}
        empty="Aucun membre d’équipe"
        emptyIcon="groups"
        emptyDescription="Invitez les membres qui doivent accéder à l’espace du centre."
        rows={results.map((u) => ({
          id: u.id,
          avatar: { initials: u.nom.charAt(0).toUpperCase() },
          badge: u.actif ? { label: 'Actif', tone: 'success' as const } : { label: 'Inactif', tone: 'neutral' as const },
          cells: [u.nom, u.email, CENTER_ROLE_LABELS[u.role], u.actif ? 'Actif' : 'Inactif'],
          onEdit: () => openEdit(u),
          onDelete: () => setDeleting(u),
        }))}
        cardHiddenColumns={[0, 1, 3]}
      />
      <CenterUserFormModal open={modalOpen} onClose={() => setModalOpen(false)} centerId={centerId} user={editing} actor={{ utilisateur: 'Centre (self-service)', role }} />
      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        title="Retirer ce membre ?"
        description={deleting ? `Êtes-vous sûr de vouloir retirer « ${deleting.nom} » de l’équipe ?` : undefined}
        confirmLabel="Retirer"
      />
    </div>
  );
}
