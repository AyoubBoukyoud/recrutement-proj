'use client';

// Interface 23 — Suivi administratif post-recrutement pour un candidat (paramètre `candidat`).

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Timeline } from '@/components/shared/Timeline';
import { QRCodeGenerator } from '@/components/shared/QRCodeGenerator';
import { CandidateCard } from '@/components/shared/CandidateCard';
import { useLanguage } from '@/context/LanguageContext';
import { MOCK_CANDIDATES, MOCK_TIMELINE } from '@/lib/mockData';

function SuiviContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const candidatId = searchParams.get('candidat');
  const candidate = MOCK_CANDIDATES.find((c) => c.id === candidatId);
  const { t } = useLanguage();

  if (!candidate) {
    return (
      <div className="mx-auto max-w-3xl p-6 md:p-8">
        <h1 className="text-2xl font-bold text-primary">{t('employer:suivi.title')}</h1>
        <p className="mt-1 text-sm text-onSurface-variant">{t('employer:suivi.selectValidated')}</p>
        <div className="mt-6 grid gap-3 md:grid-cols-2">
          {MOCK_CANDIDATES.filter((c) => c.status === 'valide' || c.status === 'entretien').map((c) => (
            <button key={c.id} type="button" onClick={() => router.push(`/employer/suivi?candidat=${c.id}`)} className="text-left">
              <CandidateCard candidate={c} />
            </button>
          ))}
        </div>
      </div>
    );
  }

  const completed = MOCK_TIMELINE.filter((s) => s.status === 'termine').length;
  const percent = Math.round((completed / MOCK_TIMELINE.length) * 100);
  const currentStep = MOCK_TIMELINE.find((s) => s.status === 'en_cours');

  return (
    <div className="min-h-screen bg-surface pb-16">
      <header className="flex h-16 items-center gap-4 border-b border-outline-variant bg-surface px-6 md:px-8">
        <button
          type="button"
          onClick={() => router.push('/employer/suivi')}
          className="flex items-center gap-1 rounded-full p-2 text-primary transition-colors hover:bg-surface-container"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 22 }}>arrow_back</span>
        </button>
        <h1 className="text-lg font-bold text-primary">{t('employer:suivi.title')}</h1>
      </header>

      <main className="mx-auto max-w-[1200px] space-y-6 p-6 md:p-8">
        <div className="flex items-center justify-between rounded-xl border border-outline-variant bg-surface-lowest p-4 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-light text-sm font-bold text-primary">
              {candidate.avatarInitials}
            </div>
            <div>
              <p className="text-xs font-semibold text-onSurface-variant">{t('employer:suivi.selectedCandidate')}</p>
              <h2 className="text-lg font-bold text-onSurface">{candidate.name}</h2>
            </div>
          </div>
          <button
            type="button"
            onClick={() => router.push('/employer/suivi')}
            className="flex items-center gap-1.5 rounded-lg bg-surface-container px-4 py-2 text-sm font-semibold transition-colors hover:bg-surface-high"
          >
            {t('employer:suivi.change')}
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>expand_more</span>
          </button>
        </div>

        <div className="relative overflow-hidden rounded-xl bg-primary p-6 text-onPrimary shadow-sm">
          <div className="mb-4 flex items-end justify-between">
            <h3 className="text-xl font-bold">{t('employer:suivi.globalProgress')}</h3>
            <span className="rounded bg-white/20 px-2.5 py-1 text-xs font-semibold">
              <span dir="ltr">{completed}/{MOCK_TIMELINE.length}</span> {t('employer:suivi.stepsLabel')}
            </span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-white/20">
            <div className="h-full rounded-full bg-primary-light transition-all duration-1000 ease-out" style={{ width: `${percent}%` }} />
          </div>
          <p className="mt-3 text-sm text-primary-light"><span dir="ltr">{percent}%</span> {t('employer:suivi.completeSuffix')}</p>
        </div>

        {currentStep && (
          <section className="space-y-3">
            <h4 className="flex items-center gap-2 text-lg font-bold text-onSurface">
              <span className="material-symbols-outlined text-secondary" style={{ fontSize: 20 }}>notifications</span>
              {t('employer:suivi.currentStep')}
            </h4>
            <div className="flex gap-4 rounded-lg border-l-4 border-primary bg-surface-high p-4">
              <span className="material-symbols-outlined shrink-0 text-primary" style={{ fontSize: 20 }}>calendar_month</span>
              <div>
                <p className="text-sm font-bold text-onSurface">{currentStep.label}</p>
                <p className="text-sm text-onSurface">{currentStep.description}</p>
              </div>
            </div>
          </section>
        )}

        <div className="grid gap-6 md:grid-cols-[1fr_auto]">
          <section className="space-y-3">
            <h4 className="text-lg font-bold text-onSurface">{t('employer:suivi.processSteps')}</h4>
            <div className="rounded-xl border border-outline-variant bg-surface-lowest p-5 shadow-sm">
              <Timeline steps={MOCK_TIMELINE} />
            </div>
          </section>
          <section className="flex flex-col items-center gap-3 rounded-xl border border-outline-variant bg-surface-lowest p-5 shadow-sm">
            <span className="text-xs font-semibold text-onSurface-variant">{t('employer:suivi.fileReference')}</span>
            <QRCodeGenerator value={`AMUD-SKILLS-${candidate.id}`} size={140} />
          </section>
        </div>
      </main>
    </div>
  );
}

export default function SuiviPage() {
  return (
    <Suspense fallback={null}>
      <SuiviContent />
    </Suspense>
  );
}
