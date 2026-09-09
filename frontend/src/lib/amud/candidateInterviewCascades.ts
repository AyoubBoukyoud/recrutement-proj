'use client';

import { generateId } from './storage/ids';
import { scheduleInterview } from './interviewCascades';
import { candidateActivitiesCollection } from './localCandidateActivities';
import { pushNotification } from './storage/notify';
import type { Application } from '@/data/amud/applications';
import type { Interview } from '@/data/amud/interviews';

/**
 * Action "Programmer un entretien (démo)" exposée côté candidat une fois la
 * candidature au statut `INTERVIEW` — permet de tester le parcours entretien
 * complet (§46 étape 30) sans dépendre d'une action côté espace entreprise,
 * qui n'existe que côté maquette entreprise aujourd'hui. Réutilise
 * `scheduleInterview` (déjà partagé, gère la collection + l'audit + la
 * notification employeur) et ajoute la notification/activité côté candidat.
 */
export function scheduleDemoInterview(application: Application, input: { date: string; heureDebut: string; heureFin: string; type: Interview['type']; lieuOuLien?: string }): Interview {
  const interview = scheduleInterview(application, { ...input, notes: 'Entretien de démonstration programmé par le candidat.' });

  pushNotification({
    scope: 'candidate',
    targetId: application.candidateId,
    title: `Entretien programmé pour « ${application.offerTitre} » le ${interview.date} à ${interview.heureDebut}.`,
    category: 'Entretiens',
    href: `/amud/candidat/entretiens/${interview.id}`,
  });
  candidateActivitiesCollection.add({
    id: generateId('candidate_activity'),
    candidateAccountId: application.candidateId,
    type: 'entretien',
    label: `Entretien programmé : ${application.offerTitre}`,
    href: `/amud/candidat/entretiens/${interview.id}`,
    createdAt: new Date().toISOString(),
  });

  return interview;
}
