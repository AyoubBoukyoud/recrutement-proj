/** Réexport fin — voir `centerTypes.ts` (types) et `centerDemoFactory.ts` (génération). */
export type { CenterLead, LeadStatus } from './centerTypes';
export { LEAD_STATUSES, LEAD_STATUS_LABELS } from './centerTypes';
import { CENTER_DEMO } from './centerDemoFactory';
export const centerLeadsSeed = CENTER_DEMO.leads;
