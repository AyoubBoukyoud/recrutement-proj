/** Réexport fin — voir `centerTypes.ts` (types) et `centerDemoFactory.ts` (génération). */
export type { CenterGroup, GroupStatus } from './centerTypes';
export { GROUP_STATUSES } from './centerTypes';
import { CENTER_DEMO } from './centerDemoFactory';
export const centerGroupsSeed = CENTER_DEMO.groups;
