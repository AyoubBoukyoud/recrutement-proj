'use client';

import { useCurrentCenter } from './currentCentre';
import { canPerform, type CenterAction } from './centerPermissions';

/**
 * Combine "quel centre/rôle je simule" (`useCurrentCenter`) et la matrice de
 * permissions (`canPerform`) en un seul hook, pour que chaque page
 * `/amud/centre/*` n'ait qu'une ligne à écrire pour savoir si l'action
 * qu'elle propose (bouton "Ajouter", sauvegarde d'un formulaire…) est
 * réellement autorisée pour le rôle actuellement simulé.
 */
export function useCenterAccess(action: CenterAction) {
  const { centerId, role } = useCurrentCenter();
  return { centerId, role, allowed: canPerform(role, action) };
}
