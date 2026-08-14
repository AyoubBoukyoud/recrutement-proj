'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Eye, Trash2, Check, X } from 'lucide-react';
import { api } from '@/lib/opsApi';
import { Avatar, Badge, Card, Field, Notice, ProgressBar, SectionHeader, SelectField } from '@/components/ui';
import { Pagination } from '@/components/Pagination';
import { EngagementBadge } from '@/components/admin/EngagementBadge';
import { apiErrorMessage } from '@/lib/apiError';
import type { AdminCandidateRow, AdminChecklist } from '@/types/admin';
import type { PaginatedResponse } from '@/types/candidate';

const CHECKLIST_LABELS: [keyof AdminChecklist, string][] = [
  ['profile_completed', 'Profil personnel complété'],
  ['cv_uploaded', 'CV téléversé et analysé'],
  ['certificates_uploaded', 'Certificats téléversés'],
  ['video_recorded', 'Vidéo de présentation enregistrée'],
];

const cx = (...parts: (string | false | undefined)[]) => parts.filter(Boolean).join(' ');

const ICON_BUTTON =
  'inline-flex h-8 w-8 items-center justify-center rounded-element border border-outline-variant bg-surface-lowest text-on-surface-variant transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-60';

function CandidateRow({
  candidate,
  onOpen,
  confirming,
  onAskDelete,
  onCancelDelete,
  onConfirmDelete,
  deletePending,
  deleteError,
}: {
  candidate: AdminCandidateRow;
  onOpen: () => void;
  confirming: boolean;
  onAskDelete: () => void;
  onCancelDelete: () => void;
  onConfirmDelete: () => void;
  deletePending: boolean;
  deleteError: unknown;
}) {
  const done = CHECKLIST_LABELS.filter(([key]) => candidate.checklist[key]).length;
  const name = candidate.name ?? candidate.phone;

  return (
    <tr className={confirming ? 'bg-error-light/30' : 'hover:bg-surface-container/40'}>
      <td className="py-3 pr-3">
        <button onClick={onOpen} className="flex items-center gap-3 border-none bg-transparent p-0 text-left">
          <Avatar name={name} />
          <span className="grid">
            <span className="text-[14px] font-semibold text-on-surface hover:text-primary hover:underline">
              {name}
            </span>
            <span className="font-mono text-[12px] text-on-surface-variant">{candidate.phone}</span>
          </span>
        </button>
      </td>

      <td className="py-3 pr-3">
        <div className="flex items-center gap-2">
          <ProgressBar percent={candidate.completion_percent} className="w-24" />
          <span className="font-mono text-[12px] tabular-nums text-on-surface-variant">
            {candidate.completion_percent}%
          </span>
        </div>
      </td>

      <td className="py-3 pr-3">
        <Badge tone={done === CHECKLIST_LABELS.length ? 'done' : 'pending'}>
          {done}/{CHECKLIST_LABELS.length}
        </Badge>
      </td>

      <td className="py-3 pr-3">
        <Badge tone={candidate.verified_at ? 'done' : 'pending'}>
          {candidate.verified_at ? 'vérifié' : candidate.submitted_at ? 'soumis' : 'brouillon'}
        </Badge>
      </td>

      <td className="py-3 pr-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {candidate.referred_by && <Badge tone="neutral">via {candidate.referred_by}</Badge>}
          {candidate.documents_awaiting_approval > 0 && (
            <Badge>{`${candidate.documents_awaiting_approval} à approuver`}</Badge>
          )}
          <EngagementBadge engagement={candidate.engagement} />
        </div>
      </td>

      <td className="py-3">
        {confirming ? (
          <div className="flex items-center justify-end gap-2">
            <span className="whitespace-nowrap text-[12px] font-medium text-on-error-container">Supprimer ?</span>
            <button
              className={cx(ICON_BUTTON, 'hover:border-primary hover:text-primary')}
              onClick={onConfirmDelete}
              disabled={deletePending}
              aria-label="Confirmer la suppression"
              title="Confirmer la suppression"
            >
              <Check size={16} />
            </button>
            <button
              className={ICON_BUTTON}
              onClick={onCancelDelete}
              disabled={deletePending}
              aria-label="Annuler"
              title="Annuler"
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-end gap-2">
            <button className={ICON_BUTTON} onClick={onOpen} aria-label="Ouvrir le dossier" title="Ouvrir le dossier">
              <Eye size={16} />
            </button>
            <button
              className={cx(ICON_BUTTON, 'hover:border-error hover:text-error')}
              onClick={onAskDelete}
              aria-label="Supprimer"
              title="Supprimer"
            >
              <Trash2 size={16} />
            </button>
          </div>
        )}
        {confirming && !!deleteError && (
          <div className="mt-2 flex justify-end">
            <Notice>{apiErrorMessage(deleteError, "Cela n'a pas fonctionné. Réessayez.")}</Notice>
          </div>
        )}
      </td>
    </tr>
  );
}

/**
 * Route `/admin/candidats`. Ouvrir un dossier navigue vers
 * `/admin/candidats/:id` plutôt que de basculer un `useState` du parent — le
 * bouton retour du navigateur redevient ce qu'il est partout ailleurs.
 *
 * Seul `status` vit dans l'URL : c'est le seul des trois filtres que la page
 * d'aperçu doit pouvoir présélectionner (`?status=submitted`). `q` et `page`
 * gardent leur comportement d'origine, en `useState` local.
 *
 * `useSearchParams()` de Next est en lecture seule (contrairement à celui de
 * react-router) : écrire un filtre construit la nouvelle chaîne de requête à
 * la main et navigue avec `router.push`.
 */
export function CandidatesPanel() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const status = searchParams.get('status') ?? '';
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [confirmingId, setConfirmingId] = useState<number | null>(null);

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/admin/candidates/${id}`),
    onSuccess: () => {
      setConfirmingId(null);
      queryClient.invalidateQueries({ queryKey: ['admin-candidates'] });
    },
  });

  const setStatus = (value: string) => {
    const next = new URLSearchParams(searchParams.toString());
    if (value) next.set('status', value);
    else next.delete('status');
    router.push(next.size > 0 ? `${pathname}?${next.toString()}` : pathname);
  };

  const { data, isLoading } = useQuery({
    queryKey: ['admin-candidates', page, q, status],
    queryFn: () =>
      api
        .get('/admin/candidates', { params: { page, q: q || undefined, status: status || undefined } })
        .then((r) => r.data as PaginatedResponse<AdminCandidateRow>),
  });

  return (
    <Card>
      <SectionHeader
        eyebrow="Dossiers"
        title="Avancement des candidats"
        // L'ancien en-tête affichait `{data.data.length} candidats`, ce qui
        // aurait indiqué « 20 candidats » à jamais dès le vingtième dépassé.
        subtitle={isLoading ? 'Chargement…' : undefined}
      />

      <div className="mb-4 grid gap-2 [grid-template-columns:minmax(160px,2fr)_minmax(140px,1fr)]">
        <Field
          label="Recherche"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(1);
          }}
          placeholder="Nom, téléphone ou métier"
        />
        <SelectField
          label="Étape"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
        >
          <option value="">Tout le monde</option>
          <option value="draft">Encore un brouillon</option>
          <option value="submitted">Soumis, non vérifié</option>
          <option value="verified">Vérifié</option>
        </SelectField>
      </div>

      <div className="-mx-6 overflow-x-auto px-6">
        <table className="w-full min-w-[760px] border-collapse text-left">
          <thead>
            <tr className="border-b border-outline-variant text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
              <th className="pb-2 pr-3 font-bold">Candidat</th>
              <th className="pb-2 pr-3 font-bold">Complétude</th>
              <th className="pb-2 pr-3 font-bold">Checklist</th>
              <th className="pb-2 pr-3 font-bold">Statut</th>
              <th className="pb-2 pr-3 font-bold">Signaux</th>
              <th className="pb-2 text-right font-bold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant">
            {(data?.data ?? []).map((candidate) => (
              <CandidateRow
                key={candidate.id}
                candidate={candidate}
                onOpen={() => router.push(`/admin/candidats/${candidate.id}`)}
                confirming={confirmingId === candidate.id}
                onAskDelete={() => setConfirmingId(candidate.id)}
                onCancelDelete={() => setConfirmingId(null)}
                onConfirmDelete={() => deleteMutation.mutate(candidate.id)}
                deletePending={deleteMutation.isPending}
                deleteError={confirmingId === candidate.id ? deleteMutation.error : null}
              />
            ))}
          </tbody>
        </table>

        {!isLoading && (data?.data.length ?? 0) === 0 && (
          <p className="helper-text py-4">Aucun candidat ne correspond.</p>
        )}
      </div>

      <div className="mt-4">
        <Pagination page={page} data={data} onPage={setPage} />
      </div>
    </Card>
  );
}
