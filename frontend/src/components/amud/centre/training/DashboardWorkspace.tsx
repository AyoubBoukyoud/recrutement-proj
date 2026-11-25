'use client';

import Link from 'next/link';
import { ErrorState, LoadingState } from '@/components/amud/ui';
import { timetableError, type TimetableCenter } from '@/lib/amud/services/timetableService';
import { academicMonth, formatMoney, formatMonth } from '@/lib/amud/services/trainingService';
import { academicToday, addDays, minutes, mondayOf } from '@/lib/amud/timetable/calendar';
import { useTimetableResources, useTimetableSessions } from '@/lib/amud/timetable/useTimetable';
import { useMonthlyReport, useStudents } from '@/lib/amud/training/useTraining';
import { CentreHeader, ConnectedCentre, Panel } from './shared';

export function DashboardWorkspace() {
  return <ConnectedCentre>{(center) => <Dashboard key={center.id} center={center} />}</ConnectedCentre>;
}

function Dashboard({ center }: { center: TimetableCenter }) {
  const today = academicToday();
  const week = mondayOf(today);
  const month = academicMonth();
  const resourcesQuery = useTimetableResources();
  const sessionsQuery = useTimetableSessions(week, addDays(week, 6));
  const studentsQuery = useStudents();
  const reportQuery = useMonthlyReport(month);

  if (resourcesQuery.isLoading || sessionsQuery.isLoading) return <LoadingState label="Chargement du tableau de bord…" rows={5} />;
  if (resourcesQuery.isError || sessionsQuery.isError || !resourcesQuery.data) return <ErrorState title="Tableau de bord indisponible" description={timetableError(resourcesQuery.error ?? sessionsQuery.error)} onRetry={() => { void resourcesQuery.refetch(); void sessionsQuery.refetch(); }} />;

  const resources = resourcesQuery.data;
  const sessions = sessionsQuery.data?.sessions ?? [];
  const students = studentsQuery.data ?? [];
  const activeStudents = students.filter((student) => student.status === 'active');
  const assigned = activeStudents.filter((student) => student.group_ids.length).length;
  const todaySessions = sessions.filter((session) => session.date === today).sort((a, b) => a.start_time.localeCompare(b.start_time));
  const hours = sessions.reduce((sum, session) => sum + (minutes(session.end_time) - minutes(session.start_time)) / 60, 0);
  const totals = reportQuery.data?.totals;
  const name = (kind: 'modules' | 'groups' | 'teachers' | 'rooms', id: number) => resources[kind].find((item) => item.id === id)?.name ?? '—';

  const steps = [
    { done: resources.modules.length > 0, label: 'Créer une formation', detail: 'Niveau et tarif mensuel', href: '/amud/centre/formations?new=1' },
    { done: resources.teachers.length > 0, label: 'Ajouter un enseignant', detail: 'Pour planifier ses cours', href: '/amud/centre/enseignants?new=1' },
    { done: resources.rooms.length > 0, label: 'Ajouter une salle', detail: 'Planning → Ressources → Salles', href: '/amud/centre/salles' },
    { done: resources.groups.length > 0, label: 'Créer un groupe', detail: 'Rattaché à une formation', href: '/amud/centre/groupes?new=1' },
    ...(center.can_view_students ? [{ done: assigned > 0, label: 'Inscrire et affecter un étudiant', detail: 'Étudiants → Affecter à un groupe', href: '/amud/centre/etudiants?new=1' }] : []),
    { done: sessions.length > 0, label: 'Planifier un cours', detail: 'Glissez sur un créneau libre', href: '/amud/centre/planning' },
    ...(center.can_manage_finance ? [{ done: (totals?.paid ?? 0) > 0, label: 'Enregistrer un paiement', detail: `Pour ${formatMonth(month)}`, href: '/amud/centre/paiements-etudiants?new=1' }] : []),
  ];
  const remaining = steps.filter((step) => !step.done).length;

  const stats = [
    ...(center.can_view_students ? [{ label: 'Étudiants actifs', value: String(activeStudents.length), hint: `${activeStudents.length - assigned} sans groupe`, href: '/amud/centre/etudiants' }] : []),
    { label: 'Groupes', value: String(resources.groups.length), hint: `${resources.modules.length} formation${resources.modules.length > 1 ? 's' : ''}`, href: '/amud/centre/groupes' },
    { label: 'Cours cette semaine', value: String(sessions.length), hint: `${hours.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} h planifiées`, href: '/amud/centre/planning' },
    ...(center.can_manage_finance && totals ? [{ label: `Encaissé · ${formatMonth(month)}`, value: formatMoney(totals.paid), hint: `Reste ${formatMoney(totals.outstanding)}`, href: '/amud/centre/paiements-etudiants' }] : []),
  ];

  return <div className="space-y-6">
    <CentreHeader section="Tableau de bord" title={center.name} subtitle="Vue d’ensemble de l’activité réelle de votre centre." />
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {stats.map((stat) => <Link key={stat.label} href={stat.href} className="rounded-xl border border-amud-outline-variant bg-amud-surface p-4 transition-colors hover:border-amud-primary">
        <p className="text-label-sm uppercase tracking-wide text-amud-on-surface-variant">{stat.label}</p>
        <p className="mt-1 text-headline-md font-bold text-amud-on-surface">{stat.value}</p>
        <p className="text-label-sm text-amud-on-surface-variant">{stat.hint}</p>
      </Link>)}
    </div>
    <div className="grid gap-4 lg:grid-cols-2">
      {center.can_manage && <Panel className="p-4">
        <h2 className="text-title-lg font-semibold">{remaining ? 'Mise en route' : 'Votre centre est prêt'}</h2>
        <p className="text-body-md text-amud-on-surface-variant">{remaining ? `${steps.length - remaining} étape${steps.length - remaining > 1 ? 's' : ''} sur ${steps.length} terminée${steps.length - remaining > 1 ? 's' : ''}.` : 'Toutes les étapes de base sont faites.'}</p>
        <ol className="mt-3 space-y-1">
          {steps.map((step) => <li key={step.label}>
            <Link href={step.href} className="flex min-h-[48px] items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-amud-surface-container-low">
              <span className={`material-symbols-outlined ${step.done ? 'text-amud-primary' : 'text-amud-outline'}`} aria-hidden="true">{step.done ? 'check_circle' : 'radio_button_unchecked'}</span>
              <span className="min-w-0 flex-1"><span className={`block text-body-md ${step.done ? 'text-amud-on-surface-variant line-through' : 'font-semibold text-amud-on-surface'}`}>{step.label}</span><span className="block text-label-sm text-amud-on-surface-variant">{step.detail}</span></span>
              <span className="sr-only">{step.done ? 'terminé' : 'à faire'}</span>
              <span className="material-symbols-outlined text-amud-on-surface-variant" aria-hidden="true">chevron_right</span>
            </Link>
          </li>)}
        </ol>
      </Panel>}
      <Panel className="p-4">
        <div className="flex items-center justify-between gap-2"><h2 className="text-title-lg font-semibold">Cours d’aujourd’hui</h2><Link href="/amud/centre/planning" className="text-label-md font-semibold text-amud-primary">Ouvrir le planning</Link></div>
        {todaySessions.length ? <ul className="mt-3 divide-y divide-amud-outline-variant">
          {todaySessions.map((session) => <li key={session.id} className="flex items-center gap-3 py-2.5">
            <span className="w-24 shrink-0 text-label-md font-semibold text-amud-primary">{session.start_time}–{session.end_time}</span>
            <span className="min-w-0"><span className="block truncate text-body-md font-semibold">{name('modules', session.module_id)} · {name('groups', session.group_id)}</span><span className="block truncate text-label-sm text-amud-on-surface-variant">{name('teachers', session.teacher_id)} · {name('rooms', session.room_id)}</span></span>
          </li>)}
        </ul> : <p className="mt-3 text-body-md text-amud-on-surface-variant">Aucun cours prévu aujourd’hui.</p>}
      </Panel>
    </div>
  </div>;
}
