'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Badge, EmptyState, PageHeader, SegmentedControl, type BadgeTone } from '@/components/amud/ui';
import { useCurrentCandidate } from '@/lib/amud/useCurrentCandidate';
import { useCollection } from '@/lib/amud/storage/useCollection';
import { applicationsCollection } from '@/lib/amud/localApplications';
import { STATUS_LABEL, type ApplicationStatus } from '@/data/amud/applications';

type FilterId = 'toutes' | 'en_cours' | 'entretiens' | 'acceptees' | 'refusees';

const FILTERS: { id: FilterId; label: string; statuses: ApplicationStatus[] | null }[] = [
  { id: 'toutes', label: 'Toutes', statuses: null },
  { id: 'en_cours', label: 'En cours', statuses: ['NEW', 'SCREENING', 'SHORTLIST'] },
  { id: 'entretiens', label: 'Entretiens', statuses: ['INTERVIEW'] },
  { id: 'acceptees', label: 'Acceptées', statuses: ['ACCEPTED'] },
  { id: 'refusees', label: 'Refusées', statuses: ['REJECTED', 'WITHDRAWN'] },
];

const STATUS_TONE: Record<ApplicationStatus, BadgeTone> = {
  NEW: 'info',
  SCREENING: 'info',
  INTERVIEW: 'warning',
  SHORTLIST: 'warning',
  ACCEPTED: 'success',
  REJECTED: 'danger',
  WITHDRAWN: 'neutral',
};

export default function CandidaturesPage() {
  const { candidate, loading } = useCurrentCandidate();
  const [applications] = useCollection(applicationsCollection, []);
  const [filter, setFilter] = useState<FilterId>('toutes');

  const myApplications = useMemo(
    () => applications.filter((a) => a.candidateId === candidate?.id).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    [applications, candidate],
  );

  const activeFilter = FILTERS.find((f) => f.id === filter)!;
  const filtered = activeFilter.statuses ? myApplications.filter((a) => activeFilter.statuses!.includes(a.status)) : myApplications;

  if (loading) return null;

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Mes candidatures" subtitle={`${myApplications.length} candidature(s)`} />

      <div className="mb-lg">
        <SegmentedControl label="Filtrer" value={filter} onChange={setFilter} options={FILTERS.map((f) => ({ value: f.id, label: f.label }))} />
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon="assignment" title="Vous n'avez pas encore postulé à une offre." actionLabel="Découvrir les opportunités" onAction={() => (window.location.href = '/amud/candidat/opportunites')} />
      ) : (
        <div className="flex flex-col gap-md">
          {filtered.map((a) => (
            <Link key={a.id} href={`/amud/candidat/candidatures/${a.id}`} className="flex items-center justify-between gap-sm rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-md shadow-sm transition-colors hover:border-amud-primary">
              <div className="min-w-0">
                <p className="truncate text-body-md font-semibold text-amud-on-surface">{a.offerTitre}</p>
                <p className="truncate text-label-sm text-amud-on-surface-variant">{a.entrepriseNom}</p>
                <p className="mt-1 text-label-sm text-amud-on-surface-variant">Mis à jour le {new Date(a.updatedAt).toLocaleDateString('fr-FR')}</p>
              </div>
              <Badge tone={STATUS_TONE[a.status]}>{STATUS_LABEL[a.status]}</Badge>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
