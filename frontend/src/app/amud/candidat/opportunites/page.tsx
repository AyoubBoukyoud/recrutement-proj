'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { FilterBar, SelectFilter, SegmentedControl, Badge, EmptyState, PageHeader } from '@/components/amud/ui';
import { useCurrentCandidate } from '@/lib/amud/useCurrentCandidate';
import { useCollection } from '@/lib/amud/storage/useCollection';
import { offresCollection } from '@/lib/amud/localOffres';
import { applicationsCollection } from '@/lib/amud/localApplications';
import { offresSeed } from '@/data/amud/offres';
import { computeMatchScore } from '@/lib/amud/matchScoreService';

function parseFrenchDate(s: string): number {
  const m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return -Infinity;
  return new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1])).getTime();
}

type SortOption = 'pertinence' | 'date' | 'compatibilite';

export default function OpportunitesPage() {
  const { candidate } = useCurrentCandidate();
  const [offres] = useCollection(offresCollection, offresSeed);
  const [applications] = useCollection(applicationsCollection, []);
  const [search, setSearch] = useState('');
  const [ville, setVille] = useState('');
  const [contrat, setContrat] = useState('');
  const [secteur, setSecteur] = useState('');
  const [experience, setExperience] = useState('');
  const [teletravail, setTeletravail] = useState('');
  const [sort, setSort] = useState<SortOption>('pertinence');

  const published = useMemo(() => offres.filter((o) => o.statut === 'Publiée'), [offres]);
  const appliedOfferIds = useMemo(() => new Set(applications.filter((a) => a.candidateId === candidate?.id).map((a) => a.offerId)), [applications, candidate]);

  const villes = useMemo(() => Array.from(new Set(published.map((o) => o.ville))).sort(), [published]);
  const contrats = useMemo(() => Array.from(new Set(published.map((o) => o.contrat))).sort(), [published]);
  const secteurs = useMemo(() => Array.from(new Set(published.map((o) => o.secteur).filter((s): s is string => Boolean(s)))).sort(), [published]);
  const experiences = useMemo(() => Array.from(new Set(published.map((o) => o.niveauExperience).filter((s): s is NonNullable<typeof s> => Boolean(s)))) as string[], [published]);
  const teletravails = useMemo(() => Array.from(new Set(published.map((o) => o.teletravail).filter((s): s is NonNullable<typeof s> => Boolean(s)))) as string[], [published]);

  const activeFilterCount = [ville, contrat, secteur, experience, teletravail].filter(Boolean).length;

  const results = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = published.filter((o) => {
      if (q && !`${o.titre} ${o.entreprise} ${(o.competences ?? []).join(' ')}`.toLowerCase().includes(q)) return false;
      if (ville && o.ville !== ville) return false;
      if (contrat && o.contrat !== contrat) return false;
      if (secteur && o.secteur !== secteur) return false;
      if (experience && o.niveauExperience !== experience) return false;
      if (teletravail && o.teletravail !== teletravail) return false;
      return true;
    });

    const scored = list.map((o) => ({ offre: o, match: candidate ? computeMatchScore(candidate, o) : { score: 0, matches: [], gaps: [] } }));

    if (sort === 'date') scored.sort((a, b) => parseFrenchDate(b.offre.publication) - parseFrenchDate(a.offre.publication));
    else scored.sort((a, b) => b.match.score - a.match.score);

    return scored;
  }, [published, search, ville, contrat, secteur, experience, teletravail, sort, candidate]);

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader title="Opportunités" subtitle="Quel poste recherchez-vous ?" />

      <FilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Quel poste recherchez-vous ?"
        activeFilterCount={activeFilterCount}
        onReset={() => {
          setVille('');
          setContrat('');
          setSecteur('');
          setExperience('');
          setTeletravail('');
        }}
        filters={
          <>
            <SelectFilter label="Ville" value={ville} onChange={setVille} options={villes.map((v) => ({ value: v, label: v }))} />
            <SelectFilter label="Secteur" value={secteur} onChange={setSecteur} options={secteurs.map((v) => ({ value: v, label: v }))} />
            <SelectFilter label="Contrat" value={contrat} onChange={setContrat} options={contrats.map((v) => ({ value: v, label: v }))} />
            <SelectFilter label="Expérience" value={experience} onChange={setExperience} options={experiences.map((v) => ({ value: v, label: v }))} />
            <SelectFilter label="Télétravail" value={teletravail} onChange={setTeletravail} options={teletravails.map((v) => ({ value: v, label: v }))} />
          </>
        }
      />

      <div className="mb-md">
        <SegmentedControl
          label="Trier par"
          value={sort}
          onChange={setSort}
          options={[
            { value: 'pertinence', label: 'Pertinence' },
            { value: 'compatibilite', label: 'Compatibilité' },
            { value: 'date', label: 'Date' },
          ]}
        />
      </div>

      {results.length === 0 ? (
        <EmptyState icon="search_off" title="Aucune offre ne correspond à votre recherche" description="Essayez d'élargir vos filtres." />
      ) : (
        <div className="grid grid-cols-1 gap-md sm:grid-cols-2">
          {results.map(({ offre, match }) => (
            <Link
              key={offre.id}
              href={`/amud/candidat/opportunites/${offre.id}`}
              className="flex flex-col gap-sm rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-md shadow-sm transition-all hover:-translate-y-0.5 hover:border-amud-primary"
            >
              <div className="flex items-start justify-between gap-sm">
                <div className="min-w-0">
                  <p className="truncate text-body-md font-semibold text-amud-on-surface">{offre.titre}</p>
                  <p className="truncate text-label-sm text-amud-on-surface-variant">{offre.entreprise} · {offre.ville}</p>
                </div>
                {candidate ? <Badge tone={match.score >= 70 ? 'success' : match.score >= 40 ? 'warning' : 'neutral'}>{match.score}%</Badge> : null}
              </div>
              <div className="flex flex-wrap gap-1">
                <Badge tone="info">{offre.contrat}</Badge>
                {offre.teletravail ? <Badge>{offre.teletravail}</Badge> : null}
                {appliedOfferIds.has(offre.id) ? <Badge tone="success">Déjà postulé</Badge> : null}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
