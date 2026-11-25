'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/opsApi';
import { apiErrorMessage } from '@/lib/apiError';
import { Badge, Card, Notice, Tabs } from '@/components/ui';
import { Pagination } from '@/components/Pagination';
import type { PaginatedResponse } from '@/types/candidate';
import { FLAG_LABELS, OUTCOME_LABELS, SOURCE_LABELS, STATUS_LABELS, type ReviewSummary } from '@/lib/languageTestReview';

const TABS = [
  { key: 'awaiting_review', label: 'À valider (B2+)' },
  { key: 'validated', label: 'Résultats publiés' },
  { key: 'attention', label: 'À vérifier' },
  { key: 'failed', label: 'Échecs techniques' },
  { key: 'in_progress', label: 'En cours' },
  { key: 'abandoned', label: 'Annulés' },
  { key: '', label: 'Tous' },
];

/**
 * Résultats des examens AMUD : A1–B1 publiés automatiquement, B2 et plus à valider.
 */
export default function AdminLanguageTests() {
  const [status, setStatus] = useState('awaiting_review');
  const [page, setPage] = useState(1);

  const q = useQuery({
    queryKey: ['admin-language-tests', status, page],
    queryFn: () =>
      api
        .get('/admin/language-tests', { params: { status: status === 'attention' ? undefined : status || undefined, needs_attention: status === 'attention' ? 1 : undefined, page } })
        .then((r) => r.data as PaginatedResponse<ReviewSummary>),
  });

  return (
    <div className="mx-auto grid max-w-5xl grid-cols-1 gap-4 sm:p-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Examens de langue</h1>
          <p className="helper-text mt-1">
            Les résultats A1–B1 sont publiés automatiquement. Les examens B2 et plus attendent votre validation.
          </p>
        </div>
        <Link href="/admin/tests-langue/banque" className="text-sm font-semibold text-primary hover:underline">
          Banque d’items →
        </Link>
      </header>

      <Tabs
        tabs={TABS}
        active={status}
        onChange={(key) => {
          setStatus(key);
          setPage(1);
        }}
      />

      {q.isError && <Notice>{apiErrorMessage(q.error, 'Impossible de charger les examens.')}</Notice>}
      {q.isSuccess && q.data.data.length === 0 && <p className="helper-text">Aucun examen ici.</p>}

      <div className="grid gap-3">
        {q.data?.data.map((t) => (
          <Link key={t.id} href={`/admin/tests-langue/${t.id}`} className="block rounded-card transition-shadow hover:shadow-md">
            <Card>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="grid gap-1">
                  <span className="font-bold">{t.candidate.name ?? 'Candidat sans nom'}</span>
                  <span className="helper-text">
                    {t.candidate.profession ?? '—'} · {t.candidate.phone ?? ''}
                  </span>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    <Badge tone="neutral">
                      Examen {t.exam_level} ({SOURCE_LABELS[t.level_source]})
                    </Badge>
                    {t.outcome && <Badge tone={t.outcome === 'reclassified' ? 'pending' : 'done'}>{OUTCOME_LABELS[t.outcome]}</Badge>}
                    {t.needs_attention && <Badge tone="error">À vérifier</Badge>}
                    {t.flags.slice(0, 2).map((f) => (
                      <Badge key={f} tone="pending">
                        {FLAG_LABELS[f] ?? f}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="grid justify-items-end gap-1 text-end">
                  <Badge tone={t.status === 'validated' ? 'done' : t.status === 'awaiting_review' ? 'pending' : 'neutral'}>
                    {STATUS_LABELS[t.status]}
                  </Badge>
                  <span className="text-2xl font-bold text-primary">{t.final_cefr ?? t.ai_cefr ?? '—'}</span>
                  <span className="helper-text">
                    {t.final_cefr ? 'résultat publié' : t.ai_cefr ? 'estimation IA' : t.provisional_cefr ? 'provisoire' : ''}
                  </span>
                  {t.completed_at && <span className="helper-text">{new Date(t.completed_at).toLocaleString('fr-FR')}</span>}
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      <Pagination page={page} data={q.data} onPage={setPage} noun="examen" language="fr" />
    </div>
  );
}
