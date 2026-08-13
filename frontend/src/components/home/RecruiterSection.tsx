'use client';

import { useHomeContent } from '@/lib/useLocalizedContent';
import { GhostCta, PrimaryCta } from './Cta';

/**
 * La page appartient au candidat ; le recruteur a droit à une porte nette.
 *
 * Le fond sombre n'est pas décoratif : le changement d'interlocuteur doit être
 * perceptible avant d'être lu, sinon un candidat croit que ce bloc s'adresse
 * encore à lui et s'y perd.
 *
 * Les trois arguments sont exactement ce que l'espace recruteur fait
 * aujourd'hui — recherche multicritère, dossier complet, pipeline et export.
 */
export function RecruiterSection() {
  const { recruiter } = useHomeContent();
  return (
    <section id="recruteurs" className="scroll-mt-24 bg-primary-dark py-16 text-surface-lowest lg:py-24">
      <div className="mx-auto grid w-full max-w-[1280px] gap-10 px-6 lg:grid-cols-12 lg:px-12">
        <div className="lg:col-span-5">
          <span className="inline-flex items-center gap-2 rounded-full border border-surface-lowest/25 px-3 py-1 text-xs font-bold uppercase tracking-wider text-on-primary-container">
            {recruiter.eyebrow}
          </span>
          <h2 className="mt-5 text-[clamp(1.75rem,3vw,2.5rem)] font-extrabold leading-tight">{recruiter.title}</h2>
          <p className="mt-4 max-w-[52ch] text-[1.0625rem] leading-relaxed text-surface-lowest/80">
            {recruiter.subtitle}
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <PrimaryCta href="/auth-phone" onDark>
              {recruiter.cta}
            </PrimaryCta>
            <GhostCta href="#questions" onDark>
              {recruiter.secondaryCta}
            </GhostCta>
          </div>
        </div>

        <ul className="grid gap-4 lg:col-span-7">
          {recruiter.points.map((point) => (
            <li key={point.title} className="rounded-2xl border border-surface-lowest/15 bg-surface-lowest/5 p-6">
              <h3 className="flex items-center gap-2 text-base font-bold">
                <span className="material-symbols-outlined text-on-primary-container" style={{ fontSize: 20 }} aria-hidden="true">
                  {point.icon}
                </span>
                {point.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-surface-lowest/75">{point.body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
