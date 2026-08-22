'use client';

import { useMemo, useState } from 'react';
import { CountUp, Modal } from '@/components/amud/ui';
import { useToast } from '@/components/amud/Toast';
import { CURRENT_COMMERCIAL } from '@/data/amud/currentCommercial';
import { activitesSeed, type ResultatActivite } from '@/data/amud/commercialActivites';
import { activitesCollection } from '@/lib/amud/localCommercialActivites';
import { mesContactsSeed, type Contact } from '@/data/amud/mesContacts';
import { mesContactsCollection } from '@/lib/amud/localMesContacts';
import { followupsSeed } from '@/data/amud/followups';
import { followupsCollection } from '@/lib/amud/localFollowUps';
import { objectivesSeed, getObjectiveForCommercial } from '@/data/amud/objectives';
import { objectivesCollection } from '@/lib/amud/localObjectives';
import { buildSeedRdvs } from '@/data/amud/commercialRdv';
import { rendezVousCollection } from '@/lib/amud/localRendezVous';
import { useCollection } from '@/lib/amud/storage/useCollection';
import { generateId } from '@/lib/amud/storage/ids';
import { createCallTicket } from '@/lib/amud/callTicketCascade';
import type { CallResult } from '@/data/amud/callTickets';

const CALL_RESULTS: CallResult[] = ['Répondu', 'Pas de réponse', 'Ligne occupée', 'Téléphone éteint', 'Numéro incorrect', 'Refus', 'Intéressé', 'À rappeler', 'Rendez-vous fixé'];

type QuickModal = 'ticket' | 'rappel' | 'note' | null;

function todayFr() {
  return new Date().toLocaleDateString('fr-FR');
}

export default function AmudCommercialDashboardPage() {
  const notify = useToast();
  const [activites, { add: addActivite }] = useCollection(activitesCollection, activitesSeed);
  const [contacts] = useCollection(mesContactsCollection, mesContactsSeed);
  const [followups, { add: addFollowUp }] = useCollection(followupsCollection, followupsSeed);
  const [objectives] = useCollection(objectivesCollection, objectivesSeed);
  const [rdvsAll] = useCollection(rendezVousCollection, buildSeedRdvs());

  const mesActivites = useMemo(() => activites.filter((a) => a.commercialId === CURRENT_COMMERCIAL.id), [activites]);
  const activitesAuj = useMemo(() => mesActivites.filter((a) => a.date === todayFr()), [mesActivites]);
  const appelsAuj = useMemo(() => activitesAuj.filter((a) => a.type === 'Appel'), [activitesAuj]);
  const appelsFaits = appelsAuj.length;
  const objectifAppels = getObjectiveForCommercial(CURRENT_COMMERCIAL.id, objectives)?.appelsJour ?? 40;
  const tauxReponse = appelsAuj.length > 0 ? Math.round((appelsAuj.filter((a) => a.resultat === 'Répondu' || a.resultat === 'Positif').length / appelsAuj.length) * 100) : 0;
  const mesFollowups = useMemo(() => followups.filter((f) => f.commercialId === CURRENT_COMMERCIAL.id && f.status === 'Planifiée'), [followups]);
  const pct = Math.min(100, Math.round((appelsFaits / objectifAppels) * 100));

  const contactsPrioritaires = useMemo(
    () =>
      contacts
        .filter((c) => c.aRappeler || c.priorite === 'Haute')
        .slice(0, 4),
    [contacts],
  );

  const journal = useMemo(() => [...mesActivites].sort((a, b) => (a.date === b.date ? b.heureDebut.localeCompare(a.heureDebut) : b.date.localeCompare(a.date))).slice(0, 6), [mesActivites]);

  const [quickModal, setQuickModal] = useState<QuickModal>(null);

  const [ticketContactId, setTicketContactId] = useState('');
  const [ticketResult, setTicketResult] = useState<CallResult>('Répondu');
  const [ticketSummary, setTicketSummary] = useState('');
  const [ticketFollowUp, setTicketFollowUp] = useState(false);
  const [ticketFollowUpDate, setTicketFollowUpDate] = useState('');
  const [ticketFollowUpTime, setTicketFollowUpTime] = useState('09:00');

  const [rappelContact, setRappelContact] = useState('');
  const [rappelDate, setRappelDate] = useState('');
  const [rappelHeure, setRappelHeure] = useState('09:00');
  const [noteTexte, setNoteTexte] = useState('');

  function resetTicketForm() {
    setTicketContactId('');
    setTicketResult('Répondu');
    setTicketSummary('');
    setTicketFollowUp(false);
    setTicketFollowUpDate('');
    setTicketFollowUpTime('09:00');
  }

  function logAppel(contact?: Contact) {
    createCallTicket({
      commercialId: CURRENT_COMMERCIAL.id,
      commercialNom: CURRENT_COMMERCIAL.nom,
      contactId: contact?.id ?? generateId('contact'),
      contactNom: contact?.nom ?? 'Contact',
      contactType: contact ? 'Portefeuille' : 'Portefeuille',
      entrepriseId: contact?.entrepriseId,
      durationSeconds: 0,
      result: 'Répondu',
      summary: contact ? `Appel sortant vers ${contact.nom}.` : 'Appel sortant enregistré.',
      followUpRequired: false,
    });
    notify(contact ? `Appel avec ${contact.nom} enregistré.` : 'Appel enregistré.');
  }

  function submitTicket(e: React.FormEvent) {
    e.preventDefault();
    const contact = contacts.find((c) => c.id === ticketContactId);
    if (!contact || !ticketSummary.trim()) return;
    createCallTicket({
      commercialId: CURRENT_COMMERCIAL.id,
      commercialNom: CURRENT_COMMERCIAL.nom,
      contactId: contact.id,
      contactNom: contact.nom,
      contactType: 'Portefeuille',
      entrepriseId: contact.entrepriseId,
      durationSeconds: 0,
      result: ticketResult,
      summary: ticketSummary.trim(),
      followUpRequired: ticketFollowUp,
      followUpDate: ticketFollowUp ? ticketFollowUpDate || todayFr() : undefined,
      followUpTime: ticketFollowUp ? ticketFollowUpTime : undefined,
    });
    notify('Ticket d’appel enregistré.');
    setQuickModal(null);
    resetTicketForm();
  }

  function submitRappel(e: React.FormEvent) {
    e.preventDefault();
    if (!rappelContact.trim() || !rappelDate) return;
    addFollowUp({
      id: generateId('followup'),
      contactNom: rappelContact.trim(),
      commercialId: CURRENT_COMMERCIAL.id,
      commercialNom: CURRENT_COMMERCIAL.nom,
      dueDate: rappelDate,
      dueTime: rappelHeure,
      note: `Rappel planifié pour ${rappelContact.trim()}.`,
      status: 'Planifiée',
      createdAt: new Date().toISOString(),
    });
    notify('Rappel planifié.');
    setQuickModal(null);
    setRappelContact('');
    setRappelDate('');
  }

  function submitNote(e: React.FormEvent) {
    e.preventDefault();
    if (!noteTexte.trim()) return;
    const now = new Date();
    addActivite({
      id: generateId('act'),
      entrepriseId: '',
      entrepriseNom: '—',
      contact: CURRENT_COMMERCIAL.nom,
      commercialId: CURRENT_COMMERCIAL.id,
      commercial: CURRENT_COMMERCIAL.nom,
      date: todayFr(),
      heureDebut: now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      duree: '-',
      type: 'Note',
      resultat: '—' as ResultatActivite,
      resume: noteTexte.trim(),
      prochaineAction: 'Aucune action planifiée',
      statut: 'Terminé',
    });
    notify('Note ajoutée.');
    setQuickModal(null);
    setNoteTexte('');
  }

  return (
    <div>
      <header className="mb-xl flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h1 className="text-headline-lg font-bold text-amud-primary md:text-headline-lg">Bonjour {CURRENT_COMMERCIAL.nom.split(' ')[0]} 👋</h1>
          <p className="mt-2 text-body-md text-amud-on-surface-variant">Voici votre activité commerciale du jour.</p>
        </div>
        <button
          onClick={() => logAppel()}
          className="flex items-center gap-2 whitespace-nowrap rounded-lg bg-amud-primary px-4 py-2 text-label-sm font-medium text-white shadow-sm transition-colors hover:bg-amud-primary-dark"
        >
          <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
            add_call
          </span>
          Appel
        </button>
      </header>

      <div className="grid grid-cols-1 gap-gutter lg:grid-cols-12">
        <div className="space-y-gutter lg:col-span-8">
          <div className="relative overflow-hidden rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-lg shadow-[0_4px_12px_rgba(0,0,0,0.02)]">
            <div className="absolute bottom-0 left-0 top-0 w-2 bg-amud-primary" />
            <div className="pl-2">
              <div className="mb-6 flex items-start justify-between">
                <div>
                  <h2 className="text-title-lg text-amud-on-surface">Objectif d&apos;appels aujourd&apos;hui</h2>
                  <p className="mt-1 text-body-md text-amud-on-surface-variant">Progression vers votre cible journalière</p>
                </div>
                <span className="material-symbols-outlined text-3xl text-amud-primary">target</span>
              </div>
              <div className="mb-4 flex items-baseline gap-4">
                <span className="text-display-lg text-amud-primary">
                  <CountUp value={appelsFaits} />
                </span>
                <span className="text-headline-md text-amud-on-surface-variant">/ {objectifAppels}</span>
                <span className="ml-auto rounded-full bg-amud-primary-container px-2 py-1 text-label-md text-white">{pct}%</span>
              </div>
              <div className="mb-4 h-3 w-full overflow-hidden rounded-full bg-amud-surface-container-high">
                <div className="h-3 rounded-full bg-amud-primary transition-all duration-500 ease-out" style={{ width: `${pct}%` }} />
              </div>
              <div className="flex justify-between text-label-sm text-amud-on-surface-variant">
                <span>Terminé: {appelsFaits}</span>
                <span>Restant: {Math.max(0, objectifAppels - appelsFaits)}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-md md:grid-cols-3">
            <div className="rounded-lg border border-amud-outline-variant bg-amud-surface-container-lowest p-md transition-shadow hover:shadow-[0_4px_12px_rgba(0,0,0,0.02)]">
              <div className="mb-2 flex items-center gap-2 text-amud-on-surface-variant">
                <span className="material-symbols-outlined text-xl">phone_in_talk</span>
                <span className="text-label-md">Taux de réponse</span>
              </div>
              <span className="text-headline-md text-amud-on-surface">
                <CountUp value={tauxReponse} formatter={(n) => `${n}%`} />
              </span>
            </div>
            <div className="rounded-lg border border-amud-outline-variant bg-amud-surface-container-lowest p-md transition-shadow hover:shadow-[0_4px_12px_rgba(0,0,0,0.02)]">
              <div className="mb-2 flex items-center gap-2 text-amud-on-surface-variant">
                <span className="material-symbols-outlined text-xl">event</span>
                <span className="text-label-md">Rendez-vous</span>
              </div>
              <span className="text-headline-md text-amud-on-surface">
                <CountUp value={rdvsAll.length} />
              </span>
            </div>
            <div className="rounded-lg border border-amud-outline-variant bg-amud-surface-container-lowest p-md transition-shadow hover:shadow-[0_4px_12px_rgba(0,0,0,0.02)]">
              <div className="mb-2 flex items-center gap-2 text-amud-on-surface-variant">
                <span className="material-symbols-outlined text-xl">notification_important</span>
                <span className="text-label-md">Rappels</span>
              </div>
              <span className="text-headline-md text-amud-on-surface">
                <CountUp value={mesFollowups.length} />
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-md md:grid-cols-4">
            <button
              onClick={() => logAppel()}
              className="flex flex-col items-center justify-center gap-2 rounded-lg bg-amud-primary p-4 text-white shadow-sm transition-colors hover:bg-amud-primary-dark"
            >
              <span className="material-symbols-outlined">add_call</span>
              <span className="text-label-sm">Nouvel appel</span>
            </button>
            <button
              onClick={() => setQuickModal('ticket')}
              className="flex flex-col items-center justify-center gap-2 rounded-lg border border-amud-outline-variant bg-amud-surface-container-lowest p-4 text-amud-primary transition-colors hover:bg-amud-surface-container-low"
            >
              <span className="material-symbols-outlined">confirmation_number</span>
              <span className="text-label-sm">Nouveau ticket</span>
            </button>
            <button
              onClick={() => setQuickModal('rappel')}
              className="flex flex-col items-center justify-center gap-2 rounded-lg border border-amud-outline-variant bg-amud-surface-container-lowest p-4 text-amud-primary transition-colors hover:bg-amud-surface-container-low"
            >
              <span className="material-symbols-outlined">schedule</span>
              <span className="text-label-sm">Planifier rappel</span>
            </button>
            <button
              onClick={() => setQuickModal('note')}
              className="flex flex-col items-center justify-center gap-2 rounded-lg border border-amud-outline-variant bg-amud-surface-container-lowest p-4 text-amud-primary transition-colors hover:bg-amud-surface-container-low"
            >
              <span className="material-symbols-outlined">note_add</span>
              <span className="text-label-sm">Ajouter note</span>
            </button>
          </div>
        </div>

        <div className="space-y-gutter lg:col-span-4">
          <div className="rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-lg shadow-[0_4px_12px_rgba(0,0,0,0.02)]">
            <h3 className="mb-4 text-title-lg text-amud-on-surface">Contacts prioritaires</h3>
            <div className="flex flex-col gap-4">
              {contactsPrioritaires.map((c) => (
                <div key={c.id} className="group relative overflow-hidden rounded-lg border border-amud-outline-variant p-md transition-shadow hover:shadow-[0_4px_12px_rgba(0,0,0,0.02)]">
                  <div className={`absolute bottom-0 left-0 top-0 w-1 ${c.priorite === 'Haute' ? 'bg-amud-secondary' : 'bg-amud-tertiary-fixed-dim'}`} />
                  <div className="mb-2 flex items-start justify-between pl-2">
                    <div>
                      <h4 className="text-label-md font-semibold">{c.nom}</h4>
                      <span className="text-label-sm text-amud-on-surface-variant">
                        {c.type} • {c.ville}
                      </span>
                    </div>
                    <span className="rounded bg-amud-secondary/10 px-2 py-0.5 text-label-sm text-amud-secondary">{c.priorite}</span>
                  </div>
                  <div className="mt-3 flex items-center justify-between border-t border-amud-outline-variant/30 pl-2 pt-2">
                    <span className="flex items-center gap-1 text-label-sm text-amud-on-surface-variant">
                      <span className="material-symbols-outlined text-[14px]">history</span> {c.dernierContact}
                    </span>
                    <button onClick={() => logAppel(c)} className="flex items-center gap-1 text-label-sm text-amud-primary hover:text-amud-primary-dark">
                      <span className="material-symbols-outlined text-[16px]">call</span> Appeler
                    </button>
                  </div>
                </div>
              ))}
              {contactsPrioritaires.length === 0 ? <p className="text-label-sm text-amud-on-surface-variant">Aucun contact prioritaire pour le moment.</p> : null}
            </div>
          </div>

          <div className="rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-lg shadow-[0_4px_12px_rgba(0,0,0,0.02)]">
            <h3 className="mb-4 text-title-lg text-amud-on-surface">Activité récente</h3>
            <div className="relative ml-3 space-y-6 border-l border-amud-outline-variant">
              {journal.map((item, i) => (
                <div key={item.id} className="relative animate-amud-rise-in pl-6">
                  <div className={`absolute -left-1.5 top-1.5 h-3 w-3 rounded-full ring-4 ring-amud-surface-container-lowest ${i === 0 ? 'bg-amud-primary' : 'bg-amud-surface-variant'}`} />
                  <p className="text-label-md font-semibold">
                    {item.type} - {item.entrepriseNom !== '—' ? item.entrepriseNom : item.contact} — {item.resume}
                  </p>
                  <span className="text-label-sm text-amud-on-surface-variant/70">{item.heureDebut}</span>
                </div>
              ))}
              {journal.length === 0 ? <p className="text-label-sm text-amud-on-surface-variant">Aucune activité récente.</p> : null}
            </div>
          </div>
        </div>
      </div>

      <Modal
        open={quickModal === 'ticket'}
        onClose={() => setQuickModal(null)}
        title="Nouveau ticket d'appel"
        widthClassName="max-w-md"
        footer={
          <div className="flex justify-end gap-sm">
            <button type="button" onClick={() => setQuickModal(null)} className="rounded-lg border border-amud-outline-variant px-lg py-2 text-label-md text-amud-on-surface transition-colors hover:bg-amud-surface-container-low">
              Annuler
            </button>
            <button type="submit" form="ticket-form" className="rounded-lg bg-amud-primary px-lg py-2 text-label-md font-medium text-white shadow-sm transition-colors hover:bg-amud-primary-dark">
              Enregistrer
            </button>
          </div>
        }
      >
        <form id="ticket-form" onSubmit={submitTicket} className="flex flex-col gap-md">
          <div>
            <label className="mb-1 block text-label-md text-amud-on-surface-variant">Contact</label>
            <select value={ticketContactId} onChange={(e) => setTicketContactId(e.target.value)} required className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary">
              <option value="">Sélectionner un contact…</option>
              {contacts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nom} ({c.type})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-label-md text-amud-on-surface-variant">Résultat</label>
            <select value={ticketResult} onChange={(e) => setTicketResult(e.target.value as CallResult)} className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary">
              {CALL_RESULTS.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-label-md text-amud-on-surface-variant">Résumé</label>
            <textarea autoFocus value={ticketSummary} onChange={(e) => setTicketSummary(e.target.value)} required rows={3} className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary" />
          </div>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={ticketFollowUp} onChange={(e) => setTicketFollowUp(e.target.checked)} className="h-4 w-4 rounded border-amud-outline text-amud-primary focus:ring-amud-primary" />
            <span className="text-label-md text-amud-on-surface">Planifier un rappel</span>
          </label>
          {ticketFollowUp ? (
            <div className="grid grid-cols-2 gap-md">
              <input type="date" value={ticketFollowUpDate} onChange={(e) => setTicketFollowUpDate(e.target.value)} className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary" />
              <input type="time" value={ticketFollowUpTime} onChange={(e) => setTicketFollowUpTime(e.target.value)} className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary" />
            </div>
          ) : null}
        </form>
      </Modal>

      <Modal
        open={quickModal === 'rappel'}
        onClose={() => setQuickModal(null)}
        title="Planifier un rappel"
        widthClassName="max-w-md"
        footer={
          <div className="flex justify-end gap-sm">
            <button type="button" onClick={() => setQuickModal(null)} className="rounded-lg border border-amud-outline-variant px-lg py-2 text-label-md text-amud-on-surface transition-colors hover:bg-amud-surface-container-low">
              Annuler
            </button>
            <button type="submit" form="rappel-form" className="rounded-lg bg-amud-primary px-lg py-2 text-label-md font-medium text-white shadow-sm transition-colors hover:bg-amud-primary-dark">
              Planifier
            </button>
          </div>
        }
      >
        <form id="rappel-form" onSubmit={submitRappel} className="flex flex-col gap-md">
          <div>
            <label className="mb-1 block text-label-md text-amud-on-surface-variant">Contact</label>
            <input autoFocus value={rappelContact} onChange={(e) => setRappelContact(e.target.value)} required className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary" type="text" />
          </div>
          <div className="grid grid-cols-2 gap-md">
            <div>
              <label className="mb-1 block text-label-md text-amud-on-surface-variant">Date</label>
              <input value={rappelDate} onChange={(e) => setRappelDate(e.target.value)} required className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary" type="date" />
            </div>
            <div>
              <label className="mb-1 block text-label-md text-amud-on-surface-variant">Heure</label>
              <input value={rappelHeure} onChange={(e) => setRappelHeure(e.target.value)} className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary" type="time" />
            </div>
          </div>
        </form>
      </Modal>

      <Modal
        open={quickModal === 'note'}
        onClose={() => setQuickModal(null)}
        title="Ajouter une note"
        widthClassName="max-w-md"
        footer={
          <div className="flex justify-end gap-sm">
            <button type="button" onClick={() => setQuickModal(null)} className="rounded-lg border border-amud-outline-variant px-lg py-2 text-label-md text-amud-on-surface transition-colors hover:bg-amud-surface-container-low">
              Annuler
            </button>
            <button type="submit" form="note-form" className="rounded-lg bg-amud-primary px-lg py-2 text-label-md font-medium text-white shadow-sm transition-colors hover:bg-amud-primary-dark">
              Ajouter
            </button>
          </div>
        }
      >
        <form id="note-form" onSubmit={submitNote} className="flex flex-col gap-md">
          <label className="block text-label-md text-amud-on-surface-variant">Note</label>
          <textarea autoFocus value={noteTexte} onChange={(e) => setNoteTexte(e.target.value)} required rows={3} className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary" />
        </form>
      </Modal>
    </div>
  );
}
