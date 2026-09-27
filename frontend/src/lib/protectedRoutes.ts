/*
 * Les chemins qui exigent une session. Partagés entre `proxy.ts` (qui refuse
 * la requête côté serveur d'après le cookie de rôle) et `AuthContext` (qui
 * répare côté client une session à moitié présente — cookie sans jeton).
 * Le `matcher` de `proxy.ts` doit rester un littéral statique : il recopie
 * cette liste, et toute route ajoutée ici doit l'être là-bas aussi.
 */
export const CANDIDATE_PATHS = [
  '/dashboard',
  '/matching-preferences',
  '/documents',
  '/video',
  '/test-langue',
  '/reclamation',
  '/faq',
  '/profil',
  '/profile-creation',
  '/lecon-jour',
  '/taches',
  '/offres',
  '/quiz-metier',
  '/visibilite',
  '/salaire',
  '/parrainage',
  '/verification-identite',
  '/candidatures',
  '/favoris',
  '/notifications',
  '/compte',
  '/messages',
] as const;

const STAFF_PREFIXES = ['/recruiter', '/agent', '/admin'] as const;

const matches = (pathname: string, path: string) => pathname === path || pathname.startsWith(`${path}/`);

export function isCandidatePath(pathname: string): boolean {
  return CANDIDATE_PATHS.some((path) => matches(pathname, path));
}

export function isProtectedPath(pathname: string): boolean {
  return isCandidatePath(pathname) || STAFF_PREFIXES.some((path) => matches(pathname, path));
}
