'use client';

import { createCollection } from './storage/collection';
import { AMUD_KEYS } from './storage/keys';
import type { Quiz } from '@/data/amud/quizzes';

const collection = createCollection<Quiz>(AMUD_KEYS.quizzes);

export function loadLocalQuizzes(): Quiz[] {
  return collection.getAll();
}

export function addLocalQuiz(q: Quiz) {
  collection.add(q);
}

export function updateLocalQuiz(id: string, patch: Partial<Quiz>) {
  return collection.update(id, patch);
}

export function removeLocalQuiz(id: string) {
  collection.remove(id);
}

export { collection as quizzesCollection };
