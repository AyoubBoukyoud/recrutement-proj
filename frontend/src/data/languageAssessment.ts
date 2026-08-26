/**
 * Évaluation de langue orale, en maquette ou via l'API Laravel.
 *
 * L'implémentation HTTP délègue à `lib/languageAssessment`, qui reste la
 * description du contrat réel du back (transcription + notation via
 * CefrScorer). La maquette simule ce pipeline : elle met l'enregistrement en
 * `processing` puis, après un délai, calcule un score CEFR plausible et met à
 * jour le niveau d'allemand du profil candidat — comme le ferait le back une
 * fois le job terminé.
 */
import {
  listLanguageAssessments,
  getLanguageAssessment,
  submitLanguageAssessment,
  type LanguageAssessmentResult,
} from '@/lib/languageAssessment';
import type { LanguageCode, CefrLevel } from '@/lib/candidateProfile';
import { readStorage, writeStorage, STORAGE_KEYS } from '@/lib/storage';
import { fakeLatency } from './config';
import { applyLanguageAssessmentResult } from './candidateProfile';

export interface LanguageAssessmentRepository {
  list(token: string): Promise<LanguageAssessmentResult[]>;
  get(id: number, token: string): Promise<LanguageAssessmentResult>;
  submit(language: LanguageCode, audio: Blob, token: string): Promise<LanguageAssessmentResult>;
}

const httpLanguageAssessment: LanguageAssessmentRepository = {
  list: listLanguageAssessments,
  get: getLanguageAssessment,
  submit: submitLanguageAssessment,
};

/* ------------------------------------------------------------------ *
 * Maquette — persistée dans `as_language_assessments`.
 * ------------------------------------------------------------------ */

let store: LanguageAssessmentResult[] | null = null;
let nextId = 1;

function results(): LanguageAssessmentResult[] {
  if (store === null) {
    store = readStorage<LanguageAssessmentResult[]>(STORAGE_KEYS.languageAssessments, []);
    nextId = store.length > 0 ? Math.max(...store.map((r) => r.id)) + 1 : 1;
  }
  return store;
}

function persist(next: LanguageAssessmentResult[]) {
  store = next;
  writeStorage(STORAGE_KEYS.languageAssessments, next);
}

function replace(id: number, patch: Partial<LanguageAssessmentResult>) {
  persist(results().map((r) => (r.id === id ? { ...r, ...patch } : r)));
}

/** Une passe B1 ou B2 plausible plutôt qu'un tirage complet A1-C2 : c'est le
 *  niveau que viserait un candidat qui vient de finir son test de préparation. */
const CEFR_OUTCOMES: CefrLevel[] = ['B1', 'B1', 'B2'];

function randomBetween(min: number, max: number): number {
  return Math.round(min + Math.random() * (max - min));
}

const GERMAN_TRANSCRIPTS = [
  'Guten Tag, ich heiße Youssef und ich arbeite als Softwareentwickler. Ich habe vier Jahre Erfahrung und ich möchte gerne in Deutschland arbeiten.',
  'Hallo, mein Name ist Youssef Amrani. Ich komme aus Marokko und ich lerne seit einem Jahr Deutsch. Ich interessiere mich für eine Stelle im Gesundheitswesen.',
];

const mockLanguageAssessment: LanguageAssessmentRepository = {
  list: () => fakeLatency([...results()]),

  get: (id) => {
    const found = results().find((r) => r.id === id);
    return fakeLatency(found ? { ...found } : (undefined as unknown as LanguageAssessmentResult));
  },

  submit: (language, audio) => {
    const id = nextId++;
    const created: LanguageAssessmentResult = {
      id,
      language,
      status: 'processing',
      transcript: null,
      duration_seconds: null,
      words_per_minute: null,
      filler_word_ratio: null,
      pronunciation_score: null,
      predicted_cefr: null,
      score_breakdown: null,
      failure_reason: null,
      badge_awarded_at: null,
      created_at: new Date().toISOString(),
    };
    persist([created, ...results()]);
    void audio; // maquette : le contenu réel de l'enregistrement n'est jamais lu.

    setTimeout(() => {
      const predictedCefr = CEFR_OUTCOMES[Math.floor(Math.random() * CEFR_OUTCOMES.length)];
      replace(id, {
        status: 'completed',
        transcript: GERMAN_TRANSCRIPTS[Math.floor(Math.random() * GERMAN_TRANSCRIPTS.length)],
        duration_seconds: randomBetween(22, 55),
        words_per_minute: randomBetween(100, 130),
        filler_word_ratio: Math.round(randomBetween(5, 15)) / 100,
        pronunciation_score: randomBetween(80, 95),
        predicted_cefr: predictedCefr,
        score_breakdown: {
          fluency: { label: 'Fluidité', score: randomBetween(75, 92) },
          grammar: { label: 'Grammaire', score: randomBetween(70, 90) },
          vocabulary: { label: 'Vocabulaire', score: randomBetween(75, 95) },
        },
        badge_awarded_at: new Date().toISOString(),
      });
      if (language === 'de') applyLanguageAssessmentResult('de', predictedCefr);
    }, 3000);

    return fakeLatency({ ...created }, 400);
  },
};

export const languageAssessmentRepository: LanguageAssessmentRepository =
  process.env.NEXT_PUBLIC_USE_MOCKS === '1' ? mockLanguageAssessment : httpLanguageAssessment;
