/**
 * Voir `storageService.ts` pour le principe de cette couche. Regroupe aussi
 * les inscriptions (`amud_enrollments`) — le cahier des charges (§18) ne
 * liste pas de service dédié pour cette collection, et un rattachement
 * étudiant↔groupe n'a de sens que par rapport à un groupe.
 */
export {
  centerGroupsCollection as groupsCollection,
  loadLocalCenterGroups as loadGroups,
  addLocalCenterGroup as addGroup,
  updateLocalCenterGroup as updateGroup,
  removeLocalCenterGroup as removeGroup,
} from '../localCenterGroups';
export {
  centerEnrollmentsCollection as enrollmentsCollection,
  loadLocalCenterEnrollments as loadEnrollments,
  addLocalCenterEnrollment as addEnrollment,
  updateLocalCenterEnrollment as updateEnrollment,
  removeLocalCenterEnrollment as removeEnrollment,
  activeStudentIdsForGroup,
} from '../localCenterEnrollments';
