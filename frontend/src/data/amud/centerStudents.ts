/** Réexport fin — voir `centerTypes.ts` (types) et `centerDemoFactory.ts` (génération). */
export type { CenterStudent, StudentStatus, GermanLevel } from './centerTypes';
export { STUDENT_STATUSES, GERMAN_LEVELS } from './centerTypes';
import { CENTER_DEMO } from './centerDemoFactory';
export const centerStudentsSeed = CENTER_DEMO.students;
