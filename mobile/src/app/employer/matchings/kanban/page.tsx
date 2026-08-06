'use client';

// Interface 21 (sous-page) — Pipeline kanban.

import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { CandidateCard } from '@/components/shared/CandidateCard';
import { WithPageSkeleton } from '@/components/shared/SkeletonLoader';
import { useLanguage } from '@/context/LanguageContext';
import { MOCK_CANDIDATES } from '@/lib/mockData';
import type { CandidateSummary } from '@/lib/types';

const COLUMNS: { status: CandidateSummary['status']; labelKey: string }[] = [
  { status: 'nouveau', labelKey: 'employer:matchingsKanban.columns.nouveau' },
  { status: 'contacte', labelKey: 'employer:matchingsKanban.columns.contacte' },
  { status: 'entretien', labelKey: 'employer:matchingsKanban.columns.entretien' },
  { status: 'valide', labelKey: 'employer:matchingsKanban.columns.valide' },
];

export default function KanbanMatchingsPage() {
  const { t } = useLanguage();

  return (
    <WithPageSkeleton layout="kanban">
    <div className="mx-auto max-w-6xl">
      <Link href="/employer/matchings" className="flex items-center gap-1 text-xs font-semibold text-onSurface-variant">
        <ChevronLeft size={14} /> {t('employer:shared.back')}
      </Link>
      <h1 className="mt-2 text-2xl font-bold text-navy-900">{t('employer:matchingsKanban.title')}</h1>

      <div className="mt-6 grid gap-4 overflow-x-auto md:grid-cols-4">
        {COLUMNS.map((col) => {
          const candidates = MOCK_CANDIDATES.filter((c) => c.status === col.status);
          return (
            <div key={col.status} className="min-w-[240px] rounded-2xl bg-surface-container p-3">
              <div className="mb-3 flex items-center justify-between px-1">
                <span className="text-xs font-bold text-onSurface-variant">{t(col.labelKey)}</span>
                <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-navy-900">
                  {candidates.length}
                </span>
              </div>
              <div className="space-y-2.5">
                {candidates.map((candidate) => (
                  <CandidateCard key={candidate.id} candidate={candidate} href={`/employer/candidat/${candidate.id}`} />
                ))}
                {candidates.length === 0 && (
                  <p className="rounded-xl border border-dashed border-gray-200 p-4 text-center text-[11px] text-gray-400">
                    {t('employer:matchingsKanban.empty')}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
    </WithPageSkeleton>
  );
}
