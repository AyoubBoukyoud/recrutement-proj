/** Voir `storageService.ts` pour le principe de cette couche. Couvre les paiements étudiants ET la rémunération enseignants (cahier des charges §11/§12) — deux flux financiers du même service, comme leurs routes `/paiements-etudiants` et `/remuneration` partagent déjà `computeCenterStats`. */
export {
  centerStudentPaymentsCollection as studentPaymentsCollection,
  loadLocalCenterStudentPayments as loadStudentPayments,
  addLocalCenterStudentPayment as recordStudentPayment,
  updateLocalCenterStudentPayment as updateStudentPayment,
  removeLocalCenterStudentPayment as removeStudentPayment,
} from '../localCenterStudentPayments';
export {
  centerTeacherPaymentsCollection as teacherPaymentsCollection,
  loadLocalCenterTeacherPayments as loadTeacherPayments,
  addLocalCenterTeacherPayment as recordTeacherPayment,
  updateLocalCenterTeacherPayment as updateTeacherPayment,
  removeLocalCenterTeacherPayment as removeTeacherPayment,
} from '../localCenterTeacherPayments';
export { centerTeacherHoursCollection as teacherHoursCollection, loadLocalCenterTeacherHours as loadTeacherHoursHistory, addLocalCenterTeacherHoursRecord as recordTeacherHoursSnapshot } from '../localCenterTeacherHours';
export { computePaymentStatus, computeTeacherHours, computeTeacherRemuneration } from '../centerCalculations';
