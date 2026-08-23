'use client';

import { useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ConfirmDialog, EmptyState } from '@/components/amud/ui';
import { useToast } from '@/components/amud/Toast';
import { useCollection } from '@/lib/amud/storage/useCollection';
import { logAudit, auditLogs } from '@/lib/amud/storage/audit';
import { auditLogSeed } from '@/data/amud/auditLog';
import { canPerform, PERMISSION_DENIED_MESSAGE } from '@/lib/amud/centerPermissions';
import { centresCollection } from '@/lib/amud/localCentres';
import { centresSeed } from '@/data/amud/centres';
import { CenterFormModal } from '@/components/amud/centre/CenterFormModal';
import { AdminCenterHeader, ADMIN_CENTER_ROUTE_TABS } from '@/components/amud/centre/AdminCenterHeader';

/** Route dédiée `/amud/admin/centres/:id/activite` (cahier des charges §1). */
export default function AmudAdminCenterActivitePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const notify = useToast();
  const [editOpen, setEditOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  const [centres, { remove: removeCentre }] = useCollection(centresCollection, centresSeed);
  const [logs] = useCollection(auditLogs, auditLogSeed);
  const centre = centres.find((c) => c.id === params.id);

  const scopedLogs = useMemo(() => {
    if (!centre) return [];
    return logs.filter((l) => l.centerId === centre.id).sort((a, b) => `${b.date} ${b.heure}`.localeCompare(`${a.date} ${a.heure}`));
  }, [centre, logs]);

  if (!centre) {
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
    if ((ADMIN_CENTER_ROUTE_TABS as readonly string[]).includes(id) && id !== 'activite') {
      router.push(`/amud/admin/centres/${centre.id}/${id}`);
      return;
    }
    if (id !== 'activite') router.push(`/amud/admin/centres/${centre.id}`);
  }

  return (
    <div>
      <AdminCenterHeader centre={centre} activeTab="activite" onTabChange={handleTabChange} onEdit={() => setEditOpen(true)} onDelete={() => setConfirmDeleteOpen(true)} />

      <div className="space-y-sm">
        {scopedLogs.length === 0 ? (
          <EmptyState icon="history" title="Aucune activité enregistrée" description="Les actions effectuées sur ce centre (création, modifications, paiements…) apparaîtront ici." />
        ) : (
          scopedLogs.map((l) => (
            <div key={l.id} className="flex items-start gap-md rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-md shadow-sm">
              <span className="material-symbols-outlined mt-0.5 text-amud-primary">history</span>
              <div className="min-w-0 flex-1">
                <p className="text-body-md text-amud-on-surface">{l.action}</p>
                <p className="text-label-sm text-amud-on-surface-variant">
                  {l.utilisateur} · {l.date} à {l.heure}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      <CenterFormModal open={editOpen} onClose={() => setEditOpen(false)} centre={centre} />
      <ConfirmDialog open={confirmDeleteOpen} onClose={() => setConfirmDeleteOpen(false)} onConfirm={handleDelete} title="Supprimer ce centre ?" description="Cette action est irréversible." confirmLabel="Supprimer" />
    </div>
  );
}
