/** Réexport fin — voir `centerTypes.ts` (types) et `centerDemoFactory.ts` (génération). */
export type { CenterStudentPayment, PaymentMode, PaymentStatus } from './centerTypes';
export { PAYMENT_MODES, PAYMENT_STATUS_LABELS, PAYMENT_STATUS_CLASS } from './centerTypes';
import { CENTER_DEMO } from './centerDemoFactory';
export const centerStudentPaymentsSeed = CENTER_DEMO.studentPayments;
