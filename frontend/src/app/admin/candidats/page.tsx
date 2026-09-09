'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { api } from '@/lib/opsApi';
import type { Page } from '@/lib/candidateMarketplace';
import { ConfirmDialog } from '@/components/amud/ui';
import { useToast } from '@/components/amud/Toast';
import { Pagination } from '@/components/Pagination';

/*
 * Liste des candidats — porte le style de la maquette `/amud/admin/candidats`
 * (KPI, barre de recherche/filtres, tableau avec avatar+statut, menu d'action
 * par ligne) sur le vrai backend (`GET/PATCH /admin/candidates*`), déjà
 * construit et testé mais jusqu'ici sans aucune page qui l'appelle — voir
 * docs/WEBSITE_FULL_FUNCTIONALITY_AUDIT_2026-09-05.md, section « Admin
 * console ». Les KPI viennent de `/admin/metrics` (déjà utilisé par
 * `admin/page.tsx`) plutôt que de la page courante, forcément partielle une
 * fois paginée.
 */
type CandidateRow = {
  id: number;
  name: string | null;
  phone: string;
  email: string | null;
  city: string | null;
  account_status: 'active' | 'inactive' | 'blocked';
  availability_status: string | null;
  submitted_at: string | null;
  verified_at: string | null;
  completion_percent: number;
  documents_awaiting_approval: number;
  top_skills: string[];
  shortlists_count: number;
};

type Metrics = { candidates: { total: number; submitted: number; verified: number; new_this_week: number } };

const ACCOUNT_STATUS_LABEL: Record<CandidateRow['account_status'], string> = {
  active: 'Actif',
  inactive: 'Inactif',
  blocked: 'Bloqué',
};

const ACCOUNT_STATUS_CLASS: Record<CandidateRow['account_status'], string> = {
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

export default function AdminCandidatsPage() {
  return (
    <Suspense fallback={<p className="text-body-md text-amud-on-surface-variant">Chargement…</p>}>
      <AdminCandidatsPageInner />
    </Suspense>
  );
}

/** `useSearchParams()` (le filtre `?status=` depuis le tableau de bord) force ce composant sous `<Suspense>` — voir la note de build Next.js. */
function AdminCandidatsPageInner() {
  const notify = useToast();
  const qc = useQueryClient();
  const searchParams = useSearchParams();
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState(() => searchParams.get('status') ?? '');
  const [accountStatus, setAccountStatus] = useState('');
  const [page, setPage] = useState(1);
  const [openMenu, setOpenMenu] = useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  const metrics = useQuery({
    queryKey: ['admin-metrics'],
    queryFn: () => api.get('/admin/metrics').then((r) => r.data as Metrics),
  });

  const candidates = useQuery({
    queryKey: ['admin-candidates', search, status, accountStatus, page],
    queryFn: () =>
      api
        .get('/admin/candidates', {
          params: {
            q: search || undefined,
            status: status || undefined,
            account_status: accountStatus || undefined,
            page,
          },
        })
        .then((r) => r.data as Page<CandidateRow>),
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ['admin-candidates'] });

  const setAccountStatusMutation = useMutation({
    mutationFn: ({ id, next }: { id: number; next: CandidateRow['account_status'] }) =>
      api.patch(`/admin/candidates/${id}/status`, { status: next }),
    onSuccess: (_data, variables) => {
      setOpenMenu(null);
      notify(`Statut mis à jour : ${ACCOUNT_STATUS_LABEL[variables.next]}.`);
      refresh();
    },
    onError: (error) => notify(errorMessage(error, 'Action impossible.'), 'error'),
  });

  const remove = useMutation({
    mutationFn: (id: number) => api.delete(`/admin/candidates/${id}`),
    onSuccess: () => {
      setConfirmDeleteId(null);
      notify('Profil supprimé.', 'info');
      refresh();
    },
    onError: (error) => notify(errorMessage(error, 'Suppression impossible.'), 'error'),
  });

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  }

  const rows = candidates.data?.data ?? [];
  const m = metrics.data?.candidates;

  return (
    <div>
      <div className="mb-lg flex flex-col items-start justify-between gap-md sm:flex-row sm:items-center">
        <div>
          <h2 className="text-headline-lg text-amud-on-surface">Candidats</h2>
          <p className="mt-1 text-body-md text-amud-on-surface-variant">Dossiers, vérification et accès des candidats inscrits.</p>
        </div>
      </div>

      <div className="mb-lg grid grid-cols-2 gap-md md:grid-cols-4">
        {[
          { label: 'Total candidats', value: m?.total },
          { label: 'Dossiers soumis', value: m?.submitted },
          { label: 'Dossiers vérifiés', value: m?.verified },
          { label: 'Nouveaux cette semaine', value: m?.new_this_week },
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
            placeholder="Rechercher par nom, téléphone, e-mail, ville…"
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
            <option value="">Dossier : tous</option>
            <option value="draft">Brouillon</option>
            <option value="submitted">Soumis</option>
            <option value="verified">Vérifié</option>
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
              <th className="px-6 py-4 text-label-sm uppercase tracking-wider text-amud-on-surface-variant">Candidat</th>
              <th className="hidden px-6 py-4 text-label-sm uppercase tracking-wider text-amud-on-surface-variant md:table-cell">Ville</th>
              <th className="hidden px-6 py-4 text-center text-label-sm uppercase tracking-wider text-amud-on-surface-variant sm:table-cell">Profil</th>
              <th className="px-6 py-4 text-label-sm uppercase tracking-wider text-amud-on-surface-variant">Compte</th>
              <th className="hidden px-6 py-4 text-center text-label-sm uppercase tracking-wider text-amud-on-surface-variant lg:table-cell">Documents à revoir</th>
              <th className="px-6 py-4 text-right text-label-sm uppercase tracking-wider text-amud-on-surface-variant">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-amud-outline-variant">
            {candidates.isLoading ? (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-body-md text-amud-on-surface-variant">
                  Chargement…
                </td>
              </tr>
            ) : null}
            {!candidates.isLoading && rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-body-md text-amud-on-surface-variant">
                  Aucun candidat ne correspond à ces filtres.
                </td>
              </tr>
            ) : null}
            {rows.map((c) => {
              const name = c.name?.trim() || c.phone;
              return (
                <tr key={c.id} className="transition-colors hover:bg-amud-surface-container-lowest/50">
                  <td className="px-6 py-4">
                    <Link href={`/admin/candidats/${c.id}`} className="group flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amud-primary-container text-sm font-bold text-amud-primary">
                        {initials(name)}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-amud-on-surface transition-colors group-hover:text-amud-primary">{name}</p>
                        <p className="truncate text-label-sm text-amud-on-surface-variant">{c.phone}{c.email ? ` · ${c.email}` : ''}</p>
                      </div>
                    </Link>
                  </td>
                  <td className="hidden px-6 py-4 text-body-md text-amud-on-surface-variant md:table-cell">{c.city ?? '—'}</td>
                  <td className="hidden px-6 py-4 text-center sm:table-cell">
                    <span className="font-semibold text-amud-on-surface">{c.completion_percent}%</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${ACCOUNT_STATUS_CLASS[c.account_status]}`}>
                      {ACCOUNT_STATUS_LABEL[c.account_status]}
                    </span>
                  </td>
                  <td className="hidden px-6 py-4 text-center lg:table-cell">
                    {c.documents_awaiting_approval > 0 ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amud-tertiary-fixed px-2.5 py-0.5 text-xs font-medium text-amud-on-tertiary-fixed">
                        {c.documents_awaiting_approval}
                      </span>
                    ) : (
                      <span className="text-amud-on-surface-variant">—</span>
                    )}
                  </td>
                  <td className="relative px-6 py-4 text-right">
                    <button onClick={() => setOpenMenu(openMenu === c.id ? null : c.id)} className="p-1 text-amud-on-surface-variant transition-colors hover:text-amud-primary">
                      <span className="material-symbols-outlined">more_vert</span>
                    </button>
                    {openMenu === c.id ? (
                      <div className="absolute right-6 top-12 z-10 w-48 rounded-lg border border-amud-outline-variant bg-amud-surface py-1 text-left shadow-lg animate-amud-fade-in">
                        <Link href={`/admin/candidats/${c.id}`} onClick={() => setOpenMenu(null)} className="block w-full px-4 py-2 text-left text-label-md text-amud-on-surface hover:bg-amud-surface-container-low">
                          Voir la fiche
                        </Link>
                        {c.account_status !== 'active' ? (
                          <button onClick={() => setAccountStatusMutation.mutate({ id: c.id, next: 'active' })} className="block w-full px-4 py-2 text-left text-label-md text-amud-on-surface hover:bg-amud-surface-container-low">
                            Activer
                          </button>
                        ) : null}
                        {c.account_status !== 'inactive' ? (
                          <button onClick={() => setAccountStatusMutation.mutate({ id: c.id, next: 'inactive' })} className="block w-full px-4 py-2 text-left text-label-md text-amud-on-surface hover:bg-amud-surface-container-low">
                            Désactiver
                          </button>
                        ) : null}
                        {c.account_status !== 'blocked' ? (
                          <button onClick={() => setAccountStatusMutation.mutate({ id: c.id, next: 'blocked' })} className="block w-full px-4 py-2 text-left text-label-md text-amud-error hover:bg-amud-surface-container-low">
                            Bloquer
                          </button>
                        ) : null}
                        <button
                          onClick={() => {
                            setConfirmDeleteId(c.id);
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
        <Pagination page={page} data={candidates.data} onPage={setPage} noun="candidat" />
      </div>

      <ConfirmDialog
        open={confirmDeleteId !== null}
        onClose={() => setConfirmDeleteId(null)}
        onConfirm={() => confirmDeleteId !== null && remove.mutate(confirmDeleteId)}
        title="Supprimer ce dossier ?"
        description="Le dossier candidat (documents, formations, langues) sera retiré. Le compte de connexion reste actif."
        confirmLabel="Supprimer"
      />
    </div>
  );
}
