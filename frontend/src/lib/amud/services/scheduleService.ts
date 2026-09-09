/** Voir `storageService.ts` pour le principe de cette couche. */
export {
  centerSchedulesCollection as schedulesCollection,
  loadLocalCenterSchedules as loadSchedules,
  addLocalCenterSchedule as addSchedule,
  updateLocalCenterSchedule as updateSchedule,
  removeLocalCenterSchedule as removeSchedule,
} from '../localCenterSchedules';
export { findScheduleConflicts, type ScheduleConflict } from '../centerScheduleConflicts';
