'use client';

// Adaptateur vers l'AuthContext réel de l'application : les écrans portés
// depuis web-admin attendaient `{ user: { phone, roles }, logout }` d'un
// contexte d'authentification qui leur était propre. Plutôt que de faire
// vivre deux sources de vérité pour la session, ils lisent ici la même
// connexion (téléphone + code) que le reste du site.

import { useAuth as useAppAuth } from '@/context/AuthContext';

export function useAuth() {
  const { user, logout } = useAppAuth();

  return {
    user: user ? { id: user.id, phone: user.phone ?? '', roles: user.roles ?? [] } : null,
    logout,
  };
}
