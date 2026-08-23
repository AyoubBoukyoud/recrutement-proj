'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useCollection } from '@/lib/amud/storage/useCollection';
import { notifications as notificationsCollection, markNotificationRead, markAllNotificationsRead, removeNotification } from '@/lib/amud/storage/notify';
import { notificationsSeed, NOTIF_CATEGORIES } from '@/data/amud/notifications';

type TabId = 'all' | 'unread' | (typeof NOTIF_CATEGORIES)[number];

const CATEGORY_ICON: Record<string, string> = {
  Applications: 'assignment',
  Interviews: 'event',
  Messages: 'chat',
  Offers: 'work',
  System: 'settings',
};

export default function AmudEntrepriseNotificationsPage() {
  const [allNotifications] = useCollection(notificationsCollection, notificationsSeed);
  const [tab, setTab] = useState<TabId>('all');

  const myNotifications = useMemo(
    () => allNotifications.filter((n) => n.scope === 'employer').sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [allNotifications],
  );
  const unreadCount = myNotifications.filter((n) => !n.read).length;

  const filtered = useMemo(() => {
    if (tab === 'all') return myNotifications;
    if (tab === 'unread') return myNotifications.filter((n) => !n.read);
    return myNotifications.filter((n) => n.category === tab);
  }, [myNotifications, tab]);

  return (
    <div>
      <div className="mb-lg flex flex-wrap items-end justify-between gap-md">
        <div>
          <h2 className="text-headline-lg text-amud-on-surface">Notifications</h2>
          <p className="mt-1 text-body-md text-amud-on-surface-variant">{unreadCount} non lue(s).</p>
        </div>
        {unreadCount > 0 ? (
          <button onClick={() => markAllNotificationsRead('employer')} className="rounded-lg border border-amud-outline-variant px-md py-2 text-label-md font-medium text-amud-on-surface hover:bg-amud-surface-container-low">
            Tout marquer comme lu
          </button>
        ) : null}
      </div>

      <div className="mb-md flex flex-wrap gap-sm overflow-x-auto">
        {(['all', 'unread', ...NOTIF_CATEGORIES] as TabId[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`shrink-0 rounded-full px-md py-1.5 text-label-md font-medium transition-colors ${
              tab === t ? 'bg-amud-primary text-white' : 'bg-amud-surface-container-high text-amud-on-surface-variant hover:bg-amud-surface-container-highest'
            }`}
          >
            {t === 'all' ? 'Toutes' : t === 'unread' ? 'Non lues' : t}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-amud-outline-variant p-xl text-center">
          <span className="material-symbols-outlined text-4xl text-amud-on-surface-variant">notifications_none</span>
          <p className="mt-sm text-body-md font-medium text-amud-on-surface">Aucune notification.</p>
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
