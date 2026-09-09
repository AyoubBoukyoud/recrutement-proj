'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import { Drawer } from '@/components/amud/ui';
import { useToast } from '@/components/amud/Toast';
import { useCollection } from '@/lib/amud/storage/useCollection';
import { applicationsCollection } from '@/lib/amud/localApplications';
import { applicationsSeed, STATUS_LABEL, type Application, type ApplicationStatus } from '@/data/amud/applications';
import { offresCollection } from '@/lib/amud/localOffres';
import { offresSeed } from '@/data/amud/offres';
import { candidatesCollection } from '@/lib/amud/localCandidates';
import { candidatesSeed } from '@/data/amud/candidates';
import { CURRENT_EMPLOYER } from '@/data/amud/currentEmployer';
import { changeApplicationStatus } from '@/lib/amud/applicationCascades';
import { startConversation } from '@/lib/amud/messageCascades';

const STATUT_PILL: Record<ApplicationStatus, string> = {
  NEW: 'bg-amud-primary-container text-white',
  SCREENING: 'bg-amud-surface-container-high text-amud-on-surface-variant',
  INTERVIEW: 'bg-amud-tertiary text-white',
  SHORTLIST: 'bg-amud-primary text-white',
  ACCEPTED: 'bg-amud-primary-fixed text-amud-on-primary-fixed',
  REJECTED: 'bg-amud-error-container text-amud-on-error-container',
  WITHDRAWN: 'bg-amud-surface-container-highest text-amud-on-surface-variant',
};

const ALL_STATUSES = Object.keys(STATUS_LABEL) as ApplicationStatus[];

function initialsOf(nom: string): string {
  return nom.split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase();
}

export default function AmudEntrepriseCandidaturesPage() {
  const notify = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [applications] = useCollection(applicationsCollection, applicationsSeed);
  const [offres] = useCollection(offresCollection, offresSeed);
  const [candidates] = useCollection(candidatesCollection, candidatesSeed);

  const [search, setSearch] = useState('');
  const [offerId, setOfferId] = useState('');
  const [status, setStatus] = useState<ApplicationStatus | ''>(() => {
    const q = searchParams.get('status');
    return q && ALL_STATUSES.includes(q as ApplicationStatus) ? (q as ApplicationStatus) : '';
  });
  const [ville, setVille] = useState('');
  const [minScore, setMinScore] = useState(0);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const myApplications = useMemo(() => applications.filter((a) => a.entrepriseId === CURRENT_EMPLOYER.entrepriseId), [applications]);
  const myOffres = useMemo(() => offres.filter((o) => o.entrepriseId === CURRENT_EMPLOYER.entrepriseId), [offres]);
  const candidateById = useMemo(() => new Map(candidates.map((c) => [c.id, c])), [candidates]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return [...myApplications]
      .filter((a) => !q || a.candidateNom.toLowerCase().includes(q) || a.offerTitre.toLowerCase().includes(q))
      .filter((a) => !offerId || a.offerId === offerId)
      .filter((a) => !status || a.status === status)
      .filter((a) => !ville || candidateById.get(a.candidateId)?.ville === ville)
      .filter((a) => a.score >= minScore)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }, [myApplications, search, offerId, status, ville, minScore, candidateById]);

  const villes = useMemo(() => Array.from(new Set(myApplications.map((a) => candidateById.get(a.candidateId)?.ville).filter(Boolean) as string[])), [myApplications, candidateById]);

  function handleContacter(a: Application) {
    const conv = startConversation({ candidateId: a.candidateId, candidateNom: a.candidateNom, offerId: a.offerId, offerTitre: a.offerTitre, text: `Bonjour ${a.candidateNom}, merci pour votre candidature au poste de ${a.offerTitre}.` });
    notify(`Conversation démarrée avec ${a.candidateNom}.`);
    router.push(`/amud/entreprise/messages/${conv.id}`);
  }

  const activeFiltersCount = [offerId, status, ville, minScore > 0].filter(Boolean).length;

  const filtersContent = (
    <div className="flex flex-col gap-md">
      <div>
        <label className="mb-1 block text-label-md text-amud-on-surface-variant">Offre</label>
        <select value={offerId} onChange={(e) => setOfferId(e.target.value)} className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary">
          <option value="">Toutes les offres</option>
          {myOffres.map((o) => (
            <option key={o.id} value={o.id}>
              {o.titre}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-label-md text-amud-on-surface-variant">Statut</label>
        <select value={status} onChange={(e) => setStatus(e.target.value as ApplicationStatus | '')} className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary">
          <option value="">Tous les statuts</option>
          {ALL_STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL[s]}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-label-md text-amud-on-surface-variant">Ville</label>
        <select value={ville} onChange={(e) => setVille(e.target.value)} className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary">
          <option value="">Toutes les villes</option>
          {villes.map((v) => (
            <option key={v}>{v}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-label-md text-amud-on-surface-variant">Score minimum : {minScore}%</label>
        <input type="range" min={0} max={100} step={5} value={minScore} onChange={(e) => setMinScore(Number(e.target.value))} className="w-full accent-amud-primary" />
      </div>
      {activeFiltersCount > 0 ? (
        <button
          onClick={() => {
            setOfferId('');
            setStatus('');
            setVille('');
            setMinScore(0);
          }}
          className="text-label-md font-medium text-amud-primary hover:underline"
        >
          Réinitialiser les filtres
        </button>
      ) : null}
    </div>
  );

  return (
    <div>
      <div className="mb-lg">
        <h2 className="text-headline-lg text-amud-on-surface">Candidatures</h2>
        <p className="mt-1 text-body-md text-amud-on-surface-variant">{filtered.length} candidature(s) pour {CURRENT_EMPLOYER.entrepriseNom}.</p>
      </div>

      <div className="mb-lg flex flex-col gap-sm md:flex-row md:items-start md:gap-lg">
        <div className="flex flex-1 flex-col gap-sm sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-amud-on-surface-variant">search</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un candidat, une offre…"
              aria-label="Rechercher un candidat, une offre"
              className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface-container-low py-2 pl-10 pr-4 text-body-md outline-none focus:ring-2 focus:ring-amud-primary"
              type="text"
            />
          </div>
          <button
            onClick={() => setFiltersOpen(true)}
            className="flex shrink-0 items-center justify-center gap-1 rounded-lg border border-amud-outline-variant px-md py-2 text-label-md font-medium text-amud-on-surface hover:bg-amud-surface-container-low md:hidden"
          >
            <span className="material-symbols-outlined text-[18px]">tune</span>
            Filtres {activeFiltersCount > 0 ? `(${activeFiltersCount})` : ''}
          </button>
        </div>
        <div className="hidden w-72 shrink-0 rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-md md:block">{filtersContent}</div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-amud-outline-variant p-xl text-center">
          <span className="material-symbols-outlined text-4xl text-amud-on-surface-variant">assignment_late</span>
          <p className="mt-sm text-body-md font-medium text-amud-on-surface">Aucune candidature pour le moment.</p>
          <p className="mt-1 text-label-sm text-amud-on-surface-variant">Ajustez vos filtres ou revenez plus tard.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-sm">
          {filtered.map((a) => {
            const candidate = candidateById.get(a.candidateId);
            return (
              <div key={a.id} className="flex flex-col gap-sm rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-md sm:flex-row sm:items-center">
                <div className="flex flex-1 items-center gap-md">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-amud-primary-fixed text-[13px] font-bold text-amud-on-primary-fixed">{initialsOf(a.candidateNom)}</span>
                  <div className="min-w-0 flex-1">
                    <Link href={`/amud/entreprise/candidatures/${a.id}`} className="truncate font-bold text-amud-on-surface hover:text-amud-primary">
                      {a.candidateNom}
                    </Link>
                    <p className="truncate text-label-sm text-amud-on-surface-variant">
                      {a.offerTitre} {candidate?.ville ? `· ${candidate.ville}` : ''}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-1">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${STATUT_PILL[a.status]}`}>{STATUS_LABEL[a.status]}</span>
                      <span className="text-[11px] font-bold text-amud-primary">{a.score}% match</span>
                      <span className="text-[11px] text-amud-on-surface-variant">· {new Date(a.createdAt).toLocaleDateString('fr-FR')}</span>
                    </div>
                    {a.tags.length > 0 ? (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {a.tags.slice(0, 4).map((t) => (
                          <span key={t} className="rounded bg-amud-surface-container-highest px-1.5 py-0.5 text-[10px] font-medium text-amud-on-surface-variant">
                            {t}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-xs sm:flex-col sm:items-stretch sm:gap-1.5">
                  <select
                    value={a.status}
                    onChange={(e) => {
                      changeApplicationStatus(a, e.target.value as ApplicationStatus);
                      notify(`Statut mis à jour : ${STATUS_LABEL[e.target.value as ApplicationStatus]}.`);
                    }}
                    className="rounded-lg border border-amud-outline-variant bg-amud-surface px-2 py-1.5 text-label-sm outline-none focus:ring-2 focus:ring-amud-primary"
                    aria-label={`Changer le statut de ${a.candidateNom}`}
                  >
                    {ALL_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {STATUS_LABEL[s]}
                      </option>
                    ))}
                  </select>
                  <div className="flex gap-1.5">
                    <Link href={`/amud/entreprise/candidatures/${a.id}`} className="flex-1 rounded-lg border border-amud-outline-variant px-sm py-1.5 text-center text-label-sm font-medium text-amud-on-surface hover:bg-amud-surface-container-low">
                      Voir profil
                    </Link>
                    <button onClick={() => handleContacter(a)} className="flex-1 rounded-lg border border-amud-outline-variant px-sm py-1.5 text-center text-label-sm font-medium text-amud-on-surface hover:bg-amud-surface-container-low">
                      Contacter
                    </button>
                  </div>
                  <Link href={`/amud/entreprise/entretiens?candidatureId=${a.id}`} className="rounded-lg bg-amud-primary px-sm py-1.5 text-center text-label-sm font-medium text-white hover:brightness-110">
                    Planifier entretien
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Drawer open={filtersOpen} onClose={() => setFiltersOpen(false)} anchor="bottom" title="Filtres">
        {filtersContent}
      </Drawer>
    </div>
  );
}
