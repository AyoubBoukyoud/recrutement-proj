/** Réexport fin — voir `centerTypes.ts` (types). Pas de génération dans `centerDemoFactory.ts` : le feed d'activité démarre vide et se peuple au fil des actions, comme dans un centre qui vient d'ouvrir. */
export type { CenterActivity, CenterActivityType } from './centerTypes';
export const centerActivitiesSeed: import('./centerTypes').CenterActivity[] = [];
