'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { Badge, Button, ErrorState, Modal, ModalActions, ConfirmDialog, type BadgeTone } from '@/components/amud/ui';
import { useToast } from '@/components/amud/Toast';
import { useCurrentCandidate } from '@/lib/amud/useCurrentCandidate';
import { useCollection } from '@/lib/amud/storage/useCollection';
import { applicationsCollection } from '@/lib/amud/localApplications';
import { candidateActivitiesCollection } from '@/lib/amud/localCandidateActivities';
import { STATUS_LABEL, isDecided, type ApplicationStatus } from '@/data/amud/applications';
import { changeApplicationStatus } from '@/lib/amud/applicationCascades';
import { withdrawApplication } from '@/lib/amud/candidateApplicationCascades';
import { scheduleDemoInterview } from '@/lib/amud/candidateInterviewCascades';

const STATUS_TONE: Record<ApplicationStatus, BadgeTone> = {
  NEW: 'info',
  SCREENING: 'info',
  INTERVIEW: 'warning',
  SHORTLIST: 'warning',
  ACCEPTED: 'success',
  REJECTED: 'danger',
  WITHDRAWN: 'neutral',
};

const DEMO_NEXT_STATUS: Partial<Record<ApplicationStatus, ApplicationStatus>> = {
  NEW: 'SCREENING',
  SCREENING: 'INTERVIEW',
  INTERVIEW: 'SHORTLIST',
  SHORTLIST: 'ACCEPTED',
};

const TIMELINE_ORDER: ApplicationStatus[] = ['NEW', 'SCREENING', 'INTERVIEW', 'SHORTLIST'];
const TIMELINE_LABELS: Record<ApplicationStatus, string> = {
  NEW: 'Candidature envoyée',
  SCREENING: 'Présélection',
  INTERVIEW: 'Entretien',
  SHORTLIST: 'Décision imminente',
  ACCEPTED: 'Acceptée',
  REJECTED: 'Refusée',
  WITHDRAWN: 'Retirée',
};

export default function CandidatureDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const notify = useToast();
  const { candidate } = useCurrentCandidate();
  const [applications] = useCollection(applicationsCollection, []);
  const [activities] = useCollection(candidateActivitiesCollection, []);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [interviewModalOpen, setInterviewModalOpen] = useState(false);

  const application = applications.find((a) => a.id === params.id && a.candidateId === candidate?.id);

  if (!application) {
    return (
      <div className="mx-auto max-w-2xl py-xl">
        <ErrorState title="Candidature introuvable" onRetry={() => router.push('/amud/candidat/candidatures')} />
      </div>
    );
  }

  const decided = isDecided(application.status);
  const history = activities
    .filter((a) => a.candidateAccountId === candidate?.id && (a.href === `/amud/candidat/candidatures/${application.id}` || a.label.includes(application.offerTitre)))
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  const currentTimelineIndex = TIMELINE_ORDER.indexOf(application.status);

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/amud/candidat/candidatures" className="mb-lg inline-flex items-center gap-1 text-label-md font-medium text-amud-primary">
        <span className="material-symbols-outlined text-[18px]">arrow_back</span>
        Retour à mes candidatures
      </Link>

      <div className="mb-lg flex items-start justify-between gap-md">
        <div>
          <h1 className="text-headline-md text-amud-on-surface">{application.offerTitre}</h1>
          <p className="mt-1 text-body-lg text-amud-on-surface-variant">{application.entrepriseNom}</p>
          <p className="mt-1 text-label-sm text-amud-on-surface-variant">Envoyée le {new Date(application.createdAt).toLocaleDateString('fr-FR')}</p>
        </div>
        <Badge tone={STATUS_TONE[application.status]}>{STATUS_LABEL[application.status]}</Badge>
      </div>

      <Link href={`/amud/candidat/opportunites/${application.offerId}`} className="mb-lg inline-flex items-center gap-1 text-label-md font-medium text-amud-primary hover:underline">
        Voir l&apos;offre
        <span className="material-symbols-outlined text-[16px]">open_in_new</span>
      </Link>

      <div className="mb-lg rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-lg shadow-sm">
        <h2 className="mb-md text-title-lg text-amud-on-surface">Suivi de candidature</h2>
        {application.status === 'REJECTED' || application.status === 'WITHDRAWN' ? (
          <div className="flex items-center gap-2 text-body-md text-amud-on-surface-variant">
            <span className="material-symbols-outlined text-amud-error">cancel</span>
            {application.status === 'WITHDRAWN' ? 'Vous avez retiré cette candidature.' : "L'entreprise n'a pas donné suite à cette candidature."}
          </div>
        ) : (
          <ol className="flex flex-col gap-md">
            {TIMELINE_ORDER.map((step, i) => {
              const done = i < currentTimelineIndex || application.status === 'ACCEPTED';
              const current = i === currentTimelineIndex && application.status !== 'ACCEPTED';
              return (
                <li key={step} className="flex items-center gap-sm">
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[14px] ${
                      done ? 'bg-amud-primary text-white' : current ? 'border-2 border-amud-primary text-amud-primary' : 'border border-amud-outline-variant text-amud-outline'
                    }`}
                  >
                    {done ? '✓' : current ? '●' : '○'}
                  </span>
                  <span className={`text-body-md ${done || current ? 'font-medium text-amud-on-surface' : 'text-amud-on-surface-variant'}`}>{TIMELINE_LABELS[step]}</span>
                </li>
              );
            })}
            <li className="flex items-center gap-sm">
              <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[14px] ${application.status === 'ACCEPTED' ? 'bg-amud-primary text-white' : 'border border-amud-outline-variant text-amud-outline'}`}>
                {application.status === 'ACCEPTED' ? '✓' : '○'}
              </span>
              <span className={`text-body-md ${application.status === 'ACCEPTED' ? 'font-medium text-amud-on-surface' : 'text-amud-on-surface-variant'}`}>Décision</span>
            </li>
          </ol>
        )}
      </div>

      {history.length > 0 ? (
        <div className="mb-lg rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-lg shadow-sm">
          <h2 className="mb-md text-title-lg text-amud-on-surface">Historique</h2>
          <ul className="flex flex-col gap-sm">
            {history.map((h) => (
              <li key={h.id} className="flex justify-between text-body-md text-amud-on-surface-variant">
                <span>{h.label}</span>
                <span className="shrink-0">{new Date(h.createdAt).toLocaleDateString('fr-FR')}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="mb-xl flex flex-wrap gap-sm">
        {!decided ? (
          <Button variant="secondary" icon="close" onClick={() => setWithdrawOpen(true)}>
            Retirer ma candidature
          </Button>
        ) : null}
        {application.status === 'INTERVIEW' ? (
          <Button icon="event" onClick={() => setInterviewModalOpen(true)}>
            Programmer un entretien (démo)
          </Button>
        ) : null}
        {!decided && DEMO_NEXT_STATUS[application.status] ? (
          <Button
            variant="secondary"
            icon="skip_next"
            onClick={() => {
              const next = DEMO_NEXT_STATUS[application.status]!;
              changeApplicationStatus(application, next);
              notify(`Statut simulé : ${STATUS_LABEL[next]}`, 'info');
            }}
          >
            Simuler l&apos;étape suivante (démo)
          </Button>
        ) : null}
      </div>

      <ConfirmDialog
        open={withdrawOpen}
        onClose={() => setWithdrawOpen(false)}
        onConfirm={() => {
          withdrawApplication(application, candidate!.id);
          notify('Candidature retirée', 'success');
        }}
        title="Retirer cette candidature ?"
        description="Vous pourrez à nouveau postuler à cette offre plus tard si vous changez d'avis."
      />

      <ScheduleDemoInterviewModal
        open={interviewModalOpen}
        onClose={() => setInterviewModalOpen(false)}
        onScheduled={(interviewId) => {
          setInterviewModalOpen(false);
          notify('Entretien programmé', 'success');
          router.push(`/amud/candidat/entretiens/${interviewId}`);
        }}
        application={application}
      />
    </div>
  );
}

function ScheduleDemoInterviewModal({
  open,
  onClose,
  onScheduled,
  application,
}: {
  open: boolean;
  onClose: () => void;
  onScheduled: (id: string) => void;
  application: import('@/data/amud/applications').Application;
}) {
  const [date, setDate] = useState('');
  const [heureDebut, setHeureDebut] = useState('10:00');
  const [type, setType] = useState<'Visioconférence' | 'Téléphonique' | 'Présentiel'>('Visioconférence');

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Programmer un entretien (démo)"
      subtitle="Action de démonstration — simule la planification côté entreprise."
      footer={
        <ModalActions
          onCancel={onClose}
          submitLabel="Programmer"
          disabled={!date}
          onSubmit={() => {
            const interview = scheduleDemoInterview(application, { date, heureDebut, heureFin: addOneHour(heureDebut), type });
            onScheduled(interview.id);
          }}
        />
      }
    >
      <div className="flex flex-col gap-md">
        <label className="flex flex-col gap-1">
          <span className="text-label-sm font-medium text-amud-on-surface-variant">Date</span>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="min-h-[44px] rounded-lg border border-amud-outline-variant bg-amud-surface px-4 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary" />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-label-sm font-medium text-amud-on-surface-variant">Heure</span>
          <input type="time" value={heureDebut} onChange={(e) => setHeureDebut(e.target.value)} className="min-h-[44px] rounded-lg border border-amud-outline-variant bg-amud-surface px-4 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary" />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-label-sm font-medium text-amud-on-surface-variant">Type</span>
          <select value={type} onChange={(e) => setType(e.target.value as typeof type)} className="min-h-[44px] rounded-lg border border-amud-outline-variant bg-amud-surface px-4 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary">
            <option>Visioconférence</option>
            <option>Téléphonique</option>
            <option>Présentiel</option>
          </select>
        </label>
      </div>
    </Modal>
  );
}

function addOneHour(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number);
  const next = (h + 1) % 24;
  return `${String(next).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}
