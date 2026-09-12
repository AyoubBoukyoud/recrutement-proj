'use client';

import { createCollection } from './storage/collection';
import { AMUD_KEYS } from './storage/keys';
import type { CenterEnrollment } from '@/data/amud/centerEnrollments';

const collection = createCollection<CenterEnrollment>(AMUD_KEYS.centerEnrollments);

export function loadLocalCenterEnrollments(): CenterEnrollment[] {
  return collection.getAll();
}

export function addLocalCenterEnrollment(e: CenterEnrollment) {
  collection.add(e);
}

export function updateLocalCenterEnrollment(id: string, patch: Partial<CenterEnrollment>) {
  return collection.update(id, patch);
}

export function removeLocalCenterEnrollment(id: string) {
  collection.remove(id);
}

/** Étudiants actuellement `ACTIF` dans un groupe donné. */
export function activeStudentIdsForGroup(enrollments: CenterEnrollment[], groupId: string): string[] {
  return enrollments.filter((e) => e.groupId === groupId && e.statut === 'ACTIF').map((e) => e.studentId);
}

export { collection as centerEnrollmentsCollection };
