'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import { ConfirmDialog } from '@/components/amud/ui';
import { useToast } from '@/components/amud/Toast';
import { useCollection } from '@/lib/amud/storage/useCollection';
import { interviewsCollection } from '@/lib/amud/localInterviews';
import { interviewsSeed, STATUT_CLASS, TYPE_ICON } from '@/data/amud/interviews';
import { interviewFeedbackCollection } from '@/lib/amud/localInterviewFeedback';
import { interviewFeedbackSeed, RECOMMENDATION_CLASS } from '@/data/amud/interviewFeedback';
import { CURRENT_EMPLOYER } from '@/data/amud/currentEmployer';
import { updateInterviewStatus } from '@/lib/amud/interviewCascades';
import { InterviewFeedbackForm } from '@/components/amud/entreprise/InterviewFeedbackForm';

const CRITERIA_LABELS: Record<string, string> = {
  overall: 'Global',
  technical: 'Technique',
  communication: 'Communication',
  motivation: 'Motivation',
  cultureFit: 'Culture',
};

export default function AmudEntrepriseEntretienDetailPage() {
  const params = useParams<{ id: string }>();
  const notify = useToast();
  const [interviews] = useCollection(interviewsCollection, interviewsSeed);
  const [feedbacks] = useCollection(interviewFeedbackCollection, interviewFeedbackSeed);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [rescheduling, setRescheduling] = useState(false);
  const [newDate, setNewDate] = useState('');
  const [newDebut, setNewDebut] = useState('');
  const [newFin, setNewFin] = useState('');

  const interview = interviews.find((i) => i.id === params.id && i.entrepriseId === CURRENT_EMPLOYER.entrepriseId);
  const interviewFeedbacks = useMemo(() => (interview ? feedbacks.filter((f) => f.interviewId === interview.id) : []), [feedbacks, interview]);

  if (!interview) {
    return (
      <div className="rounded-xl border border-dashed border-amud-outline-variant p-xl text-center">
        <p className="text-body-md font-medium text-amud-on-surface">Entretien introuvable.</p>
        <Link href="/amud/entreprise/entretiens" className="mt-md inline-flex items-center gap-1 text-label-md font-medium text-amud-primary hover:underline">
          Retour aux entretiens
        </Link>
      </div>
    );
  }

  function startReschedule() {
    setNewDate(interview!.date);
    setNewDebut(interview!.heureDebut);
    setNewFin(interview!.heureFin);
    setRescheduling(true);
  }

  function confirmReschedule() {
    interviewsCollection.update(interview!.id, { date: newDate, heureDebut: newDebut, heureFin: newFin, status: 'Reporté', updatedAt: new Date().toISOString() });
    notify('Entretien reporté.');
    setRescheduling(false);
  }

  return (
    <div>
      <Link href="/amud/entreprise/entretiens" className="mb-3 flex items-center gap-1 text-label-sm text-amud-on-surface-variant hover:text-amud-primary">
        <span className="material-symbols-outlined text-[16px]">arrow_back</span> Entretiens
      </Link>

      <div className="mb-lg flex flex-wrap items-start justify-between gap-md rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-lg">
        <div className="flex items-start gap-md">
          <span className="material-symbols-outlined shrink-0 rounded-lg bg-amud-surface-container-highest p-sm text-amud-primary">{TYPE_ICON[interview.type]}</span>
          <div>
            <h2 className="text-headline-lg text-amud-on-surface">{interview.candidateNom}</h2>
            <p className="text-body-md text-amud-on-surface-variant">{interview.offerTitre}</p>
            <span className={`mt-1 inline-flex items-center rounded-full px-2 py-1 text-xs font-bold ${STATUT_CLASS[interview.status]}`}>{interview.status}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-sm">
          {interview.status !== 'Confirmé' && interview.status !== 'Terminé' && interview.status !== 'Annulé' ? (
            <button
              onClick={() => {
                updateInterviewStatus(interview, 'Confirmé');
                notify('Entretien confirmé.');
              }}
              className="rounded-lg border border-amud-outline-variant px-md py-2 text-label-md font-medium text-amud-on-surface hover:bg-amud-surface-container-low"
            >
              Confirmer
            </button>
          ) : null}
          {interview.status !== 'Terminé' && interview.status !== 'Annulé' ? (
            <button onClick={startReschedule} className="rounded-lg border border-amud-outline-variant px-md py-2 text-label-md font-medium text-amud-on-surface hover:bg-amud-surface-container-low">
              Reporter
            </button>
          ) : null}
          {interview.status !== 'Terminé' && interview.status !== 'Annulé' ? (
            <button
              onClick={() => {
                updateInterviewStatus(interview, 'Terminé');
                notify('Entretien marqué comme terminé.');
              }}
              className="rounded-lg bg-amud-primary px-md py-2 text-label-md font-medium text-white hover:brightness-110"
            >
              Marquer terminé
            </button>
          ) : null}
          {interview.status !== 'Annulé' && interview.status !== 'Terminé' ? (
            <button onClick={() => setConfirmCancel(true)} className="rounded-lg border border-amud-error px-md py-2 text-label-md font-medium text-amud-error hover:bg-amud-error-container">
              Annuler
            </button>
          ) : null}
        </div>
      </div>

      {rescheduling ? (
        <div className="mb-lg grid grid-cols-1 gap-md rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-lg sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-label-md text-amud-on-surface-variant">Nouvelle date</label>
            <input value={newDate} onChange={(e) => setNewDate(e.target.value)} type="date" className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary" />
          </div>
          <div>
            <label className="mb-1 block text-label-md text-amud-on-surface-variant">Début</label>
            <input value={newDebut} onChange={(e) => setNewDebut(e.target.value)} type="time" className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary" />
          </div>
          <div>
            <label className="mb-1 block text-label-md text-amud-on-surface-variant">Fin</label>
            <input value={newFin} onChange={(e) => setNewFin(e.target.value)} type="time" className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary" />
          </div>
          <div className="flex items-end gap-sm sm:col-span-3">
            <button onClick={confirmReschedule} className="rounded-lg bg-amud-primary px-lg py-2 text-label-md font-medium text-white hover:brightness-110">
              Confirmer le report
            </button>
            <button onClick={() => setRescheduling(false)} className="rounded-lg border border-amud-outline-variant px-lg py-2 text-label-md text-amud-on-surface hover:bg-amud-surface-container-low">
              Annuler
            </button>
          </div>
        </div>
      ) : null}

      <div className="mb-lg rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-lg">
        <dl className="grid grid-cols-1 gap-md sm:grid-cols-2">
          <div>
            <dt className="text-label-sm text-amud-on-surface-variant">Date</dt>
            <dd className="text-body-md text-amud-on-surface">{new Date(interview.date).toLocaleDateString('fr-FR')}</dd>
          </div>
          <div>
            <dt className="text-label-sm text-amud-on-surface-variant">Horaire</dt>
            <dd className="text-body-md text-amud-on-surface">{interview.heureDebut} – {interview.heureFin}</dd>
          </div>
          <div>
            <dt className="text-label-sm text-amud-on-surface-variant">Recruteur</dt>
            <dd className="text-body-md text-amud-on-surface">{interview.recruiterNom ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-label-sm text-amud-on-surface-variant">{interview.type === 'Présentiel' ? 'Lieu' : 'Lien / numéro'}</dt>
            <dd className="text-body-md text-amud-on-surface">{interview.lieuOuLien ?? '—'}</dd>
          </div>
        </dl>
        {interview.notes ? (
          <div className="mt-md border-t border-amud-outline-variant pt-md">
            <dt className="text-label-sm text-amud-on-surface-variant">Notes</dt>
            <p className="mt-1 text-body-md text-amud-on-surface">{interview.notes}</p>
          </div>
        ) : null}
        <div className="mt-md flex gap-sm border-t border-amud-outline-variant pt-md">
          <Link href={`/amud/entreprise/candidatures/${interview.applicationId}`} className="text-label-md font-medium text-amud-primary hover:underline">
            Voir la candidature
          </Link>
        </div>
      </div>

      <div className="mb-lg">
        <h3 className="mb-md text-title-lg text-amud-on-surface">Évaluations</h3>
        {interviewFeedbacks.length === 0 ? (
          <p className="mb-md text-label-md text-amud-on-surface-variant">Aucune évaluation pour le moment.</p>
        ) : (
          <div className="mb-md flex flex-col gap-sm">
            {interviewFeedbacks.map((f) => (
              <div key={f.id} className="rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-lg">
                <div className="mb-sm flex items-center justify-between">
                  <span className="text-label-md font-bold text-amud-on-surface">{f.authorNom}</span>
                  <span className={`rounded-full px-2 py-1 text-[11px] font-bold ${RECOMMENDATION_CLASS[f.recommendation]}`}>{f.recommendation}</span>
                </div>
                <div className="flex flex-wrap gap-md text-label-sm text-amud-on-surface-variant">
                  {(['overall', 'technical', 'communication', 'motivation', 'cultureFit'] as const).map((k) => (
                    <span key={k}>
                      {CRITERIA_LABELS[k]} : <strong className="text-amud-on-surface">{f[k]}/5</strong>
                    </span>
                  ))}
                </div>
                {f.notes ? <p className="mt-sm text-body-md text-amud-on-surface">{f.notes}</p> : null}
              </div>
            ))}
          </div>
        )}
        <InterviewFeedbackForm interview={interview} />
      </div>

      <ConfirmDialog
        open={confirmCancel}
        onClose={() => setConfirmCancel(false)}
        onConfirm={() => {
          updateInterviewStatus(interview, 'Annulé');
          notify('Entretien annulé.', 'info');
        }}
        title="Annuler cet entretien ?"
        description={`${interview.candidateNom} ne sera plus prévu(e) pour ce créneau.`}
        confirmLabel="Annuler l’entretien"
      />
    </div>
  );
}
