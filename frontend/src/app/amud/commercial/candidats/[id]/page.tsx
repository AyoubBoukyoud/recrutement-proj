'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { Avatar, Badge, EmptyState, Modal, StatCard, Tabs, type BadgeTone } from '@/components/amud/ui';
import { useToast } from '@/components/amud/Toast';
import { useCollection } from '@/lib/amud/storage/useCollection';
import { CURRENT_COMMERCIAL } from '@/data/amud/currentCommercial';
import { candidatesSeed, type StatutCandidate } from '@/data/amud/candidates';
import { candidatesCollection } from '@/lib/amud/localCandidates';
import { activitesSeed, RESULTAT_CLASS, TYPE_ICON, type Activite } from '@/data/amud/commercialActivites';
import { activitesCollection } from '@/lib/amud/localCommercialActivites';
import { callTicketsSeed, type CallResult } from '@/data/amud/callTickets';
import { callTicketsCollection } from '@/lib/amud/localCallTickets';
import { followupsSeed } from '@/data/amud/followups';
import { followupsCollection } from '@/lib/amud/localFollowUps';
import { applicationsSeed } from '@/data/amud/applications';
import { applicationsCollection } from '@/lib/amud/localApplications';
import { rendezVousCollection } from '@/lib/amud/localRendezVous';
import { buildSeedRdvs } from '@/data/amud/commercialRdv';
import { commercialCandidatePrefsSeed, PRIORITE_CANDIDAT_CLASS, PRIORITES_CANDIDAT, getPrefForCandidate, type PrioriteCandidat } from '@/data/amud/commercialCandidatePrefs';
import { commercialCandidatePrefsCollection, toggleCommercialCandidateFavorite, setCommercialCandidatePriority } from '@/lib/amud/localCommercialCandidatePrefs';
import { commercialCandidateNotesSeed, getCommercialNotesForCandidate } from '@/data/amud/commercialCandidateNotes';
import { commercialCandidateNotesCollection } from '@/lib/amud/localCommercialCandidateNotes';
import { createCallTicket } from '@/lib/amud/callTicketCascade';
import { generateId } from '@/lib/amud/storage/ids';
import { pushNotification } from '@/lib/amud/storage/notify';
import { logAudit } from '@/lib/amud/storage/audit';

const STATUT_TONE: Record<StatutCandidate, BadgeTone> = { Actif: 'success', Inactif: 'neutral', Bloqué: 'danger' };
const CALL_RESULTS: CallResult[] = ['Répondu', 'Pas de réponse', 'Ligne occupée', 'Téléphone éteint', 'Numéro incorrect', 'Refus', 'Intéressé', 'À rappeler', 'Rendez-vous fixé'];

const TABS = [
  { id: 'overview', label: "Vue d'ensemble" },
  { id: 'profil', label: 'Profil' },
  { id: 'competences', label: 'Compétences' },
  { id: 'experiences', label: 'Expériences' },
  { id: 'candidatures', label: 'Candidatures' },
  { id: 'activites', label: 'Activités' },
  { id: 'historique', label: 'Historique' },
  { id: 'notes', label: 'Notes' },
];

function todayFr() {
  return new Date().toLocaleDateString('fr-FR');
}
function nowFr() {
  return new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

export default function AmudCommercialCandidatDetailPage() {
  const params = useParams<{ id: string }>();
  const notify = useToast();
  const [tab, setTab] = useState('overview');

  const [candidates] = useCollection(candidatesCollection, candidatesSeed);
  const candidate = useMemo(() => candidates.find((c) => c.id === params.id) ?? null, [candidates, params.id]);

  const [allActivites, { add: addActivite }] = useCollection(activitesCollection, activitesSeed);
  const [allCallTickets] = useCollection(callTicketsCollection, callTicketsSeed);
  const [allFollowups, { add: addFollowUp }] = useCollection(followupsCollection, followupsSeed);
  const [allApplications] = useCollection(applicationsCollection, applicationsSeed);
  const [allPrefs] = useCollection(commercialCandidatePrefsCollection, commercialCandidatePrefsSeed);
  const [allNotes, { add: addNote }] = useCollection(commercialCandidateNotesCollection, commercialCandidateNotesSeed);
  const [rdvsAll, { add: addRdv }] = useCollection(rendezVousCollection, buildSeedRdvs());

  const [ticketModal, setTicketModal] = useState<'appel' | 'ticket' | 'rappel' | 'rdv' | 'note' | null>(null);

  const activites = useMemo(
    () => (candidate ? allActivites.filter((a) => a.contact === candidate.nom).sort((a, b) => (a.date === b.date ? b.heureDebut.localeCompare(a.heureDebut) : b.date.localeCompare(a.date))) : []),
    [allActivites, candidate],
  );
  const callTickets = useMemo(
    () => (candidate ? allCallTickets.filter((t) => t.contactType === 'Candidat' && t.contactId === candidate.id) : []),
    [allCallTickets, candidate],
  );
  const followups = useMemo(
    () => (candidate ? allFollowups.filter((f) => f.contactType === 'Candidat' && f.contactId === candidate.id) : []),
    [allFollowups, candidate],
  );
  const openFollowup = useMemo(() => followups.find((f) => f.status === 'Planifiée'), [followups]);
  const candidatures = useMemo(() => (candidate ? allApplications.filter((a) => a.candidateId === candidate.id) : []), [allApplications, candidate]);
  const notes = useMemo(() => (candidate ? getCommercialNotesForCandidate(CURRENT_COMMERCIAL.id, candidate.id, allNotes) : []), [allNotes, candidate]);
  const pref = useMemo(() => (candidate ? getPrefForCandidate(CURRENT_COMMERCIAL.id, candidate.id, allPrefs) : undefined), [allPrefs, candidate]);

  if (candidate === null) {
    return (
      <div className="mx-auto max-w-xl rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-xl text-center">
        <span className="material-symbols-outlined mb-md text-4xl text-amud-outline">person_off</span>
        <h2 className="text-title-lg text-amud-on-surface">Candidat introuvable</h2>
        <p className="mt-2 text-body-md text-amud-on-surface-variant">Aucune fiche ne correspond à &quot;{params.id}&quot;.</p>
        <Link href="/amud/commercial/candidats" className="mt-4 inline-block text-amud-primary hover:underline">
          Retour aux candidats
        </Link>
      </div>
    );
  }

  const c = candidate;

  function handleFavori() {
    const { favori } = toggleCommercialCandidateFavorite(CURRENT_COMMERCIAL.id, c.id, allPrefs);
    notify(favori ? `${c.nom} ajouté(e) aux favoris.` : `${c.nom} retiré(e) des favoris.`);
  }

  function handlePriorite(p: PrioriteCandidat) {
    setCommercialCandidatePriority(CURRENT_COMMERCIAL.id, c.id, p, allPrefs);
    notify(`Priorité définie sur « ${p} ».`);
  }

  function handleQuickCall() {
    createCallTicket({
      commercialId: CURRENT_COMMERCIAL.id,
      commercialNom: CURRENT_COMMERCIAL.nom,
      contactId: c.id,
      contactNom: c.nom,
      contactType: 'Candidat',
      durationSeconds: 0,
      result: 'Répondu',
      summary: `Appel sortant vers ${c.nom}.`,
      followUpRequired: false,
    });
    notify(`Appel avec ${c.nom} enregistré.`);
  }

  return (
    <div className="mx-auto max-w-[1200px]">
      <section className="relative mb-lg overflow-hidden rounded-xl border border-amud-outline-variant/30 bg-amud-surface-container-lowest p-lg shadow-[0_4px_12px_rgba(0,0,0,0.02)]">
        <div className="absolute bottom-0 left-0 top-0 w-2 bg-amud-primary" />
        <div className="flex flex-col items-start justify-between gap-lg lg:flex-row lg:items-center">
          <div className="flex items-start gap-lg">
            <Avatar name={c.nom} size="lg" />
            <div>
              <div className="mb-1 flex flex-wrap items-center gap-sm">
                <h1 className="text-headline-lg text-amud-on-surface">{c.nom}</h1>
                <Badge tone={STATUT_TONE[c.statut]}>{c.statut}</Badge>
                {pref ? <span className={`inline-flex w-fit items-center whitespace-nowrap rounded-full border border-transparent px-2.5 py-0.5 text-xs font-medium ${PRIORITE_CANDIDAT_CLASS[pref.priorite]}`}>{pref.priorite}</span> : null}
                <button
                  type="button"
                  onClick={handleFavori}
                  title={pref?.favori ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-amud-tertiary transition-colors hover:bg-amud-surface-container-low"
                >
                  <span className="material-symbols-outlined" style={pref?.favori ? { fontVariationSettings: "'FILL' 1" } : undefined}>
                    star
                  </span>
                </button>
              </div>
              <p className="flex flex-wrap items-center gap-xs text-title-lg text-amud-on-surface-variant">
                {c.posteRecherche}
                <span className="text-amud-outline-variant">•</span>
                <span className="material-symbols-outlined text-sm">location_on</span> {c.ville}
              </p>
              <div className="mt-sm flex flex-wrap gap-md text-label-md text-amud-on-surface-variant">
                <a href={`tel:${c.telephone}`} className="flex items-center gap-xs hover:text-amud-primary">
                  <span className="material-symbols-outlined text-sm">phone</span> {c.telephone}
                </a>
                <a href={`mailto:${c.email}`} className="flex items-center gap-xs hover:text-amud-primary">
                  <span className="material-symbols-outlined text-sm">mail</span> {c.email}
                </a>
                <span className="flex items-center gap-xs">
                  <span className="material-symbols-outlined text-sm">history</span> Dernière activité : {c.dernierAcces}
                </span>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-sm">
            <button onClick={handleQuickCall} className="flex items-center gap-xs rounded-lg bg-amud-primary px-md py-sm text-label-md text-white transition-opacity hover:opacity-90">
              <span className="material-symbols-outlined text-sm">call</span> Appeler
            </button>
            <button onClick={() => setTicketModal('ticket')} className="flex items-center gap-xs rounded-lg border border-amud-outline-variant px-md py-sm text-label-md text-amud-on-surface transition-colors hover:bg-amud-surface-container-low">
              <span className="material-symbols-outlined text-sm">confirmation_number</span> Créer un ticket
            </button>
            <button onClick={() => setTicketModal('rappel')} className="flex items-center gap-xs rounded-lg border border-amud-outline-variant px-md py-sm text-label-md text-amud-on-surface transition-colors hover:bg-amud-surface-container-low">
              <span className="material-symbols-outlined text-sm">schedule</span> Programmer un rappel
            </button>
            <button onClick={() => setTicketModal('rdv')} className="flex items-center gap-xs rounded-lg border border-amud-outline-variant px-md py-sm text-label-md text-amud-on-surface transition-colors hover:bg-amud-surface-container-low">
              <span className="material-symbols-outlined text-sm">event</span> Planifier un rendez-vous
            </button>
            <button onClick={() => setTicketModal('note')} className="flex items-center justify-center rounded-lg border border-amud-outline-variant p-sm text-amud-on-surface transition-colors hover:bg-amud-surface-container-low" title="Ajouter une note">
              <span className="material-symbols-outlined">note_add</span>
            </button>
          </div>
        </div>
      </section>

      <div className="mb-lg">
        <Tabs tabs={TABS} active={tab} onChange={setTab} />
      </div>

      {tab === 'overview' ? (
        <div className="grid grid-cols-1 gap-lg lg:grid-cols-3">
          <div className="flex flex-col gap-lg lg:col-span-2">
            <div className="grid grid-cols-2 gap-md md:grid-cols-4">
              <StatCard icon="history" value={activites.length} label="Activités" />
              <StatCard icon="call" value={callTickets.length} label="Appels" />
              <StatCard icon="work" value={candidatures.length} label="Candidatures" />
              <StatCard icon="event" value={callTickets.filter((t) => t.result === 'Rendez-vous fixé').length} label="Rendez-vous" />
            </div>
            <div className="rounded-xl border border-amud-outline-variant/30 bg-amud-surface-container-lowest p-lg">
              <div className="mb-md flex items-center justify-between">
                <h3 className="text-title-lg text-amud-on-surface">Historique récent</h3>
                <button onClick={() => setTab('historique')} className="text-label-sm text-amud-primary hover:underline">
                  Voir tout l&apos;historique
                </button>
              </div>
              {activites.length === 0 ? (
                <EmptyState icon="history_toggle_off" title="Aucune activité" description="Aucune activité enregistrée pour ce candidat." compact />
              ) : (
                <div className="flex flex-col gap-md">
                  {activites.slice(0, 4).map((a) => (
                    <ActiviteCard key={a.id} activite={a} />
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-lg">
            {openFollowup ? (
              <div className="rounded-xl border border-amud-tertiary-fixed-dim bg-amud-tertiary-fixed/30 p-lg">
                <h3 className="mb-2 flex items-center gap-2 text-title-lg text-amud-on-surface">
                  <span className="material-symbols-outlined text-amud-tertiary">notification_important</span> Rappel prévu
                </h3>
                <p className="text-body-md text-amud-on-surface">{openFollowup.dueDate} à {openFollowup.dueTime}</p>
                <p className="mt-1 text-label-sm text-amud-on-surface-variant">{openFollowup.note}</p>
              </div>
            ) : null}
            <div className="rounded-xl border border-amud-outline-variant/30 bg-amud-surface-container-lowest p-lg">
              <h3 className="mb-md text-title-lg text-amud-on-surface">Priorité</h3>
              <div className="flex flex-wrap gap-sm">
                {PRIORITES_CANDIDAT.map((p) => (
                  <button
                    key={p}
                    onClick={() => handlePriorite(p)}
                    className={`rounded-full border px-3 py-1.5 text-label-sm font-medium transition-colors ${
                      (pref?.priorite ?? 'Normale') === p ? PRIORITE_CANDIDAT_CLASS[p] + ' border-transparent' : 'border-amud-outline-variant text-amud-on-surface-variant hover:bg-amud-surface-container-low'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {tab === 'profil' ? (
        <div className="rounded-xl border border-amud-outline-variant/30 bg-amud-surface-container-lowest p-lg">
          <h3 className="mb-md text-title-lg text-amud-on-surface">Informations du candidat</h3>
          <div className="grid grid-cols-1 gap-md sm:grid-cols-2">
            {[
              { icon: 'badge', label: 'Nom complet', value: c.nom },
              { icon: 'work', label: 'Poste recherché', value: c.posteRecherche },
              { icon: 'location_on', label: 'Ville', value: c.ville },
              { icon: 'phone', label: 'Téléphone', value: c.telephone },
              { icon: 'mail', label: 'Email', value: c.email },
              { icon: 'event_available', label: 'Disponibilité', value: c.disponibilite },
              { icon: 'verified', label: 'Statut', value: c.statut },
              { icon: 'star_rate', label: 'Score', value: String(c.score) },
              { icon: 'calendar_month', label: 'Créé le', value: c.creeLe },
              { icon: 'support_agent', label: 'Commercial responsable', value: c.commercialResponsable ?? '—' },
            ].map((r) => (
              <div key={r.label} className="flex items-start gap-sm">
                <span className="material-symbols-outlined mt-0.5 text-amud-primary">{r.icon}</span>
                <div className="min-w-0">
                  <p className="text-label-sm text-amud-on-surface-variant">{r.label}</p>
                  <p className="truncate text-body-md text-amud-on-surface">{r.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {tab === 'competences' ? (
        <div className="rounded-xl border border-amud-outline-variant/30 bg-amud-surface-container-lowest p-lg">
          <h3 className="mb-md text-title-lg text-amud-on-surface">Compétences</h3>
          {c.competences.length === 0 ? (
            <EmptyState icon="psychology" title="Aucune compétence renseignée" compact />
          ) : (
            <div className="flex flex-wrap gap-sm">
              {c.competences.map((comp) => (
                <Badge key={comp} tone="info" className="text-label-md">
                  {comp}
                </Badge>
              ))}
            </div>
          )}
        </div>
      ) : null}

      {tab === 'experiences' ? (
        <div className="rounded-xl border border-amud-outline-variant/30 bg-amud-surface-container-lowest p-lg">
          <h3 className="mb-md text-title-lg text-amud-on-surface">Expériences</h3>
          <EmptyState
            icon="work_history"
            title="Détail d'expérience non disponible"
            description={`Le profil ne contient pas d'historique de postes détaillé. Poste recherché actuel : ${c.posteRecherche}, disponibilité : ${c.disponibilite}.`}
            compact
          />
        </div>
      ) : null}

      {tab === 'candidatures' ? (
        <div className="overflow-hidden rounded-xl border border-amud-outline-variant/30 bg-amud-surface-container-lowest">
          {candidatures.length === 0 ? (
            <div className="p-lg">
              <EmptyState icon="work_off" title="Aucune candidature" description="Ce candidat n'a pas encore de candidature enregistrée." compact />
            </div>
          ) : (
            <div className="divide-y divide-amud-outline-variant">
              {candidatures.map((a) => (
                <div key={a.id} className="flex flex-col gap-2 p-md sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="font-medium text-amud-on-surface">{a.offerTitre}</p>
                    <p className="text-label-sm text-amud-on-surface-variant">{a.entrepriseNom}</p>
                  </div>
                  <Badge tone="info">{a.status}</Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : null}

      {tab === 'activites' ? (
        <div className="rounded-xl border border-amud-outline-variant/30 bg-amud-surface-container-lowest p-lg">
          <div className="mb-md flex items-center justify-between">
            <h3 className="text-title-lg text-amud-on-surface">Activités</h3>
            <Link href={`/amud/commercial/activites?q=${encodeURIComponent(c.nom)}`} className="text-label-sm text-amud-primary hover:underline">
              Voir dans Activités
            </Link>
          </div>
          {activites.length === 0 ? (
            <EmptyState icon="history_toggle_off" title="Aucune activité" description="Aucune activité enregistrée pour ce candidat." compact />
          ) : (
            <div className="flex flex-col gap-md">
              {activites.map((a) => (
                <ActiviteCard key={a.id} activite={a} />
              ))}
            </div>
          )}
        </div>
      ) : null}

      {tab === 'historique' ? (
        <div className="rounded-xl border border-amud-outline-variant/30 bg-amud-surface-container-lowest p-lg">
          <h3 className="mb-md text-title-lg text-amud-on-surface">Historique commercial</h3>
          {activites.length === 0 ? (
            <EmptyState icon="history_toggle_off" title="Aucun historique" description="Aucun appel, note ou rendez-vous enregistré pour ce candidat." compact />
          ) : (
            <div className="relative ml-sm space-y-6 border-l border-amud-outline-variant">
              {activites.map((a) => (
                <div key={a.id} className="relative pl-lg">
                  <div className="absolute -left-[6.5px] top-1 h-3 w-3 rounded-full bg-amud-primary ring-4 ring-amud-surface-container-lowest" />
                  <div className="mb-xs flex flex-wrap items-center justify-between gap-2">
                    <span className="flex items-center gap-xs text-label-md font-bold text-amud-on-surface">
                      <span className="material-symbols-outlined text-sm text-amud-primary">{TYPE_ICON[a.type]}</span> {a.type}
                    </span>
                    <span className="text-label-sm text-amud-outline">
                      {a.date} — {a.heureDebut}
                    </span>
                  </div>
                  <p className="text-label-sm text-amud-on-surface-variant">Durée : {a.duree}</p>
                  <span className={`mt-1 inline-flex items-center rounded-full border px-2.5 py-0.5 text-[12px] font-medium ${RESULTAT_CLASS[a.resultat]}`}>Résultat : {a.resultat}</span>
                  <p className="mt-2 text-body-md text-amud-on-surface">{a.resume}</p>
                  <p className="mt-1 text-label-sm font-medium text-amud-tertiary">Prochaine action : {a.prochaineAction}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : null}

      {tab === 'notes' ? (
        <div className="rounded-xl border border-amud-outline-variant/30 bg-amud-surface-container-lowest p-lg">
          <div className="mb-md flex items-center justify-between">
            <h3 className="text-title-lg text-amud-on-surface">Notes</h3>
            <button onClick={() => setTicketModal('note')} className="flex items-center gap-xs rounded-lg bg-amud-primary px-3 py-1.5 text-label-sm text-white hover:bg-amud-primary-dark">
              <span className="material-symbols-outlined text-[18px]">add</span> Ajouter une note
            </button>
          </div>
          {notes.length === 0 ? (
            <EmptyState icon="sticky_note_2" title="Aucune note" description="Aucune note pour ce candidat." compact />
          ) : (
            <div className="flex flex-col gap-sm">
              {notes.map((n) => (
                <div key={n.id} className="rounded-lg border border-amud-outline-variant bg-amud-surface p-md">
                  <p className="text-body-md text-amud-on-surface">{n.text}</p>
                  <p className="mt-2 text-label-sm text-amud-on-surface-variant">
                    {n.authorNom} · {new Date(n.createdAt).toLocaleString('fr-FR')}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : null}

      <TicketModal
        open={ticketModal === 'ticket'}
        onClose={() => setTicketModal(null)}
        onSubmit={(input) => {
          createCallTicket({
            commercialId: CURRENT_COMMERCIAL.id,
            commercialNom: CURRENT_COMMERCIAL.nom,
            contactId: c.id,
            contactNom: c.nom,
            contactType: 'Candidat',
            durationSeconds: 0,
            result: input.result,
            summary: input.summary,
            followUpRequired: input.followUp,
            followUpDate: input.followUp ? input.followUpDate || todayFr() : undefined,
            followUpTime: input.followUp ? input.followUpTime : undefined,
          });
          notify('Ticket d’appel enregistré.');
          setTicketModal(null);
        }}
      />

      <RappelModal
        open={ticketModal === 'rappel'}
        onClose={() => setTicketModal(null)}
        onSubmit={(input) => {
          addFollowUp({
            id: generateId('followup'),
            contactNom: c.nom,
            contactId: c.id,
            contactType: 'Candidat',
            commercialId: CURRENT_COMMERCIAL.id,
            commercialNom: CURRENT_COMMERCIAL.nom,
            dueDate: input.date,
            dueTime: input.heure,
            note: input.note || `Rappel planifié pour ${c.nom}.`,
            status: 'Planifiée',
            createdAt: new Date().toISOString(),
          });
          pushNotification({ scope: 'commercial', title: `Rappel programmé pour ${c.nom} le ${input.date} à ${input.heure}.`, category: 'Rappel', href: `/amud/commercial/candidats/${c.id}` });
          notify('Rappel planifié.');
          setTicketModal(null);
        }}
      />

      <RdvModal
        open={ticketModal === 'rdv'}
        onClose={() => setTicketModal(null)}
        onSubmit={(input) => {
          const rdv = {
            id: generateId('rdv'),
            date: input.date,
            debut: input.heure,
            fin: input.heure,
            nom: c.nom,
            entreprise: 'Candidat',
            statut: 'programme' as const,
            type: 'Appel téléphonique' as const,
            objectif: input.objectif,
            notes: [],
          };
          addRdv(rdv);
          addActivite({
            id: generateId('act'),
            entrepriseId: '',
            entrepriseNom: c.nom,
            contact: c.nom,
            commercialId: CURRENT_COMMERCIAL.id,
            commercial: CURRENT_COMMERCIAL.nom,
            date: todayFr(),
            heureDebut: nowFr(),
            duree: '-',
            type: 'Rendez-vous',
            resultat: 'En cours',
            resume: `Rendez-vous planifié : ${input.objectif}`,
            prochaineAction: `Rendez-vous le ${input.date} à ${input.heure}`,
            statut: 'Planifié',
            rdvId: rdv.id,
          });
          logAudit({ utilisateur: CURRENT_COMMERCIAL.nom, role: 'Commercial', action: 'Rendez-vous créé', actionType: 'create', module: 'CRM', reference: `${c.nom} (#${rdv.id})` });
          pushNotification({ scope: 'commercial', title: `Rendez-vous planifié avec ${c.nom} le ${input.date}.`, category: 'Rendez-vous', href: `/amud/commercial/candidats/${c.id}` });
          notify('Rendez-vous planifié.');
          setTicketModal(null);
        }}
      />

      <Modal open={ticketModal === 'note'} onClose={() => setTicketModal(null)} title="Ajouter une note" widthClassName="max-w-md">
        <NoteForm
          onSubmit={(text) => {
            addNote({ id: generateId('ccn'), commercialId: CURRENT_COMMERCIAL.id, candidateId: c.id, authorNom: CURRENT_COMMERCIAL.nom, text, createdAt: new Date().toISOString() });
            notify('Note ajoutée.');
            setTicketModal(null);
          }}
        />
      </Modal>
    </div>
  );
}

function ActiviteCard({ activite: a }: { activite: Activite }) {
  return (
    <div className="relative overflow-hidden rounded-lg border border-amud-outline-variant bg-amud-surface p-md">
      <div className="absolute bottom-0 left-0 top-0 w-1 bg-amud-primary" />
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2 pl-2">
        <span className="flex items-center gap-1.5 text-label-md font-semibold text-amud-on-surface">
          <span className="material-symbols-outlined text-[18px] text-amud-primary">{TYPE_ICON[a.type]}</span>
          {a.type}
        </span>
        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[12px] font-medium ${RESULTAT_CLASS[a.resultat]}`}>{a.resultat}</span>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 pl-2 text-label-sm text-amud-on-surface-variant sm:grid-cols-3">
        <span>Date : {a.date}</span>
        <span>Heure : {a.heureDebut}</span>
        <span>Durée : {a.duree}</span>
      </div>
      <p className="mt-2 pl-2 text-body-md text-amud-on-surface">{a.resume}</p>
      <p className="mt-1 pl-2 text-label-sm font-medium text-amud-tertiary">Prochaine action : {a.prochaineAction}</p>
    </div>
  );
}

function TicketModal({ open, onClose, onSubmit }: { open: boolean; onClose: () => void; onSubmit: (input: { result: CallResult; summary: string; followUp: boolean; followUpDate: string; followUpTime: string }) => void }) {
  const [result, setResult] = useState<CallResult>('Répondu');
  const [summary, setSummary] = useState('');
  const [followUp, setFollowUp] = useState(false);
  const [followUpDate, setFollowUpDate] = useState('');
  const [followUpTime, setFollowUpTime] = useState('09:00');

  useEffect(() => {
    if (!open) return;
    setResult('Répondu');
    setSummary('');
    setFollowUp(false);
    setFollowUpDate('');
    setFollowUpTime('09:00');
  }, [open]);

  function submit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!summary.trim()) return;
    onSubmit({ result, summary: summary.trim(), followUp, followUpDate, followUpTime });
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Nouveau ticket d'appel"
      widthClassName="max-w-md"
      footer={
        <div className="flex justify-end gap-sm">
          <button type="button" onClick={onClose} className="rounded-lg border border-amud-outline-variant px-lg py-2 text-label-md text-amud-on-surface hover:bg-amud-surface-container-low">
            Annuler
          </button>
          <button type="submit" form="candidat-ticket-form" className="rounded-lg bg-amud-primary px-lg py-2 text-label-md font-medium text-white hover:bg-amud-primary-dark">
            Enregistrer
          </button>
        </div>
      }
    >
      <form id="candidat-ticket-form" onSubmit={submit} className="flex flex-col gap-md">
        <div>
          <label className="mb-1 block text-label-md text-amud-on-surface-variant">Résultat</label>
          <select value={result} onChange={(e) => setResult(e.target.value as CallResult)} className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary">
            {CALL_RESULTS.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-label-md text-amud-on-surface-variant">Résumé</label>
          <textarea autoFocus value={summary} onChange={(e) => setSummary(e.target.value)} required rows={3} className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary" />
        </div>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={followUp} onChange={(e) => setFollowUp(e.target.checked)} className="h-4 w-4 rounded border-amud-outline text-amud-primary focus:ring-amud-primary" />
          <span className="text-label-md text-amud-on-surface">Planifier un rappel</span>
        </label>
        {followUp ? (
          <div className="grid grid-cols-2 gap-md">
            <input type="date" value={followUpDate} onChange={(e) => setFollowUpDate(e.target.value)} className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary" />
            <input type="time" value={followUpTime} onChange={(e) => setFollowUpTime(e.target.value)} className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary" />
          </div>
        ) : null}
      </form>
    </Modal>
  );
}

function RappelModal({ open, onClose, onSubmit }: { open: boolean; onClose: () => void; onSubmit: (input: { date: string; heure: string; note: string }) => void }) {
  const [date, setDate] = useState('');
  const [heure, setHeure] = useState('09:00');
  const [note, setNote] = useState('');

  useEffect(() => {
    if (!open) return;
    setDate('');
    setHeure('09:00');
    setNote('');
  }, [open]);

  function submit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!date) return;
    onSubmit({ date, heure, note: note.trim() });
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Programmer un rappel"
      widthClassName="max-w-md"
      footer={
        <div className="flex justify-end gap-sm">
          <button type="button" onClick={onClose} className="rounded-lg border border-amud-outline-variant px-lg py-2 text-label-md text-amud-on-surface hover:bg-amud-surface-container-low">
            Annuler
          </button>
          <button type="submit" form="candidat-rappel-form" className="rounded-lg bg-amud-primary px-lg py-2 text-label-md font-medium text-white hover:bg-amud-primary-dark">
            Planifier
          </button>
        </div>
      }
    >
      <form id="candidat-rappel-form" onSubmit={submit} className="flex flex-col gap-md">
        <div className="grid grid-cols-2 gap-md">
          <div>
            <label className="mb-1 block text-label-md text-amud-on-surface-variant">Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary" />
          </div>
          <div>
            <label className="mb-1 block text-label-md text-amud-on-surface-variant">Heure</label>
            <input type="time" value={heure} onChange={(e) => setHeure(e.target.value)} className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary" />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-label-md text-amud-on-surface-variant">Note (optionnel)</label>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary" />
        </div>
      </form>
    </Modal>
  );
}

function RdvModal({ open, onClose, onSubmit }: { open: boolean; onClose: () => void; onSubmit: (input: { date: string; heure: string; objectif: string }) => void }) {
  const [date, setDate] = useState('');
  const [heure, setHeure] = useState('10:00');
  const [objectif, setObjectif] = useState('');

  useEffect(() => {
    if (!open) return;
    setDate('');
    setHeure('10:00');
    setObjectif('');
  }, [open]);

  function submit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!date.trim() || !objectif.trim()) return;
    onSubmit({ date: date.trim(), heure, objectif: objectif.trim() });
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Planifier un rendez-vous"
      widthClassName="max-w-md"
      footer={
        <div className="flex justify-end gap-sm">
          <button type="button" onClick={onClose} className="rounded-lg border border-amud-outline-variant px-lg py-2 text-label-md text-amud-on-surface hover:bg-amud-surface-container-low">
            Annuler
          </button>
          <button type="submit" form="candidat-rdv-form" className="rounded-lg bg-amud-primary px-lg py-2 text-label-md font-medium text-white hover:bg-amud-primary-dark">
            Planifier
          </button>
        </div>
      }
    >
      <form id="candidat-rdv-form" onSubmit={submit} className="grid grid-cols-1 gap-md sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-label-md text-amud-on-surface-variant">Date</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary" />
        </div>
        <div>
          <label className="mb-1 block text-label-md text-amud-on-surface-variant">Heure</label>
          <input type="time" value={heure} onChange={(e) => setHeure(e.target.value)} className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary" />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-label-md text-amud-on-surface-variant">Objectif</label>
          <textarea value={objectif} onChange={(e) => setObjectif(e.target.value)} required rows={2} className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary" />
        </div>
      </form>
    </Modal>
  );
}

function NoteForm({ onSubmit }: { onSubmit: (text: string) => void }) {
  const [text, setText] = useState('');
  return (
    <form
      onSubmit={(ev) => {
        ev.preventDefault();
        if (!text.trim()) return;
        onSubmit(text.trim());
        setText('');
      }}
      className="flex flex-col gap-md"
    >
      <textarea
        autoFocus
        value={text}
        onChange={(e) => setText(e.target.value)}
        required
        rows={4}
        className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary"
        placeholder="Écrire une note…"
      />
      <div className="flex justify-end gap-sm">
        <button type="submit" className="rounded-lg bg-amud-primary px-lg py-2 text-label-md font-medium text-white hover:bg-amud-primary-dark">
          Ajouter
        </button>
      </div>
    </form>
  );
}
