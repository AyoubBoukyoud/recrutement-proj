'use client';

import { useHomeContent } from '@/lib/useLocalizedContent';
import { PrimaryCta } from './Cta';
import { Reveal } from './Reveal';

function Icon({ name, className = '' }: { name: string; className?: string }) {
  return <span className={`material-symbols-outlined ${className}`}>{name}</span>;
}

/**
 * Présente l'écosystème « centre de formation » sans exposer tout le module
 * interne (plan §18) : quatre capacités, un aperçu stylisé du tableau de
 * bord, un seul CTA. La route de ce CTA n'a pas encore de parcours
 * d'inscription dédié pour les centres — elle réutilise le flux recruteur
 * (`/auth-phone?intent=recruiter`) en attendant qu'un parcours propre existe,
 * plutôt que de pointer vers une page qui n'existe pas.
 */
export function TrainingCenterSection() {
  const { trainingCenter } = useHomeContent();

  return (
    <section id="centres" className="scroll-mt-20 border-y border-outline-variant/50 bg-surface-container/40 py-20 lg:py-28">
      <div className="mx-auto grid max-w-[1280px] items-center gap-12 px-6 lg:grid-cols-2 lg:gap-16 lg:px-12">
        <Reveal>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">{trainingCenter.eyebrow}</p>
          <h2 className="mt-3 text-3xl font-bold leading-tight tracking-tight text-primary-dark sm:text-4xl">
            {trainingCenter.title}
          </h2>
          <p className="mt-4 text-base leading-relaxed text-onSurface-variant sm:text-lg">
            {trainingCenter.subtitle}
          </p>

          <div className="mt-8">
            <PrimaryCta href="/auth-phone?intent=recruiter" size="lg">
              {trainingCenter.cta}
            </PrimaryCta>
          </div>
        </Reveal>

        <Reveal delay={120}>
          <div className="rounded-3xl border border-outline-variant/60 bg-surface-lowest p-5 shadow-soft sm:p-6">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wider text-outline">{trainingCenter.eyebrow}</p>
              <Icon name="dashboard" className="text-primary" />
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3" role="img" aria-label={trainingCenter.imageAlt}>
              {trainingCenter.capabilities.map((capability) => (
                <div
                  key={capability.label}
                  className="flex flex-col items-start gap-2 rounded-xl border border-outline-variant/50 bg-surface-container/50 p-4"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon name={capability.icon} className="text-lg" />
                  </span>
                  <p className="text-sm font-bold text-primary-dark">{capability.label}</p>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
