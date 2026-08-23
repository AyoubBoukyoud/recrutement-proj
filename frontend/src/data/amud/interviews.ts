/**
 * Entité Entretien (`/amud/entreprise/entretiens`) — planification et suivi
 * des entretiens de recrutement, rattachée à une candidature (`Application`)
 * précise. Modélisée sur le même schéma date ISO + heures `HH:MM` que
 * `commercialRdv.ts` (`Rdv`), réutilisable avec `weekDates.ts`.
 */
export type InterviewType = 'Visioconférence' | 'Téléphonique' | 'Présentiel';
export type InterviewStatus = 'Planifié' | 'Confirmé' | 'Terminé' | 'Annulé' | 'Reporté';

export type Interview = {
  id: string;
  applicationId: string;
  candidateId: string;
  candidateNom: string;
  offerId: string;
  offerTitre: string;
  entrepriseId: string;
  recruiterId?: string;
  recruiterNom?: string;
  date: string;
  heureDebut: string;
  heureFin: string;
  type: InterviewType;
  lieuOuLien?: string;
  notes?: string;
  status: InterviewStatus;
  createdAt: string;
  updatedAt: string;
};

export const STATUT_CLASS: Record<InterviewStatus, string> = {
  Planifié: 'bg-amud-surface-container-highest text-amud-on-surface-variant',
  Confirmé: 'bg-amud-primary-fixed text-amud-on-primary-fixed',
  Terminé: 'bg-amud-primary-container text-amud-on-primary-container',
  Annulé: 'bg-amud-error-container text-amud-on-error-container',
  Reporté: 'bg-amud-tertiary-fixed text-amud-on-tertiary-fixed',
};

export const TYPE_ICON: Record<InterviewType, string> = {
  Visioconférence: 'videocam',
  Téléphonique: 'call',
  Présentiel: 'meeting_room',
};

export const interviewsSeed: Interview[] = [
  { id: 'interview_1', applicationId: 'application_c5', candidateId: 'candidate_youssefa', candidateNom: 'Youssef Amrani', offerId: '2', offerTitre: 'Développeur Fullstack React/Node', entrepriseId: '1', recruiterId: 'recruiter_techcorp2', recruiterNom: 'Marc Dubois', date: '2026-08-25', heureDebut: '10:00', heureFin: '11:00', type: 'Visioconférence', lieuOuLien: 'https://meet.amud-skills.ma/techcorp-youssef', notes: 'Entretien technique — revue de code en direct.', status: 'Confirmé', createdAt: '2026-08-20T09:00:00.000Z', updatedAt: '2026-08-21T14:00:00.000Z' },
  { id: 'interview_2', applicationId: 'application_7', candidateId: 'candidate_omark', candidateNom: 'Omar Kadiri', offerId: '5', offerTitre: 'Ingénieur Cloud Senior', entrepriseId: '1', recruiterId: 'recruiter_techcorp3', recruiterNom: 'Salma Idrissi', date: '2026-08-26', heureDebut: '14:30', heureFin: '15:15', type: 'Présentiel', lieuOuLien: '12 Boulevard Zerktouni, Casablanca', notes: 'Premier échange RH.', status: 'Planifié', createdAt: '2026-08-21T09:00:00.000Z', updatedAt: '2026-08-21T09:00:00.000Z' },
  { id: 'interview_3', applicationId: 'application_12', candidateId: 'candidate_youssefa', candidateNom: 'Youssef Amrani', offerId: '2', offerTitre: 'Développeur Fullstack React/Node', entrepriseId: '1', recruiterId: 'recruiter_techcorp1', recruiterNom: 'Fatima Zahra', date: '2026-08-10', heureDebut: '09:30', heureFin: '10:15', type: 'Téléphonique', notes: 'Pré-qualification.', status: 'Terminé', createdAt: '2026-08-05T09:00:00.000Z', updatedAt: '2026-08-10T10:30:00.000Z' },
  { id: 'interview_4', applicationId: 'application_13', candidateId: 'candidate_omark', candidateNom: 'Omar Kadiri', offerId: '5', offerTitre: 'Ingénieur Cloud Senior', entrepriseId: '1', recruiterId: 'recruiter_techcorp2', recruiterNom: 'Marc Dubois', date: '2026-08-08', heureDebut: '11:00', heureFin: '12:00', type: 'Visioconférence', lieuOuLien: 'https://meet.amud-skills.ma/techcorp-omar', notes: 'Entretien annulé, candidat indisponible.', status: 'Annulé', createdAt: '2026-08-01T09:00:00.000Z', updatedAt: '2026-08-06T09:00:00.000Z' },
  { id: 'interview_5', applicationId: 'application_c5', candidateId: 'candidate_youssefa', candidateNom: 'Youssef Amrani', offerId: '2', offerTitre: 'Développeur Fullstack React/Node', entrepriseId: '1', recruiterId: 'recruiter_techcorp1', recruiterNom: 'Fatima Zahra', date: '2026-08-29', heureDebut: '16:00', heureFin: '16:45', type: 'Présentiel', lieuOuLien: '12 Boulevard Zerktouni, Casablanca', notes: 'Entretien final avec la direction.', status: 'Reporté', createdAt: '2026-08-18T09:00:00.000Z', updatedAt: '2026-08-22T09:00:00.000Z' },
  { id: 'interview_6', applicationId: 'application_7', candidateId: 'candidate_omark', candidateNom: 'Omar Kadiri', offerId: '5', offerTitre: 'Ingénieur Cloud Senior', entrepriseId: '1', recruiterId: 'recruiter_techcorp3', recruiterNom: 'Salma Idrissi', date: '2026-08-24', heureDebut: '09:00', heureFin: '09:30', type: 'Téléphonique', notes: 'Point rapide sur les prétentions salariales.', status: 'Planifié', createdAt: '2026-08-19T09:00:00.000Z', updatedAt: '2026-08-19T09:00:00.000Z' },
];

export function getInterviewsForEntreprise(entrepriseId: string, all: Interview[] = interviewsSeed) {
  return all.filter((i) => i.entrepriseId === entrepriseId);
}

export function getInterviewsForCandidate(candidateId: string, all: Interview[] = interviewsSeed) {
  return all.filter((i) => i.candidateId === candidateId);
}

export function getInterviewsForApplication(applicationId: string, all: Interview[] = interviewsSeed) {
  return all.filter((i) => i.applicationId === applicationId);
}
