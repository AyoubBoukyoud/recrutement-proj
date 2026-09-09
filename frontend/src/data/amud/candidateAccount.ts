/**
 * Compte candidat self-service (`/amud/candidat/*`) — distinct de `Candidate`
 * (`candidates.ts`), qui reste la fiche CRM consultée par admin/commercial/
 * entreprise pour suivre un candidat de l'extérieur. `CandidateAccount` est
 * le profil que le candidat gère lui-même : identité, compétences,
 * expériences, formation, langues, profil Allemagne, préférences,
 * progression d'onboarding. Pas de mot de passe ici (voir `candidateAuth.ts`).
 */
export type GermanLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

export type CandidateExperience = {
  id: string;
  poste: string;
  entreprise: string;
  ville?: string;
  dateDebut: string;
  dateFin?: string;
  enCours?: boolean;
  description?: string;
};

export type CandidateFormation = {
  id: string;
  diplome: string;
  etablissement: string;
  annee: string;
  niveau?: string;
};

export type CandidateLangue = {
  id: string;
  langue: string;
  niveau: string;
};

export type CandidateAllemagne = {
  niveau?: GermanLevel;
  niveauVise?: GermanLevel;
  metierRecherche?: string;
  mobilite?: string;
  disponibilite?: string;
  preferences?: string;
};

export type CandidatePreferencesPro = {
  contrat?: string;
  villes?: string[];
  salaireMin?: number;
  teletravail?: string;
};

export type CandidateOnboarding = {
  step: number;
  complete: boolean;
};

export type CandidateAccount = {
  id: string;
  prenom: string;
  nom: string;
  email: string;
  telephone: string;
  ville?: string;
  posteRecherche?: string;
  situation?: string;
  domaine?: string;
  metier?: string;
  experienceAnnees?: string;
  competences: string[];
  experiences: CandidateExperience[];
  formations: CandidateFormation[];
  langues: CandidateLangue[];
  allemagne: CandidateAllemagne;
  disponibilite?: string;
  preferencesPro: CandidatePreferencesPro;
  onboarding: CandidateOnboarding;
  createdAt: string;
  updatedAt: string;
};

export const ONBOARDING_STEPS = ['situation', 'domaine', 'metier', 'experience', 'langues', 'allemand', 'preferences'] as const;
export type OnboardingStepKey = (typeof ONBOARDING_STEPS)[number];

export function blankCandidateAccount(input: { id: string; prenom: string; nom: string; email: string; telephone: string }): CandidateAccount {
  const now = new Date().toISOString();
  return {
    id: input.id,
    prenom: input.prenom,
    nom: input.nom,
    email: input.email,
    telephone: input.telephone,
    competences: [],
    experiences: [],
    formations: [],
    langues: [],
    allemagne: {},
    preferencesPro: {},
    onboarding: { step: 0, complete: false },
    createdAt: now,
    updatedAt: now,
  };
}
