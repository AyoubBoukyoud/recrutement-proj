'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { EmptyState, PageHeader } from '@/components/amud/ui';
import { useCollection } from '@/lib/amud/storage/useCollection';
import { notifications as notificationsCollection, markNotificationRead, markAllNotificationsRead, removeNotification } from '@/lib/amud/storage/notify';
import { notificationsSeed } from '@/data/amud/notifications';
import { getCommercialNotifications } from '@/lib/amud/commercialServices';

const SPECIAL_CATEGORIES = ['Rappel', 'Rendez-vous', 'Objectif', 'Système'] as const;
type TabId = 'all' | 'unread' | (typeof SPECIAL_CATEGORIES)[number];

const TAB_LABEL: Record<TabId, string> = {
  all: 'Toutes',
  unread: 'Non lues',
  Rappel: 'Rappels',
  'Rendez-vous': 'Rendez-vous',
  Objectif: 'Objectifs',
  Système: 'Système',
};

const CATEGORY_ICON: Record<string, string> = {
  Appel: 'call',
  Candidat: 'person',
  Rappel: 'notification_important',
  'Rendez-vous': 'event',
  Objectif: 'flag',
  Système: 'settings',
};

export default function AmudCommercialNotificationsPage() {
  const [allNotifications] = useCollection(notificationsCollection, notificationsSeed);
  const [tab, setTab] = useState<TabId>('all');

  const myNotifications = useMemo(() => getCommercialNotifications(allNotifications), [allNotifications]);
  const unreadCount = myNotifications.filter((n) => !n.read).length;

  const filtered = useMemo(() => {
    if (tab === 'all') return myNotifications;
    if (tab === 'unread') return myNotifications.filter((n) => !n.read);
    return myNotifications.filter((n) => n.category === tab);
  }, [myNotifications, tab]);

  return (
    <div>
      <div className="mb-lg flex flex-wrap items-end justify-between gap-md">
        <PageHeader title="Notifications" subtitle={`${unreadCount} non lue(s) sur ${myNotifications.length}.`} />
        {unreadCount > 0 ? (
          <button
            onClick={() => markAllNotificationsRead('commercial')}
            className="rounded-lg border border-amud-outline-variant px-md py-2 text-label-md font-medium text-amud-on-surface hover:bg-amud-surface-container-low"
          >
            Tout marquer comme lu
          </button>
        ) : null}
      </div>

      <div className="mb-md flex flex-wrap gap-sm overflow-x-auto">
        {(['all', 'unread', ...SPECIAL_CATEGORIES] as TabId[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`shrink-0 rounded-full px-md py-1.5 text-label-md font-medium transition-colors ${
              tab === t ? 'bg-amud-primary text-white' : 'bg-amud-surface-container-high text-amud-on-surface-variant hover:bg-amud-surface-container-highest'
            }`}
          >
            {TAB_LABEL[t]}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-amud-outline-variant bg-amud-surface-container-lowest">
          <EmptyState icon="notifications_none" title="Aucune notification" description="Vous n'avez aucune notification dans cette catégorie." />
        </div>
      ) : (
        <div className="divide-y divide-amud-outline-variant overflow-hidden rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest">
          {filtered.map((n) => (
            <div key={n.id} className={`flex items-start gap-sm p-md ${n.read ? 'opacity-70' : ''}`}>
              <span className="material-symbols-outlined mt-0.5 shrink-0 rounded-lg bg-amud-surface-container-highest p-1.5 text-amud-primary">{CATEGORY_ICON[n.category] ?? 'notifications'}</span>
              <Link href={n.href ?? '#'} onClick={() => markNotificationRead(n.id)} className="min-w-0 flex-1">
                <p className="text-body-md text-amud-on-surface">{n.title}</p>
                <p className="text-label-sm text-amud-on-surface-variant">
                  {n.category} · {new Date(n.createdAt).toLocaleString('fr-FR')}
                </p>
              </Link>
              <div className="flex shrink-0 items-center gap-1">
                {!n.read ? (
                  <button onClick={() => markNotificationRead(n.id)} aria-label="Marquer comme lu" className="flex h-8 w-8 items-center justify-center rounded-full text-amud-on-surface-variant hover:bg-amud-surface-container-high hover:text-amud-primary">
                    <span className="material-symbols-outlined text-[18px]">done</span>
                  </button>
                ) : null}
                <button onClick={() => removeNotification(n.id)} aria-label="Supprimer" className="flex h-8 w-8 items-center justify-center rounded-full text-amud-on-surface-variant hover:bg-amud-error-container hover:text-amud-error">
                  <span className="material-symbols-outlined text-[18px]">delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
