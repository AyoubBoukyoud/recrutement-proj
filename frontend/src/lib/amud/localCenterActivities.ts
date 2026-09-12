'use client';

import { createCollection } from './storage/collection';
import { AMUD_KEYS } from './storage/keys';
import { generateId } from './storage/ids';
import type { CenterActivity, CenterActivityType } from '@/data/amud/centerActivities';

const collection = createCollection<CenterActivity>(AMUD_KEYS.centerActivities);

/**
 * Écrit un événement typé du feed d'activité (`amud_center_activities`,
 * cahier des charges §20) — complémentaire à `logAudit`/`amud_audit_logs`,
 * pas un doublon : l'audit log garde la trace libre + diff pour la
 * conformité (tous types d'opérations, y compris suppressions), ce feed ne
 * garde que les 13 événements métier typés (`CenterActivityType`), pensé
 * pour être filtré/compté sans correspondance de texte — un tableau de bord
 * "12 étudiants inscrits ce mois-ci" n'a pas à parser des chaînes libres.
 */
export function logCenterActivity(input: { centerId: string; type: CenterActivityType; message: string; utilisateur: string; role: string }): CenterActivity {
  const entry: CenterActivity = {
    id: generateId('activity'),
    centerId: input.centerId,
    type: input.type,
    message: input.message,
    utilisateur: input.utilisateur,
    role: input.role,
    createdAt: new Date().toISOString(),
  };
  collection.add(entry);
  return entry;
}

export { collection as centerActivitiesCollection };
