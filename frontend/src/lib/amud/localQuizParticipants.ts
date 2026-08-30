'use client';

import { createCollection } from './storage/collection';
import { AMUD_KEYS } from './storage/keys';
import type { QuizParticipant } from '@/data/amud/quizParticipants';

const collection = createCollection<QuizParticipant>(AMUD_KEYS.quizParticipants);

export function loadLocalQuizParticipants(): QuizParticipant[] {
  return collection.getAll();
}

export function addLocalQuizParticipant(p: QuizParticipant) {
  collection.add(p);
}

export function updateLocalQuizParticipant(id: string, patch: Partial<QuizParticipant>) {
  return collection.update(id, patch);
}

export function removeLocalQuizParticipant(id: string) {
  collection.remove(id);
}

export { collection as quizParticipantsCollection };
