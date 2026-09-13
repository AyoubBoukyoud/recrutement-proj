'use client';

import { useHomeContent } from '@/lib/useLocalizedContent';
import { CoralButton, Icon, SectionHeading } from './ui';
import { Reveal } from './Reveal';

/**
 * Présente l'écosystème « centre de formation » sans exposer tout le module
 * interne (`/amud/centre/*`, qui a sa propre charte). Le tableau de bord est
 * un aperçu stylisé — construit en HTML/CSS, pas une vraie capture d'écran.
 */
export function TrainingCenterSection() {
  const { trainingCenter } = useHomeContent();

  return (
    <section id="centres" className="scroll-mt-20 bg-home-lavender py-20 lg:py-28">
      <div className="mx-auto grid max-w-[1280px] items-center gap-12 px-6 lg:grid-cols-2 lg:gap-16 lg:px-12">
        <Reveal>
          <SectionHeading eyebrow={trainingCenter.eyebrow} title={trainingCenter.title} subtitle={trainingCenter.subtitle} />
          <div className="mt-8">
            <CoralButton href="/auth-phone?intent=recruiter" size="lg">
              {trainingCenter.cta}
            </CoralButton>
          </div>
        </Reveal>

        <Reveal delay={120}>
          <div className="rounded-3xl border border-home-line bg-home-surface/70 p-5 shadow-[0_20px_50px_rgba(91,87,166,0.14)] sm:p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-home-ink">{trainingCenter.dashboardTitle}</p>
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-home-violet/10 text-home-violet">
                <Icon name="dashboard" className="text-lg" />
              </span>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              {trainingCenter.capabilities.map((capability) => (
                <div key={capability.label} className="rounded-xl border border-home-line bg-home-surface p-4">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-home-violet/10 text-home-violet">
                    <Icon name={capability.icon} className="text-lg" />
                  </span>
                  <p className="mt-3 text-sm font-bold text-home-ink">{capability.label}</p>
                  <p className="mt-1 text-xs leading-relaxed text-home-slate">{capability.body}</p>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
