'use client';

import { createCollection } from './storage/collection';
import { AMUD_KEYS } from './storage/keys';
import type { QuizQuestion } from '@/data/amud/quizQuestions';

const collection = createCollection<QuizQuestion>(AMUD_KEYS.quizQuestions);

export function loadLocalQuizQuestions(): QuizQuestion[] {
  return collection.getAll();
}

export function addLocalQuizQuestion(q: QuizQuestion) {
  collection.add(q);
}

export function updateLocalQuizQuestion(id: string, patch: Partial<QuizQuestion>) {
  return collection.update(id, patch);
}

export function removeLocalQuizQuestion(id: string) {
  collection.remove(id);
}

export { collection as quizQuestionsCollection };
