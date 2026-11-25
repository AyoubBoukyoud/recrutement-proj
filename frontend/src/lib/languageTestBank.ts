// Banque d'items du test de langue AMUD (un examen par niveau CECRL).
// Types et libellés partagés par les écrans admin `/admin/tests-langue/*`.

export type CefrLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
export type ExamSkill = 'reading' | 'listening' | 'read_aloud' | 'writing' | 'oral';
export type ItemStatus = 'draft' | 'approved' | 'retired';

export const CEFR_LEVELS: CefrLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
export const EXAM_SKILLS: ExamSkill[] = ['reading', 'listening', 'read_aloud', 'writing', 'oral'];

export const SKILL_LABELS: Record<ExamSkill, string> = {
  reading: 'Lecture',
  listening: 'Écoute',
  read_aloud: 'Lecture à voix haute',
  writing: 'Écriture',
  oral: 'Oral (caméra)',
};

export const TASK_TYPE_LABELS: Record<string, string> = {
  true_false: 'Vrai / faux',
  multiple_choice: 'QCM',
  matching: 'Association',
  gap_text: 'Texte à trous',
  form_fill: 'Formulaire',
  read_aloud: 'Texte à lire',
  short_message: 'Message court',
  informal_email: 'E-mail informel',
  formal_note: 'Message formel',
  opinion_text: 'Texte d’opinion',
  argumentative_text: 'Texte argumentatif',
  reformulation: 'Reformulation',
  oral_introduction: 'Se présenter',
  oral_situation: 'Situation',
  oral_presentation: 'Présentation',
  oral_discussion: 'Débat',
};

export const SECTORS = ['general', 'care', 'construction', 'hospitality', 'logistics', 'industry'] as const;

export const SECTOR_LABELS: Record<string, string> = {
  general: 'Général',
  care: 'Soins',
  construction: 'BTP',
  hospitality: 'Hôtellerie-restauration',
  logistics: 'Logistique',
  industry: 'Industrie',
};

export interface ExamOption {
  id: string;
  label: string;
}

export interface ExamQuestion {
  id: string;
  prompt: string;
  options?: ExamOption[];
}

/** Contenu stocké d'un item — la forme dépend de la famille du type de tâche. */
export interface ExamItemContent {
  stimulus?: string;
  script?: { speaker: string; text: string }[];
  options?: ExamOption[];
  questions?: ExamQuestion[];
  explanations?: Record<string, string>;
  plays?: number;
  fields?: { id: string; label: string }[];
  text?: string;
  situation?: string;
  instructions?: string;
  points?: string[];
  min_words?: number;
  max_words?: number;
  prep_seconds?: number;
  answer_seconds?: number;
}

export interface BankItem {
  id: number;
  language: string;
  cefr_level: CefrLevel;
  skill: ExamSkill;
  task_type: string;
  sector: string;
  title: string | null;
  content: ExamItemContent;
  answer_key: Record<string, string | string[]> | null;
  status: ItemStatus;
  generated_by: string | null;
  reviewed_at: string | null;
  review_note: string | null;
  reviewer: { id: number; name: string } | null;
  has_audio: boolean;
  audio_url: string | null;
  problems: string[];
  created_at: string;
}

export interface CoverageTask {
  skill: ExamSkill;
  task_type: string;
  per_exam: number;
  approved: number;
  draft: number;
  target: number;
}

export interface LevelCoverage {
  level: CefrLevel;
  exams_possible: number;
  target_exams: number;
  tasks: CoverageTask[];
}
