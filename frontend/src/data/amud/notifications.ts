/**
 * Notifications réelles (lu/non-lu, persistées), alimentées par
 * `lib/amud/storage/notify.ts`. Remplace les tableaux statiques
 * `*_ALERTS` de `alerts.ts` (comptes fixes, jamais recalculés, aucun
 * lu/non-lu) — la cloche de chaque Shell filtre cette collection par `scope`.
 */
export type NotificationScope = 'admin' | 'commercial' | 'employer';

export type Notification = {
  id: string;
  scope: NotificationScope;
  title: string;
  category: string;
  href?: string;
  read: boolean;
  createdAt: string;
};

/** Notifications de démarrage, une par espace, pour que la cloche ne soit jamais vide au premier chargement. */
export const notificationsSeed: Notification[] = [
  { id: 'notif_seed_admin', scope: 'admin', title: 'Bienvenue dans la console Amud Skills.', category: 'Système', href: '/amud/admin', read: false, createdAt: new Date().toISOString() },
  { id: 'notif_seed_commercial', scope: 'commercial', title: 'Votre espace commercial est prêt.', category: 'Système', href: '/amud/commercial', read: false, createdAt: new Date().toISOString() },
  { id: 'notif_seed_employer', scope: 'employer', title: 'Bienvenue sur votre espace entreprise.', category: 'System', href: '/amud/entreprise/dashboard', read: false, createdAt: new Date().toISOString() },
];

/** Catégories utilisées par l'espace entreprise (`/amud/entreprise/notifications`) — `category` reste une chaîne libre pour les autres espaces (ex. « Appel », « Système » côté commercial/admin). */
export const NOTIF_CATEGORIES = ['Applications', 'Interviews', 'Messages', 'Offers', 'System'] as const;
export type NotifCategory = (typeof NOTIF_CATEGORIES)[number];
