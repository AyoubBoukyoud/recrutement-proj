/** Réexport fin — voir `centerTypes.ts` (types) et `centerDemoFactory.ts` (génération). */
export type { CenterFormation, FormationStatus } from './centerTypes';
export { FORMATION_STATUSES } from './centerTypes';
import { CENTER_DEMO } from './centerDemoFactory';
export const centerFormationsSeed = CENTER_DEMO.formations;
