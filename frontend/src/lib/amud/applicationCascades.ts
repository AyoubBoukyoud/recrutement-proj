'use client';

import { applicationsCollection } from './localApplications';
import { pushNotification } from './storage/notify';
import { logAudit } from './storage/audit';
import { CURRENT_EMPLOYER } from '@/data/amud/currentEmployer';
import { STATUS_LABEL, type Application, type ApplicationStatus } from '@/data/amud/applications';

/**
 * Changement de statut d'une candidature (cahier des charges §22) — fonction
 * unique partagée par le drag-and-drop du Kanban et le sélecteur de statut
 * de la page de détail, pour que toute transition passe par le même chemin
 * d'écriture (maj + notification + audit).
 */
export function changeApplicationStatus(application: Application, next: ApplicationStatus) {
  if (application.status === next) return;
  const updatedAt = new Date().toISOString();
  applicationsCollection.update(application.id, { status: next, updatedAt });
  pushNotification({
    scope: 'employer',
    title: `${application.candidateNom} est passé(e) à « ${STATUS_LABEL[next]} » pour « ${application.offerTitre} ».`,
    category: 'Applications',
    href: `/amud/entreprise/candidatures/${application.id}`,
  });
  logAudit({
    utilisateur: CURRENT_EMPLOYER.userNom,
    role: 'Recruteur',
    action: 'Statut de candidature modifié',
    actionType: 'update',
    module: 'Candidatures',
    reference: `${application.candidateNom} — ${application.offerTitre} (#${application.id})`,
    diff: { before: STATUS_LABEL[application.status], after: STATUS_LABEL[next] },
  });
}
