/** Réexport fin — voir `centerTypes.ts` (types) et `centerDemoFactory.ts` (génération). */
export type { CenterModificationRequest, ModificationRequestStatus } from './centerTypes';
export { MODIFICATION_REQUEST_LABELS } from './centerTypes';
import { CENTER_DEMO } from './centerDemoFactory';
export const centerModificationRequestsSeed = CENTER_DEMO.modificationRequests;
