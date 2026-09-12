'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { api } from '@/lib/opsApi';
import type { Page } from '@/lib/candidateMarketplace';
import { Modal } from '@/components/amud/ui';
import { useToast } from '@/components/amud/Toast';

/*
 * Entretiens — porte le style de la maquette `/amud/entreprise/entretiens`
 * sur `GET/POST /recruiter/interviews`, nouvel endpoint : la plateforme
 * n'avait jusqu'ici aucune notion d'entretien planifié (date, créneau, mode,
 * lieu), seulement le statut `interview` d'une candidature.
 */
type InterviewType = 'in_person' | 'video' | 'phone';
type InterviewStatus = 'scheduled' | 'confirmed' | 'rescheduled' | 'completed' | 'cancelled';

type Interview = {
  id: number;
  job_application_id: number;
  date: string;
  start_time: string;
  end_time: string;
  type: InterviewType;
  location: string | null;
  notes: string | null;
  status: InterviewStatus;
  application: {
    id: number;
    offer: { id: number; title: string };
    candidate_profile: { id: number; first_name: string | null; last_name: string | null; user: { phone: string } | null } | null;
  };
};

type ApplicationOption = {
  id: number;
  offer: { title: string };
  candidate_profile: { first_name: string | null; last_name: string | null; user: { phone: string } | null } | null;
};

const TYPE_ICON: Record<InterviewType, string> = { in_person: 'location_on', video: 'videocam', phone: 'call' };
const TYPE_LABEL: Record<InterviewType, string> = { in_person: 'Présentiel', video: 'Visio', phone: 'Téléphone' };
const STATUS_LABEL: Record<InterviewStatus, string> = { scheduled: 'Planifié', confirmed: 'Confirmé', rescheduled: 'Reporté', completed: 'Terminé', cancelled: 'Annulé' };
const STATUS_CLASS: Record<InterviewStatus, string> = {
  scheduled: 'bg-amud-secondary-container text-amud-on-surface',
  confirmed: 'bg-amud-primary-fixed text-amud-on-primary-fixed',
  rescheduled: 'bg-amud-tertiary-fixed text-amud-on-tertiary-fixed',
  completed: 'bg-amud-surface-container-highest text-amud-on-surface-variant',
  cancelled: 'bg-amud-error-container text-amud-on-error-container',
};

type TabId = 'upcoming' | 'today' | 'week' | 'completed' | 'cancelled';
const TABS: { id: TabId; label: string }[] = [
  { id: 'upcoming', label: 'À venir' },
  { id: 'today', label: "Aujourd'hui" },
  { id: 'week', label: 'Cette semaine' },
  { id: 'completed', label: 'Terminés' },
  { id: 'cancelled', label: 'Annulés' },
];

function candidateName(app: { candidate_profile: ApplicationOption['candidate_profile'] } | Interview['application']) {
  const p = app.candidate_profile;
  const name = `${p?.first_name ?? ''} ${p?.last_name ?? ''}`.trim();
  return name || p?.user?.phone || 'Candidat';
}

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function getMonday(d: Date) {
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
  const m = new Date(d);
  m.setDate(d.getDate() + diff);
  m.setHours(0, 0, 0, 0);
  return m;
}

function errorMessage(error: unknown, fallback: string) {
  if (isAxiosError(error)) {
    const data = error.response?.data as { message?: string; errors?: Record<string, string[]> } | undefined;
    return (data?.errors ? Object.values(data.errors)[0]?.[0] : undefined) ?? data?.message ?? fallback;
  }
  return fallback;
}

export default function RecruiterEntretiensPage() {
  return (
    <Suspense fallback={<p className="text-body-md text-amud-on-surface-variant">Chargement…</p>}>
      <RecruiterEntretiensPageInner />
    </Suspense>
  );
}

function RecruiterEntretiensPageInner() {
  const notify = useToast();
  const qc = useQueryClient();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<TabId>('upcoming');
  const [scheduleOpen, setScheduleOpen] = useState(false);

  const interviews = useQuery({
    queryKey: ['recruiter-interviews'],
    queryFn: () => api.get('/recruiter/interviews').then((r) => r.data as Interview[]),
  });

  const applications = useQuery({
    queryKey: ['recruiter-applications-for-scheduling'],
    queryFn: () => api.get('/recruiter/applications', { params: { per_page: 100 } }).then((r) => r.data as Page<ApplicationOption>),
    enabled: scheduleOpen,
  });

  const schedule = useMutation({
    mutationFn: (body: { job_application_id: number; date: string; start_time: string; end_time: string; type: InterviewType; location?: string; notes?: string }) =>
      api.post('/recruiter/interviews', body),
    onSuccess: () => {
      notify('Entretien planifié.');
      setScheduleOpen(false);
      qc.invalidateQueries({ queryKey: ['recruiter-interviews'] });
      qc.invalidateQueries({ queryKey: ['recruiter-applications'] });
    },
    onError: (error) => notify(errorMessage(error, 'Planification impossible.'), 'error'),
  });

  const all = useMemo(() => interviews.data ?? [], [interviews.data]);
  const now = new Date();
  const todayIso = isoDate(now);
  const monday = getMonday(now);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const filtered = useMemo(() => {
    return all
      .filter((i) => {
        const dt = new Date(`${i.date}T${i.start_time}`);
        switch (tab) {
          case 'upcoming':
            return (i.status === 'scheduled' || i.status === 'confirmed' || i.status === 'rescheduled') && dt >= now;
          case 'today':
            return i.date === todayIso;
          case 'week':
            return i.date >= isoDate(monday) && i.date <= isoDate(sunday);
          case 'completed':
            return i.status === 'completed';
          case 'cancelled':
            return i.status === 'cancelled';
          default:
            return true;
        }
      })
      .sort((a, b) => `${a.date}T${a.start_time}`.localeCompare(`${b.date}T${b.start_time}`));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [all, tab]);

  const preselectedApplicationId = searchParams.get('candidatureId');

  return (
    <div>
      <div className="mb-lg flex flex-wrap items-end justify-between gap-md">
        <div>
          <h2 className="text-headline-lg text-amud-on-surface">Entretiens</h2>
          <p className="mt-1 text-body-md text-amud-on-surface-variant">Planifiez et suivez les entretiens de recrutement.</p>
        </div>
        <button onClick={() => setScheduleOpen(true)} className="flex items-center gap-2 rounded-lg bg-amud-primary px-lg py-3 text-label-md font-medium text-white shadow-sm hover:brightness-110">
          <span className="material-symbols-outlined text-[20px]">add</span>
          Planifier un entretien
        </button>
      </div>

      <div className="mb-md flex flex-wrap gap-sm overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`shrink-0 rounded-full px-md py-1.5 text-label-md font-medium transition-colors ${
              tab === t.id ? 'bg-amud-primary text-white' : 'bg-amud-surface-container-high text-amud-on-surface-variant hover:bg-amud-surface-container-highest'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {interviews.isLoading ? (
        <p className="text-body-md text-amud-on-surface-variant">Chargement…</p>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-amud-outline-variant p-xl text-center">
          <span className="material-symbols-outlined text-4xl text-amud-on-surface-variant">event_busy</span>
          <p className="mt-sm text-body-md font-medium text-amud-on-surface">Aucun entretien programmé.</p>
          <button onClick={() => setScheduleOpen(true)} className="mt-md inline-flex items-center gap-1 rounded-lg bg-amud-primary px-lg py-2 text-label-md font-medium text-white hover:brightness-110">
            Planifier un entretien
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-sm">
          {filtered.map((i) => (
            <Link key={i.id} href={`/recruiter/entretiens/${i.id}`} className="flex items-center gap-md rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-md hover:border-amud-primary">
              <span className="material-symbols-outlined shrink-0 rounded-lg bg-amud-surface-container-highest p-sm text-amud-primary">{TYPE_ICON[i.type]}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold text-amud-on-surface">{candidateName(i.application)}</p>
                <p className="truncate text-label-sm text-amud-on-surface-variant">
                  {i.application.offer.title} · {new Date(i.date).toLocaleDateString('fr-FR')} à {i.start_time} · {TYPE_LABEL[i.type]}
                </p>
              </div>
              <span className={`shrink-0 rounded-full px-2 py-1 text-[11px] font-bold ${STATUS_CLASS[i.status]}`}>{STATUS_LABEL[i.status]}</span>
            </Link>
          ))}
        </div>
      )}

      <Modal open={scheduleOpen} onClose={() => setScheduleOpen(false)} title="Planifier un entretien">
        <ScheduleForm
          applications={applications.data?.data ?? []}
          preselectedId={preselectedApplicationId ? Number(preselectedApplicationId) : undefined}
          pending={schedule.isPending}
          onSubmit={(body) => schedule.mutate(body)}
          onCancel={() => setScheduleOpen(false)}
        />
      </Modal>
    </div>
  );
}

function ScheduleForm({
  applications,
  preselectedId,
  pending,
  onSubmit,
  onCancel,
}: {
  applications: ApplicationOption[];
  preselectedId?: number;
  pending: boolean;
  onSubmit: (body: { job_application_id: number; date: string; start_time: string; end_time: string; type: InterviewType; location?: string; notes?: string }) => void;
  onCancel: () => void;
}) {
  const [applicationId, setApplicationId] = useState(preselectedId ? String(preselectedId) : '');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('10:30');
  const [type, setType] = useState<InterviewType>('video');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');

  return (
    <form
      id="schedule-interview-form"
      onSubmit={(e) => {
        e.preventDefault();
        if (!applicationId || !date) return;
        onSubmit({ job_application_id: Number(applicationId), date, start_time: startTime, end_time: endTime, type, location: location.trim() || undefined, notes: notes.trim() || undefined });
      }}
      className="grid grid-cols-1 gap-md"
    >
      <div>
        <label className="mb-1 block text-label-md text-amud-on-surface-variant">Candidature *</label>
        <select value={applicationId} onChange={(e) => setApplicationId(e.target.value)} required className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary">
          <option value="">Sélectionner…</option>
          {applications.map((a) => (
            <option key={a.id} value={a.id}>
              {candidateName(a)} — {a.offer.title}
            </option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-1 gap-md sm:grid-cols-3">
        <div>
          <label className="mb-1 block text-label-md text-amud-on-surface-variant">Date *</label>
          <input value={date} onChange={(e) => setDate(e.target.value)} type="date" required className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary" />
        </div>
        <div>
          <label className="mb-1 block text-label-md text-amud-on-surface-variant">Début</label>
          <input value={startTime} onChange={(e) => setStartTime(e.target.value)} type="time" className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary" />
        </div>
        <div>
          <label className="mb-1 block text-label-md text-amud-on-surface-variant">Fin</label>
          <input value={endTime} onChange={(e) => setEndTime(e.target.value)} type="time" className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary" />
        </div>
      </div>
      <div>
        <label className="mb-1 block text-label-md text-amud-on-surface-variant">Type</label>
        <select value={type} onChange={(e) => setType(e.target.value as InterviewType)} className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary">
          {(['video', 'in_person', 'phone'] as InterviewType[]).map((t) => (
            <option key={t} value={t}>
              {TYPE_LABEL[t]}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-label-md text-amud-on-surface-variant">{type === 'in_person' ? 'Lieu' : 'Lien / numéro'}</label>
        <input value={location} onChange={(e) => setLocation(e.target.value)} type="text" className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary" />
      </div>
      <div>
        <label className="mb-1 block text-label-md text-amud-on-surface-variant">Notes</label>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary" />
      </div>
      <div className="flex justify-end gap-sm">
        <button type="button" onClick={onCancel} className="rounded-lg border border-amud-outline-variant px-lg py-2 text-label-md text-amud-on-surface hover:bg-amud-surface-container-low">
          Annuler
        </button>
        <button type="submit" disabled={pending} className="rounded-lg bg-amud-primary px-lg py-2 text-label-md font-medium text-white shadow-sm hover:brightness-110 disabled:opacity-50">
          {pending ? 'Planification…' : 'Planifier'}
        </button>
      </div>
    </form>
  );
}
