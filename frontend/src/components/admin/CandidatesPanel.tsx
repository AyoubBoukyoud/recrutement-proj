'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { api } from '@/lib/opsApi';
import { Badge, Button, Card, CheckMark, Field, Notice, SectionHeader, SelectField } from '@/components/ui';
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

function ChecklistMark({ done, label }: { done: boolean; label: string }) {
  return (
    <span
      className={`flex items-center gap-1.5 text-[13px] ${done ? 'text-on-surface' : 'text-on-surface-variant'}`}
    >
      <span
        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-sm text-white ${
          done ? 'bg-primary' : 'border border-outline-variant bg-transparent'
        }`}
      >
        {done && <CheckMark size={9} />}
      </span>
      {label}
    </span>
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

      <div className="grid gap-6">
        {(data?.data ?? []).map((candidate) => {
          const done = CHECKLIST_LABELS.filter(([key]) => candidate.checklist[key]).length;
          return (
            <div key={candidate.id} className="border-t border-outline-variant pt-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <button
                  onClick={() => router.push(`/admin/candidats/${candidate.id}`)}
                  className="cursor-pointer border-none bg-transparent p-0 text-left font-mono text-[13px] tracking-[0.5px] text-primary hover:underline"
                >
                  {candidate.name ?? candidate.phone}
                </button>
                <div className="flex flex-wrap items-center gap-2">
                  {candidate.referred_by && <Badge>via {candidate.referred_by}</Badge>}
                  {candidate.documents_awaiting_approval > 0 && (
                    <Badge>{`${candidate.documents_awaiting_approval} à approuver`}</Badge>
                  )}
                  <EngagementBadge engagement={candidate.engagement} />
                  <Badge tone={candidate.verified_at ? 'done' : 'pending'}>
                    {candidate.verified_at ? 'vérifié' : candidate.submitted_at ? 'soumis' : 'brouillon'}
                  </Badge>
                  <Badge tone={candidate.completion_percent >= 100 ? 'done' : 'pending'}>
                    {candidate.completion_percent} % complété
                  </Badge>
                  <Badge tone={done === CHECKLIST_LABELS.length ? 'done' : 'pending'}>
                    {done}/{CHECKLIST_LABELS.length}
                  </Badge>
                </div>
              </div>

              {/* Les sections d'un dossier se signent : une section terminée est
                  donc tamponnée plutôt que cochée dans une case que l'opérateur
                  ne peut de toute façon pas basculer. */}
              <div className="mt-2 flex flex-wrap gap-4">
                {CHECKLIST_LABELS.map(([key, label]) => (
                  <ChecklistMark key={key} done={candidate.checklist[key]} label={label} />
                ))}
              </div>

              {confirmingId === candidate.id ? (
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="text-[13px] text-on-surface">
                    Supprimer définitivement ce dossier ?
                  </span>
                  <Button
                    variant="danger"
                    size="compact"
                    onClick={() => deleteMutation.mutate(candidate.id)}
                    disabled={deleteMutation.isPending}
                  >
                    {deleteMutation.isPending ? 'Suppression…' : 'Oui, supprimer'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="compact"
                    onClick={() => setConfirmingId(null)}
                    disabled={deleteMutation.isPending}
                  >
                    Annuler
                  </Button>
                </div>
              ) : (
                <div className="mt-2 flex flex-wrap gap-2">
                  <Button
                    variant="ghost"
                    size="compact"
                    onClick={() => router.push(`/admin/candidats/${candidate.id}`)}
                  >
                    Ouvrir le dossier
                  </Button>
                  <Button variant="danger" size="compact" onClick={() => setConfirmingId(candidate.id)}>
                    Supprimer
                  </Button>
                </div>
              )}

              {confirmingId === candidate.id && deleteMutation.isError && (
                <div className="mt-2">
                  <Notice>{apiErrorMessage(deleteMutation.error, "Cela n'a pas fonctionné. Réessayez.")}</Notice>
                </div>
              )}
            </div>
          );
        })}

        {!isLoading && (data?.data.length ?? 0) === 0 && (
          <p className="helper-text">Aucun candidat ne correspond.</p>
        )}
      </div>

      <div className="mt-4">
        <Pagination page={page} data={data} onPage={setPage} />
      </div>
    </Card>
  );
}
