'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { api } from '@/lib/opsApi';
import type { Page } from '@/lib/candidateMarketplace';
import { useToast } from '@/components/amud/Toast';

/*
 * Candidatures reçues — même transformation que `admin/candidatures` :
 * kanban de la maquette `/amud/entreprise/candidatures`, données réelles via
 * `GET /recruiter/applications` + `PATCH /recruiter/applications/{id}`
 * (déjà construits — voir `CandidateApplicationController::recruiterIndex`
 * et `::updateStatus`). Mêmes trois colonnes actives qu'admin : `submitted`
 * n'est pas réglable (état initial), `withdrawn` non plus (action du
 * candidat) — seuls `viewed`/`interview`/`accepted`/`rejected` le sont.
 */
type ApplicationStatus = 'submitted' | 'viewed' | 'interview' | 'accepted' | 'rejected' | 'withdrawn';
type ColonneId = Extract<ApplicationStatus, 'submitted' | 'viewed' | 'interview'>;
type SettableStatus = Extract<ApplicationStatus, 'viewed' | 'interview' | 'accepted' | 'rejected'>;

type Application = {
  id: number;
  status: ApplicationStatus;
  applied_at: string;
  candidate_profile: { id: number; first_name: string | null; last_name: string | null; profession: string | null; user: { phone: string } | null } | null;
  offer: { id: number; title: string; city: string };
};

const KANBAN_COLUMNS: { id: ColonneId; label: string; dot: string }[] = [
  { id: 'submitted', label: 'Nouvelle', dot: 'bg-amud-surface-tint' },
  { id: 'viewed', label: 'Vue', dot: 'bg-amud-secondary-container' },
  { id: 'interview', label: 'Entretien', dot: 'bg-amud-tertiary-fixed-dim' },
];

const STATUS_LABEL: Record<ApplicationStatus, string> = {
  submitted: 'Nouvelle',
  viewed: 'Vue',
  interview: 'Entretien',
  accepted: 'Acceptée',
  rejected: 'Refusée',
  withdrawn: 'Retirée',
};

function isDecided(status: ApplicationStatus): status is 'accepted' | 'rejected' | 'withdrawn' {
  return status === 'accepted' || status === 'rejected' || status === 'withdrawn';
}

function candidateName(a: Application) {
  const name = `${a.candidate_profile?.first_name ?? ''} ${a.candidate_profile?.last_name ?? ''}`.trim();
  return name || a.candidate_profile?.user?.phone || `Candidat #${a.candidate_profile?.id ?? '?'}`;
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
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

export default function RecruiterCandidaturesPage() {
  const notify = useToast();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [dragCard, setDragCard] = useState<{ id: number; from: ColonneId } | null>(null);
  const [decisionsTab, setDecisionsTab] = useState<'accepted' | 'rejected' | 'withdrawn'>('accepted');

  const applications = useQuery({
    queryKey: ['recruiter-applications'],
    queryFn: () => api.get('/recruiter/applications', { params: { per_page: 100 } }).then((r) => r.data as Page<Application>),
  });

  const setStatus = useMutation({
    mutationFn: ({ id, status }: { id: number; status: SettableStatus }) => api.patch(`/recruiter/applications/${id}`, { status }),
    onSuccess: (_data, variables) => {
      notify(`Candidature déplacée : ${STATUS_LABEL[variables.status]}.`);
      qc.invalidateQueries({ queryKey: ['recruiter-applications'] });
    },
    onError: (error) => notify(errorMessage(error, 'Action impossible.'), 'error'),
  });

  const all = useMemo(() => applications.data?.data ?? [], [applications.data]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return all;
    return all.filter((a) => candidateName(a).toLowerCase().includes(q) || a.offer.title.toLowerCase().includes(q));
  }, [all, search]);

  const colonnes = useMemo(() => {
    const out = {} as Record<ColonneId, Application[]>;
    for (const col of KANBAN_COLUMNS) out[col.id] = filtered.filter((a) => a.status === col.id);
    return out;
  }, [filtered]);

  const decisions = useMemo(() => filtered.filter((a) => isDecided(a.status)), [filtered]);
  const accepted = decisions.filter((a) => a.status === 'accepted');
  const rejected = decisions.filter((a) => a.status === 'rejected');
  const withdrawn = decisions.filter((a) => a.status === 'withdrawn');
  const decisionsByTab = { accepted, rejected, withdrawn };

  const totals = {
    total: all.length,
    ...Object.fromEntries(KANBAN_COLUMNS.map((c) => [c.id, all.filter((a) => a.status === c.id).length])),
  } as Record<'total' | ColonneId, number>;

  function moveCard(id: number, from: ColonneId, to: ColonneId) {
    if (from === to) return;
    if (to === 'submitted') {
      notify('Une candidature ne peut pas revenir à « Nouvelle ».', 'error');
      return;
    }
    setStatus.mutate({ id, status: to });
  }

  function decide(id: number, status: 'accepted' | 'rejected') {
    setStatus.mutate({ id, status });
  }

  return (
    <div className="flex min-h-[calc(100vh-96px)] flex-col md:min-h-[calc(100vh-160px)]">
      <header className="mb-md flex shrink-0 flex-col gap-md">
        <div>
          <h2 className="text-headline-lg text-amud-on-surface">Candidatures reçues</h2>
          <p className="mt-xs text-amud-on-surface-variant">Suivi du pipeline sur vos offres.</p>
        </div>
        <div className="grid grid-cols-2 gap-sm md:grid-cols-4">
          {[{ label: 'Total', value: totals.total }, ...KANBAN_COLUMNS.map((c) => ({ label: c.label, value: totals[c.id] }))].map((k) => (
            <div key={k.label} className="flex flex-col items-center justify-center rounded-lg border border-amud-surface-container-high bg-amud-surface-container-lowest p-sm">
              <span className="text-label-sm uppercase tracking-wider text-amud-outline">{k.label}</span>
              <span className="text-title-lg font-bold text-amud-on-surface">{k.value}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-sm rounded-lg border border-amud-surface-container-high bg-amud-surface-container-lowest p-sm shadow-sm">
          <div className="relative max-w-xs flex-1">
            <span className="material-symbols-outlined absolute left-sm top-1/2 -translate-y-1/2 text-amud-outline">search</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-md border border-amud-outline-variant bg-amud-surface-container-lowest py-sm pl-xl pr-sm text-body-md outline-none transition-all focus:border-amud-primary focus:ring-2 focus:ring-amud-primary"
              placeholder="Rechercher un candidat…"
              type="text"
            />
          </div>
          <span className="text-label-sm text-amud-on-surface-variant">{filtered.length} résultat(s)</span>
        </div>
      </header>

      {applications.isLoading ? (
        <p className="text-body-md text-amud-on-surface-variant">Chargement…</p>
      ) : (
        <div className="snap-x snap-mandatory overflow-x-auto rounded-lg bg-amud-surface-container-low">
          <div className="flex w-max gap-md p-md">
            {KANBAN_COLUMNS.map((col) => (
              <div
                key={col.id}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  if (dragCard) moveCard(dragCard.id, dragCard.from, col.id);
                  setDragCard(null);
                }}
                className="flex w-[85vw] shrink-0 snap-start flex-col rounded-lg border border-amud-outline-variant bg-amud-surface-container-lowest sm:w-80"
              >
                <div className="flex items-center justify-between rounded-t-lg border-b border-amud-outline-variant bg-amud-surface-container-high p-sm">
                  <h3 className="flex items-center gap-sm text-title-lg text-amud-on-surface">
                    <div className={`h-3 w-3 rounded-full ${col.dot}`} />
                    {col.label}
                  </h3>
                  <span className="rounded bg-amud-surface px-xs py-[2px] text-label-sm text-amud-outline">{colonnes[col.id].length}</span>
                </div>
                <div className="flex flex-1 flex-col gap-sm p-sm">
                  {colonnes[col.id].map((a) => {
                    const name = candidateName(a);
                    return (
                      <div
                        key={a.id}
                        draggable
                        onDragStart={() => setDragCard({ id: a.id, from: col.id })}
                        className="group relative cursor-grab rounded-lg border border-amud-outline-variant bg-amud-surface p-sm shadow-sm transition-all animate-amud-rise-in hover:-translate-y-0.5 hover:border-amud-primary hover:shadow-md active:cursor-grabbing"
                      >
                        <div className="mb-sm flex items-start justify-between">
                          <div className="flex items-center gap-sm">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-amud-surface-container-highest bg-amud-surface-container-highest font-bold text-amud-primary">
                              {initials(name)}
                            </div>
                            <div>
                              <h4 className="text-label-md font-semibold text-amud-on-surface">{name}</h4>
                              <p className="text-label-sm text-amud-outline">{a.candidate_profile?.profession ?? 'Métier non renseigné'}</p>
                            </div>
                          </div>
                        </div>
                        <div className="mb-sm flex items-center justify-between text-[11px] text-amud-outline">
                          <span className="flex items-center gap-[2px]">
                            <span className="material-symbols-outlined text-[14px]">work</span> {a.offer.title}
                          </span>
                          <span className="flex items-center gap-[2px]">
                            <span className="material-symbols-outlined text-[14px]">calendar_today</span> {new Date(a.applied_at).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                        <div className="flex items-center justify-end gap-xs border-t border-amud-outline-variant/50 pt-xs opacity-0 transition-opacity group-hover:opacity-100">
                          <button onClick={() => decide(a.id, 'accepted')} title="Accepter" className="rounded p-1 text-amud-primary transition-colors hover:bg-amud-primary/10">
                            <span className="material-symbols-outlined text-[18px]">check_circle</span>
                          </button>
                          <button onClick={() => decide(a.id, 'rejected')} title="Refuser" className="rounded p-1 text-amud-error transition-colors hover:bg-amud-error/10">
                            <span className="material-symbols-outlined text-[18px]">cancel</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  {colonnes[col.id].length === 0 ? (
                    <div className="flex min-h-[140px] flex-1 flex-col items-center justify-center p-md text-center text-amud-outline">
                      <span className="material-symbols-outlined mb-sm text-display-lg">inbox</span>
                      <p className="text-label-sm">Glissez une carte ici.</p>
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {decisions.length > 0 ? (
        <section className="mt-lg rounded-lg border border-amud-outline-variant bg-amud-surface-container-lowest p-md">
          <div className="mb-sm flex items-center justify-between">
            <h3 className="text-title-lg text-amud-on-surface">Décisions récentes</h3>
            <div className="flex rounded-lg bg-amud-surface-container-low p-xs">
              <button
                onClick={() => setDecisionsTab('accepted')}
                className={`rounded-md px-md py-xs text-label-md ${decisionsTab === 'accepted' ? 'bg-amud-surface text-amud-primary shadow-sm' : 'text-amud-on-surface-variant'}`}
              >
                Acceptées ({accepted.length})
              </button>
              <button
                onClick={() => setDecisionsTab('rejected')}
                className={`rounded-md px-md py-xs text-label-md ${decisionsTab === 'rejected' ? 'bg-amud-surface text-amud-primary shadow-sm' : 'text-amud-on-surface-variant'}`}
              >
                Refusées ({rejected.length})
              </button>
              <button
                onClick={() => setDecisionsTab('withdrawn')}
                className={`rounded-md px-md py-xs text-label-md ${decisionsTab === 'withdrawn' ? 'bg-amud-surface text-amud-primary shadow-sm' : 'text-amud-on-surface-variant'}`}
              >
                Retirées ({withdrawn.length})
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-sm sm:grid-cols-2 lg:grid-cols-3">
            {decisionsByTab[decisionsTab].map((a) => (
              <div key={a.id} className="rounded-lg border border-amud-outline-variant bg-amud-surface p-sm">
                <div className="flex items-center justify-between">
                  <span className="text-label-md font-semibold text-amud-on-surface">{candidateName(a)}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                      a.status === 'accepted' ? 'bg-amud-primary-fixed text-amud-on-primary-fixed' : a.status === 'rejected' ? 'bg-amud-error-container text-amud-on-error-container' : 'bg-amud-surface-container-highest text-amud-on-surface-variant'
                    }`}
                  >
                    {STATUS_LABEL[a.status]}
                  </span>
                </div>
                <p className="text-label-sm text-amud-outline">{a.offer.title}</p>
              </div>
            ))}
            {decisionsByTab[decisionsTab].length === 0 ? <p className="text-label-sm text-amud-on-surface-variant">Aucune décision pour l’instant.</p> : null}
          </div>
        </section>
      ) : null}
    </div>
  );
}
