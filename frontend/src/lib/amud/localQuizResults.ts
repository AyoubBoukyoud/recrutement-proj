'use client';

import { createCollection } from './storage/collection';
import { AMUD_KEYS } from './storage/keys';
import type { QuizResult } from '@/data/amud/quizResults';

const collection = createCollection<QuizResult>(AMUD_KEYS.quizResults);

export function loadLocalQuizResults(): QuizResult[] {
  return collection.getAll();
}

export function addLocalQuizResult(r: QuizResult) {
  collection.add(r);
}

export function updateLocalQuizResult(id: string, patch: Partial<QuizResult>) {
  return collection.update(id, patch);
}

export function removeLocalQuizResult(id: string) {
  collection.remove(id);
}

export { collection as quizResultsCollection };
