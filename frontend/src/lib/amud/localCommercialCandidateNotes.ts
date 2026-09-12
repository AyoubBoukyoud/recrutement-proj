'use client';

import { createCollection } from './storage/collection';
import { AMUD_KEYS } from './storage/keys';
import type { CommercialCandidateNote } from '@/data/amud/commercialCandidateNotes';

export const commercialCandidateNotesCollection = createCollection<CommercialCandidateNote>(AMUD_KEYS.commercialCandidateNotes);
