/**
 * Ce que l'API renverra au candidat sur son propre dossier. Le parcours couvre
 * les trois états d'étape (terminée, en cours, à venir) et les réclamations
 * les trois états de ticket : sans quoi la moitié des styles de ces écrans ne
 * serait jamais rendue pendant qu'on les dessine.
 */
import type { ReclamationEntry, TimelineStep } from '@/lib/types';

export const MOCK_TIMELINE: TimelineStep[] = [
  { id: 'step_1', label: 'Dossier validé', description: 'Votre dossier a été vérifié par notre équipe.', status: 'termine', date: '2026-06-02' },
  { id: 'step_2', label: 'Contrat signé', description: 'Contrat de travail signé avec TechGmbH Munich.', status: 'termine', date: '2026-06-20' },
  { id: 'step_3', label: 'Demande de visa', description: 'Dépôt du dossier de visa de travail auprès du consulat allemand.', status: 'en_cours', date: null },
  { id: 'step_4', label: 'Relocalisation', description: 'Organisation du logement et du déménagement à Munich.', status: 'a_venir', date: null },
  { id: 'step_5', label: 'Prise de poste', description: "Premier jour de travail chez l'employeur.", status: 'a_venir', date: null },
];

export const MOCK_RECLAMATIONS: ReclamationEntry[] = [
  { id: 'rec_1', subject: 'Document refusé', category: 'Documents', message: "Mon diplôme a été marqué comme illisible alors qu'il est net.", status: 'ouverte', createdAt: '2026-07-29T08:00:00Z', authorName: 'Youssef Amrani', authorRole: 'candidate' },
  { id: 'rec_2', subject: 'Retard de réponse employeur', category: 'Messagerie', message: "Aucune réponse depuis 2 semaines suite à l'entretien.", status: 'en_cours', createdAt: '2026-07-25T08:00:00Z', authorName: 'Salma Bennis', authorRole: 'candidate' },
  { id: 'rec_3', subject: 'Question sur le visa', category: 'Administratif', message: 'Quels documents sont nécessaires pour le rendez-vous consulaire ?', status: 'resolue', createdAt: '2026-07-10T08:00:00Z', authorName: 'Hamza Rachidi', authorRole: 'candidate' },
];
