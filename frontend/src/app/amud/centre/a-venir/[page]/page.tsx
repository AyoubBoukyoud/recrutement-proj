import Link from 'next/link';
import { notFound } from 'next/navigation';
import { UPCOMING_CENTRE_PAGES } from '@/lib/amud/timetable/paths';

export const dynamicParams = false;

export function generateStaticParams() {
  return UPCOMING_CENTRE_PAGES.map(({ slug }) => ({ page: slug }));
}

const AVAILABLE = [
  { href: '/amud/centre/etudiants', icon: 'group', label: 'Étudiants' },
  { href: '/amud/centre/planning', icon: 'calendar_month', label: 'Planning' },
  { href: '/amud/centre/paiements-etudiants', icon: 'payments', label: 'Paiements étudiants' },
];

/** Shown instead of a prototype module: no fictional data reaches real centre accounts. */
export default async function UpcomingCentrePage({ params }: { params: Promise<{ page: string }> }) {
  const { page: slug } = await params;
  const page = UPCOMING_CENTRE_PAGES.find((item) => item.slug === slug);
  if (!page) notFound();
  return <div className="mx-auto max-w-2xl py-8">
    <div className="rounded-2xl border border-amud-outline-variant bg-amud-surface p-8 text-center shadow-sm">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amud-primary/10 text-amud-primary">
        <span className="material-symbols-outlined text-[28px]" aria-hidden="true">schedule</span>
      </span>
      <p className="mt-4 text-label-sm font-semibold uppercase tracking-widest text-amud-primary">Bientôt disponible</p>
      <h1 className="mt-1 text-headline-md font-bold text-amud-on-surface">{page.title}</h1>
      <p className="mt-2 text-body-md text-amud-on-surface-variant">{page.description}</p>
      <p className="mt-4 text-body-md text-amud-on-surface-variant">Ce module est en cours de préparation et sera relié aux données réelles de votre centre. En attendant, aucune information n’y est affichée.</p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        {AVAILABLE.map((item) => <Link key={item.href} href={item.href} className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-amud-outline-variant px-4 text-label-md font-medium text-amud-on-surface transition-colors hover:bg-amud-surface-container-low">
          <span className="material-symbols-outlined text-[18px] text-amud-primary" aria-hidden="true">{item.icon}</span>{item.label}
        </Link>)}
      </div>
    </div>
  </div>;
}
