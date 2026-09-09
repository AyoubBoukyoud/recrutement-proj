'use client';

import { createCollection } from './storage/collection';
import { AMUD_KEYS } from './storage/keys';
import type { QuizSession } from '@/data/amud/quizSessions';

const collection = createCollection<QuizSession>(AMUD_KEYS.quizSessions);

export function loadLocalQuizSessions(): QuizSession[] {
  return collection.getAll();
}

export function addLocalQuizSession(s: QuizSession) {
  collection.add(s);
}

export function updateLocalQuizSession(id: string, patch: Partial<QuizSession>) {
  return collection.update(id, patch);
}

export function removeLocalQuizSession(id: string) {
  collection.remove(id);
}

export { collection as quizSessionsCollection };
