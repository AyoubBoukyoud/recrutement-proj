'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useProfile } from '@/context/ProfileContext';
import { destinationForRole, navigateTo } from '@/lib/roleDestination';

/**
 * `/` sert deux publics : un visiteur non connecté y trouve la page d'accueil
 * publique, une session déjà ouverte est renvoyée vers son espace.
 *
 * La redirection est faite ici, dans un composant client minuscule, plutôt que
 * dans la page elle-même : la session vit dans le stockage local, donc le
 * serveur ne peut pas la connaître, et rendre la page publique côté serveur
 * garde le contenu indexable et l'affichage immédiat pour le visiteur — qui est
 * le cas de très loin le plus fréquent sur cette URL.
 */
export function SessionRedirect() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const { isHydrated, getIncompleteStep } = useProfile();

  useEffect(() => {
    if (isLoading || !isHydrated || !user) return;
    navigateTo(destinationForRole(user.role, getIncompleteStep()), router.replace);
  }, [user, isLoading, isHydrated, router, getIncompleteStep]);

  return null;
}
