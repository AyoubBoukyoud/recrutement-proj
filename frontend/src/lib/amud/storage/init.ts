'use client';

import { AMUD_KEYS } from './keys';
import { createCollection, type Entity } from './collection';

import { entreprisesSeed } from '@/data/amud/entreprises';
import { offresSeed } from '@/data/amud/offres';
import { commerciaux } from '@/data/amud/commerciaux';
import { utilisateursSeed } from '@/data/amud/utilisateurs';
import { applicationsSeed } from '@/data/amud/applications';
import { activitesSeed } from '@/data/amud/commercialActivites';
import { tachesSeed } from '@/data/amud/commercialTaches';
import { buildSeedRdvs } from '@/data/amud/commercialRdv';
import { contactsEntrepriseSeed } from '@/data/amud/commercialContacts';
import { mesContactsSeed } from '@/data/amud/mesContacts';
import { recruitersSeed } from '@/data/amud/recruiters';
import { candidatesSeed } from '@/data/amud/candidates';
import { callTicketsSeed } from '@/data/amud/callTickets';
import { followupsSeed } from '@/data/amud/followups';
import { notificationsSeed } from '@/data/amud/notifications';
import { auditLogSeed } from '@/data/amud/auditLog';
import { objectivesSeed } from '@/data/amud/objectives';
import { interviewsSeed } from '@/data/amud/interviews';
import { interviewFeedbackSeed } from '@/data/amud/interviewFeedback';
import { favoritesSeed } from '@/data/amud/favorites';
import { conversationsSeed } from '@/data/amud/conversations';
import { candidateNotesSeed } from '@/data/amud/candidateNotes';
import { centresSeed } from '@/data/amud/centres';
import { centerStudentsSeed } from '@/data/amud/centerStudents';
import { centerTeachersSeed } from '@/data/amud/centerTeachers';
import { centerFormationsSeed } from '@/data/amud/centerFormations';
import { centerGroupsSeed } from '@/data/amud/centerGroups';
import { centerSchedulesSeed } from '@/data/amud/centerSchedules';
import { centerAttendanceSeed } from '@/data/amud/centerAttendance';
import { centerStudentPaymentsSeed } from '@/data/amud/centerStudentPayments';
import { centerTeacherPaymentsSeed } from '@/data/amud/centerTeacherPayments';
import { centerTarifsSeed } from '@/data/amud/centerTarifs';
import { centerLeadsSeed } from '@/data/amud/centerLeads';
import { centerModificationRequestsSeed } from '@/data/amud/centerModificationRequests';
import { centerStudentResultsSeed } from '@/data/amud/centerStudentResults';
import { teacherResourcesSeed } from '@/data/amud/teacherResources';

/**
 * Initialise chaque collection manquante avec un jeu de données de
 * démonstration réaliste (cahier des charges §4). Idempotent : une clé déjà
 * présente en localStorage n'est jamais réécrite — seul un "Réinitialiser
 * les données de démonstration" explicite (Paramètres, phase 8) vide les
 * clés avant de rappeler cette fonction.
 */
function hasKey(key: string): boolean {
  if (typeof window === 'undefined') return true;
  return window.localStorage.getItem(key) !== null;
}

function seedIfMissing<T extends Entity>(key: string, seedFn: () => T[]) {
  if (typeof window === 'undefined' || hasKey(key)) return;
  createCollection<T>(key).replace(seedFn());
}

let initialized = false;

export function initAmudDemoData() {
  if (typeof window === 'undefined' || initialized) return;
  initialized = true;

  seedIfMissing(AMUD_KEYS.companies, () => entreprisesSeed);
  seedIfMissing(AMUD_KEYS.offers, () => offresSeed);
  seedIfMissing(AMUD_KEYS.commercials, () => commerciaux);
  seedIfMissing(AMUD_KEYS.users, () => utilisateursSeed);
  seedIfMissing(AMUD_KEYS.applications, () => applicationsSeed);
  seedIfMissing(AMUD_KEYS.activities, () => activitesSeed);
  seedIfMissing(AMUD_KEYS.tasks, () => tachesSeed);
  seedIfMissing(AMUD_KEYS.appointments, () => buildSeedRdvs());
  seedIfMissing(AMUD_KEYS.companyContacts, () => contactsEntrepriseSeed);
  seedIfMissing(AMUD_KEYS.recruiters, () => recruitersSeed);
  seedIfMissing(AMUD_KEYS.candidates, () => candidatesSeed);
  seedIfMissing(AMUD_KEYS.callTickets, () => callTicketsSeed);
  seedIfMissing(AMUD_KEYS.followups, () => followupsSeed);
  seedIfMissing(AMUD_KEYS.notifications, () => notificationsSeed);
  seedIfMissing(AMUD_KEYS.auditLogs, () => auditLogSeed);
  seedIfMissing(AMUD_KEYS.objectives, () => objectivesSeed);
  seedIfMissing(AMUD_KEYS.contacts, () => mesContactsSeed);
  seedIfMissing(AMUD_KEYS.interviews, () => interviewsSeed);
  seedIfMissing(AMUD_KEYS.interviewFeedback, () => interviewFeedbackSeed);
  seedIfMissing(AMUD_KEYS.favorites, () => favoritesSeed);
  seedIfMissing(AMUD_KEYS.conversations, () => conversationsSeed);
  seedIfMissing(AMUD_KEYS.candidateNotes, () => candidateNotesSeed);
  seedIfMissing(AMUD_KEYS.centres, () => centresSeed);
  seedIfMissing(AMUD_KEYS.centerStudents, () => centerStudentsSeed);
  seedIfMissing(AMUD_KEYS.centerTeachers, () => centerTeachersSeed);
  seedIfMissing(AMUD_KEYS.centerFormations, () => centerFormationsSeed);
  seedIfMissing(AMUD_KEYS.centerGroups, () => centerGroupsSeed);
  seedIfMissing(AMUD_KEYS.centerSchedules, () => centerSchedulesSeed);
  seedIfMissing(AMUD_KEYS.centerAttendance, () => centerAttendanceSeed);
  seedIfMissing(AMUD_KEYS.centerStudentPayments, () => centerStudentPaymentsSeed);
  seedIfMissing(AMUD_KEYS.centerTeacherPayments, () => centerTeacherPaymentsSeed);
  seedIfMissing(AMUD_KEYS.centerTarifs, () => centerTarifsSeed);
  seedIfMissing(AMUD_KEYS.centerLeads, () => centerLeadsSeed);
  seedIfMissing(AMUD_KEYS.centerModificationRequests, () => centerModificationRequestsSeed);
  seedIfMissing(AMUD_KEYS.studentResults, () => centerStudentResultsSeed);
  seedIfMissing(AMUD_KEYS.teacherResources, () => teacherResourcesSeed);
}

/**
 * Réinitialisation explicite des données de démonstration (cahier des
 * charges §29) : vide toutes les clés `AMUD_KEYS` puis relance
 * `initAmudDemoData()`, qui reseed tout puisque `hasKey()` ne trouve plus
 * rien. Chaque `replace()` émet son événement de changement, donc toute
 * page montée via `useCollection` se met à jour sans refresh manuel.
 * N'est jamais appelée automatiquement — seulement depuis un bouton avec
 * confirmation (Paramètres admin).
 */
export function resetAmudDemoData() {
  if (typeof window === 'undefined') return;
  for (const key of Object.values(AMUD_KEYS)) {
    window.localStorage.removeItem(key);
  }
  initialized = false;
  initAmudDemoData();
}
