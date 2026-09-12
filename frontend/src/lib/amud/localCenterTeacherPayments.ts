'use client';

import { createCollection } from './storage/collection';
import { AMUD_KEYS } from './storage/keys';
import type { CenterTeacherPayment } from '@/data/amud/centerTeacherPayments';

const collection = createCollection<CenterTeacherPayment>(AMUD_KEYS.centerTeacherPayments);

export function loadLocalCenterTeacherPayments(): CenterTeacherPayment[] {
  return collection.getAll();
}

export function addLocalCenterTeacherPayment(p: CenterTeacherPayment) {
  collection.add(p);
}

export function updateLocalCenterTeacherPayment(id: string, patch: Partial<CenterTeacherPayment>) {
  return collection.update(id, patch);
}

export function removeLocalCenterTeacherPayment(id: string) {
  collection.remove(id);
}

export { collection as centerTeacherPaymentsCollection };
