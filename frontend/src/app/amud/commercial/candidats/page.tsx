'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Avatar, Badge, EmptyState, FilterBar, PageHeader, ReadOnlyNotice, ResponsiveTable, SelectFilter, StatCard, type BadgeTone } from '@/components/amud/ui';
import { useToast } from '@/components/amud/Toast';
import { useCollection } from '@/lib/amud/storage/useCollection';
import { CURRENT_COMMERCIAL } from '@/data/amud/currentCommercial';
import { candidatesSeed, getCandidatesForCommercial, type StatutCandidate } from '@/data/amud/candidates';
import { candidatesCollection } from '@/lib/amud/localCandidates';
import { callTicketsSeed } from '@/data/amud/callTickets';
import { callTicketsCollection } from '@/lib/amud/localCallTickets';
import { followupsSeed } from '@/data/amud/followups';
import { followupsCollection } from '@/lib/amud/localFollowUps';
import { commercialCandidatePrefsSeed, PRIORITE_CANDIDAT_CLASS, PRIORITES_CANDIDAT, getPrefForCandidate, type PrioriteCandidat } from '@/data/amud/commercialCandidatePrefs';
import { commercialCandidatePrefsCollection, toggleCommercialCandidateFavorite } from '@/lib/amud/localCommercialCandidatePrefs';
import { getCommercialCandidateStats } from '@/lib/amud/commercialServices';
import { createCallTicket } from '@/lib/amud/callTicketCascade';

const STATUT_TONE: Record<StatutCandidate, BadgeTone> = {
  Actif: 'success',
  Inactif: 'neutral',
  Bloqué: 'danger',
};

export default function AmudCommercialCandidatsPage() {
  const notify = useToast();
  const [candidatesAll] = useCollection(candidatesCollection, candidatesSeed);
  const [callTicketsAll] = useCollection(callTicketsCollection, callTicketsSeed);
  const [followupsAll] = useCollection(followupsCollection, followupsSeed);
  const [prefsAll] = useCollection(commercialCandidatePrefsCollection, commercialCandidatePrefsSeed);

  const mesCandidats = useMemo(() => getCandidatesForCommercial(CURRENT_COMMERCIAL.nom, candidatesAll), [candidatesAll]);
  const mesCallTickets = useMemo(() => callTicketsAll.filter((t) => t.commercialId === CURRENT_COMMERCIAL.id), [callTicketsAll]);
  const mesFollowups = useMemo(() => followupsAll.filter((f) => f.commercialId === CURRENT_COMMERCIAL.id), [followupsAll]);

  const stats = useMemo(() => getCommercialCandidateStats(mesCandidats, mesCallTickets, mesFollowups), [mesCandidats, mesCallTickets, mesFollowups]);

  const rappelByCandidate = useMemo(() => {
    const map = new Map<string, { dueDate: string; dueTime: string }>();
    for (const f of mesFollowups) {
      if (f.status !== 'Planifiée' || f.contactType !== 'Candidat' || !f.contactId) continue;
      const current = map.get(f.contactId);
      if (!current || `${f.dueDate} ${f.dueTime}` < `${current.dueDate} ${current.dueTime}`) map.set(f.contactId, { dueDate: f.dueDate, dueTime: f.dueTime });
    }
    return map;
  }, [mesFollowups]);

  const [search, setSearch] = useState('');
  const [ville, setVille] = useState('');
  const [competence, setCompetence] = useState('');
  const [statut, setStatut] = useState('');
  const [disponibilite, setDisponibilite] = useState('');
  const [priorite, setPriorite] = useState('');
  const [onlyRappel, setOnlyRappel] = useState(false);

  const villes = useMemo(() => Array.from(new Set(mesCandidats.map((c) => c.ville))).sort(), [mesCandidats]);
  const competences = useMemo(() => Array.from(new Set(mesCandidats.flatMap((c) => c.competences))).sort(), [mesCandidats]);
  const disponibilites = useMemo(() => Array.from(new Set(mesCandidats.map((c) => c.disponibilite))).sort(), [mesCandidats]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return mesCandidats.filter((c) => {
      const pref = getPrefForCandidate(CURRENT_COMMERCIAL.id, c.id, prefsAll);
      const matchesQuery =
        !q ||
        c.nom.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.telephone.toLowerCase().includes(q) ||
        c.ville.toLowerCase().includes(q) ||
        c.posteRecherche.toLowerCase().includes(q) ||
        c.competences.some((comp) => comp.toLowerCase().includes(q));
      return (
        matchesQuery &&
        (!ville || c.ville === ville) &&
        (!competence || c.competences.includes(competence)) &&
        (!statut || c.statut === statut) &&
        (!disponibilite || c.disponibilite === disponibilite) &&
        (!priorite || (pref?.priorite ?? 'Normale') === priorite) &&
        (!onlyRappel || rappelByCandidate.has(c.id))
      );
    });
  }, [mesCandidats, prefsAll, search, ville, competence, statut, disponibilite, priorite, onlyRappel, rappelByCandidate]);

  function handleFavori(candidateId: string, nom: string) {
    const { favori } = toggleCommercialCandidateFavorite(CURRENT_COMMERCIAL.id, candidateId, prefsAll);
    notify(favori ? `${nom} ajouté(e) aux favoris.` : `${nom} retiré(e) des favoris.`);
  }

  function handleQuickCall(candidateId: string, nom: string) {
    createCallTicket({
      commercialId: CURRENT_COMMERCIAL.id,
      commercialNom: CURRENT_COMMERCIAL.nom,
      contactId: candidateId,
      contactNom: nom,
      contactType: 'Candidat',
      durationSeconds: 0,
      result: 'Répondu',
      summary: `Appel sortant vers ${nom}.`,
      followUpRequired: false,
    });
    notify(`Appel avec ${nom} enregistré.`);
  }

  const activeFilterCount = [ville, competence, statut, disponibilite, priorite, onlyRappel ? 'x' : ''].filter(Boolean).length;

  return (
    <div>
      <PageHeader title="Candidats" subtitle="Consultez et relancez les candidats qui vous sont affectés." />

      <ReadOnlyNotice>Les informations administratives du candidat restent gérées par le recrutement ; vous pouvez consulter, appeler, noter et prioriser.</ReadOnlyNotice>

      <div className="mb-lg grid grid-cols-2 gap-md md:grid-cols-4 lg:grid-cols-7">
        <StatCard label="Total candidats" value={stats.total} accent="bg-amud-primary" />
        <StatCard label="Actifs" value={stats.actifs} accent="bg-amud-primary-container" />
        <StatCard label="Nouveaux" value={stats.nouveaux} accent="bg-amud-tertiary-fixed-dim" />
        <StatCard label="Contactés" value={stats.contactes} accent="bg-amud-secondary" />
        <StatCard label="Intéressés" value={stats.interesses} accent="bg-amud-primary" />
        <StatCard label="À rappeler" value={stats.aRappeler} accent="bg-amud-tertiary-fixed-dim" />
        <StatCard label="Rendez-vous" value={stats.rdvProgrammes} accent="bg-amud-secondary" />
      </div>

      <FilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Rechercher par nom, email, téléphone, ville, compétence, métier…"
        activeFilterCount={activeFilterCount}
        onReset={() => {
          setSearch('');
          setVille('');
          setCompetence('');
          setStatut('');
          setDisponibilite('');
          setPriorite('');
          setOnlyRappel(false);
        }}
        filters={
          <>
            <SelectFilter label="Ville" value={ville} onChange={setVille} options={villes.map((v) => ({ value: v, label: v }))} />
            <SelectFilter label="Compétence" value={competence} onChange={setCompetence} options={competences.map((c) => ({ value: c, label: c }))} />
            <SelectFilter label="Statut" value={statut} onChange={setStatut} options={(['Actif', 'Inactif', 'Bloqué'] as StatutCandidate[]).map((s) => ({ value: s, label: s }))} />
            <SelectFilter label="Disponibilité" value={disponibilite} onChange={setDisponibilite} options={disponibilites.map((d) => ({ value: d, label: d }))} />
            <SelectFilter label="Priorité" value={priorite} onChange={setPriorite} options={PRIORITES_CANDIDAT.map((p) => ({ value: p, label: p }))} />
            <label className="flex min-h-[44px] shrink-0 items-center gap-2 rounded-lg border border-amud-outline-variant px-4 text-label-md text-amud-on-surface">
              <input type="checkbox" checked={onlyRappel} onChange={(e) => setOnlyRappel(e.target.checked)} className="h-4 w-4 rounded border-amud-outline text-amud-primary focus:ring-amud-primary" />
              À rappeler
            </label>
          </>
        }
      />

      <ResponsiveTable
        columns={['Candidat', 'Ville', 'Compétences', 'Score', 'Statut', 'Dernière activité', 'Prochaine action']}
        caption="Liste de mes candidats"
        pageSize={10}
        rows={filtered.map((c) => {
          const pref = getPrefForCandidate(CURRENT_COMMERCIAL.id, c.id, prefsAll);
          const rappel = rappelByCandidate.get(c.id);
          return {
            id: c.id,
            cells: [
              <Link key="nom" href={`/amud/commercial/candidats/${c.id}`} className="flex items-center gap-3">
                <Avatar name={c.nom} size="sm" />
                <span className="min-w-0">
                  <span className="block truncate font-medium text-amud-on-surface hover:text-amud-primary">{c.nom}</span>
                  <span className="block truncate text-label-sm text-amud-on-surface-variant">{c.posteRecherche}</span>
                </span>
              </Link>,
              c.ville,
              <span key="comp" className="flex flex-wrap gap-1">
                {c.competences.slice(0, 2).map((comp) => (
                  <Badge key={comp} tone="info">
                    {comp}
                  </Badge>
                ))}
                {c.competences.length > 2 ? <span className="text-label-sm text-amud-on-surface-variant">+{c.competences.length - 2}</span> : null}
              </span>,
              c.score,
              <span key="statut" className="flex items-center gap-2">
                <Badge tone={STATUT_TONE[c.statut]}>{c.statut}</Badge>
                {pref?.favori ? <span className="material-symbols-outlined text-[16px] text-amud-tertiary" style={{ fontVariationSettings: "'FILL' 1" }}>star</span> : null}
              </span>,
              c.dernierAcces,
              rappel ? (
                <span key="pa" className="text-amud-tertiary">
                  Rappel {rappel.dueDate} à {rappel.dueTime}
                </span>
              ) : (
                '—'
              ),
            ],
            action: (
              <div className="flex justify-end gap-xs">
                <button
                  type="button"
                  onClick={() => handleFavori(c.id, c.nom)}
                  title={pref?.favori ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-amud-outline-variant text-amud-tertiary transition-colors hover:bg-amud-surface-container-low"
                >
                  <span className="material-symbols-outlined text-[18px]" style={pref?.favori ? { fontVariationSettings: "'FILL' 1" } : undefined}>
                    star
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickCall(c.id, c.nom)}
                  title="Appeler"
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-amud-outline-variant text-amud-primary transition-colors hover:bg-amud-surface-container-low"
                >
                  <span className="material-symbols-outlined text-[18px]">call</span>
                </button>
                <Link
                  href={`/amud/commercial/candidats/${c.id}`}
                  className="flex items-center gap-1 rounded-lg border border-amud-outline-variant px-3 py-1.5 text-label-sm text-amud-primary transition-colors hover:bg-amud-surface-container-low"
                >
                  Voir <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                </Link>
              </div>
            ),
          };
        })}
        empty={<EmptyState icon="person_search" title="Aucun candidat trouvé" description="Aucun candidat ne correspond à votre recherche ou à vos filtres." />}
      />

      {mesCandidats.length === 0 ? (
        <p className="mt-md text-center text-label-sm text-amud-on-surface-variant">Aucun candidat ne vous est actuellement affecté.</p>
      ) : null}
    </div>
  );
}
