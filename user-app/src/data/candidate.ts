/**
 * Le dossier du candidat vu par lui-même : son parcours, ses réclamations.
 *
 * Les routes réelles n'existent pas encore côté Laravel — ces écrans étaient
 * jusqu'ici câblés en dur sur un tableau importé. Les faire passer par un
 * dépôt ne change rien à ce qu'ils affichent aujourd'hui, mais leur donne
 * l'asynchronisme et les états de chargement qu'ils auront de toute façon, et
 * laisse un seul endroit à remplir quand le back livrera les routes.
 */
import { fakeLatency } from './config';
import { MOCK_RECLAMATIONS, MOCK_TIMELINE } from './fixtures/candidate';
import type { ReclamationEntry, TimelineStep } from '@/lib/types';

export interface NewComplaint {
  category: string;
  message: string;
  voiceNoteUrl?: string | null;
}

export interface CandidateRepository {
  timeline(): Promise<TimelineStep[]>;
  complaints(): Promise<ReclamationEntry[]>;
  submitComplaint(input: NewComplaint, authorName: string): Promise<ReclamationEntry>;
}

/**
 * Tant que le back n'expose pas ces routes, l'implémentation HTTP échoue
 * franchement au lieu de renvoyer un tableau vide : un écran vide se
 * confondrait avec « vous n'avez aucune réclamation », ce qui est faux.
 */
const notImplemented = (route: string) => (): never => {
  throw new Error(`Route non encore fournie par l'API : ${route}`);
};

const httpCandidate: CandidateRepository = {
  timeline: notImplemented('GET /candidate/timeline'),
  complaints: notImplemented('GET /candidate/complaints'),
  submitComplaint: notImplemented('POST /candidate/complaints'),
};

/* Paresseux pour la même raison que dans `documents` : une initialisation au
   niveau du module embarquerait les fixtures dans le bundle de production. */
let complaints: ReclamationEntry[] | null = null;
let nextComplaintId = 0;

function entries(): ReclamationEntry[] {
  if (complaints === null) {
    complaints = MOCK_RECLAMATIONS.filter((r) => r.authorRole === 'candidate');
    nextComplaintId = complaints.length + 1;
  }
  return complaints;
}

const mockCandidate: CandidateRepository = {
  timeline: () => fakeLatency(MOCK_TIMELINE.map((step) => ({ ...step }))),

  complaints: () => fakeLatency(entries().map((entry) => ({ ...entry }))),

  submitComplaint: (input, authorName) => {
    const entry: ReclamationEntry = {
      id: `rec_${nextComplaintId++}`,
      subject: input.category,
      category: input.category,
      message: input.message,
      status: 'ouverte',
      createdAt: new Date().toISOString(),
      authorName,
      authorRole: 'candidate',
    };
    complaints = [entry, ...entries()];
    return fakeLatency({ ...entry }, 600);
  },
};

export const candidateRepository: CandidateRepository = process.env.NEXT_PUBLIC_USE_MOCKS === '1' ? mockCandidate : httpCandidate;
