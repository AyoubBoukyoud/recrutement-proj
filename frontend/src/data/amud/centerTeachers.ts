/** Réexport fin — voir `centerTypes.ts` (types) et `centerDemoFactory.ts` (génération). */
export type { CenterTeacher, ContractType, TeacherStatus } from './centerTypes';
export { CONTRACT_TYPES } from './centerTypes';
import { CENTER_DEMO } from './centerDemoFactory';
export const centerTeachersSeed = CENTER_DEMO.teachers;
