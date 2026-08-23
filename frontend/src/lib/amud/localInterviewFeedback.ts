'use client';

import { createCollection } from './storage/collection';
import { AMUD_KEYS } from './storage/keys';
import type { InterviewFeedback } from '@/data/amud/interviewFeedback';

const collection = createCollection<InterviewFeedback>(AMUD_KEYS.interviewFeedback);

export function loadLocalInterviewFeedback(): InterviewFeedback[] {
  return collection.getAll();
}

export function addLocalInterviewFeedback(f: InterviewFeedback) {
  collection.add(f);
}

export { collection as interviewFeedbackCollection };
