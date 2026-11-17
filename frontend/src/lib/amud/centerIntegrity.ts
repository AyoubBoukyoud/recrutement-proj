'use client';

import { createCollection, type Entity } from './storage/collection';
import { AMUD_KEYS } from './storage/keys';
import { loadLocalCentres, removeLocalCentre } from './localCentres';
import { loadLocalCenterEnrollments } from './localCenterEnrollments';
import { loadLocalCenterStudentPayments } from './localCenterStudentPayments';
import { loadLocalCenterAttendance } from './localCenterAttendance';
import { loadLocalCenterGroups } from './localCenterGroups';
import { loadLocalCenterSchedules } from './localCenterSchedules';
import { loadLocalCenterTarifs } from './localCenterTarifs';
import { loadLocalCenterTeacherPayments } from './localCenterTeacherPayments';

/**
 * Intégrité référentielle du module Centres (stockage localStorage, donc
 * aucune clé étrangère pour nous protéger) :
 *
 * - `deleteBlockers*` : avant de supprimer un étudiant / enseignant /
 *   formation / groupe, liste ce qui y fait encore référence. Les pages
 *   refusent la suppression tant que la liste n'est pas vide et proposent de
 *   passer la fiche en « Inactif » / « Terminé » — on ne supprime jamais en
 *   silence un historique de paiements ou de présences.
 * - `removeCentreCascade` : la suppression d'un centre par l'Admin retire
 *   aussi toutes les données rattachées à ce `centerId`, au lieu de laisser
 *   des milliers de lignes orphelines invisibles mais comptées ailleurs.
 */

function plural(n: number, singular: string, pluralForm: string) {
  return `${n} ${n > 1 ? pluralForm : singular}`;
}

export function deleteBlockersForStudent(studentId: string): string[] {
  const reasons: string[] = [];
  const enrollments = loadLocalCenterEnrollments().filter((e) => e.studentId === studentId && e.statut === 'ACTIF').length;
  const payments = loadLocalCenterStudentPayments().filter((p) => p.studentId === studentId).length;
  const attendance = loadLocalCenterAttendance().filter((a) => a.studentId === studentId).length;
  if (enrollments) reasons.push(plural(enrollments, 'inscription active à un groupe', 'inscriptions actives à des groupes'));
  if (payments) reasons.push(plural(payments, 'paiement enregistré', 'paiements enregistrés'));
  if (attendance) reasons.push(plural(attendance, 'présence enregistrée', 'présences enregistrées'));
  return reasons;
}

export function deleteBlockersForTeacher(teacherId: string): string[] {
  const reasons: string[] = [];
  const groups = loadLocalCenterGroups().filter((g) => g.enseignantId === teacherId).length;
  const schedules = loadLocalCenterSchedules().filter((s) => s.enseignantId === teacherId).length;
  const payments = loadLocalCenterTeacherPayments().filter((p) => p.enseignantId === teacherId).length;
  if (groups) reasons.push(plural(groups, 'groupe affecté', 'groupes affectés'));
  if (schedules) reasons.push(plural(schedules, 'cours au planning', 'cours au planning'));
  if (payments) reasons.push(plural(payments, 'rémunération enregistrée', 'rémunérations enregistrées'));
  return reasons;
}

export function deleteBlockersForFormation(formationId: string): string[] {
  const reasons: string[] = [];
  const groups = loadLocalCenterGroups().filter((g) => g.formationId === formationId).length;
  const payments = loadLocalCenterStudentPayments().filter((p) => p.formationId === formationId).length;
  const tarifs = loadLocalCenterTarifs().filter((t) => t.formationId === formationId).length;
  if (groups) reasons.push(plural(groups, 'groupe', 'groupes'));
  if (payments) reasons.push(plural(payments, 'paiement étudiant', 'paiements étudiants'));
  if (tarifs) reasons.push(plural(tarifs, 'tarif', 'tarifs'));
  return reasons;
}

export function deleteBlockersForGroup(groupId: string): string[] {
  const reasons: string[] = [];
  const enrollments = loadLocalCenterEnrollments().filter((e) => e.groupId === groupId && e.statut === 'ACTIF').length;
  const schedules = loadLocalCenterSchedules().filter((s) => s.groupId === groupId).length;
  if (enrollments) reasons.push(plural(enrollments, 'étudiant inscrit', 'étudiants inscrits'));
  if (schedules) reasons.push(plural(schedules, 'cours au planning', 'cours au planning'));
  return reasons;
}

/** Message affiché quand une suppression est refusée. */
export function blockedDeleteMessage(label: string, reasons: string[], archiveHint: string): string {
  return `Impossible de supprimer ${label} : ${reasons.join(', ')}. ${archiveHint}`;
}

/** Toutes les collections dont chaque ligne porte un `centerId`. */
const CENTER_SCOPED_KEYS = [
  AMUD_KEYS.centerStudents,
  AMUD_KEYS.centerTeachers,
  AMUD_KEYS.centerFormations,
  AMUD_KEYS.centerGroups,
  AMUD_KEYS.centerEnrollments,
  AMUD_KEYS.centerSchedules,
  AMUD_KEYS.centerAttendance,
  AMUD_KEYS.centerStudentPayments,
  AMUD_KEYS.centerTeacherPayments,
  AMUD_KEYS.centerTeacherHours,
  AMUD_KEYS.centerTarifs,
  AMUD_KEYS.centerLeads,
  AMUD_KEYS.centerModificationRequests,
  AMUD_KEYS.centerUsers,
  AMUD_KEYS.centerActivities,
  AMUD_KEYS.studentResults,
  AMUD_KEYS.teacherResources,
  AMUD_KEYS.centerSessionStates,
  AMUD_KEYS.quizzes,
  AMUD_KEYS.quizQuestions,
  AMUD_KEYS.quizSessions,
  AMUD_KEYS.quizParticipants,
  AMUD_KEYS.quizAnswers,
  AMUD_KEYS.quizResults,
] as const;

/** Supprime un centre et toutes les données qui lui sont rattachées. Renvoie le nombre de lignes retirées. */
export function removeCentreCascade(centerId: string): number {
  let removed = 0;
  for (const key of CENTER_SCOPED_KEYS) {
    const collection = createCollection<Entity & { centerId?: string }>(key);
    const all = collection.getAll();
    const kept = all.filter((row) => row.centerId !== centerId);
    if (kept.length !== all.length) {
      removed += all.length - kept.length;
      collection.replace(kept);
    }
  }
  removeLocalCentre(centerId);
  // Si l'espace Centre « simulé » pointait sur ce centre, on le fait retomber
  // sur un centre existant au lieu d'afficher un chargement infini.
  try {
    if (window.localStorage.getItem('amud_current_center_id') === centerId) {
      const next = loadLocalCentres()[0]?.id;
      if (next) window.localStorage.setItem('amud_current_center_id', next);
      else window.localStorage.removeItem('amud_current_center_id');
      window.dispatchEvent(new CustomEvent('amud:current-center-change'));
    }
  } catch {
    // stockage indisponible : rien à resynchroniser
  }
  return removed;
}
