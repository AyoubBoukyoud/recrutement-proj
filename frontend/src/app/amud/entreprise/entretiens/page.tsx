'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import { useCollection } from '@/lib/amud/storage/useCollection';
import { interviewsCollection } from '@/lib/amud/localInterviews';
import { interviewsSeed, STATUT_CLASS, TYPE_ICON } from '@/data/amud/interviews';
import { applicationsCollection } from '@/lib/amud/localApplications';
import { applicationsSeed } from '@/data/amud/applications';
import { CURRENT_EMPLOYER } from '@/data/amud/currentEmployer';
import { ScheduleInterviewModal } from '@/components/amud/entreprise/ScheduleInterviewModal';
import { getMonday, addDays, isoDate } from '@/lib/amud/weekDates';

type TabId = 'upcoming' | 'today' | 'week' | 'completed' | 'cancelled';
const TABS: { id: TabId; label: string }[] = [
  { id: 'upcoming', label: 'À venir' },
  { id: 'today', label: "Aujourd'hui" },
  { id: 'week', label: 'Cette semaine' },
  { id: 'completed', label: 'Terminés' },
  { id: 'cancelled', label: 'Annulés' },
];

export default function AmudEntrepriseEntretiensPage() {
  const searchParams = useSearchParams();
  const [interviews] = useCollection(interviewsCollection, interviewsSeed);
  const [applications] = useCollection(applicationsCollection, applicationsSeed);
  const [tab, setTab] = useState<TabId>('upcoming');
  const [scheduleOpen, setScheduleOpen] = useState(false);

  const candidatureId = searchParams.get('candidatureId');
  const candidatId = searchParams.get('candidatId');
  const prefillApplication = candidatureId ? applications.find((a) => a.id === candidatureId) : undefined;

  const myInterviews = useMemo(() => interviews.filter((i) => i.entrepriseId === CURRENT_EMPLOYER.entrepriseId), [interviews]);

  const now = new Date();
  const todayIso = isoDate(now);
  const monday = getMonday(now);
  const sunday = addDays(monday, 6);

  const filtered = useMemo(() => {
    return myInterviews
      .filter((i) => {
        const dt = new Date(`${i.date}T${i.heureDebut}`);
        switch (tab) {
          case 'upcoming':
            return (i.status === 'Planifié' || i.status === 'Confirmé') && dt >= now;
          case 'today':
            return i.date === todayIso;
          case 'week':
            return i.date >= isoDate(monday) && i.date <= isoDate(sunday);
          case 'completed':
            return i.status === 'Terminé';
          case 'cancelled':
            return i.status === 'Annulé';
          default:
            return true;
        }
      })
      .sort((a, b) => `${a.date}T${a.heureDebut}`.localeCompare(`${b.date}T${b.heureDebut}`));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myInterviews, tab]);

  return (
    <div>
      <div className="mb-lg flex flex-wrap items-end justify-between gap-md">
        <div>
          <h2 className="text-headline-lg text-amud-on-surface">Entretiens</h2>
          <p className="mt-1 text-body-md text-amud-on-surface-variant">Planifiez et suivez les entretiens de recrutement.</p>
        </div>
        <button
          onClick={() => setScheduleOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-amud-primary px-lg py-3 text-label-md font-medium text-white shadow-sm transition-colors hover:brightness-110"
        >
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

      {filtered.length === 0 ? (
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
            <Link key={i.id} href={`/amud/entreprise/entretiens/${i.id}`} className="flex items-center gap-md rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-md hover:border-amud-primary">
              <span className="material-symbols-outlined shrink-0 rounded-lg bg-amud-surface-container-highest p-sm text-amud-primary">{TYPE_ICON[i.type]}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold text-amud-on-surface">{i.candidateNom}</p>
                <p className="truncate text-label-sm text-amud-on-surface-variant">
                  {i.offerTitre} · {new Date(i.date).toLocaleDateString('fr-FR')} à {i.heureDebut} · {i.type}
                </p>
              </div>
              <span className={`shrink-0 rounded-full px-2 py-1 text-[11px] font-bold ${STATUT_CLASS[i.status]}`}>{i.status}</span>
            </Link>
          ))}
        </div>
      )}

      <ScheduleInterviewModal
        open={scheduleOpen}
        onClose={() => setScheduleOpen(false)}
        application={prefillApplication}
        candidateId={!prefillApplication ? (candidatId ?? undefined) : undefined}
      />
    </div>
  );
}
