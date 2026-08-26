// Où atterrit chaque rôle après connexion — partagé entre la redirection de
// racine (session déjà ouverte) et l'écran OTP (session qui vient de s'ouvrir),
// pour que les deux ne divergent jamais.
//
// Recruteur et agent vivent dans cette même application, sous /recruiter et
// /agent — middleware.ts est ce qui les protège par rôle. Le back-office
// administrateur (/admin) a été retiré : ce rôle n'a plus de destination
// dédiée pour l'instant.

import type { UserRole } from './types';

export function destinationForRole(role: UserRole, incompleteProfileStep: number | null): string {
  switch (role) {
    case 'candidate':
      return incompleteProfileStep ? `/profile-creation?step=${incompleteProfileStep}` : '/dashboard';
    case 'employer':
      return '/recruiter';
    case 'admin':
      return '/';
    case 'agent':
      return '/agent';
  }
}
