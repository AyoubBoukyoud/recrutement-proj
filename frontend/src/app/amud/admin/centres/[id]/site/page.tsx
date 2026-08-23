'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ConfirmDialog, Toggle } from '@/components/amud/ui';
import { useToast } from '@/components/amud/Toast';
import { useCollection } from '@/lib/amud/storage/useCollection';
import { logAudit } from '@/lib/amud/storage/audit';
import { logCenterActivity } from '@/lib/amud/localCenterActivities';
import { canPerform, PERMISSION_DENIED_MESSAGE } from '@/lib/amud/centerPermissions';
import { centresCollection } from '@/lib/amud/localCentres';
import { centresSeed, THEMES } from '@/data/amud/centres';
import { CenterFormModal } from '@/components/amud/centre/CenterFormModal';
import { ThemePreviewCard } from '@/components/amud/centre/ThemePreviewCard';
import { AdminCenterHeader, ADMIN_CENTER_ROUTE_TABS } from '@/components/amud/centre/AdminCenterHeader';

/**
 * Route dédiée `/amud/admin/centres/:id/site` (cahier des charges §1) —
 * l'Admin peut consulter ET modifier le thème (contrairement au Commercial,
 * lecture seule sur cette même information, cahier des charges §16).
 */
export default function AmudAdminCenterSitePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const notify = useToast();
  const [editOpen, setEditOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  const [centres, { update: updateCentre, remove: removeCentre }] = useCollection(centresCollection, centresSeed);
  const centre = centres.find((c) => c.id === params.id);

  if (!centre) {
    return <p className="rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-lg text-center text-body-md text-amud-on-surface-variant">Centre introuvable.</p>;
  }

  function handleTheme(themeId: string) {
    if (!centre) return;
    if (!canPerform('ADMIN', 'manage-site')) {
      notify(PERMISSION_DENIED_MESSAGE, 'error');
      return;
    }
    updateCentre(centre.id, { theme: themeId as typeof centre.theme, updatedAt: new Date().toISOString() });
    logAudit({ utilisateur: 'Administrateur', role: 'Admin', action: 'Changement de thème', actionType: 'update', module: 'Centres de formation', reference: `${centre.nom} (#${centre.id})`, centerId: centre.id });
    logCenterActivity({ centerId: centre.id, type: 'THEME_CHANGED', message: `Thème changé pour « ${THEMES.find((t) => t.id === themeId)?.nom ?? themeId} ».`, utilisateur: 'Administrateur', role: 'ADMIN' });
    notify('Thème mis à jour, visible immédiatement sur le site public.');
  }

  function handleSiteToggle(enabled: boolean) {
    if (!centre) return;
    if (!canPerform('ADMIN', 'manage-site')) {
      notify(PERMISSION_DENIED_MESSAGE, 'error');
      return;
    }
    updateCentre(centre.id, { site: { ...centre.site, enabled }, updatedAt: new Date().toISOString() });
    logAudit({ utilisateur: 'Administrateur', role: 'Admin', action: enabled ? 'Activation du site public' : 'Désactivation du site public', actionType: 'update', module: 'Centres de formation', reference: `${centre.nom} (#${centre.id})`, centerId: centre.id });
    logCenterActivity({ centerId: centre.id, type: 'WEBSITE_UPDATED', message: enabled ? 'Site public activé.' : 'Site public désactivé.', utilisateur: 'Administrateur', role: 'ADMIN' });
    notify(enabled ? 'Site public activé.' : 'Site public désactivé.');
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
    if ((ADMIN_CENTER_ROUTE_TABS as readonly string[]).includes(id) && id !== 'site') {
      router.push(`/amud/admin/centres/${centre.id}/${id}`);
      return;
    }
    if (id !== 'site') router.push(`/amud/admin/centres/${centre.id}`);
  }

  return (
    <div>
      <AdminCenterHeader centre={centre} activeTab="site" onTabChange={handleTabChange} onEdit={() => setEditOpen(true)} onDelete={() => setConfirmDeleteOpen(true)} />

      <div className="space-y-lg">
        <div className="rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-lg shadow-sm">
          <div className="mb-md flex items-center justify-between">
            <h3 className="text-title-lg text-amud-on-surface">Site public</h3>
            <label className="flex min-h-[44px] items-center gap-sm text-label-md text-amud-on-surface">
              Activé
              <Toggle checked={centre.site.enabled} onChange={handleSiteToggle} label="Activer le site public" />
            </label>
          </div>
          <p className="mb-md text-body-md text-amud-on-surface-variant">{centre.site.tagline}</p>
          {centre.site.enabled ? (
            <Link href={`/amud/centres/${centre.slug}`} target="_blank" className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-amud-outline-variant px-md text-label-md text-amud-primary hover:bg-amud-surface-container-low">
              <span className="material-symbols-outlined text-[18px]">open_in_new</span> Voir le site public
            </Link>
          ) : (
            <p className="text-label-sm text-amud-on-surface-variant">Le site public est désactivé pour ce centre.</p>
          )}
        </div>
        <div className="rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-lg shadow-sm">
          <h3 className="mb-1 text-title-lg text-amud-on-surface">Thème</h3>
          <p className="mb-md text-label-md text-amud-on-surface-variant">Chaque thème change réellement la navigation, le hero, les cartes, la typographie et le pied de page.</p>
          <div className="grid grid-cols-1 gap-md sm:grid-cols-2 lg:grid-cols-3">
            {THEMES.map((t) => (
              <ThemePreviewCard key={t.id} theme={t.id} selected={centre.theme === t.id} onSelect={() => handleTheme(t.id)} />
            ))}
          </div>
        </div>
      </div>

      <CenterFormModal open={editOpen} onClose={() => setEditOpen(false)} centre={centre} />
      <ConfirmDialog open={confirmDeleteOpen} onClose={() => setConfirmDeleteOpen(false)} onConfirm={handleDelete} title="Supprimer ce centre ?" description="Cette action est irréversible." confirmLabel="Supprimer" />
    </div>
  );
}
