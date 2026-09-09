'use client';

import { createCollection } from './storage/collection';
import { AMUD_KEYS } from './storage/keys';
import type { Conversation } from '@/data/amud/conversations';

const collection = createCollection<Conversation>(AMUD_KEYS.conversations);

export function loadLocalConversations(): Conversation[] {
  return collection.getAll();
}

export function addLocalConversation(c: Conversation) {
  collection.add(c);
}

export function updateLocalConversation(id: string, patch: Partial<Conversation>) {
  return collection.update(id, patch);
}

export { collection as conversationsCollection };
