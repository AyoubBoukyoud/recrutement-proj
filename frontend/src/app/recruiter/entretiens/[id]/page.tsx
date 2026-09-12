'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { api } from '@/lib/opsApi';
import { useToast } from '@/components/amud/Toast';

type InterviewType = 'in_person' | 'video' | 'phone';
type InterviewStatus = 'scheduled' | 'confirmed' | 'rescheduled' | 'completed' | 'cancelled';
type Recommendation = 'strong_yes' | 'yes' | 'no' | 'strong_no';

type Feedback = {
  id: number;
  overall: number;
  technical: number;
  communication: number;
  motivation: number;
  culture_fit: number;
  recommendation: Recommendation;
  notes: string | null;
  author: { name: string | null };
};

type Interview = {
  id: number;
  date: string;
  start_time: string;
  end_time: string;
  type: InterviewType;
  location: string | null;
  notes: string | null;
  status: InterviewStatus;
  application: {
    id: number;
    offer: { title: string };
    candidate_profile: { first_name: string | null; last_name: string | null; user: { phone: string } | null } | null;
  };
  feedback: Feedback[];
};

const TYPE_ICON: Record<InterviewType, string> = { in_person: 'location_on', video: 'videocam', phone: 'call' };
const STATUS_LABEL: Record<InterviewStatus, string> = { scheduled: 'Planifié', confirmed: 'Confirmé', rescheduled: 'Reporté', completed: 'Terminé', cancelled: 'Annulé' };
const STATUS_CLASS: Record<InterviewStatus, string> = {
  scheduled: 'bg-amud-secondary-container text-amud-on-surface',
  confirmed: 'bg-amud-primary-fixed text-amud-on-primary-fixed',
  rescheduled: 'bg-amud-tertiary-fixed text-amud-on-tertiary-fixed',
  completed: 'bg-amud-surface-container-highest text-amud-on-surface-variant',
  cancelled: 'bg-amud-error-container text-amud-on-error-container',
};
const RECOMMENDATION_LABEL: Record<Recommendation, string> = { strong_yes: 'Fortement recommandé', yes: 'Recommandé', no: 'Non recommandé', strong_no: 'Fortement déconseillé' };
const RECOMMENDATION_CLASS: Record<Recommendation, string> = {
  strong_yes: 'bg-amud-primary-fixed text-amud-on-primary-fixed',
  yes: 'bg-amud-secondary-container text-amud-on-surface',
  no: 'bg-amud-tertiary-fixed text-amud-on-tertiary-fixed',
  strong_no: 'bg-amud-error-container text-amud-on-error-container',
};

function candidateName(app: Interview['application']) {
  const p = app.candidate_profile;
  const name = `${p?.first_name ?? ''} ${p?.last_name ?? ''}`.trim();
  return name || p?.user?.phone || 'Candidat';
}

function errorMessage(error: unknown, fallback: string) {
  if (isAxiosError(error)) {
    const data = error.response?.data as { message?: string } | undefined;
    return data?.message ?? fallback;
  }
  return fallback;
}

export default function RecruiterEntretienDetailPage() {
  const notify = useToast();
  const qc = useQueryClient();
  const params = useParams<{ id: string }>();
  const [rescheduling, setRescheduling] = useState(false);
  const [newDate, setNewDate] = useState('');
  const [newStart, setNewStart] = useState('');
  const [newEnd, setNewEnd] = useState('');

  const interview = useQuery({
    queryKey: ['recruiter-interview', params.id],
    queryFn: () => api.get(`/recruiter/interviews/${params.id}`).then((r) => r.data as Interview),
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ['recruiter-interview', params.id] });

  const setStatus = useMutation({
    mutationFn: (status: InterviewStatus) => api.patch(`/recruiter/interviews/${params.id}`, { status }),
    onSuccess: (_data, status) => {
      notify(`Entretien ${STATUS_LABEL[status].toLowerCase()}.`);
      refresh();
    },
    onError: (error) => notify(errorMessage(error, 'Action impossible.'), 'error'),
  });

  const reschedule = useMutation({
    mutationFn: () => api.patch(`/recruiter/interviews/${params.id}`, { date: newDate, start_time: newStart, end_time: newEnd }),
    onSuccess: () => {
      notify('Entretien reporté.');
      setRescheduling(false);
      refresh();
    },
    onError: (error) => notify(errorMessage(error, 'Action impossible.'), 'error'),
  });

  const submitFeedback = useMutation({
    mutationFn: (body: { overall: number; technical: number; communication: number; motivation: number; culture_fit: number; recommendation: Recommendation; notes?: string }) =>
      api.post(`/recruiter/interviews/${params.id}/feedback`, body),
    onSuccess: () => {
      notify('Évaluation enregistrée.');
      refresh();
    },
    onError: (error) => notify(errorMessage(error, 'Enregistrement impossible.'), 'error'),
  });

  if (interview.isLoading) {
    return <p className="text-body-md text-amud-on-surface-variant">Chargement…</p>;
  }

  if (interview.isError || !interview.data) {
    return (
      <div className="rounded-xl border border-dashed border-amud-outline-variant p-xl text-center">
        <p className="text-body-md font-medium text-amud-on-surface">Entretien introuvable.</p>
        <Link href="/recruiter/entretiens" className="mt-md inline-flex items-center gap-1 text-label-md font-medium text-amud-primary hover:underline">
          Retour aux entretiens
        </Link>
      </div>
    );
  }

  const i = interview.data;
  const canAct = i.status !== 'completed' && i.status !== 'cancelled';

  function startReschedule() {
    setNewDate(i.date);
    setNewStart(i.start_time);
    setNewEnd(i.end_time);
    setRescheduling(true);
  }

  return (
    <div>
      <Link href="/recruiter/entretiens" className="mb-3 flex items-center gap-1 text-label-sm text-amud-on-surface-variant hover:text-amud-primary">
        <span className="material-symbols-outlined text-[16px]">arrow_back</span> Entretiens
      </Link>

      <div className="mb-lg flex flex-wrap items-start justify-between gap-md rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-lg">
        <div className="flex items-start gap-md">
          <span className="material-symbols-outlined shrink-0 rounded-lg bg-amud-surface-container-highest p-sm text-amud-primary">{TYPE_ICON[i.type]}</span>
          <div>
            <h2 className="text-headline-lg text-amud-on-surface">{candidateName(i.application)}</h2>
            <p className="text-body-md text-amud-on-surface-variant">{i.application.offer.title}</p>
            <span className={`mt-1 inline-flex items-center rounded-full px-2 py-1 text-xs font-bold ${STATUS_CLASS[i.status]}`}>{STATUS_LABEL[i.status]}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-sm">
          {canAct && i.status !== 'confirmed' ? (
            <button onClick={() => setStatus.mutate('confirmed')} className="rounded-lg border border-amud-outline-variant px-md py-2 text-label-md font-medium text-amud-on-surface hover:bg-amud-surface-container-low">
              Confirmer
            </button>
          ) : null}
          {canAct ? (
            <button onClick={startReschedule} className="rounded-lg border border-amud-outline-variant px-md py-2 text-label-md font-medium text-amud-on-surface hover:bg-amud-surface-container-low">
              Reporter
            </button>
          ) : null}
          {canAct ? (
            <button onClick={() => setStatus.mutate('completed')} className="rounded-lg bg-amud-primary px-md py-2 text-label-md font-medium text-white hover:brightness-110">
              Marquer terminé
            </button>
          ) : null}
          {canAct ? (
            <button onClick={() => setStatus.mutate('cancelled')} className="rounded-lg border border-amud-error px-md py-2 text-label-md font-medium text-amud-error hover:bg-amud-error-container">
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
            <input value={newStart} onChange={(e) => setNewStart(e.target.value)} type="time" className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary" />
          </div>
          <div>
            <label className="mb-1 block text-label-md text-amud-on-surface-variant">Fin</label>
            <input value={newEnd} onChange={(e) => setNewEnd(e.target.value)} type="time" className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary" />
          </div>
          <div className="flex items-end gap-sm sm:col-span-3">
            <button onClick={() => reschedule.mutate()} disabled={reschedule.isPending} className="rounded-lg bg-amud-primary px-lg py-2 text-label-md font-medium text-white hover:brightness-110 disabled:opacity-50">
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
            <dd className="text-body-md text-amud-on-surface">{new Date(i.date).toLocaleDateString('fr-FR')}</dd>
          </div>
          <div>
            <dt className="text-label-sm text-amud-on-surface-variant">Horaire</dt>
            <dd className="text-body-md text-amud-on-surface">
              {i.start_time} – {i.end_time}
            </dd>
          </div>
          <div>
            <dt className="text-label-sm text-amud-on-surface-variant">{i.type === 'in_person' ? 'Lieu' : 'Lien / numéro'}</dt>
            <dd className="text-body-md text-amud-on-surface">{i.location ?? '—'}</dd>
          </div>
        </dl>
        {i.notes ? (
          <div className="mt-md border-t border-amud-outline-variant pt-md">
            <dt className="text-label-sm text-amud-on-surface-variant">Notes</dt>
            <p className="mt-1 text-body-md text-amud-on-surface">{i.notes}</p>
          </div>
        ) : null}
      </div>

      <div className="mb-lg">
        <h3 className="mb-md text-title-lg text-amud-on-surface">Évaluations</h3>
        {i.feedback.length === 0 ? (
          <p className="mb-md text-label-md text-amud-on-surface-variant">Aucune évaluation pour le moment.</p>
        ) : (
          <div className="mb-md flex flex-col gap-sm">
            {i.feedback.map((f) => (
              <div key={f.id} className="rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-lg">
                <div className="mb-sm flex items-center justify-between">
                  <span className="text-label-md font-bold text-amud-on-surface">{f.author.name ?? 'Recruteur'}</span>
                  <span className={`rounded-full px-2 py-1 text-[11px] font-bold ${RECOMMENDATION_CLASS[f.recommendation]}`}>{RECOMMENDATION_LABEL[f.recommendation]}</span>
                </div>
                <div className="flex flex-wrap gap-md text-label-sm text-amud-on-surface-variant">
                  <span>
                    Global : <strong className="text-amud-on-surface">{f.overall}/5</strong>
                  </span>
                  <span>
                    Technique : <strong className="text-amud-on-surface">{f.technical}/5</strong>
                  </span>
                  <span>
                    Communication : <strong className="text-amud-on-surface">{f.communication}/5</strong>
                  </span>
                  <span>
                    Motivation : <strong className="text-amud-on-surface">{f.motivation}/5</strong>
                  </span>
                  <span>
                    Culture : <strong className="text-amud-on-surface">{f.culture_fit}/5</strong>
                  </span>
                </div>
                {f.notes ? <p className="mt-sm text-body-md text-amud-on-surface">{f.notes}</p> : null}
              </div>
            ))}
          </div>
        )}
        <FeedbackForm pending={submitFeedback.isPending} onSubmit={(body) => submitFeedback.mutate(body)} />
      </div>
    </div>
  );
}

function FeedbackForm({
  pending,
  onSubmit,
}: {
  pending: boolean;
  onSubmit: (body: { overall: number; technical: number; communication: number; motivation: number; culture_fit: number; recommendation: Recommendation; notes?: string }) => void;
}) {
  const [scores, setScores] = useState({ overall: 3, technical: 3, communication: 3, motivation: 3, culture_fit: 3 });
  const [recommendation, setRecommendation] = useState<Recommendation>('yes');
  const [notes, setNotes] = useState('');

  const CRITERIA: { key: keyof typeof scores; label: string }[] = [
    { key: 'overall', label: 'Global' },
    { key: 'technical', label: 'Technique' },
    { key: 'communication', label: 'Communication' },
    { key: 'motivation', label: 'Motivation' },
    { key: 'culture_fit', label: 'Culture' },
  ];

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({ ...scores, recommendation, notes: notes.trim() || undefined });
        setNotes('');
      }}
      className="rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-lg"
    >
      <h4 className="mb-md text-title-md text-amud-on-surface">Ajouter une évaluation</h4>
      <div className="grid grid-cols-1 gap-md sm:grid-cols-2">
        {CRITERIA.map((c) => (
          <div key={c.key}>
            <label className="mb-1 block text-label-md text-amud-on-surface-variant">
              {c.label} : {scores[c.key]}/5
            </label>
            <input
              type="range"
              min={1}
              max={5}
              value={scores[c.key]}
              onChange={(e) => setScores((s) => ({ ...s, [c.key]: Number(e.target.value) }))}
              className="w-full accent-amud-primary"
            />
          </div>
        ))}
      </div>
      <div className="mt-md">
        <label className="mb-1 block text-label-md text-amud-on-surface-variant">Recommandation</label>
        <select value={recommendation} onChange={(e) => setRecommendation(e.target.value as Recommendation)} className="w-full max-w-xs rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary">
          {(Object.keys(RECOMMENDATION_LABEL) as Recommendation[]).map((r) => (
            <option key={r} value={r}>
              {RECOMMENDATION_LABEL[r]}
            </option>
          ))}
        </select>
      </div>
      <div className="mt-md">
        <label className="mb-1 block text-label-md text-amud-on-surface-variant">Notes</label>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary" />
      </div>
      <button type="submit" disabled={pending} className="mt-md rounded-lg bg-amud-primary px-lg py-2 text-label-md font-medium text-white hover:brightness-110 disabled:opacity-50">
        {pending ? 'Enregistrement…' : 'Enregistrer l’évaluation'}
      </button>
    </form>
  );
}
