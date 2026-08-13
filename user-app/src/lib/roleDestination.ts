// Où atterrit chaque rôle après connexion — partagé entre la redirection de
// racine (session déjà ouverte) et l'écran OTP (session qui vient de s'ouvrir),
// pour que les deux ne divergent jamais.
//
// Cette application ne sert plus que les candidats : les espaces recruteur,
// administrateur et agent vivent dans web-admin, une application à part. Un
// compte non candidat n'a donc pas de page ici, il a une autre adresse — d'où
// une destination qui n'est pas toujours un chemin interne.

import type { UserRole } from './types';

/** La console ops (web-admin). Le port 5173 est celui du service Vite. */
export const OPS_CONSOLE_URL = (
  process.env.NEXT_PUBLIC_OPS_URL ?? 'http://localhost:5173'
).replace(/\/+$/, '');

/**
 * Une destination interne se parcourt avec le routeur Next ; une destination
 * externe change d'application et demande une vraie navigation. Les deux cas
 * sont distingués dans le type pour qu'aucun appelant ne puisse passer une URL
 * absolue à `router.replace()`, qui la traiterait comme un chemin.
 */
export type Destination =
  | { kind: 'internal'; path: string }
  | { kind: 'external'; url: string };

export function destinationForRole(
  role: UserRole,
  incompleteProfileStep: number | null
): Destination {
  if (role === 'candidate') {
    return {
      kind: 'internal',
      path: incompleteProfileStep ? `/profile-creation?step=${incompleteProfileStep}` : '/dashboard',
    };
  }

  return { kind: 'external', url: OPS_CONSOLE_URL };
}

/** Emmène l'appelant à destination, quel que soit son genre. */
export function navigateTo(
  destination: Destination,
  replace: (path: string) => void
): void {
  if (destination.kind === 'internal') {
    replace(destination.path);
  } else {
    window.location.assign(destination.url);
  }
}
