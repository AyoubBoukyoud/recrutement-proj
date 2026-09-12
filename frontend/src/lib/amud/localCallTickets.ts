'use client';

import { createCollection } from './storage/collection';
import { AMUD_KEYS } from './storage/keys';
import type { CallTicket } from '@/data/amud/callTickets';

export const callTicketsCollection = createCollection<CallTicket>(AMUD_KEYS.callTickets);

export function loadLocalCallTickets(): CallTicket[] {
  return callTicketsCollection.getAll();
}
