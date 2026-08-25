'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useDropdown } from '@/components/amud/ui';
import { notificationsSeed, type NotificationScope } from '@/data/amud/notifications';
import { notifications as notificationsCollection, markAllNotificationsRead, markNotificationRead } from '@/lib/amud/storage/notify';
import { useCollection } from '@/lib/amud/storage/useCollection';

/**
 * Cloche de notifications — remplace le bloc identique (bouton + badge +
 * dropdown + "tout marquer comme lu") réimplémenté à la main dans chaque
 * coquille (`AdminShell`, `CommercialShell`, `CompanyShell`, `EmployerShell`,
 * `CentreShell`, `StudentShell`, `TeacherShell`). Chaque rôle ne fournit que
 * son `scope` ; les données réelles viennent toujours de
 * `lib/amud/storage/notify.ts`.
 */
export function NotificationCenter({
  scope,
  targetId,
  buttonClassName,
  viewAllHref,
}: {
  scope: NotificationScope;
  /** Filtre additionnel — ne garde que les notifications sans cible ou ciblant cet id (ex. l'étudiant/enseignant actuellement simulé). */
  targetId?: string;
  buttonClassName?: string;
  /** Lien optionnel "Voir toutes les notifications" en pied de dropdown, quand le rôle a une page dédiée. */
  viewAllHref?: string;
}) {
  const router = useRouter();
  const { open, setOpen, ref } = useDropdown<HTMLDivElement>();
  const [all] = useCollection(notificationsCollection, notificationsSeed);
  const items = useMemo(
    () =>
      all
        .filter((n) => n.scope === scope && (!targetId || !n.targetId || n.targetId === targetId))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [all, scope, targetId],
  );
  const unread = items.filter((n) => !n.read).length;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={
          buttonClassName ??
          'relative rounded-full p-2 text-amud-on-surface-variant transition-colors hover:bg-amud-surface-container-high hover:text-amud-primary'
        }
        aria-label="Notifications"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className="material-symbols-outlined">notifications</span>
        {unread > 0 ? (
          <span className="absolute right-1 top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-amud-secondary px-1 text-[10px] font-bold text-white">
            {unread}
          </span>
        ) : null}
      </button>
      {open ? (
        <div className="absolute right-0 top-full z-40 mt-2 w-80 overflow-hidden rounded-lg border border-amud-outline-variant bg-amud-surface shadow-xl animate-amud-fade-in">
          <div className="flex items-center justify-between border-b border-amud-outline-variant bg-amud-surface-container-low px-md py-sm text-label-md font-semibold text-amud-on-surface">
            <span>Notifications</span>
            {unread > 0 ? (
              <button type="button" onClick={() => markAllNotificationsRead(scope)} className="text-label-sm font-normal text-amud-primary hover:underline">
                Tout marquer comme lu
              </button>
            ) : null}
          </div>
          <div className="flex max-h-96 flex-col overflow-y-auto">
            {items.length === 0 ? (
              <p className="px-md py-lg text-center text-label-sm text-amud-on-surface-variant">Aucune notification.</p>
            ) : (
              items.slice(0, 10).map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => {
                    markNotificationRead(n.id);
                    setOpen(false);
                    if (n.href) router.push(n.href);
                  }}
                  className={`flex w-full items-start gap-sm px-md py-sm text-left transition-colors hover:bg-amud-surface-container-low ${n.read ? 'opacity-60' : ''}`}
                >
                  <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.read ? 'bg-amud-outline-variant' : 'bg-amud-secondary'}`} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-body-md text-amud-on-surface">{n.title}</span>
                    <span className="block text-label-sm text-amud-on-surface-variant">{n.category}</span>
                  </span>
                </button>
              ))
            )}
          </div>
          {viewAllHref ? (
            <Link
              href={viewAllHref}
              onClick={() => setOpen(false)}
              className="block border-t border-amud-outline-variant px-md py-sm text-center text-label-sm font-medium text-amud-primary hover:underline"
            >
              Voir toutes les notifications
            </Link>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
