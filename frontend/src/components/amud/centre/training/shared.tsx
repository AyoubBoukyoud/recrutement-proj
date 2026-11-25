'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { EmptyState, ErrorState, LoadingState } from '@/components/amud/ui';
import { timetableError, type TimetableCenter } from '@/lib/amud/services/timetableService';
import { useTimetableScope } from '@/lib/amud/timetable/useTimetable';

export const inputClass = 'min-h-[44px] w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md text-amud-on-surface outline-none focus:ring-2 focus:ring-amud-primary disabled:opacity-60';

export function Field({ label, required, hint, error, children, className = '' }: { label: string; required?: boolean; hint?: string; error?: string; children: ReactNode; className?: string }) {
  return <label className={`block text-label-md text-amud-on-surface-variant ${className}`}>
    <span>{label}{required && <span className="text-amud-error"> *</span>}</span>
    <span className="mt-1 block">{children}</span>
    {hint && !error && <span className="mt-1 block text-label-sm">{hint}</span>}
    {error && <span role="alert" className="mt-1 block text-label-sm text-amud-error">{error}</span>}
  </label>;
}

/** Loads the signed-in account's centres and renders children once one is selected and allowed. */
export function ConnectedCentre({ need, children }: { need?: 'students' | 'finance'; children: (center: TimetableCenter) => ReactNode }) {
  const { centersQuery, center, token, user } = useTimetableScope();
  if (!token) return <Panel><EmptyState icon="lock" title="Connexion requise" description="Connectez-vous avec le compte de votre centre de formation pour accéder à ces données." />
    <p className="pb-6 text-center"><Link href="/auth-phone?intent=training_center" className="font-semibold text-amud-primary underline">Se connecter</Link></p></Panel>;
  if (centersQuery.isLoading) return <LoadingState label="Chargement du centre…" rows={4} />;
  if (centersQuery.isError) return <ErrorState title="Centre indisponible" description={timetableError(centersQuery.error)} onRetry={() => void centersQuery.refetch()} />;
  if (!center) return <Panel><EmptyState icon="school" title="Aucun centre accessible" description="Un administrateur doit rattacher votre compte à un centre de formation." />
    {user?.roles?.includes('Administrator') && <p className="pb-6 text-center"><Link href="/admin/centres" className="font-semibold text-amud-primary underline">Gérer les centres</Link></p>}</Panel>;
  if (need === 'students' && !center.can_view_students) return <Panel><EmptyState icon="lock" title="Accès réservé" description="Votre rôle dans ce centre ne permet pas de consulter les dossiers étudiants." /></Panel>;
  if (need === 'finance' && !center.can_manage_finance) return <Panel><EmptyState icon="lock" title="Accès réservé" description="Les paiements sont réservés à la direction et à la comptabilité du centre." /></Panel>;
  return <>{children(center)}</>;
}

export function Panel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-xl border border-amud-outline-variant bg-amud-surface ${className}`}>{children}</div>;
}

export function CentreHeader({ section, title, subtitle, actions }: { section: string; title: string; subtitle?: string; actions?: ReactNode }) {
  const { center, centers, selectCenter } = useTimetableScope();
  return <div className="flex flex-wrap items-start justify-between gap-3">
    <div className="min-w-0">
      <p className="text-label-sm font-semibold uppercase tracking-widest text-amud-primary">{section} · {center?.name}</p>
      <h1 className="mt-1 text-headline-md font-bold text-amud-on-surface">{title}</h1>
      {subtitle && <p className="mt-1 text-body-md text-amud-on-surface-variant">{subtitle}</p>}
    </div>
    <div className="flex flex-wrap items-center gap-2">
      {centers.length > 1 && <select aria-label="Centre de formation" value={center?.id} onChange={(event) => selectCenter(Number(event.target.value))} className="min-h-[44px] max-w-64 rounded-lg border border-amud-outline-variant bg-amud-surface px-3 text-body-md">{centers.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>}
      {actions}
    </div>
  </div>;
}

export function ReadOnlyHint({ show }: { show: boolean }) {
  if (!show) return null;
  return <p className="rounded-lg bg-amud-surface-container-low p-3 text-body-md text-amud-on-surface-variant">Lecture seule : votre rôle dans ce centre ne permet pas de modifier ces informations.</p>;
}

/** Reads a query parameter once on mount, without forcing the page into a Suspense boundary. */
export function readQueryParam(name: string): string | null {
  if (typeof window === 'undefined') return null;
  return new URLSearchParams(window.location.search).get(name);
}
