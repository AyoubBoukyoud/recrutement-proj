'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Badge, ErrorState, type BadgeTone } from '@/components/amud/ui';
import { useCurrentCandidate } from '@/lib/amud/useCurrentCandidate';
import { useCollection } from '@/lib/amud/storage/useCollection';
import { interviewsCollection } from '@/lib/amud/localInterviews';
import { TYPE_ICON, type InterviewStatus } from '@/data/amud/interviews';

const STATUS_TONE: Record<InterviewStatus, BadgeTone> = {
  Planifié: 'neutral',
  Confirmé: 'success',
  Terminé: 'info',
  Annulé: 'danger',
  Reporté: 'warning',
};

export default function EntretienDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { candidate } = useCurrentCandidate();
  const [interviews] = useCollection(interviewsCollection, []);

  const interview = interviews.find((i) => i.id === params.id && i.candidateId === candidate?.id);

  if (!interview) {
    return (
      <div className="mx-auto max-w-2xl py-xl">
        <ErrorState title="Entretien introuvable" onRetry={() => router.push('/amud/candidat/entretiens')} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/amud/candidat/entretiens" className="mb-lg inline-flex items-center gap-1 text-label-md font-medium text-amud-primary">
        <span className="material-symbols-outlined text-[18px]">arrow_back</span>
        Retour à mes entretiens
      </Link>

      <div className="mb-lg flex items-start justify-between gap-md">
        <div>
          <h1 className="text-headline-md text-amud-on-surface">{interview.offerTitre}</h1>
          <p className="mt-1 text-body-lg text-amud-on-surface-variant">
            {new Date(interview.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })} à {interview.heureDebut}
          </p>
        </div>
        <Badge tone={STATUS_TONE[interview.status]}>{interview.status}</Badge>
      </div>

      <div className="mb-lg flex flex-col gap-md rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-lg shadow-sm">
        <InfoRow icon={TYPE_ICON[interview.type]} label="Type" value={interview.type} />
        {interview.lieuOuLien ? <InfoRow icon="place" label={interview.type === 'Visioconférence' ? 'Lien' : 'Lieu'} value={interview.lieuOuLien} /> : null}
        <InfoRow icon="schedule" label="Horaire" value={`${interview.heureDebut} — ${interview.heureFin}`} />
        {interview.notes ? <InfoRow icon="notes" label="Notes" value={interview.notes} /> : null}
      </div>

      <Link
        href={`/amud/candidat/entretiens/${interview.id}/preparation`}
        className="flex items-center gap-md rounded-xl border border-amud-primary/30 bg-amud-primary/5 p-lg transition-colors hover:border-amud-primary"
      >
        <span className="material-symbols-outlined text-[28px] text-amud-primary">record_voice_over</span>
        <div className="flex-1">
          <p className="text-title-lg text-amud-on-surface">Préparer mon entretien</p>
          <p className="text-body-md text-amud-on-surface-variant">Présentation, questions potentielles, conseils.</p>
        </div>
        <span className="material-symbols-outlined text-amud-primary">arrow_forward</span>
      </Link>
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex items-start gap-sm">
      <span className="material-symbols-outlined mt-0.5 text-amud-primary">{icon}</span>
      <div>
        <p className="text-label-sm font-semibold uppercase tracking-wide text-amud-on-surface-variant">{label}</p>
        <p className="text-body-md text-amud-on-surface">{value}</p>
      </div>
    </div>
  );
}
