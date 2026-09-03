'use client';

// Mon stage quotidien — les tâches assignées au candidat (`GET /candidate/tasks`).
//
// Cet écran vivait sous `/lecon-jour` avant la fusion avec `origin/main`, qui
// y a remis la leçon d'allemand du jour. `/lecon-jour` est nommé « leçon » par
// tout le reste de l'app (icône `translate`, clé `germanLesson` du tableau de
// bord, redirection `/cours-allemand`), donc la leçon garde cette route et la
// liste de tâches a la sienne — sans quoi la seule UI consommant l'API
// `/candidate/tasks` aurait disparu.
//
// Le bundle de contenu reste `candidate-lecon-jour.*.json` : il porte déjà les
// clés des deux écrans (`tasks`/`sections`/`stats` ici, `lesson`/`quiz` pour la
// leçon), et les scinder dupliquerait quatre fichiers de traduction pour rien.

import Link from 'next/link';
import { Button } from '@/components/shared/Button';
import { useLanguage } from '@/context/LanguageContext';
import { candidateLeconJourContentFor } from '@/lib/candidateLeconJourContent';
import type { TaskAssignment } from '@/lib/candidateTasks';
import { useCandidateTasks, useUpdateCandidateTask } from '@/lib/useCandidateTasks';

const CATEGORY_ICONS: Record<string, string> = { language: 'translate', documents: 'description', culture: 'public', admin: 'assignment', other: 'task_alt' };

function TaskCard({ assignment, overdue = false }: { assignment: TaskAssignment; overdue?: boolean }) {
  const { language } = useLanguage();
  const content = candidateLeconJourContentFor(language);
  const update = useUpdateCandidateTask();
  const task = assignment.task;
  if (!task) return null;

  return (
    <article className={`rounded-xl border bg-surface-container-lowest p-5 shadow-soft ${overdue ? 'border-error/40' : 'border-outline-variant'}`}>
      <div className="flex items-start gap-4">
        <span className={`material-symbols-outlined flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${overdue ? 'bg-error/10 text-error' : 'bg-primary/10 text-primary'}`}>
          {CATEGORY_ICONS[task.category] ?? CATEGORY_ICONS.other}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <h3 className="font-bold text-onSurface">{task.title}</h3>
            <span className="rounded-full bg-surface-container-high px-2.5 py-1 text-xs font-semibold text-onSurface-variant">{content.tasks.minutes.replace('{count}', String(task.estimated_minutes))}</span>
          </div>
          {task.description && <p className="mt-2 text-sm leading-6 text-onSurface-variant">{task.description}</p>}
          {overdue && <p className="mt-2 text-xs font-bold text-error">{content.tasks.overdue}</p>}
          <div className="mt-4 flex justify-end">
            <Button size="sm" onClick={() => update.mutate({ id: assignment.id, input: { status: 'completed', minutes_spent: task.estimated_minutes } })} isLoading={update.isPending} loadingLabel={content.tasks.saving} leadingIcon={<span className="material-symbols-outlined" style={{ fontSize: 18 }}>check</span>}>
              {content.tasks.complete}
            </Button>
          </div>
          {update.isError && <p role="alert" className="mt-2 text-right text-xs text-error">{content.error.update}</p>}
        </div>
      </div>
    </article>
  );
}

export default function LeconJourPage() {
  const { language } = useLanguage();
  const content = candidateLeconJourContentFor(language);
  const tasks = useCandidateTasks();
  const engagement = tasks.data?.engagement;
  const completion = engagement?.completion_rate ?? 0;

  return (
    <div className="min-h-screen bg-surface pb-24">
      <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-outline-variant bg-surface px-4 lg:px-10">
        <Link href="/dashboard" className="p-2 transition-transform active:scale-95" aria-label={content.header.backAria}><span className="material-symbols-outlined text-primary-dark">arrow_back</span></Link>
        <h1 className="flex-1 truncate text-lg font-bold text-primary-dark">{content.header.title}</h1>
        {engagement && <div className="flex items-center gap-1.5 rounded-full bg-gold/10 px-3 py-1.5"><span className="material-symbols-outlined fill text-gold" style={{ fontSize: 18 }}>local_fire_department</span><span className="text-sm font-bold text-gold-dark">{content.streak.label.replace('{count}', String(engagement.streak_days))}</span></div>}
      </header>

      <main className="mx-auto w-full max-w-[720px] space-y-8 px-4 py-6 lg:px-10 lg:py-10">
        {tasks.isLoading && <div className="h-36 animate-pulse rounded-xl bg-surface-container-high" aria-label={content.loading} />}
        {tasks.isError && <section role="alert" className="rounded-xl border border-error/30 bg-error/5 p-6 text-center"><p className="font-bold text-error">{content.error.load}</p><Button variant="outline" className="mt-4" onClick={() => tasks.refetch()}>{content.error.retry}</Button></section>}
        {tasks.data && <>
          <section className="space-y-3 rounded-xl border border-outline-variant bg-surface-container-lowest p-5 shadow-soft">
            <div className="flex items-center justify-between"><span className="text-xs font-bold uppercase tracking-wider text-onSurface-variant">{content.progress.label}</span><span className="text-sm font-bold text-primary-dark">{completion}%</span></div>
            <div className="h-2.5 overflow-hidden rounded-full bg-surface-container-high" role="progressbar" aria-label={content.progress.label} aria-valuenow={completion} aria-valuemin={0} aria-valuemax={100}><div className="h-full rounded-full bg-tertiary transition-all" style={{ width: `${completion}%` }} /></div>
            <div className="grid grid-cols-3 gap-3 pt-2 text-center text-xs"><div><strong className="block text-lg text-primary">{engagement?.completed ?? 0}</strong>{content.stats.completed}</div><div><strong className="block text-lg text-primary">{engagement?.minutes_last_7_days ?? 0}</strong>{content.stats.minutes}</div><div><strong className="block text-lg text-primary">{engagement?.overdue ?? 0}</strong>{content.stats.overdue}</div></div>
          </section>
          {tasks.data.overdue.length > 0 && <section className="space-y-3"><h2 className="text-lg font-bold text-error">{content.sections.overdue}</h2>{tasks.data.overdue.map((item) => <TaskCard key={item.id} assignment={item} overdue />)}</section>}
          <section className="space-y-3"><h2 className="text-lg font-bold text-onSurface">{content.sections.today}</h2>{tasks.data.today.length > 0 ? tasks.data.today.map((item) => <TaskCard key={item.id} assignment={item} />) : <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-8 text-center"><span className="material-symbols-outlined text-4xl text-primary">event_available</span><p className="mt-2 font-bold text-onSurface">{content.empty.title}</p><p className="mt-1 text-sm text-onSurface-variant">{content.empty.body}</p></div>}</section>
          {tasks.data.upcoming.length > 0 && <section className="space-y-3"><h2 className="text-lg font-bold text-onSurface">{content.sections.upcoming}</h2>{tasks.data.upcoming.map((item) => <article key={item.id} className="flex items-center gap-3 rounded-xl border border-outline-variant bg-surface-container-lowest p-4"><span className="material-symbols-outlined text-primary">schedule</span><div className="min-w-0 flex-1"><p className="font-semibold text-onSurface">{item.task?.title}</p><p className="text-xs text-onSurface-variant">{item.assigned_for}</p></div></article>)}</section>}
        </>}
      </main>
    </div>
  );
}
