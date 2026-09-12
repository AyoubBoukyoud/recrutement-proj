'use client';

import { useMemo } from 'react';
import { EmptyState } from '@/components/amud/ui';
import { useCurrentTeacher } from '@/lib/amud/currentTeacher';
import { useCollection } from '@/lib/amud/storage/useCollection';
import { notifications as notificationsCollection, markNotificationRead, markAllNotificationsRead } from '@/lib/amud/storage/notify';
import { notificationsSeed } from '@/data/amud/notifications';

export default function TeacherNotificationsPage() {
  const { teacherId } = useCurrentTeacher();
  const [allNotifications] = useCollection(notificationsCollection, notificationsSeed);

  const myNotifications = useMemo(
    () =>
      allNotifications
        .filter((n) => n.scope === 'teacher' && (!n.targetId || n.targetId === teacherId))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [allNotifications, teacherId],
  );

  const unreadCount = myNotifications.filter((n) => !n.read).length;

  const CATEGORY_ICONS: Record<string, string> = {
    Système: 'info',
    Planning: 'calendar_month',
    Présence: 'fact_check',
    Paiement: 'account_balance_wallet',
    Formation: 'menu_book',
    Message: 'chat',
    Rémunération: 'payments',
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
            onClick={() => markAllNotificationsRead('teacher')}
            className="rounded-lg border border-amud-primary px-md py-sm text-label-md font-medium text-amud-primary transition-colors hover:bg-amud-primary/10"
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
                className={`flex w-full items-start gap-md rounded-xl border p-md text-left transition-all hover:border-amud-primary hover:shadow-sm ${
                  n.read ? 'border-amud-outline-variant bg-amud-surface-container-lowest opacity-70' : 'border-amud-primary/30 bg-amud-primary/5'
                }`}
              >
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${n.read ? 'bg-amud-surface-container-high' : 'bg-amud-primary'}`}>
                  <span className={`material-symbols-outlined text-[20px] ${n.read ? 'text-amud-on-surface-variant' : 'text-white'}`}>{icon}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-sm">
                    <p className={`text-body-md ${n.read ? 'text-amud-on-surface-variant' : 'font-semibold text-amud-on-surface'}`}>{n.title}</p>
                    {!n.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-amud-primary" />}
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
