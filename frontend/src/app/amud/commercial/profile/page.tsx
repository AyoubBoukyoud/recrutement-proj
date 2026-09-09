'use client';

import { useEffect, useMemo, useState } from 'react';
import { Avatar, Badge, Modal, PageHeader, ReadOnlyNotice, StatCard, Tabs, Toggle } from '@/components/amud/ui';
import { HeaderLanguageThemeControls } from '@/components/amud/HeaderLanguageThemeControls';
import { useToast } from '@/components/amud/Toast';
import { useCollection } from '@/lib/amud/storage/useCollection';
import { CURRENT_COMMERCIAL } from '@/data/amud/currentCommercial';
import { commercialProfileSettingsSeed, DEFAULT_COMMERCIAL_SKILLS, type CommercialProfileSettings, type CommercialSkill } from '@/data/amud/commercialProfileSettings';
import { commercialProfileSettingsCollection } from '@/lib/amud/localCommercialProfileSettings';
import { objectivesSeed } from '@/data/amud/objectives';
import { objectivesCollection } from '@/lib/amud/localObjectives';
import { activitesSeed } from '@/data/amud/commercialActivites';
import { activitesCollection } from '@/lib/amud/localCommercialActivites';
import { callTicketsSeed } from '@/data/amud/callTickets';
import { callTicketsCollection } from '@/lib/amud/localCallTickets';
import { centresSeed } from '@/data/amud/centres';
import { centresCollection } from '@/lib/amud/localCentres';
import { entreprisesSeed } from '@/data/amud/entreprises';
import { entreprisesCollection } from '@/lib/amud/localEntreprises';
import { getCommercialProfile, getCommercialObjectives, getCommercialPerformance } from '@/lib/amud/commercialServices';
import { resolvePeriod } from '@/lib/amud/analytics/period';
import { percentOf } from '@/lib/amud/analytics/aggregate';
import { ActivityHistogram } from '@/components/amud/analytics/ActivityHistogram';
import { AnalyticsCard } from '@/components/amud/analytics/AnalyticsCard';

const TABS = [
  { id: 'profil', label: 'Profil' },
  { id: 'competences', label: 'Compétences' },
  { id: 'objectifs', label: 'Objectifs' },
  { id: 'statistiques', label: 'Statistiques' },
  { id: 'preferences', label: 'Préférences' },
  { id: 'securite', label: 'Sécurité' },
];

export default function AmudCommercialProfilePage() {
  const notify = useToast();
  const [tab, setTab] = useState('profil');

  const [settingsAll, { update: updateSettings, add: addSettings }] = useCollection(commercialProfileSettingsCollection, commercialProfileSettingsSeed);
  const [objectivesAll] = useCollection(objectivesCollection, objectivesSeed);
  const [activitesAll] = useCollection(activitesCollection, activitesSeed);
  const [callTicketsAll] = useCollection(callTicketsCollection, callTicketsSeed);
  const [centresAll] = useCollection(centresCollection, centresSeed);
  const [entreprisesAll] = useCollection(entreprisesCollection, entreprisesSeed);

  const profile = useMemo(() => getCommercialProfile(settingsAll), [settingsAll]);
  const myObjective = useMemo(() => getCommercialObjectives(objectivesAll), [objectivesAll]);

  const mesActivites = useMemo(() => activitesAll.filter((a) => a.commercialId === CURRENT_COMMERCIAL.id), [activitesAll]);
  const mesCallTickets = useMemo(() => callTicketsAll.filter((t) => t.commercialId === CURRENT_COMMERCIAL.id), [callTicketsAll]);
  const mesCentres = useMemo(() => centresAll.filter((c) => c.assignedCommercialNom === CURRENT_COMMERCIAL.nom), [centresAll]);
  const mesEntreprises = useMemo(() => entreprisesAll.filter((e) => e.commercialResponsable === CURRENT_COMMERCIAL.nom), [entreprisesAll]);
  const stats = useMemo(
    () => getCommercialPerformance(mesActivites, mesCallTickets, { centres: mesCentres, entreprises: mesEntreprises, objective: myObjective }, resolvePeriod('30d')),
    [mesActivites, mesCallTickets, mesCentres, mesEntreprises, myObjective],
  );
  const appelsRepondus = mesCallTickets.filter((t) => t.result === 'Répondu').length;
  const tauxReponse = percentOf(appelsRepondus, mesCallTickets.length);

  function persist(patch: Partial<CommercialProfileSettings>) {
    const exists = settingsAll.some((s) => s.id === CURRENT_COMMERCIAL.id);
    if (exists) updateSettings(CURRENT_COMMERCIAL.id, patch);
    else
      addSettings({
        id: CURRENT_COMMERCIAL.id,
        telephone: profile.telephone,
        ville: profile.ville,
        email: profile.email,
        competences: profile.competences.length ? profile.competences : DEFAULT_COMMERCIAL_SKILLS,
        langue: profile.langue,
        notifEmail: profile.notifEmail,
        notifPush: profile.notifPush,
        notifRappels: profile.notifRappels,
        ...patch,
      });
  }

  const [editOpen, setEditOpen] = useState(false);
  const [editTelephone, setEditTelephone] = useState(profile.telephone);
  const [editVille, setEditVille] = useState(profile.ville);
  const [editEmail, setEditEmail] = useState(profile.email);

  useEffect(() => {
    if (editOpen) {
      setEditTelephone(profile.telephone);
      setEditVille(profile.ville);
      setEditEmail(profile.email);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editOpen]);

  function submitEdit(e: React.FormEvent) {
    e.preventDefault();
    persist({ telephone: editTelephone.trim(), ville: editVille.trim(), email: editEmail.trim() });
    notify('Informations mises à jour.');
    setEditOpen(false);
  }

  return (
    <div>
      <PageHeader title="Mon profil" subtitle="Vos informations professionnelles, compétences, objectifs et préférences." />

      <section className="mb-lg flex flex-col items-start justify-between gap-lg rounded-xl border border-amud-outline-variant/30 bg-amud-surface-container-lowest p-lg shadow-[0_4px_12px_rgba(0,0,0,0.02)] sm:flex-row sm:items-center">
        <div className="flex items-center gap-lg">
          <Avatar name={profile.nom} size="lg" />
          <div>
            <h1 className="text-headline-lg text-amud-on-surface">{profile.nom}</h1>
            <p className="text-body-md text-amud-on-surface-variant">
              {profile.fonction} · {profile.ville}
            </p>
            <Badge tone="success" className="mt-1">
              {profile.statut}
            </Badge>
          </div>
        </div>
        <button onClick={() => setEditOpen(true)} className="flex items-center gap-xs rounded-lg border border-amud-outline-variant px-md py-2 text-label-md text-amud-on-surface transition-colors hover:bg-amud-surface-container-low">
          <span className="material-symbols-outlined text-sm">edit</span> Modifier mes informations
        </button>
      </section>

      <div className="mb-lg">
        <Tabs tabs={TABS} active={tab} onChange={setTab} />
      </div>

      {tab === 'profil' ? (
        <div className="rounded-xl border border-amud-outline-variant/30 bg-amud-surface-container-lowest p-lg">
          <div className="grid grid-cols-1 gap-md sm:grid-cols-2">
            {[
              { icon: 'badge', label: 'Nom complet', value: profile.nom },
              { icon: 'mail', label: 'Email', value: profile.email },
              { icon: 'phone', label: 'Téléphone', value: profile.telephone },
              { icon: 'location_on', label: 'Ville', value: profile.ville },
              { icon: 'work', label: 'Fonction', value: profile.fonction },
              { icon: 'event', label: "Date d'entrée", value: profile.dateEntree },
              { icon: 'verified', label: 'Statut', value: profile.statut },
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
          <div className="flex flex-col gap-md">
            {(profile.competences.length ? profile.competences : DEFAULT_COMMERCIAL_SKILLS).map((s) => (
              <div key={s.label} className="flex items-center gap-md">
                <span className="w-40 shrink-0 text-label-md text-amud-on-surface">{s.label}</span>
                <div className="flex flex-1 items-center gap-1">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => {
                        const next: CommercialSkill[] = (profile.competences.length ? profile.competences : DEFAULT_COMMERCIAL_SKILLS).map((sk) =>
                          sk.label === s.label ? { ...sk, niveau: level } : sk,
                        );
                        persist({ competences: next });
                      }}
                      className="flex h-8 w-8 items-center justify-center"
                      aria-label={`${s.label} niveau ${level}`}
                    >
                      <span
                        className={`material-symbols-outlined text-[20px] ${level <= s.niveau ? 'text-amud-primary' : 'text-amud-outline-variant'}`}
                        style={level <= s.niveau ? { fontVariationSettings: "'FILL' 1" } : undefined}
                      >
                        star
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {tab === 'objectifs' ? (
        <div>
          <ReadOnlyNotice>Les objectifs sont définis par l&apos;administrateur ; vous pouvez les consulter mais pas les modifier ici.</ReadOnlyNotice>
          <div className="grid grid-cols-2 gap-md md:grid-cols-3">
            <StatCard label="Objectif quotidien (appels)" value={myObjective?.appelsJour ?? 0} accent="bg-amud-primary" />
            <StatCard label="Objectif hebdomadaire (RDV)" value={myObjective?.rdvSemaine ?? 0} accent="bg-amud-secondary" />
            <StatCard label="Objectif mensuel (contacts)" value={myObjective?.contactsMois ?? 0} accent="bg-amud-primary-container" />
            <StatCard label="Objectif rendez-vous conversion" value={myObjective?.tauxConversionCible ?? 0} suffix="%" accent="bg-amud-tertiary-fixed-dim" />
            <StatCard label="Objectif mensuel (appels)" value={myObjective?.objectifMensuel ?? 0} accent="bg-amud-secondary" />
          </div>
        </div>
      ) : null}

      {tab === 'statistiques' ? (
        <div className="flex flex-col gap-lg">
          <div className="grid grid-cols-2 gap-md md:grid-cols-4">
            <StatCard label="Appels (30j)" value={mesCallTickets.length} accent="bg-amud-primary" />
            <StatCard label="Taux de réponse" value={tauxReponse} suffix="%" accent="bg-amud-primary-container" />
            <StatCard label="Rendez-vous" value={stats.kpis.rendezVous} accent="bg-amud-secondary" />
            <StatCard label="Centres contactés" value={stats.kpis.centresContactes} accent="bg-amud-tertiary-fixed-dim" />
            <StatCard label="Conversion" value={stats.kpis.tauxConversion} suffix="%" accent="bg-amud-primary" />
            <StatCard label="Objectif atteint" value={stats.objectifMensuel.pct} suffix="%" accent="bg-amud-secondary" />
          </div>
          <AnalyticsCard title="Activité par jour de la semaine" subtitle="30 derniers jours">
            <ActivityHistogram data={stats.activiteParJour} ariaLabel="Activités par jour de la semaine" />
          </AnalyticsCard>
        </div>
      ) : null}

      {tab === 'preferences' ? (
        <div className="flex flex-col gap-lg">
          <div className="rounded-xl border border-amud-outline-variant/30 bg-amud-surface-container-lowest p-lg">
            <h3 className="mb-md text-title-lg text-amud-on-surface">Langue et thème</h3>
            <div className="flex items-center gap-sm">
              <HeaderLanguageThemeControls />
              <span className="text-label-sm text-amud-on-surface-variant">Langue actuelle : {profile.langue}</span>
            </div>
          </div>
          <div className="rounded-xl border border-amud-outline-variant/30 bg-amud-surface-container-lowest p-lg">
            <h3 className="mb-md text-title-lg text-amud-on-surface">Notifications</h3>
            <div className="flex flex-col gap-sm">
              <div className="flex items-center justify-between">
                <span className="text-label-md text-amud-on-surface">Notifications par email</span>
                <Toggle checked={profile.notifEmail} onChange={(v) => persist({ notifEmail: v })} label="Notifications par email" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-label-md text-amud-on-surface">Notifications push</span>
                <Toggle checked={profile.notifPush} onChange={(v) => persist({ notifPush: v })} label="Notifications push" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-label-md text-amud-on-surface">Rappels automatiques</span>
                <Toggle checked={profile.notifRappels} onChange={(v) => persist({ notifRappels: v })} label="Rappels automatiques" />
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {tab === 'securite' ? (
        <div className="rounded-xl border border-amud-outline-variant/30 bg-amud-surface-container-lowest p-lg">
          <h3 className="mb-md text-title-lg text-amud-on-surface">Sécurité</h3>
          <div className="flex flex-col gap-md">
            <div className="flex items-center gap-sm text-body-md text-amud-on-surface">
              <span className="material-symbols-outlined text-amud-primary">login</span>
              Dernière connexion : aujourd&apos;hui à {new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            </div>
            <div>
              <p className="mb-sm text-label-md font-medium text-amud-on-surface-variant">Sessions récentes</p>
              <div className="flex flex-col gap-sm">
                {[
                  { appareil: 'Chrome · Windows', lieu: 'Casablanca, MA', date: "Aujourd'hui" },
                  { appareil: 'Application mobile', lieu: 'Casablanca, MA', date: 'Hier' },
                ].map((s, i) => (
                  <div key={i} className="flex items-center justify-between rounded-lg border border-amud-outline-variant p-md">
                    <div>
                      <p className="text-body-md text-amud-on-surface">{s.appareil}</p>
                      <p className="text-label-sm text-amud-on-surface-variant">{s.lieu}</p>
                    </div>
                    <span className="text-label-sm text-amud-on-surface-variant">{s.date}</span>
                  </div>
                ))}
              </div>
            </div>
            <ReadOnlyNotice>Ceci est une démonstration : aucune authentification ni gestion de session réelle n&apos;est en place.</ReadOnlyNotice>
          </div>
        </div>
      ) : null}

      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Modifier mes informations"
        widthClassName="max-w-md"
        footer={
          <div className="flex justify-end gap-sm">
            <button type="button" onClick={() => setEditOpen(false)} className="rounded-lg border border-amud-outline-variant px-lg py-2 text-label-md text-amud-on-surface hover:bg-amud-surface-container-low">
              Annuler
            </button>
            <button type="submit" form="edit-profile-form" className="rounded-lg bg-amud-primary px-lg py-2 text-label-md font-medium text-white hover:bg-amud-primary-dark">
              Enregistrer
            </button>
          </div>
        }
      >
        <form id="edit-profile-form" onSubmit={submitEdit} className="flex flex-col gap-md">
          <div>
            <label className="mb-1 block text-label-md text-amud-on-surface-variant">Téléphone</label>
            <input value={editTelephone} onChange={(e) => setEditTelephone(e.target.value)} className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary" />
          </div>
          <div>
            <label className="mb-1 block text-label-md text-amud-on-surface-variant">Ville</label>
            <input value={editVille} onChange={(e) => setEditVille(e.target.value)} className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary" />
          </div>
          <div>
            <label className="mb-1 block text-label-md text-amud-on-surface-variant">Email</label>
            <input type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary" />
          </div>
        </form>
      </Modal>
    </div>
  );
}
