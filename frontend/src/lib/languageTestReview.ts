// Relecture des examens de langue AMUD par l'administration
// (`/admin/tests-langue`) — types et libellés partagés.

import type { BankItem, CefrLevel } from '@/lib/languageTestBank';

export type ReviewStatus = 'in_progress' | 'scoring' | 'awaiting_review' | 'validated' | 'abandoned' | 'failed';

export interface ReviewSummary {
  id: number;
  language: string;
  exam_level: CefrLevel;
  level_source: 'certificate' | 'declared' | 'chosen';
  status: ReviewStatus;
  outcome: 'confirmed' | 'reclassified' | 'may_be_higher' | 'not_demonstrated' | null;
  provisional_cefr: CefrLevel | null;
  ai_cefr: CefrLevel | null;
  final_cefr: CefrLevel | null;
  oral_level: CefrLevel | null;
  needs_attention: boolean;
  flags: string[];
  started_at: string | null;
  completed_at: string | null;
  reviewed_at: string | null;
  published_at: string | null;
  reviewer: { id: number; name: string } | null;
  candidate: { profile_id: number; name: string | null; phone: string | null; profession: string | null };
}

export interface CriterionGrade {
  score: number;
  /** CEFR level the grader placed this criterion at ('below_A1' … 'C2'); absent on task achievement and older marks. */
  level?: string;
  evidence: string[];
  comment: string;
}

export interface ReviewResponse {
  id: number;
  section: 'reading' | 'listening' | 'read_aloud' | 'writing' | 'oral';
  status: string;
  score: number | null;
  is_correct: boolean | null;
  plays: number;
  time_ms: number | null;
  revealed_at: string | null;
  answer: { answers?: Record<string, string>; fields?: Record<string, string>; text?: string } | null;
  evaluation: {
    correct?: number;
    total?: number;
    detail?: Record<string, boolean>;
    guard?: string;
    error?: string;
    words?: number;
    seconds?: number | null;
    transcript?: string | null;
    accuracy?: number;
    clarity?: number | null;
    missed_words?: string[];
    run_scores?: number[];
    runs?: { score: number; criteria: Record<string, CriterionGrade>; transcript?: string; on_topic?: boolean; language_ok?: boolean; speech_present?: boolean }[];
    disagreement?: boolean;
    criteria?: Record<string, CriterionGrade>;
    strengths?: string[];
    weaknesses?: string[];
  } | null;
  audio_url: string | null;
  video_url: string | null;
  item: BankItem;
}

export interface ReviewDetail extends ReviewSummary {
  sections: Record<string, { status: string; level?: string; started_at?: string; completed_at?: string }>;
  skill_scores: Record<string, number | null> | null;
  skill_results: Record<string, CefrLevel | null> | null;
  summary: { strengths: string[]; weaknesses: string[]; speaking_parts?: { read_aloud: number | null; oral: number | null; oral_level: string } } | null;
  integrity: { tab_hidden?: number; paste_blocked?: number; too_fast?: string[]; flags?: string[]; events?: { event: string; section: string | null; at: string }[] } | null;
  review_note: string | null;
  candidate_language: {
    cefr_level: CefrLevel | null;
    self_declared_cefr: CefrLevel | null;
    source: string;
    certificate_document_id: number | null;
    tested_cefr: CefrLevel | null;
    certificate_confirmed: boolean | null;
  } | null;
  responses: ReviewResponse[];
}

export const STATUS_LABELS: Record<ReviewStatus, string> = {
  in_progress: 'En cours',
  scoring: 'Correction',
  awaiting_review: 'À valider',
  validated: 'Publié',
  abandoned: 'Annulé',
  failed: 'Échec technique',
};

export const OUTCOME_LABELS: Record<string, string> = {
  confirmed: 'Niveau confirmé',
  not_demonstrated: 'Niveau non démontré',
  reclassified: 'Reclassé',
  may_be_higher: 'Peut viser plus haut',
};

export const SOURCE_LABELS: Record<string, string> = {
  certificate: 'certificat',
  declared: 'déclaré',
  chosen: 'choisi',
};

/** Ce que chaque drapeau signifie pour le relecteur. */
export const FLAG_LABELS: Record<string, string> = {
  skill_not_scored: 'Une compétence n’a pas pu être notée',
  grading_failed: 'Une correction automatique a échoué',
  grader_disagreement: 'Les deux corrections IA divergent',
  integrity: 'Changements d’onglet / collages répétés ou section trop rapide',
  oral_not_scored: 'L’oral n’a pas pu être noté',
  oral_missing: 'Oral absent ou trop court',
};

export const CRITERION_LABELS: Record<string, string> = {
  task_achievement: 'Réalisation de la tâche',
  coherence: 'Cohérence',
  vocabulary: 'Vocabulaire',
  grammar: 'Grammaire',
  fluency: 'Aisance',
  pronunciation: 'Prononciation',
};

export const GUARD_LABELS: Record<string, string> = {
  empty: 'Réponse vide',
  too_short: 'Réponse trop courte',
  copied_prompt: 'Consigne recopiée',
  no_recording: 'Aucun enregistrement',
};
