'use client';

import { generateId } from './storage/ids';
import { interviewsCollection } from './localInterviews';
import { interviewFeedbackCollection } from './localInterviewFeedback';
import { applicationsCollection } from './localApplications';
import { pushNotification } from './storage/notify';
import { logAudit } from './storage/audit';
import { CURRENT_EMPLOYER } from '@/data/amud/currentEmployer';
import type { Application } from '@/data/amud/applications';
import type { Interview, InterviewStatus } from '@/data/amud/interviews';
import type { InterviewFeedback, Recommendation } from '@/data/amud/interviewFeedback';

/**
 * Planification d'un entretien (cahier des charges §29) : crée l'entretien,
 * fait avancer la candidature vers `INTERVIEW` si elle n'a pas déjà dépassé
 * cette étape (évite de régresser une candidature déjà en Shortlist/Acceptée),
 * notifie et journalise.
 */
export function scheduleInterview(
  application: Application,
  input: Omit<Interview, 'id' | 'applicationId' | 'candidateId' | 'candidateNom' | 'offerId' | 'offerTitre' | 'entrepriseId' | 'createdAt' | 'updatedAt' | 'status'> & { status?: InterviewStatus },
): Interview {
  const now = new Date().toISOString();
  const interview: Interview = {
    id: generateId('interview'),
    applicationId: application.id,
    candidateId: application.candidateId,
    candidateNom: application.candidateNom,
    offerId: application.offerId,
    offerTitre: application.offerTitre,
    entrepriseId: application.entrepriseId,
    status: input.status ?? 'Planifié',
    createdAt: now,
    updatedAt: now,
    ...input,
  };
  interviewsCollection.add(interview);

  if (application.status === 'NEW' || application.status === 'SCREENING') {
    applicationsCollection.update(application.id, { status: 'INTERVIEW', updatedAt: now });
  }

  pushNotification({
    scope: 'employer',
    title: `Entretien planifié avec ${application.candidateNom} le ${interview.date} à ${interview.heureDebut}.`,
    category: 'Interviews',
    href: `/amud/entreprise/entretiens/${interview.id}`,
  });
  logAudit({ utilisateur: CURRENT_EMPLOYER.userNom, role: 'Recruteur', action: 'Entretien planifié', actionType: 'create', module: 'Entretiens', reference: `${application.candidateNom} — ${application.offerTitre} (#${interview.id})` });

  return interview;
}

export function updateInterviewStatus(interview: Interview, status: InterviewStatus) {
  interviewsCollection.update(interview.id, { status, updatedAt: new Date().toISOString() });
  logAudit({ utilisateur: CURRENT_EMPLOYER.userNom, role: 'Recruteur', action: `Entretien ${status.toLowerCase()}`, actionType: 'update', module: 'Entretiens', reference: `${interview.candidateNom} (#${interview.id})` });
  if (status === 'Terminé') {
    pushNotification({ scope: 'employer', title: `Entretien terminé avec ${interview.candidateNom} — pensez à ajouter votre évaluation.`, category: 'Interviews', href: `/amud/entreprise/entretiens/${interview.id}` });
  }
}

export function addInterviewFeedback(interview: Interview, input: { authorNom: string; overall: number; technical: number; communication: number; motivation: number; cultureFit: number; recommendation: Recommendation; notes?: string }): InterviewFeedback {
  const feedback: InterviewFeedback = {
    id: generateId('feedback'),
    interviewId: interview.id,
    applicationId: interview.applicationId,
    candidateId: interview.candidateId,
    entrepriseId: interview.entrepriseId,
    createdAt: new Date().toISOString(),
    ...input,
  };
  interviewFeedbackCollection.add(feedback);
  if (interview.status !== 'Terminé') {
    interviewsCollection.update(interview.id, { status: 'Terminé', updatedAt: new Date().toISOString() });
  }
  logAudit({ utilisateur: input.authorNom, role: 'Recruteur', action: 'Évaluation d’entretien ajoutée', actionType: 'create', module: 'Entretiens', reference: `${interview.candidateNom} (#${interview.id})` });
  return feedback;
}
