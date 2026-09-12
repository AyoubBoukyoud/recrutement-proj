'use client';

import { useMemo } from 'react';
import { EmptyState } from '@/components/amud/ui';
import { useCurrentStudent } from '@/lib/amud/currentStudent';
import { useCollection } from '@/lib/amud/storage/useCollection';
import { notifications as notificationsCollection, markNotificationRead, markAllNotificationsRead } from '@/lib/amud/storage/notify';
import { notificationsSeed } from '@/data/amud/notifications';

export default function StudentNotificationsPage() {
  const { studentId } = useCurrentStudent();
  const [allNotifications, { update }] = useCollection(notificationsCollection, notificationsSeed);

  const myNotifications = useMemo(
    () =>
      allNotifications
        .filter((n) => n.scope === 'student' && (!n.targetId || n.targetId === studentId))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [allNotifications, studentId],
  );

  const unreadCount = myNotifications.filter((n) => !n.read).length;

  const CATEGORY_ICONS: Record<string, string> = {
    Système: 'info',
    Planning: 'calendar_month',
    Présence: 'fact_check',
    Paiement: 'payments',
    Formation: 'menu_book',
    Enseignant: 'cast_for_education',
    'Message enseignant': 'chat',
  };

  return (
    <div className="space-y-lg">
      <div className="flex flex-wrap items-center justify-between gap-md">
        <div>
          <h1 className="text-headline-md text-amud-on-surface">Notifications</h1>
          {unreadCount > 0 && (
            <p className="text-body-md text-amud-on-surface-variant">{unreadCount} non lue{unreadCount > 1 ? 's' : ''}</p>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={() => markAllNotificationsRead('student')}
            className="rounded-lg border border-amud-secondary px-md py-sm text-label-md font-medium text-amud-secondary transition-colors hover:bg-amud-secondary/10"
          >
            Tout marquer comme lu
          </button>
        )}
      </div>

      {myNotifications.length === 0 ? (
        <EmptyState icon="notifications_none" title="Aucune notification" description="Vous n'avez aucune notification pour le moment." />
      ) : (
        <div className="space-y-sm">
          {myNotifications.map((n) => {
            const icon = CATEGORY_ICONS[n.category] ?? 'notifications';
            return (
              <button
                key={n.id}
                onClick={() => markNotificationRead(n.id)}
                className={`flex w-full items-start gap-md rounded-xl border p-md text-left transition-all hover:border-amud-secondary hover:shadow-sm ${
                  n.read ? 'border-amud-outline-variant bg-amud-surface-container-lowest opacity-70' : 'border-amud-secondary/30 bg-amud-secondary/5'
                }`}
              >
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${n.read ? 'bg-amud-surface-container-high' : 'bg-amud-secondary'}`}>
                  <span className={`material-symbols-outlined text-[20px] ${n.read ? 'text-amud-on-surface-variant' : 'text-white'}`}>{icon}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-sm">
                    <p className={`text-body-md ${n.read ? 'text-amud-on-surface-variant' : 'font-semibold text-amud-on-surface'}`}>{n.title}</p>
                    {!n.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-amud-secondary" />}
                  </div>
                  <p className="text-label-sm text-amud-on-surface-variant">{n.category}</p>
                  <p className="text-label-sm text-amud-on-surface-variant">
                    {new Date(n.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
