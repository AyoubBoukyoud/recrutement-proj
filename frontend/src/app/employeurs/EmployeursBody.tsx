'use client';

import { useEmployeursContent } from '@/lib/useLocalizedContent';
import { Reveal, RevealNoScriptFallback } from '@/components/home/Reveal';
import { RoiCalculatorForm } from './RoiCalculatorForm';

const STAT_ICONS = ['timer', 'medical_services', 'trending_down'];
const STAT_ICON_CLASSES = ['text-amud-error', 'text-amud-primary-fixed', 'text-amud-secondary'];
const STANDARD_ICONS = ['gpp_good', 'school'];

/** Corps traduit de `/employeurs` — voir `ProductHome`/`TradeDetail` pour la même raison : la langue n'est connue que du navigateur. */
export function EmployeursBody() {
  const content = useEmployeursContent();

  return (
    <main className="force-light overflow-x-hidden bg-amud-background text-amud-on-background">
      <RevealNoScriptFallback />
      {/* Hero */}
      <section className="mx-auto max-w-container-max px-margin-mobile pb-section-gap pt-20 sm:pt-28 md:px-gutter lg:pt-36">
        <div className="grid items-center gap-12 md:grid-cols-2">
          <div>
            <h1 className="mb-6 text-headline-lg-mobile text-amud-primary md:text-display-lg">{content.hero.title}</h1>
            <p className="mb-8 text-body-lg text-amud-on-surface-variant">{content.hero.body}</p>
            <div className="flex gap-4">
              <a
                href="#roi"
                className="rounded bg-amud-primary-container px-6 py-3 text-label-md font-semibold text-white shadow-sm transition-colors hover:bg-amud-primary"
              >
                {content.hero.ctaRoi}
              </a>
              <a
                href="#standards"
                className="rounded border border-amud-inverse-surface px-6 py-3 text-label-md font-semibold text-amud-inverse-surface transition-colors hover:bg-amud-surface-container-low"
              >
                {content.hero.ctaStandards}
              </a>
            </div>
          </div>
          <div className="relative h-[400px] overflow-hidden rounded-xl border border-amud-primary/10 shadow-sm">
            <img
              alt={content.hero.imageAlt}
              className="absolute inset-0 h-full w-full object-cover"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCD0ddlmdhHojXFTkDT0rDqJP0G3eDihGx90p5l_mEy0HNv0qWzAHHXml0p_4vGSFpZdAvawH1xTQOMjQLBBzDGA7VlzD51Jo6UrXjnZzu6dcCRPxpokHME41cDPWBynEQNckNFWVzxFlH4QX_T3rz2fQ9FOdlIv6ja8veuviAU9eC0t-cntXnUAB9m04c4QfAkQRs-uoH-nglNvd9fcfFkxavKirYXguaCNBnsXmVciu5_E1waW-gw"
            />
          </div>
        </div>
      </section>

      {/* Stats */}
      <section id="statistics" className="relative border-y border-amud-primary/10 bg-amud-surface-container-lowest py-section-gap">
        <div
          className="absolute inset-0 opacity-50"
          style={{
            backgroundImage:
              "url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoNDYsIDQ1LCA5OCwgMC4wNSkiLz48L3N2Zz4=')",
          }}
        />
        <div className="relative z-10 mx-auto max-w-container-max px-margin-mobile md:px-gutter">
          <Reveal className="mb-12 text-center">
            <h2 className="mb-4 text-headline-lg text-amud-primary">{content.cost.title}</h2>
            <p className="mx-auto max-w-2xl text-body-md text-amud-on-surface-variant">{content.cost.body}</p>
          </Reveal>
          <div className="grid gap-6 md:grid-cols-3">
            {content.stats.map((s, idx) =>
              idx === 1 ? (
                <Reveal key={s.label} className="h-full" delay={idx * 80}>
                  <div className="flex h-full flex-col items-center rounded-lg bg-amud-primary p-6 text-center text-amud-on-primary shadow-[0_4px_24px_-8px_rgba(46,45,98,0.15)] md:-translate-y-4">
                    <span className="material-symbols-outlined fill mb-4 text-4xl text-amud-primary-fixed">{STAT_ICONS[idx]}</span>
                    <h3 className="mb-2 text-headline-lg text-amud-on-primary">{s.value}</h3>
                    <p className="text-label-md uppercase tracking-wider text-amud-primary-fixed-dim">{s.label}</p>
                  </div>
                </Reveal>
              ) : (
                <Reveal key={s.label} className="h-full" delay={idx * 80}>
                  <div className="flex h-full flex-col items-center rounded-lg border border-amud-primary/10 bg-amud-surface p-6 text-center shadow-[0_4px_24px_-8px_rgba(46,45,98,0.05)]">
                    <span className={`material-symbols-outlined fill mb-4 text-4xl ${STAT_ICON_CLASSES[idx]}`}>{STAT_ICONS[idx]}</span>
                    <h3 className="mb-2 text-headline-lg text-amud-primary">{s.value}</h3>
                    <p className="text-label-md uppercase tracking-wider text-amud-on-surface-variant">{s.label}</p>
                  </div>
                </Reveal>
              )
            )}
          </div>
        </div>
      </section>

      {/* Compliance & ROI */}
      <section id="standards" className="mx-auto max-w-container-max px-margin-mobile py-section-gap md:px-gutter">
        <div className="grid items-center gap-16 md:grid-cols-2">
          <div>
            <Reveal>
              <h2 className="mb-6 text-headline-lg text-amud-primary">{content.standards.title}</h2>
            </Reveal>
            <div className="space-y-6">
              {content.standards.items.map((s, idx) => (
                <Reveal key={s.title} delay={100 + idx * 100}>
                  <div className="flex gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-amud-surface-container-high">
                      <span className="material-symbols-outlined text-amud-primary">{STANDARD_ICONS[idx]}</span>
                    </div>
                    <div>
                      <h3 className="mb-2 text-headline-md text-amud-primary">{s.title}</h3>
                      <p className="text-body-md text-amud-on-surface-variant">{s.desc}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>

          <Reveal delay={150}>
            <div id="roi" className="rounded-xl border border-amud-primary/10 bg-amud-surface-container-low p-8">
              <h3 className="mb-6 text-center text-headline-md text-amud-primary">{content.roi.title}</h3>
              <RoiCalculatorForm />
            </div>
          </Reveal>
        </div>
      </section>
    </main>
  );
}
