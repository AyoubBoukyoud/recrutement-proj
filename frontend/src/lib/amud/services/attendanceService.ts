/** Voir `storageService.ts` pour le principe de cette couche. */
export {
  centerAttendanceCollection as attendanceCollection,
  loadLocalCenterAttendance as loadAttendance,
  addLocalCenterAttendance as recordAttendance,
  updateLocalCenterAttendance as updateAttendance,
  removeLocalCenterAttendance as removeAttendance,
} from '../localCenterAttendance';
export { computeAttendanceRates } from '../centerCalculations';
