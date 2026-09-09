/**
 * Voir `storageService.ts` pour le principe de cette couche. Deux flux
 * distincts, tous les deux réellement écrits (cahier des charges §17/§20) :
 * `logCenterActivity` pour le feed typé (`amud_center_activities`, les 13
 * événements métier), `logAudit` pour la trace de conformité libre + diff
 * (`amud_audit_logs`, partagée avec le reste du module `/amud`, filtrable
 * par `centerId` — c'est elle qui sert de `amud_center_audit_logs`).
 */
export { logCenterActivity, centerActivitiesCollection } from '../localCenterActivities';
export { logAudit, auditLogs } from '../storage/audit';
export type { CenterActivityType, CenterActivity } from '@/data/amud/centerActivities';
