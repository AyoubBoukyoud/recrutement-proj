'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { Drawer, Modal, Tabs } from '@/components/amud/ui';
import { useToast } from '@/components/amud/Toast';
import { CURRENT_COMMERCIAL } from '@/data/amud/currentCommercial';
import { STATUT_CLASS as ENTREPRISE_STATUT_CLASS, entreprisesSeed, type Entreprise } from '@/data/amud/entreprises';
import { entreprisesCollection } from '@/lib/amud/localEntreprises';
import { offresCollection } from '@/lib/amud/localOffres';
import { useCollection } from '@/lib/amud/storage/useCollection';
import {
  RESULTAT_CLASS,
  STATUT_CLASS as ACTIVITE_STATUT_CLASS,
  TYPE_ICON,
  activitesSeed,
  getActivitesForEntreprise,
  type Activite,
  type ResultatActivite,
  type TypeActivite,
} from '@/data/amud/commercialActivites';
import { activitesCollection } from '@/lib/amud/localCommercialActivites';
import { PRIORITE_CLASS, STATUT_CLASS as TACHE_STATUT_CLASS, tachesSeed, type PrioriteTache, type StatutTache, type Tache } from '@/data/amud/commercialTaches';
import { tachesCollection } from '@/lib/amud/localCommercialTaches';
import { STATUT_CLASS as CONTACT_STATUT_CLASS, contactsEntrepriseSeed, type ContactEntreprise, type StatutContact } from '@/data/amud/commercialContacts';
import { companyContactsCollection } from '@/lib/amud/localCompanyContacts';
import { generateId } from '@/lib/amud/storage/ids';
import { logAudit } from '@/lib/amud/storage/audit';
import { pushNotification } from '@/lib/amud/storage/notify';
import { STATUT_STYLE, TYPE_ICON as RDV_TYPE_ICON, buildSeedRdvs, type Rdv } from '@/data/amud/commercialRdv';
import { rendezVousCollection } from '@/lib/amud/localRendezVous';
import { fullDayLabel, minutesToTime, timeToMinutes } from '@/lib/amud/weekDates';
import { STATUT_CLASS as OFFRE_STATUT_CLASS, offresSeed, type Offre } from '@/data/amud/offres';

const TABS = [
  { id: 'overview', label: "Vue d'ensemble" },
  { id: 'infos', label: 'Informations' },
  { id: 'contacts', label: 'Contacts' },
  { id: 'activites', label: 'Activités' },
  { id: 'appels', label: 'Appels' },
  { id: 'taches', label: 'Tâches' },
  { id: 'rdv', label: 'Rendez-vous' },
  { id: 'offres', label: 'Offres' },
  { id: 'notes', label: 'Notes' },
];

type Note = { id: string; texte: string; auteur: string; date: string };

function todayFr() {
  return new Date().toLocaleDateString('fr-FR');
}
function nowFr() {
  return new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

export default function AmudCommercialEntrepriseDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const notify = useToast();

  const [entreprises] = useCollection(entreprisesCollection, entreprisesSeed);
  const [offresAll] = useCollection(offresCollection, offresSeed);
  const entreprise = useMemo<Entreprise | null>(() => entreprises.find((x) => x.id === params.id) ?? null, [entreprises, params.id]);
  const [tab, setTab] = useState('overview');

  const [allActivites, { add: addActivite }] = useCollection(activitesCollection, activitesSeed);
  const [allTaches, { add: addTache, update: updateTache }] = useCollection(tachesCollection, tachesSeed);
  const [rdvsAll, { replace: replaceRdvs }] = useCollection(rendezVousCollection, buildSeedRdvs());
  const [notes, setNotes] = useState<Note[]>([
    { id: 'n1', texte: 'Client historique, très réactif — privilégier le téléphone plutôt que l’email.', auteur: 'Ahmed Benali', date: '02/08/2026' },
  ]);
  const [selectedActivite, setSelectedActivite] = useState<Activite | null>(null);

  const [activiteModalOpen, setActiviteModalOpen] = useState(false);
  const [tacheModalOpen, setTacheModalOpen] = useState(false);
  const [rdvModalOpen, setRdvModalOpen] = useState(false);
  const [noteModalOpen, setNoteModalOpen] = useState(false);

  const activites = useMemo(() => getActivitesForEntreprise(params.id, allActivites), [params.id, allActivites]);
  const taches = useMemo(() => allTaches.filter((t) => t.entrepriseId === params.id), [allTaches, params.id]);

  function persistRdvs(next: Rdv[]) {
    replaceRdvs(next);
  }

  const [allCompanyContacts, { add: addCompanyContact, update: updateCompanyContact }] = useCollection(companyContactsCollection, contactsEntrepriseSeed);
  const contacts = useMemo<ContactEntreprise[]>(() => (entreprise ? allCompanyContacts.filter((c) => c.entrepriseId === entreprise.id) : []), [entreprise, allCompanyContacts]);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<ContactEntreprise | null>(null);
  const rdvs = useMemo(() => (entreprise ? rdvsAll.filter((r) => r.entrepriseId === entreprise.id) : []), [entreprise, rdvsAll]);
  const offres = useMemo<Offre[]>(
    () => (entreprise ? offresAll.filter((o) => o.entrepriseId === entreprise.id || o.entreprise === entreprise.nom) : []),
    [entreprise, offresAll],
  );

  const historiqueContacts = useMemo(
    () => activites.filter((a): a is Activite => ['Appel', 'Email', 'Rendez-vous', 'Follow-up'].includes(a.type)),
    [activites],
  );
  const appels = useMemo(() => activites.filter((a) => a.type === 'Appel'), [activites]);

  if (entreprise === null) {
    return (
      <div className="mx-auto max-w-xl rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-xl text-center">
        <span className="material-symbols-outlined mb-md text-4xl text-amud-outline">domain_disabled</span>
        <h2 className="text-title-lg text-amud-on-surface">Entreprise introuvable</h2>
        <p className="mt-2 text-body-md text-amud-on-surface-variant">Aucune fiche ne correspond à &quot;{params.id}&quot;.</p>
        <Link href="/amud/commercial/entreprises" className="mt-4 inline-block text-amud-primary hover:underline">
          Retour à la liste des entreprises
        </Link>
      </div>
    );
  }

  const e = entreprise;
  const primaryContact = contacts[0];

  function logActivite(input: {
    type: TypeActivite;
    contact: string;
    resultat: ResultatActivite;
    resume: string;
    prochaineAction: string;
    duree?: string;
    rdvId?: string;
  }) {
    const activite: Activite = {
      id: `act-${Date.now()}`,
      entrepriseId: e.id,
      entrepriseNom: e.nom,
      contact: input.contact,
      commercialId: CURRENT_COMMERCIAL.id,
      commercial: CURRENT_COMMERCIAL.nom,
      date: todayFr(),
      heureDebut: nowFr(),
      duree: input.duree ?? '-',
      type: input.type,
      resultat: input.resultat,
      resume: input.resume,
      prochaineAction: input.prochaineAction || 'Aucune action planifiée',
      statut: 'Terminé',
      rdvId: input.rdvId,
    };
    addActivite(activite);
    return activite;
  }

  function handleAppeler() {
    const contact = primaryContact?.nom ?? e.nom;
    logActivite({ type: 'Appel', contact, resultat: 'Répondu', resume: `Appel sortant vers ${contact}.`, prochaineAction: 'Faire un compte-rendu du besoin exprimé', duree: '00:00' });
    notify(`Appel avec ${contact} enregistré.`);
  }

  return (
    <div className="mx-auto max-w-[1200px]">
      {/* ------------------------------------------------------------ Header */}
      <section className="relative mb-lg overflow-hidden rounded-xl border border-amud-outline-variant/30 bg-amud-surface-container-lowest p-lg shadow-[0_4px_12px_rgba(0,0,0,0.02)]">
        <div className="absolute bottom-0 left-0 top-0 w-2 bg-amud-primary" />
        <div className="flex flex-col items-start justify-between gap-lg lg:flex-row lg:items-center">
          <div className="flex items-start gap-lg">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl border-4 border-amud-surface bg-amud-primary-container shadow-sm">
              <span className="material-symbols-outlined text-[36px] text-white">{e.icon}</span>
            </div>
            <div>
              <div className="mb-1 flex flex-wrap items-center gap-sm">
                <h1 className="text-headline-lg text-amud-on-surface">{e.nom}</h1>
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${ENTREPRISE_STATUT_CLASS[e.statut]}`}>{e.statut}</span>
              </div>
              <p className="flex flex-wrap items-center gap-xs text-title-lg text-amud-on-surface-variant">
                {e.secteur}
                <span className="text-amud-outline-variant">•</span>
                <span className="material-symbols-outlined text-sm">location_on</span> {e.ville}
              </p>
              <div className="mt-sm flex flex-wrap gap-md text-label-md text-amud-on-surface-variant">
                {e.siteWeb ? (
                  <a href={`https://${e.siteWeb}`} target="_blank" rel="noreferrer" className="flex items-center gap-xs hover:text-amud-primary">
                    <span className="material-symbols-outlined text-sm">language</span> {e.siteWeb}
                  </a>
                ) : null}
                {e.telephone ? (
                  <a href={`tel:${e.telephone}`} className="flex items-center gap-xs hover:text-amud-primary">
                    <span className="material-symbols-outlined text-sm">phone</span> {e.telephone}
                  </a>
                ) : null}
                {e.email ? (
                  <a href={`mailto:${e.email}`} className="flex items-center gap-xs hover:text-amud-primary">
                    <span className="material-symbols-outlined text-sm">mail</span> {e.email}
                  </a>
                ) : null}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-sm">
            <button onClick={handleAppeler} className="flex items-center gap-xs rounded-lg bg-amud-primary px-md py-sm text-label-md text-white transition-opacity hover:opacity-90">
              <span className="material-symbols-outlined text-sm">call</span> Appeler
            </button>
            <button onClick={() => setActiviteModalOpen(true)} className="flex items-center gap-xs rounded-lg border border-amud-outline-variant px-md py-sm text-label-md text-amud-on-surface transition-colors hover:bg-amud-surface-container-low">
              <span className="material-symbols-outlined text-sm">add_task</span> Ajouter une activité
            </button>
            <button onClick={() => setTacheModalOpen(true)} className="flex items-center gap-xs rounded-lg border border-amud-outline-variant px-md py-sm text-label-md text-amud-on-surface transition-colors hover:bg-amud-surface-container-low">
              <span className="material-symbols-outlined text-sm">assignment_add</span> Créer une tâche
            </button>
            <button onClick={() => setRdvModalOpen(true)} className="flex items-center gap-xs rounded-lg border border-amud-outline-variant px-md py-sm text-label-md text-amud-on-surface transition-colors hover:bg-amud-surface-container-low">
              <span className="material-symbols-outlined text-sm">event</span> Planifier un rendez-vous
            </button>
            <button onClick={() => setNoteModalOpen(true)} className="flex items-center justify-center rounded-lg border border-amud-outline-variant p-sm text-amud-on-surface transition-colors hover:bg-amud-surface-container-low" title="Ajouter une note">
              <span className="material-symbols-outlined">note_add</span>
            </button>
          </div>
        </div>
      </section>

      <div className="mb-lg">
        <Tabs tabs={TABS} active={tab} onChange={setTab} />
      </div>

      {/* ------------------------------------------------------------ Vue d'ensemble */}
      {tab === 'overview' ? (
        <div className="grid grid-cols-1 gap-lg lg:grid-cols-3">
          <div className="flex flex-col gap-lg lg:col-span-2">
            <div className="grid grid-cols-2 gap-md md:grid-cols-4">
              <StatCard icon="history" value={activites.length} label="Activités" />
              <StatCard icon="call" value={appels.length} label="Appels" />
              <StatCard icon="assignment" value={taches.filter((t) => t.statut !== 'Terminée').length} label="Tâches ouvertes" />
              <StatCard icon="event" value={rdvs.length} label="Rendez-vous" />
            </div>

            <div className="rounded-xl border border-amud-outline-variant/30 bg-amud-surface-container-lowest p-lg">
              <div className="mb-md flex items-center justify-between">
                <h3 className="text-title-lg text-amud-on-surface">Historique des contacts</h3>
                <button onClick={() => setTab('activites')} className="text-label-sm text-amud-primary hover:underline">
                  Voir toutes les activités
                </button>
              </div>
              {historiqueContacts.length === 0 ? (
                <EmptyState icon="history_toggle_off" text="Aucune activité enregistrée." />
              ) : (
                <div className="flex flex-col gap-md">
                  {historiqueContacts.slice(0, 4).map((a) => (
                    <ContactHistoryCard key={a.id} activite={a} />
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-lg">
            <InfoCard entreprise={e} compact />
            <div className="rounded-xl border border-amud-outline-variant/30 bg-amud-surface-container-lowest p-lg">
              <div className="mb-md flex items-center justify-between">
                <h3 className="text-title-lg text-amud-on-surface">Tâches à venir</h3>
                <button onClick={() => setTab('taches')} className="text-label-sm text-amud-primary hover:underline">
                  Tout voir
                </button>
              </div>
              {taches.filter((t) => t.statut !== 'Terminée').length === 0 ? (
                <EmptyState icon="task_alt" text="Aucune tâche pour cette entreprise." />
              ) : (
                <div className="flex flex-col gap-sm">
                  {taches
                    .filter((t) => t.statut !== 'Terminée')
                    .slice(0, 3)
                    .map((t) => (
                      <div key={t.id} className="rounded-lg border border-amud-outline-variant p-sm">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-label-md font-medium text-amud-on-surface">{t.titre}</span>
                          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${TACHE_STATUT_CLASS[t.statut]}`}>{t.statut}</span>
                        </div>
                        <span className="text-label-sm text-amud-on-surface-variant">Échéance : {t.echeance}</span>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {/* ------------------------------------------------------------ Informations */}
      {tab === 'infos' ? <InfoCard entreprise={e} /> : null}

      {/* ------------------------------------------------------------ Contacts */}
      {tab === 'contacts' ? (
        <div className="rounded-xl border border-amud-outline-variant/30 bg-amud-surface-container-lowest p-lg">
          <div className="mb-md flex items-center justify-between">
            <h3 className="text-title-lg text-amud-on-surface">Contacts</h3>
            <button
              onClick={() => {
                setEditingContact(null);
                setContactModalOpen(true);
              }}
              className="flex items-center gap-xs rounded-lg bg-amud-primary px-3 py-1.5 text-label-sm text-white hover:bg-amud-primary-dark"
            >
              <span className="material-symbols-outlined text-[18px]">person_add</span> Ajouter un contact
            </button>
          </div>
          {contacts.length === 0 ? (
            <EmptyState icon="person_off" text="Aucun contact enregistré pour cette entreprise." />
          ) : (
            <div className="grid grid-cols-1 gap-md md:grid-cols-2">
              {contacts.map((c) => (
                <div key={c.id} className="rounded-lg border border-amud-outline-variant p-md">
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-label-md font-semibold text-amud-on-surface">{c.nom}</h4>
                      <p className="text-label-sm text-amud-on-surface-variant">{c.poste}</p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${CONTACT_STATUT_CLASS[c.statut]}`}>{c.statut}</span>
                  </div>
                  <div className="mb-3 flex flex-col gap-1 text-label-sm text-amud-on-surface-variant">
                    <span className="flex items-center gap-xs">
                      <span className="material-symbols-outlined text-sm">phone</span> {c.telephone}
                    </span>
                    <span className="flex items-center gap-xs">
                      <span className="material-symbols-outlined text-sm">mail</span> {c.email}
                    </span>
                    <span className="flex items-center gap-xs">
                      <span className="material-symbols-outlined text-sm">history</span> Dernier contact : {c.dernierContact}
                    </span>
                    <span className="flex items-center gap-xs">
                      <span className="material-symbols-outlined text-sm">support_agent</span> Responsable : {c.commercialResponsable}
                    </span>
                  </div>
                  <div className="flex gap-xs border-t border-amud-outline-variant/50 pt-3">
                    <a href={`tel:${c.telephone}`} className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-amud-outline-variant py-1.5 text-label-sm text-amud-primary hover:bg-amud-surface-container-low">
                      <span className="material-symbols-outlined text-[16px]">call</span> Appeler
                    </a>
                    <a href={`mailto:${c.email}`} className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-amud-outline-variant py-1.5 text-label-sm text-amud-on-surface-variant hover:bg-amud-surface-container-low">
                      <span className="material-symbols-outlined text-[16px]">mail</span> Email
                    </a>
                    <button
                      onClick={() => {
                        logActivite({ type: 'Note', contact: c.nom, resultat: '—', resume: `Activité ajoutée depuis la fiche contact de ${c.nom}.`, prochaineAction: 'À définir' });
                        notify('Activité ajoutée.');
                      }}
                      className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-amud-outline-variant py-1.5 text-label-sm text-amud-on-surface-variant hover:bg-amud-surface-container-low"
                    >
                      <span className="material-symbols-outlined text-[16px]">add_task</span> Activité
                    </button>
                    <button
                      onClick={() => {
                        setEditingContact(c);
                        setContactModalOpen(true);
                      }}
                      className="flex items-center justify-center rounded-lg border border-amud-outline-variant px-2 py-1.5 text-amud-on-surface-variant hover:bg-amud-surface-container-low"
                    >
                      <span className="material-symbols-outlined text-[16px]">edit</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : null}

      {/* ------------------------------------------------------------ Activités (all types) */}
      {tab === 'activites' ? (
        <ActivityTimeline
          title="Toutes les activités"
          activites={activites}
          onSelect={setSelectedActivite}
          emptyText="Aucune activité enregistrée."
          seeAllHref={`/amud/commercial/activites?entreprise=${e.id}`}
        />
      ) : null}

      {/* ------------------------------------------------------------ Appels */}
      {tab === 'appels' ? (
        <ActivityTimeline
          title="Historique des appels"
          activites={appels}
          onSelect={setSelectedActivite}
          emptyText="Aucun appel enregistré."
          seeAllHref={`/amud/commercial/activites?entreprise=${e.id}&type=${encodeURIComponent('Appel')}`}
        />
      ) : null}

      {/* ------------------------------------------------------------ Tâches */}
      {tab === 'taches' ? (
        <div className="overflow-hidden rounded-xl border border-amud-outline-variant/30 bg-amud-surface-container-lowest">
          {taches.length === 0 ? (
            <div className="p-lg">
              <EmptyState icon="task_alt" text="Aucune tâche pour cette entreprise." />
            </div>
          ) : (
            <div className="divide-y divide-amud-outline-variant">
              {taches.map((t) => (
                <div key={t.id} className="flex flex-col gap-3 p-md sm:flex-row sm:items-center sm:justify-between">
                  <button onClick={() => router.push(`/amud/commercial/taches?open=${t.id}`)} className="min-w-0 flex-1 text-left">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-amud-on-surface hover:text-amud-primary">{t.titre}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${PRIORITE_CLASS[t.priorite]}`}>{t.priorite}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${TACHE_STATUT_CLASS[t.statut]}`}>{t.statut}</span>
                    </div>
                    <p className="mt-1 truncate text-label-sm text-amud-on-surface-variant">{t.description}</p>
                    <p className="mt-1 text-label-sm text-amud-on-surface-variant">Échéance : {t.echeance} · {t.commercial}</p>
                  </button>
                  <div className="flex shrink-0 gap-xs">
                    {t.statut !== 'Terminée' ? (
                      <button
                        onClick={() => {
                          updateTache(t.id, { statut: 'Terminée' });
                          notify(`« ${t.titre} » marquée terminée.`);
                        }}
                        className="rounded-lg border border-amud-outline-variant px-3 py-1.5 text-label-sm text-amud-primary hover:bg-amud-surface-container-low"
                      >
                        Terminer
                      </button>
                    ) : null}
                    <button onClick={() => router.push(`/amud/commercial/taches?open=${t.id}`)} className="rounded-lg border border-amud-outline-variant px-3 py-1.5 text-label-sm text-amud-on-surface-variant hover:bg-amud-surface-container-low">
                      Modifier
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : null}

      {/* ------------------------------------------------------------ Rendez-vous */}
      {tab === 'rdv' ? (
        <div className="overflow-hidden rounded-xl border border-amud-outline-variant/30 bg-amud-surface-container-lowest">
          {rdvs.length === 0 ? (
            <div className="p-lg">
              <EmptyState icon="event_busy" text="Aucun rendez-vous prévu." />
            </div>
          ) : (
            <div className="divide-y divide-amud-outline-variant">
              {rdvs.map((r) => (
                <div key={r.id} className="flex flex-col gap-3 p-md sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-amud-on-surface">{r.nom}</span>
                      <span
                        className="inline-flex items-center gap-1 rounded border-l-4 px-2 py-0.5 text-xs font-semibold"
                        style={{ backgroundColor: STATUT_STYLE[r.statut].bg, borderColor: STATUT_STYLE[r.statut].border, color: STATUT_STYLE[r.statut].text }}
                      >
                        {STATUT_STYLE[r.statut].label}
                      </span>
                    </div>
                    <p className="mt-1 flex items-center gap-1 text-label-sm text-amud-on-surface-variant">
                      <span className="material-symbols-outlined text-[16px]">{RDV_TYPE_ICON[r.type]}</span>
                      {fullDayLabel(new Date(`${r.date}T00:00:00`))} · {r.debut}-{r.fin} · {r.type}
                    </p>
                    <p className="mt-1 text-label-sm text-amud-on-surface-variant">{r.objectif}</p>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-xs">
                    <Link href="/amud/commercial/rendez-vous" className="rounded-lg border border-amud-outline-variant px-3 py-1.5 text-label-sm text-amud-on-surface-variant hover:bg-amud-surface-container-low">
                      Modifier
                    </Link>
                    {r.statut !== 'termine' && r.statut !== 'annule' ? (
                      <>
                        <button
                          onClick={() => {
                            persistRdvs(rdvsAll.map((x) => (x.id === r.id ? { ...x, statut: 'reporte' } : x)));
                            notify('Rendez-vous reporté.');
                          }}
                          className="rounded-lg border border-amud-outline-variant px-3 py-1.5 text-label-sm text-amud-on-surface-variant hover:bg-amud-surface-container-low"
                        >
                          Reporter
                        </button>
                        <button
                          onClick={() => {
                            persistRdvs(rdvsAll.map((x) => (x.id === r.id ? { ...x, statut: 'annule' } : x)));
                            notify('Rendez-vous annulé.', 'info');
                          }}
                          className="rounded-lg border border-amud-outline-variant px-3 py-1.5 text-label-sm text-amud-error hover:bg-amud-surface-container-low"
                        >
                          Annuler
                        </button>
                        <button
                          onClick={() => {
                            persistRdvs(rdvsAll.map((x) => (x.id === r.id ? { ...x, statut: 'termine' } : x)));
                            logActivite({ type: 'Rendez-vous', contact: r.nom, resultat: 'Positif', resume: `Rendez-vous avec ${r.nom} terminé.`, prochaineAction: 'Faire le compte-rendu', rdvId: r.id });
                            notify('Rendez-vous marqué terminé.');
                          }}
                          className="rounded-lg border border-amud-outline-variant px-3 py-1.5 text-label-sm text-amud-primary hover:bg-amud-surface-container-low"
                        >
                          Terminer
                        </button>
                      </>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : null}

      {/* ------------------------------------------------------------ Offres */}
      {tab === 'offres' ? (
        <div className="overflow-x-auto rounded-xl border border-amud-outline-variant/30 bg-amud-surface-container-lowest">
          {offres.length === 0 ? (
            <div className="p-lg">
              <EmptyState icon="work_off" text="Aucune offre pour cette entreprise." />
            </div>
          ) : (
            <table className="w-full min-w-[700px] border-collapse text-left">
              <thead>
                <tr className="border-b border-amud-outline-variant bg-amud-surface-container-low/50">
                  {['Offre', 'Recruteur', 'Publication', 'Candidatures', 'Statut', 'Actions'].map((h) => (
                    <th key={h} className="px-4 py-3 text-label-sm uppercase tracking-wider text-amud-on-surface-variant">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-amud-outline-variant">
                {offres.map((o) => (
                  <tr key={o.id}>
                    <td className="px-4 py-3 font-medium text-amud-on-surface">{o.titre}</td>
                    <td className="px-4 py-3 text-amud-on-surface-variant">{o.recruteur}</td>
                    <td className="px-4 py-3 text-amud-on-surface-variant">{o.publication}</td>
                    <td className="px-4 py-3 text-amud-on-surface-variant">{o.candidatures ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${OFFRE_STATUT_CLASS[o.statut]}`}>{o.statut}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-xs">
                        <button onClick={() => router.push(`/amud/admin/offres?q=${encodeURIComponent(o.titre)}`)} className="text-label-sm text-amud-primary hover:underline">
                          Voir l&apos;offre
                        </button>
                        <span className="text-amud-outline-variant">·</span>
                        <button onClick={() => router.push(`/amud/admin/candidatures?q=${encodeURIComponent(o.titre)}`)} className="text-label-sm text-amud-primary hover:underline">
                          Voir les candidatures
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ) : null}

      {/* ------------------------------------------------------------ Notes */}
      {tab === 'notes' ? (
        <div className="rounded-xl border border-amud-outline-variant/30 bg-amud-surface-container-lowest p-lg">
          <div className="mb-md flex items-center justify-between">
            <h3 className="text-title-lg text-amud-on-surface">Notes</h3>
            <button onClick={() => setNoteModalOpen(true)} className="flex items-center gap-xs rounded-lg bg-amud-primary px-3 py-1.5 text-label-sm text-white hover:bg-amud-primary-dark">
              <span className="material-symbols-outlined text-[18px]">add</span> Ajouter une note
            </button>
          </div>
          {notes.length === 0 ? (
            <EmptyState icon="sticky_note_2" text="Aucune note pour cette entreprise." />
          ) : (
            <div className="flex flex-col gap-sm">
              {notes.map((n) => (
                <div key={n.id} className="rounded-lg border border-amud-outline-variant bg-amud-surface p-md">
                  <p className="text-body-md text-amud-on-surface">{n.texte}</p>
                  <p className="mt-2 text-label-sm text-amud-on-surface-variant">
                    {n.auteur} · {n.date}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : null}

      {/* ------------------------------------------------------------ Drawer: détail d'une activité */}
      <Drawer open={!!selectedActivite} onClose={() => setSelectedActivite(null)} title="Détail de l'activité" subtitle={selectedActivite ? `${selectedActivite.date}, ${selectedActivite.heureDebut}` : undefined}>
        {selectedActivite ? <ActiviteDetailBody activite={selectedActivite} related={activites.filter((a) => a.id !== selectedActivite.id && a.contact === selectedActivite.contact)} /> : null}
      </Drawer>

      {/* ------------------------------------------------------------ Modal: Ajouter une activité */}
      <ActiviteModal
        open={activiteModalOpen}
        onClose={() => setActiviteModalOpen(false)}
        contacts={contacts}
        defaultContact={e.nom}
        onSubmit={(input) => {
          logActivite(input);
          notify('Activité ajoutée.');
          setActiviteModalOpen(false);
        }}
      />

      {/* ------------------------------------------------------------ Modal: Créer une tâche */}
      <TacheModal
        open={tacheModalOpen}
        onClose={() => setTacheModalOpen(false)}
        onSubmit={(input) => {
          const tache: Tache = {
            id: `tache-${Date.now()}`,
            titre: input.titre,
            description: input.description,
            entrepriseId: e.id,
            entrepriseNom: e.nom,
            commercial: CURRENT_COMMERCIAL.nom,
            commercialId: CURRENT_COMMERCIAL.id,
            priorite: input.priorite,
            echeance: input.echeance || todayFr(),
            statut: 'À faire',
          };
          addTache(tache);
          notify('Tâche créée.');
          setTacheModalOpen(false);
        }}
      />

      {/* ------------------------------------------------------------ Modal: Planifier un rendez-vous */}
      <RdvModal
        open={rdvModalOpen}
        onClose={() => setRdvModalOpen(false)}
        contacts={contacts}
        defaultContact={primaryContact?.nom ?? e.nom}
        onSubmit={(input) => {
          const rdv: Rdv = {
            id: `rdv-${Date.now()}`,
            entrepriseId: e.id,
            date: input.date,
            debut: input.heure,
            fin: minutesToTime(timeToMinutes(input.heure) + 60),
            nom: input.contact,
            entreprise: e.nom,
            statut: 'programme',
            type: 'Sur site',
            objectif: input.objectif,
            notes: [],
          };
          persistRdvs([...rdvsAll, rdv]);
          logActivite({ type: 'Rendez-vous', contact: input.contact, resultat: 'En cours', resume: `Rendez-vous planifié : ${input.objectif}`, prochaineAction: `Rendez-vous le ${input.date} à ${input.heure}`, rdvId: rdv.id });
          logAudit({ utilisateur: CURRENT_COMMERCIAL.nom, role: 'Commercial', action: 'Rendez-vous créé', actionType: 'create', module: 'CRM', reference: `${input.contact} — ${e.nom} (#${rdv.id})` });
          pushNotification({ scope: 'commercial', title: `Rendez-vous planifié avec ${input.contact} (${e.nom}).`, category: 'Rendez-vous', href: `/amud/commercial/entreprises/${e.id}` });
          notify('Rendez-vous planifié.');
          setRdvModalOpen(false);
        }}
      />

      {/* ------------------------------------------------------------ Modal: Ajouter une note */}
      <Modal open={noteModalOpen} onClose={() => setNoteModalOpen(false)} title="Ajouter une note" widthClassName="max-w-md">
        <NoteForm
          onSubmit={(texte) => {
            setNotes((prev) => [{ id: `n-${Date.now()}`, texte, auteur: CURRENT_COMMERCIAL.nom, date: todayFr() }, ...prev]);
            notify('Note ajoutée.');
            setNoteModalOpen(false);
          }}
        />
      </Modal>

      {/* ------------------------------------------------------------ Modal: Ajouter/Modifier un contact d'entreprise */}
      <CompanyContactModal
        open={contactModalOpen}
        onClose={() => setContactModalOpen(false)}
        contact={editingContact}
        onSubmit={(input) => {
          if (editingContact) {
            updateCompanyContact(editingContact.id, input);
            notify('Contact mis à jour.');
          } else {
            addCompanyContact({ id: generateId('contact-ent'), entrepriseId: e.id, dernierContact: todayFr(), commercialResponsable: CURRENT_COMMERCIAL.nom, ...input });
            notify('Contact ajouté.');
          }
          setContactModalOpen(false);
        }}
      />
    </div>
  );
}

/* ==================================================================== *
 * Sous-composants
 * ==================================================================== */

function StatCard({ icon, value, label }: { icon: string; value: number; label: string }) {
  return (
    <div className="flex flex-col justify-between rounded-xl border border-amud-outline-variant/30 bg-amud-surface-container-lowest p-md">
      <span className="material-symbols-outlined mb-sm text-amud-primary">{icon}</span>
      <div>
        <div className="text-title-lg text-amud-on-surface">{value}</div>
        <div className="text-label-sm text-amud-on-surface-variant">{label}</div>
      </div>
    </div>
  );
}

function EmptyState({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-xl text-center text-amud-on-surface-variant">
      <span className="material-symbols-outlined text-3xl text-amud-outline">{icon}</span>
      <p className="text-body-md">{text}</p>
    </div>
  );
}

function InfoCard({ entreprise: e, compact }: { entreprise: Entreprise; compact?: boolean }) {
  const rows: { icon: string; label: string; value: string }[] = [
    { icon: 'apartment', label: "Nom de l'entreprise", value: e.nom },
    { icon: 'category', label: 'Secteur', value: e.secteur },
    { icon: 'home_pin', label: 'Adresse', value: e.adresse ?? '—' },
    { icon: 'location_on', label: 'Ville', value: e.ville },
    { icon: 'phone', label: 'Téléphone', value: e.telephone ?? '—' },
    { icon: 'mail', label: 'Email', value: e.email ?? '—' },
    { icon: 'language', label: 'Site web', value: e.siteWeb ?? '—' },
    { icon: 'groups', label: "Taille de l'entreprise", value: e.taille ?? '—' },
    { icon: 'calendar_month', label: "Date d'inscription", value: e.dateInscription ?? '—' },
    { icon: 'verified', label: 'Statut', value: e.statut },
    { icon: 'support_agent', label: 'Commercial responsable', value: e.commercialResponsable ?? '—' },
  ];
  return (
    <div className="rounded-xl border border-amud-outline-variant/30 bg-amud-surface-container-lowest p-lg">
      <h3 className="mb-md text-title-lg text-amud-on-surface">Informations de l&apos;entreprise</h3>
      <div className={`grid grid-cols-1 gap-md ${compact ? '' : 'sm:grid-cols-2'}`}>
        {rows.map((r) => (
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
  );
}

function ContactHistoryCard({ activite: a }: { activite: Activite }) {
  return (
    <div className="relative overflow-hidden rounded-lg border border-amud-outline-variant bg-amud-surface p-md">
      <div className="absolute bottom-0 left-0 top-0 w-1 bg-amud-primary" />
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2 pl-2">
        <span className="flex items-center gap-1.5 text-label-md font-semibold text-amud-on-surface">
          <span className="material-symbols-outlined text-[18px] text-amud-primary">{TYPE_ICON[a.type]}</span>
          {a.commercial}
        </span>
        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[12px] font-medium ${RESULTAT_CLASS[a.resultat]}`}>{a.resultat}</span>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 pl-2 text-label-sm text-amud-on-surface-variant sm:grid-cols-4">
        <span>Date : {a.date}</span>
        <span>Heure : {a.heureDebut}</span>
        <span>Durée : {a.duree}</span>
        <span>Contact : {a.contact}</span>
      </div>
      <p className="mt-2 pl-2 text-body-md text-amud-on-surface">{a.resume}</p>
      <p className="mt-1 pl-2 text-label-sm font-medium text-amud-tertiary">Prochaine action : {a.prochaineAction}</p>
    </div>
  );
}

function ActivityTimeline({
  title,
  activites,
  onSelect,
  emptyText,
  seeAllHref,
}: {
  title: string;
  activites: Activite[];
  onSelect: (a: Activite) => void;
  emptyText: string;
  seeAllHref: string;
}) {
  return (
    <div className="rounded-xl border border-amud-outline-variant/30 bg-amud-surface-container-lowest p-lg">
      <div className="mb-md flex items-center justify-between">
        <h3 className="text-title-lg text-amud-on-surface">{title}</h3>
        <Link href={seeAllHref} className="text-label-sm text-amud-primary hover:underline">
          Voir dans Activités
        </Link>
      </div>
      {activites.length === 0 ? (
        <EmptyState icon="history_toggle_off" text={emptyText} />
      ) : (
        <div className="relative ml-sm space-y-6 border-l border-amud-outline-variant">
          {activites.map((a) => (
            <button key={a.id} onClick={() => onSelect(a)} className="relative block w-full border-b border-amud-outline-variant/30 pb-md pl-lg text-left last:border-0 last:pb-0">
              <div className="absolute left-[-6.5px] top-1 h-3 w-3 rounded-full bg-amud-primary ring-4 ring-amud-surface-container-lowest" />
              <div className="mb-xs flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-xs text-label-md font-bold text-amud-on-surface">
                  <span className="material-symbols-outlined text-sm text-amud-primary">{TYPE_ICON[a.type]}</span> {a.type}
                  <span className="font-normal text-amud-on-surface-variant">· {a.contact}</span>
                </div>
                <div className="text-label-sm text-amud-outline">
                  {a.date}, {a.heureDebut}
                </div>
              </div>
              <div className="text-body-md text-amud-on-surface-variant">{a.resume}</div>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${RESULTAT_CLASS[a.resultat]}`}>{a.resultat}</span>
                <span className={`text-[11px] font-medium ${ACTIVITE_STATUT_CLASS[a.statut]}`}>{a.statut}</span>
                {a.tacheId ? <span className="text-[11px] text-amud-on-surface-variant">· Tâche liée</span> : null}
                {a.rdvId ? <span className="text-[11px] text-amud-on-surface-variant">· RDV lié</span> : null}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ActiviteDetailBody({ activite: a, related }: { activite: Activite; related: Activite[] }) {
  return (
    <div className="space-y-xl">
      <div className="flex items-start gap-4">
        <div className="rounded-lg bg-amud-primary-container p-3 text-white">
          <span className="material-symbols-outlined text-[28px]">{TYPE_ICON[a.type]}</span>
        </div>
        <div>
          <h4 className="text-headline-md text-amud-on-surface">{a.type}</h4>
          <p className="mt-1 text-body-md text-amud-on-surface-variant">
            {a.date}, {a.heureDebut}
            {a.heureFin ? ` – ${a.heureFin}` : ''} · {a.duree}
          </p>
          <p className="text-label-sm text-amud-on-surface-variant">Ticket #{a.id}</p>
        </div>
      </div>

      <div className="relative space-y-4 overflow-hidden rounded-xl border border-amud-outline-variant bg-amud-surface p-md shadow-sm">
        <div className="absolute bottom-0 left-0 top-0 w-1 bg-amud-primary" />
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-label-sm uppercase text-amud-on-surface-variant">Commercial</p>
            <p className="mt-1 text-amud-on-surface">{a.commercial}</p>
          </div>
          <div>
            <p className="text-label-sm uppercase text-amud-on-surface-variant">Entreprise</p>
            <Link href={`/amud/commercial/entreprises/${a.entrepriseId}`} className="mt-1 block font-medium text-amud-primary hover:underline">
              {a.entrepriseNom}
            </Link>
          </div>
          <div>
            <p className="text-label-sm uppercase text-amud-on-surface-variant">Contact</p>
            <p className="mt-1 text-amud-on-surface">{a.contact}</p>
          </div>
          <div>
            <p className="text-label-sm uppercase text-amud-on-surface-variant">Résultat</p>
            <span className={`mt-1 inline-flex items-center rounded-full border px-2.5 py-0.5 text-[12px] font-medium ${RESULTAT_CLASS[a.resultat]}`}>{a.resultat}</span>
          </div>
        </div>
        <div className="border-t border-amud-outline-variant pt-4">
          <p className="mb-2 text-label-sm uppercase text-amud-on-surface-variant">Résumé de la conversation</p>
          <p className="rounded-lg border border-amud-outline-variant/50 bg-amud-surface-container-lowest p-3 text-body-md text-amud-on-surface">{a.resume}</p>
        </div>
      </div>

      <div>
        <h5 className="mb-3 text-title-lg text-amud-on-surface">Prochaine action</h5>
        <div className="flex items-center justify-between rounded-xl border border-amud-tertiary-fixed-dim bg-amud-tertiary-fixed/30 p-md">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-amud-tertiary p-2 text-white">
              <span className="material-symbols-outlined">flag</span>
            </div>
            <div>
              <p className="font-medium text-amud-on-surface">{a.prochaineAction}</p>
              {a.prochaineDate ? <p className="text-label-sm text-amud-on-surface-variant">{a.prochaineDate}</p> : null}
            </div>
          </div>
        </div>
      </div>

      {related.length > 0 ? (
        <div>
          <h5 className="mb-3 text-title-lg text-amud-on-surface">Activités précédentes avec ce contact</h5>
          <div className="flex flex-col gap-2">
            {related.slice(0, 4).map((r) => (
              <div key={r.id} className="flex items-center justify-between rounded-lg border border-amud-outline-variant p-2 text-label-sm">
                <span className="flex items-center gap-xs text-amud-on-surface">
                  <span className="material-symbols-outlined text-[16px] text-amud-primary">{TYPE_ICON[r.type]}</span> {r.type}
                </span>
                <span className="text-amud-on-surface-variant">
                  {r.date}, {r.heureDebut}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ActiviteModal({
  open,
  onClose,
  contacts,
  defaultContact,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  contacts: ContactEntreprise[];
  defaultContact: string;
  onSubmit: (input: { type: TypeActivite; contact: string; resultat: ResultatActivite; resume: string; prochaineAction: string }) => void;
}) {
  const [type, setType] = useState<TypeActivite>('Note');
  const [contact, setContact] = useState(defaultContact);
  const [resultat, setResultat] = useState<ResultatActivite>('—');
  const [resume, setResume] = useState('');
  const [prochaineAction, setProchaineAction] = useState('');

  useEffect(() => {
    if (open) setContact(defaultContact);
  }, [open, defaultContact]);

  function submit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!resume.trim()) return;
    onSubmit({ type, contact, resultat, resume: resume.trim(), prochaineAction: prochaineAction.trim() });
    setResume('');
    setProchaineAction('');
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Ajouter une activité"
      footer={
        <div className="flex justify-end gap-sm">
          <button type="button" onClick={onClose} className="rounded-lg border border-amud-outline-variant px-lg py-2 text-label-md text-amud-on-surface hover:bg-amud-surface-container-low">
            Annuler
          </button>
          <button type="submit" form="add-activite-form" className="rounded-lg bg-amud-primary px-lg py-2 text-label-md font-medium text-white hover:bg-amud-primary-dark">
            Ajouter
          </button>
        </div>
      }
    >
      <form id="add-activite-form" onSubmit={submit} className="grid grid-cols-1 gap-md sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-label-md text-amud-on-surface-variant">Type</label>
          <select value={type} onChange={(e) => setType(e.target.value as TypeActivite)} className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary">
            {(['Appel', 'Email', 'Note', 'Follow-up', 'Rendez-vous'] as TypeActivite[]).map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-label-md text-amud-on-surface-variant">Contact</label>
          {contacts.length > 0 ? (
            <select value={contact} onChange={(e) => setContact(e.target.value)} className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary">
              {contacts.map((c) => (
                <option key={c.id} value={c.nom}>
                  {c.nom}
                </option>
              ))}
            </select>
          ) : (
            <input value={contact} onChange={(e) => setContact(e.target.value)} className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary" />
          )}
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-label-md text-amud-on-surface-variant">Résumé</label>
          <textarea
            value={resume}
            onChange={(e) => setResume(e.target.value)}
            required
            rows={3}
            className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary"
            placeholder="Résumé de l'échange…"
          />
        </div>
        <div>
          <label className="mb-1 block text-label-md text-amud-on-surface-variant">Résultat</label>
          <select value={resultat} onChange={(e) => setResultat(e.target.value as ResultatActivite)} className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary">
            {(['Répondu', 'Sans réponse', 'Positif', 'Négatif', 'En cours', '—'] as ResultatActivite[]).map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-label-md text-amud-on-surface-variant">Prochaine action</label>
          <input value={prochaineAction} onChange={(e) => setProchaineAction(e.target.value)} className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary" placeholder="Ex : Rappeler le…" />
        </div>
      </form>
    </Modal>
  );
}

function TacheModal({ open, onClose, onSubmit }: { open: boolean; onClose: () => void; onSubmit: (input: { titre: string; description: string; priorite: PrioriteTache; echeance: string }) => void }) {
  const [titre, setTitre] = useState('');
  const [description, setDescription] = useState('');
  const [priorite, setPriorite] = useState<PrioriteTache>('Moyenne');
  const [echeance, setEcheance] = useState('');

  function submit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!titre.trim()) return;
    onSubmit({ titre: titre.trim(), description: description.trim(), priorite, echeance });
    setTitre('');
    setDescription('');
    setPriorite('Moyenne');
    setEcheance('');
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Créer une tâche"
      footer={
        <div className="flex justify-end gap-sm">
          <button type="button" onClick={onClose} className="rounded-lg border border-amud-outline-variant px-lg py-2 text-label-md text-amud-on-surface hover:bg-amud-surface-container-low">
            Annuler
          </button>
          <button type="submit" form="add-tache-form" className="rounded-lg bg-amud-primary px-lg py-2 text-label-md font-medium text-white hover:bg-amud-primary-dark">
            Créer
          </button>
        </div>
      }
    >
      <form id="add-tache-form" onSubmit={submit} className="grid grid-cols-1 gap-md">
        <div>
          <label className="mb-1 block text-label-md text-amud-on-surface-variant">Titre</label>
          <input autoFocus value={titre} onChange={(e) => setTitre(e.target.value)} required className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary" />
        </div>
        <div>
          <label className="mb-1 block text-label-md text-amud-on-surface-variant">Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary" />
        </div>
        <div className="grid grid-cols-2 gap-md">
          <div>
            <label className="mb-1 block text-label-md text-amud-on-surface-variant">Priorité</label>
            <select value={priorite} onChange={(e) => setPriorite(e.target.value as PrioriteTache)} className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary">
              {(['Haute', 'Moyenne', 'Basse'] as PrioriteTache[]).map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-label-md text-amud-on-surface-variant">Échéance</label>
            <input value={echeance} onChange={(e) => setEcheance(e.target.value)} placeholder="jj/mm/aaaa" className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary" />
          </div>
        </div>
      </form>
    </Modal>
  );
}

function RdvModal({
  open,
  onClose,
  contacts,
  defaultContact,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  contacts: ContactEntreprise[];
  defaultContact: string;
  onSubmit: (input: { contact: string; date: string; heure: string; objectif: string }) => void;
}) {
  const [contact, setContact] = useState(defaultContact);
  const [date, setDate] = useState('');
  const [heure, setHeure] = useState('10:00');
  const [objectif, setObjectif] = useState('');

  useEffect(() => {
    if (open) setContact(defaultContact);
  }, [open, defaultContact]);

  function submit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!date.trim() || !objectif.trim()) return;
    onSubmit({ contact, date: date.trim(), heure, objectif: objectif.trim() });
    setDate('');
    setObjectif('');
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Planifier un rendez-vous"
      footer={
        <div className="flex justify-end gap-sm">
          <button type="button" onClick={onClose} className="rounded-lg border border-amud-outline-variant px-lg py-2 text-label-md text-amud-on-surface hover:bg-amud-surface-container-low">
            Annuler
          </button>
          <button type="submit" form="add-rdv-form" className="rounded-lg bg-amud-primary px-lg py-2 text-label-md font-medium text-white hover:bg-amud-primary-dark">
            Planifier
          </button>
        </div>
      }
    >
      <form id="add-rdv-form" onSubmit={submit} className="grid grid-cols-1 gap-md sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="mb-1 block text-label-md text-amud-on-surface-variant">Contact</label>
          {contacts.length > 0 ? (
            <select value={contact} onChange={(e) => setContact(e.target.value)} className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary">
              {contacts.map((c) => (
                <option key={c.id} value={c.nom}>
                  {c.nom}
                </option>
              ))}
            </select>
          ) : (
            <input value={contact} onChange={(e) => setContact(e.target.value)} className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary" />
          )}
        </div>
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

function CompanyContactModal({
  open,
  onClose,
  contact,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  contact: ContactEntreprise | null;
  onSubmit: (input: { nom: string; poste: string; telephone: string; email: string; statut: StatutContact }) => void;
}) {
  const [nom, setNom] = useState(contact?.nom ?? '');
  const [poste, setPoste] = useState(contact?.poste ?? '');
  const [telephone, setTelephone] = useState(contact?.telephone ?? '');
  const [email, setEmail] = useState(contact?.email ?? '');
  const [statut, setStatut] = useState<StatutContact>(contact?.statut ?? 'Actif');

  useEffect(() => {
    if (!open) return;
    setNom(contact?.nom ?? '');
    setPoste(contact?.poste ?? '');
    setTelephone(contact?.telephone ?? '');
    setEmail(contact?.email ?? '');
    setStatut(contact?.statut ?? 'Actif');
  }, [open, contact]);

  function submit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!nom.trim()) return;
    onSubmit({ nom: nom.trim(), poste: poste.trim(), telephone: telephone.trim(), email: email.trim(), statut });
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={contact ? 'Modifier le contact' : 'Ajouter un contact'}
      footer={
        <div className="flex justify-end gap-sm">
          <button type="button" onClick={onClose} className="rounded-lg border border-amud-outline-variant px-lg py-2 text-label-md text-amud-on-surface hover:bg-amud-surface-container-low">
            Annuler
          </button>
          <button type="submit" form="company-contact-form" className="rounded-lg bg-amud-primary px-lg py-2 text-label-md font-medium text-white hover:bg-amud-primary-dark">
            {contact ? 'Enregistrer' : 'Ajouter'}
          </button>
        </div>
      }
    >
      <form id="company-contact-form" onSubmit={submit} className="grid grid-cols-1 gap-md sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="mb-1 block text-label-md text-amud-on-surface-variant">Nom</label>
          <input autoFocus value={nom} onChange={(e) => setNom(e.target.value)} required className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary" />
        </div>
        <div>
          <label className="mb-1 block text-label-md text-amud-on-surface-variant">Poste</label>
          <input value={poste} onChange={(e) => setPoste(e.target.value)} className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary" />
        </div>
        <div>
          <label className="mb-1 block text-label-md text-amud-on-surface-variant">Statut</label>
          <select value={statut} onChange={(e) => setStatut(e.target.value as StatutContact)} className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary">
            <option>Actif</option>
            <option>À relancer</option>
            <option>Inactif</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-label-md text-amud-on-surface-variant">Téléphone</label>
          <input value={telephone} onChange={(e) => setTelephone(e.target.value)} className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary" />
        </div>
        <div>
          <label className="mb-1 block text-label-md text-amud-on-surface-variant">Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary" />
        </div>
      </form>
    </Modal>
  );
}

function NoteForm({ onSubmit }: { onSubmit: (texte: string) => void }) {
  const [texte, setTexte] = useState('');
  return (
    <form
      onSubmit={(ev) => {
        ev.preventDefault();
        if (!texte.trim()) return;
        onSubmit(texte.trim());
        setTexte('');
      }}
      className="flex flex-col gap-md"
    >
      <textarea
        autoFocus
        value={texte}
        onChange={(e) => setTexte(e.target.value)}
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
