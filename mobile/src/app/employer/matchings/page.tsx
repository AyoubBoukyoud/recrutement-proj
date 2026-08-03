// Interface 21 — Matchings : choix entre mode swipe et pipeline kanban.

import Link from 'next/link';
import { Sparkles, Kanban } from 'lucide-react';
import { MOCK_CANDIDATES } from '@/lib/mockData';

export default function MatchingsPage() {
  const mutualCount = MOCK_CANDIDATES.filter((c) => c.mutualInterest).length;

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-bold text-navy-900">Matchings</h1>
      <p className="mt-1 text-sm text-onSurface-variant">{mutualCount} intérêts mutuels actifs.</p>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Link
          href="/employer/matchings/swipe"
          className="group rounded-2xl border border-gray-100 bg-white p-6 shadow-soft transition hover:border-navy-900"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
            <Sparkles size={20} />
          </div>
          <h2 className="mt-3 text-base font-bold text-navy-900">Mode découverte (swipe)</h2>
          <p className="mt-1 text-xs text-onSurface-variant">Parcourez les profils un par un et exprimez votre intérêt.</p>
        </Link>

        <Link
          href="/employer/matchings/kanban"
          className="group rounded-2xl border border-gray-100 bg-white p-6 shadow-soft transition hover:border-navy-900"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-navy-900">
            <Kanban size={20} />
          </div>
          <h2 className="mt-3 text-base font-bold text-navy-900">Pipeline (kanban)</h2>
          <p className="mt-1 text-xs text-onSurface-variant">Suivez l&apos;avancement de vos candidats par statut.</p>
        </Link>
      </div>
    </div>
  );
}
