'use client';

import { generateId } from './storage/ids';
import { callTicketsCollection } from './localCallTickets';
import { activitesCollection } from './localCommercialActivites';
import { followupsCollection } from './localFollowUps';
import { rendezVousCollection } from './localRendezVous';
import { companyContactsCollection } from './localCompanyContacts';
import { pushNotification } from './storage/notify';
import { logAudit } from './storage/audit';
import type { CallTicket, CallResult, ContactType } from '@/data/amud/callTickets';
import type { Activite, ResultatActivite } from '@/data/amud/commercialActivites';

function formatDuration(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function mapResultToActiviteResultat(r: CallResult): ResultatActivite {
  switch (r) {
    case 'Répondu':
      return 'Répondu';
    case 'Intéressé':
    case 'Rendez-vous fixé':
      return 'Positif';
    case 'Refus':
      return 'Négatif';
    case 'À rappeler':
      return 'En cours';
    default:
      return 'Sans réponse';
  }
}

/**
 * Enregistre un appel de bout en bout (cahier des charges §10) : ticket
 * d'appel, activité liée, mise à jour du dernier contact, relance et
 * rendez-vous optionnels, notification, entrée d'audit — une seule fonction
 * pour que le dashboard commercial, la fiche entreprise et "Mes contacts"
 * déclenchent exactement la même cascade plutôt que de la réimplémenter
 * chacun à leur façon.
 */
export function createCallTicket(input: {
  commercialId: string;
  commercialNom: string;
  contactId: string;
  contactNom: string;
  contactType: ContactType;
  entrepriseId?: string;
  entrepriseNom?: string;
  durationSeconds: number;
  result: CallResult;
  summary: string;
  followUpRequired: boolean;
  followUpDate?: string;
  followUpTime?: string;
  scheduleAppointment?: { date: string; debut: string; fin: string; objectif: string };
}): CallTicket {
  const now = new Date();
  const nowIso = now.toISOString();
  const dateFr = now.toLocaleDateString('fr-FR');

  let appointmentId: string | undefined;
  if (input.scheduleAppointment) {
    appointmentId = generateId('rdv');
    rendezVousCollection.add({
      id: appointmentId,
      entrepriseId: input.entrepriseId,
      date: input.scheduleAppointment.date,
      debut: input.scheduleAppointment.debut,
      fin: input.scheduleAppointment.fin,
      nom: input.contactNom,
      entreprise: input.entrepriseNom ?? '',
      statut: 'programme',
      type: 'Appel téléphonique',
      objectif: input.scheduleAppointment.objectif,
      notes: [],
    });
  }

  const ticket: CallTicket = {
    id: generateId('ticket'),
    commercialId: input.commercialId,
    commercialNom: input.commercialNom,
    contactId: input.contactId,
    contactNom: input.contactNom,
    contactType: input.contactType,
    entrepriseId: input.entrepriseId,
    entrepriseNom: input.entrepriseNom,
    startedAt: nowIso,
    endedAt: nowIso,
    durationSeconds: input.durationSeconds,
    result: input.result,
    summary: input.summary,
    followUpRequired: input.followUpRequired,
    followUpDate: input.followUpDate,
    followUpTime: input.followUpTime,
    appointmentId,
    createdAt: nowIso,
  };
  callTicketsCollection.add(ticket);

  const activite: Activite = {
    id: generateId('act'),
    entrepriseId: input.entrepriseId ?? '',
    entrepriseNom: input.entrepriseNom ?? input.contactNom,
    contact: input.contactNom,
    commercialId: input.commercialId,
    commercial: input.commercialNom,
    date: dateFr,
    heureDebut: now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    duree: formatDuration(input.durationSeconds),
    type: 'Appel',
    resultat: mapResultToActiviteResultat(input.result),
    resume: input.summary,
    prochaineAction: input.followUpRequired ? `Rappeler le ${input.followUpDate ?? ''} ${input.followUpTime ?? ''}`.trim() : 'Aucune action planifiée',
    prochaineDate: input.followUpRequired ? `${input.followUpDate ?? ''} ${input.followUpTime ?? ''}`.trim() : undefined,
    statut: 'Terminé',
  };
  activitesCollection.add(activite);

  if (input.contactType === 'Entreprise') {
    companyContactsCollection.update(input.contactId, { dernierContact: dateFr });
  }

  if (input.followUpRequired) {
    followupsCollection.add({
      id: generateId('followup'),
      entrepriseId: input.entrepriseId,
      entrepriseNom: input.entrepriseNom,
      contactNom: input.contactNom,
      commercialId: input.commercialId,
      commercialNom: input.commercialNom,
      dueDate: input.followUpDate || dateFr,
      dueTime: input.followUpTime || '09:00',
      note: input.summary,
      status: 'Planifiée',
      callTicketId: ticket.id,
      createdAt: nowIso,
    });
  }

  pushNotification({
    scope: 'commercial',
    title: `Appel avec ${input.contactNom} enregistré (${input.result}).`,
    category: 'Appel',
    href: input.entrepriseId ? `/amud/commercial/entreprises/${input.entrepriseId}` : '/amud/commercial/activites',
  });

  logAudit({
    utilisateur: input.commercialNom,
    role: 'Commercial',
    action: 'Appel enregistré',
    actionType: 'create',
    module: 'CRM',
    reference: `${input.contactNom} (#${ticket.id})`,
  });

  return ticket;
}
