'use client';

import { createCollection } from './storage/collection';
import { AMUD_KEYS } from './storage/keys';
import type { Contact } from '@/data/amud/mesContacts';

export const mesContactsCollection = createCollection<Contact>(AMUD_KEYS.contacts);

export function loadLocalMesContacts(): Contact[] {
  return mesContactsCollection.getAll();
}

export function addLocalMesContact(c: Contact) {
  mesContactsCollection.add(c);
}

export function updateLocalMesContact(id: string, patch: Partial<Contact>) {
  return mesContactsCollection.update(id, patch);
}
