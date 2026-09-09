'use client';

import { createCollection } from './storage/collection';
import { AMUD_KEYS } from './storage/keys';
import type { CenterStudentPayment } from '@/data/amud/centerStudentPayments';

const collection = createCollection<CenterStudentPayment>(AMUD_KEYS.centerStudentPayments);

export function loadLocalCenterStudentPayments(): CenterStudentPayment[] {
  return collection.getAll();
}

export function addLocalCenterStudentPayment(p: CenterStudentPayment) {
  collection.add(p);
}

export function updateLocalCenterStudentPayment(id: string, patch: Partial<CenterStudentPayment>) {
  return collection.update(id, patch);
}

export function removeLocalCenterStudentPayment(id: string) {
  collection.remove(id);
}

export { collection as centerStudentPaymentsCollection };
