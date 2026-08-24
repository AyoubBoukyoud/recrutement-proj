'use client';

import { createCollection } from './collection';
import { AMUD_KEYS } from './keys';
import { generateId } from './ids';
import type { Notification, NotificationScope } from '@/data/amud/notifications';

const notifications = createCollection<Notification>(AMUD_KEYS.notifications);

/** Pousse une notification réelle (cahier des charges §27), lue par la cloche du Shell concerné (filtrée par `scope`). */
export function pushNotification(input: { scope: NotificationScope; targetId?: string; title: string; category: string; href?: string }): Notification {
  const notif: Notification = {
    id: generateId('notif'),
    scope: input.scope,
    targetId: input.targetId,
    title: input.title,
    category: input.category,
    href: input.href,
    read: false,
    createdAt: new Date().toISOString(),
  };
  notifications.add(notif);
  return notif;
}


export function markNotificationRead(id: string) {
  notifications.update(id, { read: true });
}

export function markAllNotificationsRead(scope: NotificationScope) {
  const all = notifications.getAll();
  const next = all.map((n) => (n.scope === scope && !n.read ? { ...n, read: true } : n));
  notifications.replace(next);
}

export function removeNotification(id: string) {
  notifications.remove(id);
}

export { notifications };
