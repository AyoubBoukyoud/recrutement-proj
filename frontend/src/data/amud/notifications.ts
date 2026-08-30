/**
 * Notifications réelles (lu/non-lu, persistées), alimentées par
 * `lib/amud/storage/notify.ts`. Remplace les tableaux statiques
 * `*_ALERTS` de `alerts.ts` (comptes fixes, jamais recalculés, aucun
 * lu/non-lu) — la cloche de chaque Shell filtre cette collection par `scope`.
 */
export type NotificationScope = 'admin' | 'commercial' | 'employer' | 'centre' | 'student' | 'teacher' | 'candidate';

export type Notification = {
  id: string;
  scope: NotificationScope;
  /** Identifiant optionnel pour cibler un étudiant ou enseignant spécifique */
  targetId?: string;
  title: string;
  category: string;
  href?: string;
  read: boolean;
  createdAt: string;
};

/** Notifications de démarrage, une par espace, pour que la cloche ne soit jamais vide au premier chargement. */
export const notificationsSeed: Notification[] = [
  { id: 'notif_seed_admin', scope: 'admin', title: 'Bienvenue dans la console Amud Skills.', category: 'Système', href: '/amud/admin', read: false, createdAt: new Date().toISOString() },
  { id: 'notif_seed_commercial', scope: 'commercial', title: 'Votre espace commercial est prêt.', category: 'Système', href: '/amud/commercial', read: true, createdAt: '2026-08-18T08:00:00.000Z' },
  { id: 'notif_commercial_candidat_1', scope: 'commercial', title: 'Sophie Martin vous a été affectée comme candidate à suivre.', category: 'Candidat', href: '/amud/commercial/candidats/candidate_sophiem', read: true, createdAt: '2026-08-19T09:12:00.000Z' },
  { id: 'notif_commercial_rappel_1', scope: 'commercial', title: 'Rappel à effectuer : Karim Bennani.', category: 'Rappel', href: '/amud/commercial/candidats/candidate_karimb', read: false, createdAt: '2026-08-24T10:00:00.000Z' },
  { id: 'notif_commercial_rdv_1', scope: 'commercial', title: 'Rendez-vous à venir avec TechCorp SA le 22/08/2026.', category: 'Rendez-vous', href: '/amud/commercial/entreprises/1', read: false, createdAt: '2026-08-21T09:00:00.000Z' },
  { id: 'notif_commercial_objectif_1', scope: 'commercial', title: 'Objectif quotidien d’appels atteint à 80 %.', category: 'Objectif', href: '/amud/commercial/performance', read: false, createdAt: '2026-08-24T18:00:00.000Z' },
  { id: 'notif_commercial_objectif_2', scope: 'commercial', title: 'Objectif mensuel en retard : pensez à relancer vos contacts.', category: 'Objectif', href: '/amud/commercial/performance', read: true, createdAt: '2026-08-20T08:30:00.000Z' },
  { id: 'notif_commercial_centre_1', scope: 'commercial', title: 'Un nouveau centre partenaire vous a été affecté.', category: 'Système', href: '/amud/commercial/centres', read: true, createdAt: '2026-08-17T14:00:00.000Z' },
  { id: 'notif_seed_employer', scope: 'employer', title: 'Bienvenue sur votre espace entreprise.', category: 'System', href: '/amud/entreprise/dashboard', read: false, createdAt: new Date().toISOString() },
  { id: 'notif_seed_centre', scope: 'centre', title: 'Bienvenue dans votre espace centre de formation.', category: 'Système', href: '/amud/centre/dashboard', read: false, createdAt: new Date().toISOString() },
  { id: 'notif_seed_student', scope: 'student', title: 'Bienvenue dans votre espace étudiant Amud Skills.', category: 'Système', href: '/amud/student/dashboard', read: false, createdAt: new Date().toISOString() },
  { id: 'notif_seed_teacher', scope: 'teacher', title: 'Bienvenue dans votre espace enseignant Amud Skills.', category: 'Système', href: '/amud/teacher/dashboard', read: false, createdAt: new Date().toISOString() },
];

/** Catégories utilisées par l'espace entreprise (`/amud/entreprise/notifications`) — `category` reste une chaîne libre pour les autres espaces (ex. « Appel », « Système » côté commercial/admin). */
export const NOTIF_CATEGORIES = ['Applications', 'Interviews', 'Messages', 'Offers', 'System'] as const;
export type NotifCategory = (typeof NOTIF_CATEGORIES)[number];
