'use client';

import { initAmudDemoData } from './init';

/**
 * Effet de bord au niveau module : l'évaluation d'un module ES n'a lieu
 * qu'une seule fois (cache des modules), avant tout rendu React — donc avant
 * l'effet de n'importe quel composant, y compris un Shell parent. Aucun des
 * 3 espaces (`/amud/admin`, `/amud/commercial`, `/amud/employer`) n'a de
 * layout racine commun pour porter un Provider ; importer ce module (fait
 * par `useCollection.ts`) suffit à garantir que les données démo existent
 * avant la première lecture d'une collection, sans dépendre de l'ordre des
 * `useEffect` parent/enfant.
 */
if (typeof window !== 'undefined') {
  initAmudDemoData();
}
