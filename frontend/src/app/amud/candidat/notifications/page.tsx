'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Button, EmptyState, PageHeader, SegmentedControl } from '@/components/amud/ui';
import { useCurrentCandidate } from '@/lib/amud/useCurrentCandidate';
import { useCollection } from '@/lib/amud/storage/useCollection';
import { notifications as notificationsCollection, markAllNotificationsRead, markNotificationRead, removeNotification } from '@/lib/amud/storage/notify';
import { notificationsSeed } from '@/data/amud/notifications';

const CATEGORIES = ['Toutes', 'Candidatures', 'Entretiens', 'Profil', 'Messages', 'Compte'];

export default function NotificationsPage() {
  const { candidate, loading } = useCurrentCandidate();
  const [all] = useCollection(notificationsCollection, notificationsSeed);
  const [category, setCategory] = useState('Toutes');

  const mine = useMemo(
    () =>
      all
        .filter((n) => n.scope === 'candidate' && (!n.targetId || n.targetId === candidate?.id))
        .filter((n) => category === 'Toutes' || n.category === category)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [all, candidate, category],
  );
  const unreadCount = mine.filter((n) => !n.read).length;

  if (loading) return null;

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Notifications" subtitle={`${unreadCount} non lue(s)`}>
        {unreadCount > 0 ? (
          <Button variant="secondary" size="sm" onClick={() => markAllNotificationsRead('candidate')}>
            Tout marquer comme lu
          </Button>
        ) : null}
      </PageHeader>

      <div className="mb-lg">
        <SegmentedControl label="Catégorie" value={category} onChange={setCategory} options={CATEGORIES.map((c) => ({ value: c, label: c }))} />
      </div>

      {mine.length === 0 ? (
        <EmptyState icon="notifications" title="Aucune notification." />
      ) : (
        <div className="flex flex-col gap-sm">
          {mine.map((n) => (
            <div key={n.id} className={`flex items-start gap-sm rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-md shadow-sm ${n.read ? 'opacity-70' : ''}`}>
              <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.read ? 'bg-amud-outline-variant' : 'bg-amud-secondary'}`} />
              <div className="min-w-0 flex-1">
                {n.href ? (
                  <Link href={n.href} onClick={() => markNotificationRead(n.id)} className="text-body-md text-amud-on-surface hover:underline">
                    {n.title}
                  </Link>
                ) : (
                  <p className="text-body-md text-amud-on-surface">{n.title}</p>
                )}
                <p className="mt-0.5 text-label-sm text-amud-on-surface-variant">
                  {n.category} · {new Date(n.createdAt).toLocaleDateString('fr-FR')}
                </p>
              </div>
              <button type="button" onClick={() => removeNotification(n.id)} aria-label="Supprimer" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-amud-on-surface-variant hover:bg-amud-surface-container-high">
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
