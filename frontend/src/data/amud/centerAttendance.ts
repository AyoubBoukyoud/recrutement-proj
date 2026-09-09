/** Réexport fin — voir `centerTypes.ts` (types) et `centerDemoFactory.ts` (génération). */
export type { CenterAttendanceRecord, AttendanceStatus } from './centerTypes';
export { ATTENDANCE_LABELS, ATTENDANCE_CLASS } from './centerTypes';
import { CENTER_DEMO } from './centerDemoFactory';
export const centerAttendanceSeed = CENTER_DEMO.attendance;
