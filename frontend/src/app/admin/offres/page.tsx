'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { api } from '@/lib/opsApi';
import type { Page } from '@/lib/candidateMarketplace';
import { useToast } from '@/components/amud/Toast';
import { Pagination } from '@/components/Pagination';

/*
 * Supervision des offres — porte le style de la maquette
 * `/amud/admin/offres` (KPI, recherche/filtres, tableau, menu d'action) sur
 * le vrai backend (`GET/PATCH /admin/offers*`, déjà utilisé par l'ancienne
 * version une ligne de cette page). Filtres alignés sur ce que
 * `AdminMarketplaceController::offers` accepte réellement (`q`, `status`) —
 * pas de filtre entreprise/secteur côté serveur, contrairement à la maquette.
 */
type OfferRow = {
  id: number;
  title: string;
  city: string;
  country: string;
  contract_type: string;
  status: 'draft' | 'published' | 'closed';
  applications_count: number;
  published_at: string | null;
  employer: { id: number; name: string | null; company_profile?: { company_name?: string | null } | null } | null;
};

type Metrics = { marketplace: { offers_draft: number; offers_published: number; applications_pending: number } };

const STATUS_LABEL: Record<OfferRow['status'], string> = {
  draft: 'Brouillon',
  published: 'Publiée',
  closed: 'Fermée',
};

const STATUS_CLASS: Record<OfferRow['status'], string> = {
  draft: 'bg-amud-surface-container-highest text-amud-on-surface-variant',
  published: 'bg-amud-primary-fixed text-amud-on-primary-fixed',
  closed: 'bg-amud-error-container text-amud-on-error-container',
};

function errorMessage(error: unknown, fallback: string) {
  if (isAxiosError(error)) {
    const data = error.response?.data as { message?: string } | undefined;
    return data?.message ?? fallback;
  }
  return fallback;
}

export default function AdminOffresPage() {
  const notify = useToast();
  const qc = useQueryClient();
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [openMenu, setOpenMenu] = useState<number | null>(null);

  const metrics = useQuery({
    queryKey: ['admin-metrics'],
    queryFn: () => api.get('/admin/metrics').then((r) => r.data as Metrics),
  });

  const offers = useQuery({
    queryKey: ['admin-offers', search, status, page],
    queryFn: () =>
      api
        .get('/admin/offers', { params: { q: search || undefined, status: status || undefined, page } })
        .then((r) => r.data as Page<OfferRow>),
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ['admin-offers'] });

  const setOfferStatus = useMutation({
    mutationFn: ({ id, next }: { id: number; next: OfferRow['status'] }) =>
      api.patch(`/admin/offers/${id}`, { status: next, reason: next === 'published' ? null : 'Modération administrateur' }),
    onSuccess: (_data, variables) => {
      setOpenMenu(null);
      notify(`Statut mis à jour : ${STATUS_LABEL[variables.next]}.`);
      refresh();
      qc.invalidateQueries({ queryKey: ['admin-metrics'] });
    },
    onError: (error) => notify(errorMessage(error, 'Action impossible.'), 'error'),
  });

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  }

  const rows = offers.data?.data ?? [];
  const m = metrics.data?.marketplace;

  return (
    <div>
      <div className="mb-lg flex flex-wrap items-end justify-between gap-md">
        <div>
          <h2 className="text-headline-lg text-amud-on-surface">Gestion des offres</h2>
          <p className="mt-1 text-body-md text-amud-on-surface-variant">Modération et suivi des offres d’emploi publiées sur la plateforme.</p>
        </div>
      </div>

      <div className="mb-lg grid grid-cols-2 gap-md md:grid-cols-4">
        {[
          { label: 'Total (page)', value: offers.data?.total },
          { label: 'Brouillons', value: m?.offers_draft },
          { label: 'Publiées', value: m?.offers_published },
          { label: 'Candidatures en attente', value: m?.applications_pending },
        ].map((k) => (
          <div key={k.label} className="relative flex flex-col items-start justify-center overflow-hidden rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-md shadow-[0_4px_12px_rgba(0,0,0,0.02)]">
            <div className="absolute bottom-0 left-0 top-0 w-1 bg-amud-primary" />
            <span className="mb-1 text-label-sm uppercase tracking-wider text-amud-on-surface-variant">{k.label}</span>
            <span className="text-headline-lg text-amud-on-surface">{k.value ?? '—'}</span>
          </div>
        ))}
      </div>

      <form onSubmit={submitSearch} className="mb-md flex flex-col items-center gap-md rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-md shadow-[0_4px_12px_rgba(0,0,0,0.02)] md:flex-row">
        <div className="relative w-full flex-1">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-amud-on-surface-variant">search</span>
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface py-2 pl-10 pr-4 text-body-md text-amud-on-surface outline-none focus:ring-2 focus:ring-amud-primary"
            placeholder="Rechercher par titre, ville, secteur…"
            type="text"
          />
        </div>
        <div className="flex w-full gap-2 overflow-x-auto pb-1 md:w-auto md:pb-0">
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-amud-outline-variant bg-amud-surface px-4 py-2 text-label-md text-amud-on-surface focus:outline-none focus:ring-2 focus:ring-amud-primary"
          >
            <option value="">Statut : tous</option>
            <option value="draft">Brouillon</option>
            <option value="published">Publiée</option>
            <option value="closed">Fermée</option>
          </select>
          <button type="submit" className="rounded-lg border border-amud-outline-variant px-4 py-2 text-label-md font-medium text-amud-on-surface hover:bg-amud-surface-container-low">
            Filtrer
          </button>
        </div>
      </form>

      <div className="overflow-x-auto rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest shadow-[0_4px_12px_rgba(0,0,0,0.02)]">
        <table className="w-full min-w-[720px] border-collapse text-left">
          <thead>
            <tr className="border-b border-amud-outline-variant bg-amud-surface-container-low/50">
              <th className="px-6 py-4 text-label-sm uppercase tracking-wider text-amud-on-surface-variant">Offre &amp; entreprise</th>
              <th className="hidden px-6 py-4 text-label-sm uppercase tracking-wider text-amud-on-surface-variant md:table-cell">Lieu &amp; contrat</th>
              <th className="hidden px-6 py-4 text-center text-label-sm uppercase tracking-wider text-amud-on-surface-variant sm:table-cell">Candidatures</th>
              <th className="px-6 py-4 text-label-sm uppercase tracking-wider text-amud-on-surface-variant">Statut</th>
              <th className="px-6 py-4 text-right text-label-sm uppercase tracking-wider text-amud-on-surface-variant">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-amud-outline-variant">
            {offers.isLoading ? (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-body-md text-amud-on-surface-variant">
                  Chargement…
                </td>
              </tr>
            ) : null}
            {!offers.isLoading && rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-body-md text-amud-on-surface-variant">
                  Aucune offre ne correspond à ces filtres.
                </td>
              </tr>
            ) : null}
            {rows.map((o) => {
              const employerName = o.employer?.company_profile?.company_name || o.employer?.name || 'Entreprise';
              return (
                <tr key={o.id} className="transition-colors hover:bg-amud-surface-container-lowest/50">
                  <td className="px-6 py-4">
                    <p className="font-semibold text-amud-on-surface">{o.title}</p>
                    <p className="text-label-sm text-amud-on-surface-variant">{employerName}</p>
                  </td>
                  <td className="hidden px-6 py-4 text-body-md text-amud-on-surface-variant md:table-cell">
                    {o.city}
                    <p className="text-label-sm">{o.contract_type}</p>
                  </td>
                  <td className="hidden px-6 py-4 text-center text-amud-on-surface sm:table-cell">{o.applications_count}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_CLASS[o.status]}`}>{STATUS_LABEL[o.status]}</span>
                  </td>
                  <td className="relative px-6 py-4 text-right">
                    <button onClick={() => setOpenMenu(openMenu === o.id ? null : o.id)} className="p-1 text-amud-on-surface-variant transition-colors hover:text-amud-primary">
                      <span className="material-symbols-outlined">more_vert</span>
                    </button>
                    {openMenu === o.id ? (
                      <div className="absolute right-6 top-12 z-10 w-48 rounded-lg border border-amud-outline-variant bg-amud-surface py-1 text-left shadow-lg animate-amud-fade-in">
                        {o.status !== 'published' ? (
                          <button onClick={() => setOfferStatus.mutate({ id: o.id, next: 'published' })} className="block w-full px-4 py-2 text-left text-label-md text-amud-on-surface hover:bg-amud-surface-container-low">
                            Publier
                          </button>
                        ) : null}
                        {o.status !== 'draft' ? (
                          <button onClick={() => setOfferStatus.mutate({ id: o.id, next: 'draft' })} className="block w-full px-4 py-2 text-left text-label-md text-amud-on-surface hover:bg-amud-surface-container-low">
                            Remettre en brouillon
                          </button>
                        ) : null}
                        {o.status !== 'closed' ? (
                          <button onClick={() => setOfferStatus.mutate({ id: o.id, next: 'closed' })} className="block w-full px-4 py-2 text-left text-label-md text-amud-error hover:bg-amud-surface-container-low">
                            Fermer
                          </button>
                        ) : null}
                      </div>
                    ) : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-md">
        <Pagination page={page} data={offers.data} onPage={setPage} noun="offre" />
      </div>
    </div>
  );
}
