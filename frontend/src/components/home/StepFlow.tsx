'use client';

import { useHomeContent } from '@/lib/useLocalizedContent';

/**
 * « Comment ça marche » — l'état où le visiteur veut savoir ce qu'on attend de
 * lui. Quatre étapes, numérotées, finies : le parcours doit se voir se terminer.
 *
 * L'étape 2 (le CV lu automatiquement) est nommée explicitement plutôt que
 * noyée dans une liste de bénéfices : c'est le seul argument que la
 * concurrence ne peut pas recopier en une phrase.
 */
export function StepFlow() {
  const { steps } = useHomeContent();
  return (
    <section id="comment-ca-marche" className="scroll-mt-24 bg-surface-container/50 py-16 lg:py-24">
      <div className="mx-auto w-full max-w-[1280px] px-6 lg:px-12">
        <h2 className="max-w-[20ch] text-[clamp(1.75rem,3vw,2.5rem)] font-extrabold leading-tight text-onSurface">
          {steps.title}
        </h2>
        <p className="mt-3 max-w-[68ch] text-[1.0625rem] leading-relaxed text-onSurface-variant">{steps.subtitle}</p>

        <ol className="mt-10 grid gap-6 lg:grid-cols-4">
          {steps.items.map((step, index) => (
            <li key={step.title} className="relative">
              {/* Trait de liaison : il n'existe qu'entre deux étapes, donc jamais
                  après la dernière. */}
              {index < steps.items.length - 1 && (
                <span
                  aria-hidden="true"
                  className="absolute start-[22px] top-12 h-[calc(100%-1rem)] w-px bg-outline-variant lg:start-12 lg:top-[22px] lg:h-px lg:w-[calc(100%-3rem)]"
                />
              )}

              <div className="flex gap-4 lg:flex-col">
                <span className="relative z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-base font-extrabold text-on-primary">
                  {index + 1}
                </span>

                <div>
                  <h3 className="flex items-center gap-2 text-base font-bold text-onSurface">
                    <span className="material-symbols-outlined text-primary" style={{ fontSize: 20 }} aria-hidden="true">
                      {step.icon}
                    </span>
                    {step.title}
                  </h3>
                  <p className="mt-2 max-w-[42ch] text-sm leading-relaxed text-onSurface-variant">{step.body}</p>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
