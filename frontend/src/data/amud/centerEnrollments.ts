/** Réexport fin — voir `centerTypes.ts` (types) et `centerDemoFactory.ts` (génération). */
export type { CenterEnrollment, EnrollmentStatus } from './centerTypes';
import { CENTER_DEMO } from './centerDemoFactory';
export const centerEnrollmentsSeed = CENTER_DEMO.enrollments;
