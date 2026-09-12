'use client';

import { generateId } from './storage/ids';
import { applicationsCollection } from './localApplications';
import { candidateActivitiesCollection } from './localCandidateActivities';
import { pushNotification } from './storage/notify';
import type { Application } from '@/data/amud/applications';
import type { CandidateAccount } from '@/data/amud/candidateAccount';
import type { Offre } from '@/data/amud/offres';

export function hasApplied(candidateAccountId: string, offerId: string, all: Application[]): Application | undefined {
  return all.find((a) => a.candidateId === candidateAccountId && a.offerId === offerId);
}

/**
 * Envoi de candidature (§20-22) — crée `Application` (statut initial `NEW`,
 * réutilisant exactement le pipeline déjà consommé par le Kanban entreprise
 * existant, `/amud/entreprise/candidatures`), notifie le candidat ET
 * l'entreprise, journalise une activité candidat.
 */
export function submitApplication(input: { account: CandidateAccount; offre: Offre; message?: string }): Application {
  const { account, offre } = input;
  const now = new Date().toISOString();
  const application: Application = {
    id: generateId('application'),
    candidateId: account.id,
    candidateNom: `${account.prenom} ${account.nom}`.trim(),
    offerId: offre.id,
    offerTitre: offre.titre,
    entrepriseId: offre.entrepriseId ?? '',
    entrepriseNom: offre.entreprise,
    tags: account.competences.slice(0, 4),
    score: 0,
    createdAt: now,
    updatedAt: now,
    status: 'NEW',
  };
  applicationsCollection.add(application);

  pushNotification({
    scope: 'candidate',
    targetId: account.id,
    title: `Votre candidature pour « ${offre.titre} » a été envoyée.`,
    category: 'Candidatures',
    href: `/amud/candidat/candidatures/${application.id}`,
  });
  pushNotification({
    scope: 'employer',
    title: `Nouvelle candidature de ${application.candidateNom} pour « ${offre.titre} ».`,
    category: 'Applications',
    href: `/amud/entreprise/candidatures/${application.id}`,
  });
  candidateActivitiesCollection.add({
    id: generateId('candidate_activity'),
    candidateAccountId: account.id,
    type: 'candidature',
    label: `Candidature envoyée : ${offre.titre}`,
    href: `/amud/candidat/candidatures/${application.id}`,
    createdAt: now,
  });

  return application;
}

export function withdrawApplication(application: Application, candidateAccountId: string) {
  applicationsCollection.update(application.id, { status: 'WITHDRAWN', updatedAt: new Date().toISOString() });
  candidateActivitiesCollection.add({
    id: generateId('candidate_activity'),
    candidateAccountId,
    type: 'candidature',
    label: `Candidature retirée : ${application.offerTitre}`,
    href: `/amud/candidat/candidatures/${application.id}`,
    createdAt: new Date().toISOString(),
  });
}
