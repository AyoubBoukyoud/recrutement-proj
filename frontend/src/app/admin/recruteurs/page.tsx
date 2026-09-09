'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { api } from '@/lib/opsApi';
import type { Page } from '@/lib/candidateMarketplace';
import { ConfirmDialog } from '@/components/amud/ui';
import { useToast } from '@/components/amud/Toast';
import { Pagination } from '@/components/Pagination';

/*
 * Liste des recruteurs — même transformation que `admin/candidats` : style
 * de la maquette `/amud/admin/recruteurs`, données réelles via
 * `GET/PATCH /admin/recruiters*` (déjà construit et testé, sans page qui
 * l'appelait — voir docs/WEBSITE_FULL_FUNCTIONALITY_AUDIT_2026-09-05.md).
 * Un « recruteur » est un `User` avec le rôle Company + son `CompanyProfile` ;
 * il n'existe pas de modèle Recruiter séparé côté backend.
 */
type RecruiterRow = {
  id: number;
  name: string | null;
  phone: string;
  email: string | null;
  account_status: 'active' | 'inactive' | 'blocked';
  company_name: string | null;
  sector: string | null;
  city: string | null;
  verified_at: string | null;
  shortlists_count: number;
  placed_count: number;
};

const ACCOUNT_STATUS_LABEL: Record<RecruiterRow['account_status'], string> = {
  active: 'Actif',
  inactive: 'Inactif',
  blocked: 'Bloqué',
};

const ACCOUNT_STATUS_CLASS: Record<RecruiterRow['account_status'], string> = {
  active: 'bg-amud-primary-fixed text-amud-on-primary-fixed',
  inactive: 'bg-amud-surface-container-highest text-amud-on-surface-variant',
  blocked: 'bg-amud-error-container text-amud-on-error-container',
};

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function errorMessage(error: unknown, fallback: string) {
  if (isAxiosError(error)) {
    const data = error.response?.data as { message?: string } | undefined;
    return data?.message ?? fallback;
  }
  return fallback;
}

export default function AdminRecruteursPage() {
  const notify = useToast();
  const qc = useQueryClient();
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [verifiedFilter, setVerifiedFilter] = useState('');
  const [accountStatus, setAccountStatus] = useState('');
  const [page, setPage] = useState(1);
  const [openMenu, setOpenMenu] = useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  const recruiters = useQuery({
    queryKey: ['admin-recruiters', search, verifiedFilter, accountStatus, page],
    queryFn: () =>
      api
        .get('/admin/recruiters', {
          params: {
            q: search || undefined,
            verified: verifiedFilter || undefined,
            account_status: accountStatus || undefined,
            page,
          },
        })
        .then((r) => r.data as Page<RecruiterRow>),
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ['admin-recruiters'] });

  const setAccountStatusMutation = useMutation({
    mutationFn: ({ id, next }: { id: number; next: RecruiterRow['account_status'] }) =>
      api.patch(`/admin/recruiters/${id}/status`, { status: next }),
    onSuccess: (_data, variables) => {
      setOpenMenu(null);
      notify(`Statut mis à jour : ${ACCOUNT_STATUS_LABEL[variables.next]}.`);
      refresh();
    },
    onError: (error) => notify(errorMessage(error, 'Action impossible.'), 'error'),
  });

  const remove = useMutation({
    mutationFn: (id: number) => api.delete(`/admin/recruiters/${id}`),
    onSuccess: () => {
      setConfirmDeleteId(null);
      notify('Fiche entreprise supprimée.', 'info');
      refresh();
    },
    onError: (error) => notify(errorMessage(error, 'Suppression impossible.'), 'error'),
  });

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  }

  const rows = recruiters.data?.data ?? [];

  return (
    <div>
      <div className="mb-lg flex flex-col items-start justify-between gap-md sm:flex-row sm:items-center">
        <div>
          <h2 className="text-headline-lg text-amud-on-surface">Recruteurs</h2>
          <p className="mt-1 text-body-md text-amud-on-surface-variant">Entreprises inscrites, vérification et accès.</p>
        </div>
      </div>

      <form onSubmit={submitSearch} className="mb-md flex flex-col items-center gap-md rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-md shadow-[0_4px_12px_rgba(0,0,0,0.02)] md:flex-row">
        <div className="relative w-full flex-1">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-amud-on-surface-variant">search</span>
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface py-2 pl-10 pr-4 text-body-md text-amud-on-surface outline-none focus:ring-2 focus:ring-amud-primary"
            placeholder="Rechercher par entreprise, nom, téléphone…"
            type="text"
          />
        </div>
        <div className="flex w-full gap-2 overflow-x-auto pb-1 md:w-auto md:pb-0">
          <select
            value={verifiedFilter}
            onChange={(e) => {
              setVerifiedFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-amud-outline-variant bg-amud-surface px-4 py-2 text-label-md text-amud-on-surface focus:outline-none focus:ring-2 focus:ring-amud-primary"
          >
            <option value="">Vérification : toutes</option>
            <option value="1">Vérifiées</option>
            <option value="0">Non vérifiées</option>
          </select>
          <select
            value={accountStatus}
            onChange={(e) => {
              setAccountStatus(e.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-amud-outline-variant bg-amud-surface px-4 py-2 text-label-md text-amud-on-surface focus:outline-none focus:ring-2 focus:ring-amud-primary"
          >
            <option value="">Compte : tous</option>
            <option value="active">Actif</option>
            <option value="inactive">Inactif</option>
            <option value="blocked">Bloqué</option>
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
              <th className="px-6 py-4 text-label-sm uppercase tracking-wider text-amud-on-surface-variant">Entreprise</th>
              <th className="hidden px-6 py-4 text-label-sm uppercase tracking-wider text-amud-on-surface-variant md:table-cell">Ville</th>
              <th className="hidden px-6 py-4 text-center text-label-sm uppercase tracking-wider text-amud-on-surface-variant sm:table-cell">Vérifiée</th>
              <th className="px-6 py-4 text-label-sm uppercase tracking-wider text-amud-on-surface-variant">Compte</th>
              <th className="hidden px-6 py-4 text-center text-label-sm uppercase tracking-wider text-amud-on-surface-variant lg:table-cell">Placements</th>
              <th className="px-6 py-4 text-right text-label-sm uppercase tracking-wider text-amud-on-surface-variant">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-amud-outline-variant">
            {recruiters.isLoading ? (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-body-md text-amud-on-surface-variant">
                  Chargement…
                </td>
              </tr>
            ) : null}
            {!recruiters.isLoading && rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-body-md text-amud-on-surface-variant">
                  Aucun recruteur ne correspond à ces filtres.
                </td>
              </tr>
            ) : null}
            {rows.map((r) => {
              const label = r.company_name || r.name || r.phone;
              return (
                <tr key={r.id} className="transition-colors hover:bg-amud-surface-container-lowest/50">
                  <td className="px-6 py-4">
                    <Link href={`/admin/recruteurs/${r.id}`} className="group flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amud-primary-container text-sm font-bold text-amud-primary">
                        {initials(label)}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-amud-on-surface transition-colors group-hover:text-amud-primary">{label}</p>
                        <p className="truncate text-label-sm text-amud-on-surface-variant">{r.name ?? r.phone}{r.sector ? ` · ${r.sector}` : ''}</p>
                      </div>
                    </Link>
                  </td>
                  <td className="hidden px-6 py-4 text-body-md text-amud-on-surface-variant md:table-cell">{r.city ?? '—'}</td>
                  <td className="hidden px-6 py-4 text-center sm:table-cell">
                    {r.verified_at ? (
                      <span className="material-symbols-outlined text-amud-primary">verified</span>
                    ) : (
                      <span className="text-amud-on-surface-variant">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${ACCOUNT_STATUS_CLASS[r.account_status]}`}>
                      {ACCOUNT_STATUS_LABEL[r.account_status]}
                    </span>
                  </td>
                  <td className="hidden px-6 py-4 text-center lg:table-cell text-amud-on-surface">{r.placed_count}</td>
                  <td className="relative px-6 py-4 text-right">
                    <button onClick={() => setOpenMenu(openMenu === r.id ? null : r.id)} className="p-1 text-amud-on-surface-variant transition-colors hover:text-amud-primary">
                      <span className="material-symbols-outlined">more_vert</span>
                    </button>
                    {openMenu === r.id ? (
                      <div className="absolute right-6 top-12 z-10 w-48 rounded-lg border border-amud-outline-variant bg-amud-surface py-1 text-left shadow-lg animate-amud-fade-in">
                        <Link href={`/admin/recruteurs/${r.id}`} onClick={() => setOpenMenu(null)} className="block w-full px-4 py-2 text-left text-label-md text-amud-on-surface hover:bg-amud-surface-container-low">
                          Voir la fiche
                        </Link>
                        {r.account_status !== 'active' ? (
                          <button onClick={() => setAccountStatusMutation.mutate({ id: r.id, next: 'active' })} className="block w-full px-4 py-2 text-left text-label-md text-amud-on-surface hover:bg-amud-surface-container-low">
                            Activer
                          </button>
                        ) : null}
                        {r.account_status !== 'inactive' ? (
                          <button onClick={() => setAccountStatusMutation.mutate({ id: r.id, next: 'inactive' })} className="block w-full px-4 py-2 text-left text-label-md text-amud-on-surface hover:bg-amud-surface-container-low">
                            Désactiver
                          </button>
                        ) : null}
                        {r.account_status !== 'blocked' ? (
                          <button onClick={() => setAccountStatusMutation.mutate({ id: r.id, next: 'blocked' })} className="block w-full px-4 py-2 text-left text-label-md text-amud-error hover:bg-amud-surface-container-low">
                            Bloquer
                          </button>
                        ) : null}
                        <button
                          onClick={() => {
                            setConfirmDeleteId(r.id);
                            setOpenMenu(null);
                          }}
                          className="block w-full px-4 py-2 text-left text-label-md text-amud-error hover:bg-amud-surface-container-low"
                        >
                          Supprimer
                        </button>
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
        <Pagination page={page} data={recruiters.data} onPage={setPage} noun="recruteur" />
      </div>

      <ConfirmDialog
        open={confirmDeleteId !== null}
        onClose={() => setConfirmDeleteId(null)}
        onConfirm={() => confirmDeleteId !== null && remove.mutate(confirmDeleteId)}
        title="Supprimer cette fiche entreprise ?"
        description="La fiche entreprise sera retirée. Le compte de connexion et sa shortlist restent en place."
        confirmLabel="Supprimer"
      />
    </div>
  );
}
