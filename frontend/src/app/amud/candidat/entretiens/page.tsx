'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { Badge, EmptyState, PageHeader, type BadgeTone } from '@/components/amud/ui';
import { useCurrentCandidate } from '@/lib/amud/useCurrentCandidate';
import { useCollection } from '@/lib/amud/storage/useCollection';
import { interviewsCollection } from '@/lib/amud/localInterviews';
import { TYPE_ICON, type Interview, type InterviewStatus } from '@/data/amud/interviews';

const STATUS_TONE: Record<InterviewStatus, BadgeTone> = {
  Planifié: 'neutral',
  Confirmé: 'success',
  Terminé: 'info',
  Annulé: 'danger',
  Reporté: 'warning',
};

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function EntretiensPage() {
  const { candidate, loading } = useCurrentCandidate();
  const [interviews] = useCollection(interviewsCollection, []);

  const mine = useMemo(() => interviews.filter((i) => i.candidateId === candidate?.id).sort((a, b) => `${a.date}${a.heureDebut}`.localeCompare(`${b.date}${b.heureDebut}`)), [interviews, candidate]);
  const today = todayIso();

  const aujourdhui = mine.filter((i) => i.date === today);
  const aVenir = mine.filter((i) => i.date > today);
  const historique = mine.filter((i) => i.date < today || i.status === 'Terminé' || i.status === 'Annulé');

  if (loading) return null;

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Mes entretiens" />

      {mine.length === 0 ? (
        <EmptyState icon="event" title="Aucun entretien programmé." description="Vos entretiens apparaîtront ici une fois planifiés par l'entreprise." />
      ) : (
        <div className="flex flex-col gap-xl">
          {aujourdhui.length > 0 ? <Group title="Aujourd'hui" items={aujourdhui} /> : null}
          {aVenir.length > 0 ? <Group title="À venir" items={aVenir} /> : null}
          {historique.length > 0 ? <Group title="Historique" items={historique} /> : null}
        </div>
      )}
    </div>
  );
}

function Group({ title, items }: { title: string; items: Interview[] }) {
  return (
    <section>
      <h2 className="mb-sm text-title-lg text-amud-on-surface">{title}</h2>
      <div className="flex flex-col gap-md">
        {items.map((i) => (
          <Link key={i.id} href={`/amud/candidat/entretiens/${i.id}`} className="flex items-center gap-md rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-md shadow-sm transition-colors hover:border-amud-primary">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-amud-primary-container text-white">
              <span className="material-symbols-outlined">{TYPE_ICON[i.type]}</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-body-md font-semibold text-amud-on-surface">{i.offerTitre}</p>
              <p className="truncate text-label-sm text-amud-on-surface-variant">{new Date(i.date).toLocaleDateString('fr-FR')} à {i.heureDebut} · {i.type}</p>
            </div>
            <Badge tone={STATUS_TONE[i.status]}>{i.status}</Badge>
          </Link>
        ))}
      </div>
    </section>
  );
}
