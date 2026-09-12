'use client';

import { useHomeContent } from '@/lib/useLocalizedContent';
import { Icon, SectionHeading } from './ui';
import { Reveal } from './Reveal';

/**
 * Aperçu illustratif de la recherche recruteur par critères. Champs non
 * interactifs à dessein — un mockup, pas un formulaire : la vraie recherche
 * vit dans l'espace recruteur authentifié.
 */
export function CriteriaSection() {
  const { criteria } = useHomeContent();
  const { form } = criteria;

  return (
    <section className="bg-home-surface py-20 lg:py-28">
      <div className="mx-auto grid max-w-[1280px] items-center gap-12 px-6 lg:grid-cols-2 lg:gap-16 lg:px-12">
        <Reveal>
          <SectionHeading eyebrow={criteria.eyebrow} title={criteria.title} subtitle={criteria.subtitle} />
        </Reveal>

        <Reveal delay={100}>
          <div className="rounded-3xl border border-home-line bg-home-sand p-6 shadow-[0_20px_50px_rgba(16,35,58,0.08)] sm:p-8">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-home-line bg-home-surface px-4 py-3">
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-home-slate">{form.tradeLabel}</p>
                <p className="mt-1 flex items-center gap-2 text-sm font-semibold text-home-ink">
                  <Icon name="work" className="text-base text-home-coral" />
                  {form.tradePlaceholder}
                </p>
              </div>
              <div className="rounded-xl border border-home-line bg-home-surface px-4 py-3">
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-home-slate">{form.cityLabel}</p>
                <p className="mt-1 flex items-center gap-2 text-sm font-semibold text-home-ink">
                  <Icon name="location_on" className="text-base text-home-coral" />
                  {form.cityPlaceholder}
                </p>
              </div>
            </div>

            <div className="mt-3 flex items-center gap-2 rounded-xl bg-home-strong px-5 py-3.5 text-sm font-bold text-white">
              <Icon name="search" className="text-lg" />
              {form.submit}
            </div>

            <div className="mt-6 border-t border-home-line pt-6">
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-home-slate">{form.skillsLabel}</p>
              <ul className="mt-3 flex flex-wrap gap-2">
                {form.skills.map((skill) => (
                  <li
                    key={skill}
                    className="rounded-full border border-home-line bg-home-surface px-3 py-1.5 text-xs font-bold text-home-ink"
                  >
                    {skill}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
