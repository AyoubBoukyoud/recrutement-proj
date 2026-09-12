'use client';

import { generateId } from './storage/ids';
import { candidateAccountsCollection } from './localCandidateAccounts';
import { candidateActivitiesCollection } from './localCandidateActivities';
import type { CandidateAccount, OnboardingStepKey } from '@/data/amud/candidateAccount';
import { ONBOARDING_STEPS } from '@/data/amud/candidateAccount';

export function updateCandidateProfile(id: string, patch: Partial<CandidateAccount>, activity?: { label: string; href?: string }) {
  const updated = candidateAccountsCollection.update(id, { ...patch, updatedAt: new Date().toISOString() });
  if (activity) {
    candidateActivitiesCollection.add({
      id: generateId('candidate_activity'),
      candidateAccountId: id,
      type: 'profil',
      label: activity.label,
      href: activity.href,
      createdAt: new Date().toISOString(),
    });
  }
  return updated;
}

export function saveOnboardingStep(id: string, stepIndex: number, patch: Partial<CandidateAccount>) {
  const complete = stepIndex >= ONBOARDING_STEPS.length - 1;
  return candidateAccountsCollection.update(id, {
    ...patch,
    onboarding: { step: stepIndex, complete },
    updatedAt: new Date().toISOString(),
  });
}

export function onboardingStepKey(stepIndex: number): OnboardingStepKey {
  return ONBOARDING_STEPS[Math.min(stepIndex, ONBOARDING_STEPS.length - 1)];
}

export type ProfileSection = 'informations' | 'competences' | 'experience' | 'formation' | 'langues' | 'cv';

export type ProfileCompletion = {
  percent: number;
  sections: Record<ProfileSection, boolean>;
};

const SECTION_LABELS: Record<ProfileSection, { label: string; href: string }> = {
  informations: { label: 'Compléter vos informations personnelles', href: '/amud/candidat/profil' },
  competences: { label: 'Ajouter vos compétences', href: '/amud/candidat/profil' },
  experience: { label: 'Ajouter une expérience', href: '/amud/candidat/profil' },
  formation: { label: 'Ajouter une formation', href: '/amud/candidat/profil' },
  langues: { label: "Ajouter vos langues et votre niveau d'allemand", href: '/amud/candidat/profil/allemagne' },
  cv: { label: 'Ajouter votre CV', href: '/amud/candidat/documents' },
};

export { SECTION_LABELS };

/** Calcul dynamique du profil (§12) — jamais de valeur en dur, toujours dérivé des champs réellement remplis. */
export function computeProfileCompletion(account: CandidateAccount, hasCV: boolean): ProfileCompletion {
  const sections: Record<ProfileSection, boolean> = {
    informations: Boolean(account.prenom && account.nom && account.email && account.telephone && account.ville),
    competences: account.competences.length > 0,
    experience: account.experiences.length > 0,
    formation: account.formations.length > 0,
    langues: account.langues.length > 0 && Boolean(account.allemagne.niveau),
    cv: hasCV,
  };
  const done = Object.values(sections).filter(Boolean).length;
  const percent = Math.round((done / Object.keys(sections).length) * 100);
  return { percent, sections };
}

export function nextIncompleteSection(completion: ProfileCompletion): { label: string; href: string } | null {
  const missing = (Object.keys(completion.sections) as ProfileSection[]).find((key) => !completion.sections[key]);
  return missing ? SECTION_LABELS[missing] : null;
}
