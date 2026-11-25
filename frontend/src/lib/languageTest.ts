// Examen de langue AMUD (un examen par niveau CECRL) — côté candidat.
//
// Le niveau de l'examen vient du certificat (sinon du niveau déclaré, sinon
// du choix du candidat). Phase 1 : lecture → écoute → lecture à voix haute →
// écriture, chacune chronométrée côté serveur. Le serveur ne renvoie jamais
// le corrigé ni le script d'écoute ; il renvoie le niveau provisoire une fois
// la phase 1 notée.

import { apiGet, apiPost, apiPut } from '@/lib/api';
import type { CefrLevel, ExamItemContent, ExamSkill } from '@/lib/languageTestBank';

export type ExamSection = ExamSkill;
export type SectionStatus = 'pending' | 'active' | 'done';
export type TestStatus = 'in_progress' | 'scoring' | 'awaiting_review' | 'validated' | 'abandoned' | 'failed';
export type LevelSource = 'certificate' | 'declared' | 'chosen';
export type Outcome = 'confirmed' | 'reclassified' | 'may_be_higher' | 'not_demonstrated';

export const PHASE_ONE_SECTIONS: ExamSection[] = ['reading', 'listening', 'read_aloud', 'writing'];

export interface SectionOutline {
  minutes: number | null;
  tasks: number;
}

export interface ExamOverview {
  language: string;
  exam_level: CefrLevel | null;
  level_source: LevelSource;
  available_levels: CefrLevel[];
  exam_available: boolean;
  cooldown_until: string | null;
  active_test_id: number | null;
  latest_test_id: number | null;
  exams: Record<string, Record<ExamSection, SectionOutline>>;
}

export interface SectionState extends SectionOutline {
  status: SectionStatus;
  started_at?: string;
  deadline_at?: string;
  completed_at?: string;
}

export interface ExamItem {
  id: number;
  skill: ExamSkill;
  task_type: string;
  title: string | null;
  content: ExamItemContent;
}

export interface ExamAnswer {
  answers?: Record<string, string>;
  fields?: Record<string, string>;
  text?: string;
}

/** A live-oral task. `content` stays null until the situation is revealed. */
export interface OralTask {
  response_id: number;
  revealed_at: string | null;
  content: { situation: string; instructions: string; points: string[] } | null;
  prep_seconds: number;
  answer_seconds: number;
  server_time: string;
}

export interface ExamEntry {
  response_id: number;
  item: ExamItem;
  answer: ExamAnswer | null;
  has_recording: boolean;
  plays_left: number | null;
  oral?: OralTask;
}

export interface ProvisionalResult {
  cefr: CefrLevel | null;
  outcome: Outcome | null;
  /** Withheld (null) while an administrator reviews the result. */
  skill_scores: Record<string, number | null> | null;
  skill_results: Record<string, CefrLevel | null> | null;
  summary: { strengths: string[]; weaknesses: string[] } | null;
}

export interface ExamState {
  id: number;
  language: string;
  exam_level: CefrLevel;
  level_source: LevelSource;
  status: TestStatus;
  current_section: ExamSection | null;
  sections: Partial<Record<ExamSection, SectionState>>;
  items: ExamEntry[];
  server_time: string;
  grace_seconds: number;
  provisional: ProvisionalResult | null;
  oral_level: CefrLevel | null;
  ai_cefr: CefrLevel | null;
  outcome: Outcome | null;
  final_cefr: CefrLevel | null;
  final_skill_results: Record<string, CefrLevel | null> | null;
}

const BASE = '/candidate/language-tests';

export const languageTestApi = {
  overview: (token: string, language = 'de') => apiGet<ExamOverview>(`${BASE}/overview?language=${language}`, token),
  start: (token: string, language: string, level: CefrLevel | null) =>
    apiPost<ExamState>(BASE, { language, level, consent: true }, token),
  get: (token: string, id: number) => apiGet<ExamState>(`${BASE}/${id}`, token),
  startSection: (token: string, id: number, section: ExamSection) =>
    apiPost<ExamState>(`${BASE}/${id}/sections/${section}/start`, {}, token),
  completeSection: (token: string, id: number, section: ExamSection) =>
    apiPost<ExamState>(`${BASE}/${id}/sections/${section}/complete`, {}, token),
  answer: (token: string, id: number, responseId: number, answer: ExamAnswer, timeMs: number) =>
    apiPut<{ saved: boolean }>(`${BASE}/${id}/responses/${responseId}`, { answer, time_ms: timeMs }, token),
  recording: (token: string, id: number, responseId: number, audio: Blob) => {
    const form = new FormData();
    form.append('audio', audio, audio.type.includes('mp4') ? 'read-aloud.m4a' : 'read-aloud.webm');
    return apiPost<{ saved: boolean }>(`${BASE}/${id}/responses/${responseId}/recording`, form, token);
  },
  reveal: (token: string, id: number, responseId: number) =>
    apiPost<OralTask>(`${BASE}/${id}/responses/${responseId}/reveal`, {}, token),
  oralRecording: (token: string, id: number, responseId: number, video: Blob) => {
    const form = new FormData();
    form.append('video', video, video.type.includes('mp4') ? 'oral-video.mp4' : 'oral-video.webm');
    return apiPost<{ saved: boolean }>(`${BASE}/${id}/responses/${responseId}/recording`, form, token);
  },
  play: (token: string, id: number, responseId: number) =>
    apiPost<{ url: string; plays_left: number }>(`${BASE}/${id}/responses/${responseId}/play`, {}, token),
  integrity: (token: string, id: number, event: 'tab_hidden' | 'paste' | 'copy', section: ExamSection | null) =>
    apiPost<{ recorded: boolean }>(`${BASE}/${id}/integrity`, { event, section }, token).catch(() => undefined),
};

/** Word count matching the server's (whitespace-separated tokens). */
export function countWords(text: string): number {
  return text.trim() === '' ? 0 : text.trim().split(/\s+/u).length;
}
