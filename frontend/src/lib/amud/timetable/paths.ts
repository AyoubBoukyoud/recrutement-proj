export function isTimetablePath(path: string): boolean {
  return path === '/amud/centre/planning' || path === '/amud/centre/salles';
}

/** Centre pages backed by the Laravel API. In the browser demo they keep their prototype version. */
export const CONNECTED_CENTRE_PATHS = ['/amud/centre/dashboard', '/amud/centre/etudiants', '/amud/centre/groupes', '/amud/centre/formations', '/amud/centre/enseignants', '/amud/centre/paiements-etudiants'];

/** Where unfinished centre modules are shown as "Bientôt disponible" without a presentation grant. */
export const UPCOMING_CENTRE_BASE = '/amud/centre/a-venir';

/** Centre modules that still run on fictional browser data. Longest paths first. */
export const UPCOMING_CENTRE_PAGES = [
  { slug: 'site-themes', path: '/amud/centre/site/themes', title: 'Thèmes du site', description: 'Choisir et personnaliser l’apparence du site public de votre centre.' },
  { slug: 'presences', path: '/amud/centre/presences', title: 'Présences', description: 'Feuilles d’appel par cours et suivi de l’assiduité des étudiants.' },
  { slug: 'remuneration', path: '/amud/centre/remuneration', title: 'Rémunération', description: 'Heures effectuées et paiements des enseignants.' },
  { slug: 'tarifs', path: '/amud/centre/tarifs', title: 'Tarifs', description: 'Grille tarifaire et offres de votre centre.' },
  { slug: 'leads', path: '/amud/centre/leads', title: 'Leads', description: 'Suivi des prospects et des demandes d’inscription.' },
  { slug: 'site', path: '/amud/centre/site', title: 'Site public', description: 'Page publique de présentation de votre centre.' },
  { slug: 'statistiques', path: '/amud/centre/statistiques', title: 'Statistiques', description: 'Indicateurs d’activité, de fréquentation et de revenus.' },
  { slug: 'profil', path: '/amud/centre/profil', title: 'Profil du centre', description: 'Coordonnées, présentation et informations légales du centre.' },
  { slug: 'parametres', path: '/amud/centre/parametres', title: 'Paramètres', description: 'Préférences et réglages de votre espace centre.' },
] as const;

export type UpcomingCentrePage = (typeof UPCOMING_CENTRE_PAGES)[number];

export function upcomingCentrePage(path: string): UpcomingCentrePage | undefined {
  return UPCOMING_CENTRE_PAGES.find((page) => path === page.path || path.startsWith(`${page.path}/`));
}

export function isConnectedPath(path: string, demo: boolean): boolean {
  return isTimetablePath(path) || path.startsWith(`${UPCOMING_CENTRE_BASE}/`) || (!demo && CONNECTED_CENTRE_PATHS.includes(path));
}
