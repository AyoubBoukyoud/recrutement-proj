// Interface 21 (sous-page) — Pipeline kanban.

import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { CandidateCard } from '@/components/shared/CandidateCard';
import { MOCK_CANDIDATES } from '@/lib/mockData';
import type { CandidateSummary } from '@/lib/types';

const COLUMNS: { status: CandidateSummary['status']; label: string }[] = [
  { status: 'nouveau', label: 'Nouveau' },
  { status: 'contacte', label: 'Contacté' },
  { status: 'entretien', label: 'Entretien' },
  { status: 'valide', label: 'Validé' },
];

export default function KanbanMatchingsPage() {
  return (
    <div className="mx-auto max-w-6xl">
      <Link href="/employer/matchings" className="flex items-center gap-1 text-xs font-semibold text-onSurface-variant">
        <ChevronLeft size={14} /> Retour
      </Link>
      <h1 className="mt-2 text-2xl font-bold text-navy-900">Pipeline de recrutement</h1>

      <div className="mt-6 grid gap-4 overflow-x-auto md:grid-cols-4">
        {COLUMNS.map((col) => {
          const candidates = MOCK_CANDIDATES.filter((c) => c.status === col.status);
          return (
            <div key={col.status} className="min-w-[240px] rounded-2xl bg-surface-container p-3">
              <div className="mb-3 flex items-center justify-between px-1">
                <span className="text-xs font-bold text-onSurface-variant">{col.label}</span>
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
                    Aucun candidat
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
