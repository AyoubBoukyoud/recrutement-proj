'use client';

import Link from 'next/link';
import { useEmployeursContent } from '@/lib/useLocalizedContent';
import { Reveal, RevealNoScriptFallback } from '@/components/home/Reveal';

function Icon({ name }: { name: string }) {
  return <span className="material-symbols-outlined text-2xl" aria-hidden="true">{name}</span>;
}

/** Public employer overview. Every action leads to an implemented route. */
export function EmployeursBody() {
  const content = useEmployeursContent();

  return (
    <main id="main-content" tabIndex={-1} className="force-light overflow-x-hidden bg-surface text-onSurface outline-none">
      <RevealNoScriptFallback />

      <section className="relative overflow-hidden pb-20 pt-32 lg:pb-28 lg:pt-44">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(27,94,55,0.14),transparent_48%)]" />
        <div className="relative mx-auto grid max-w-[1280px] items-center gap-12 px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-12">
          <div>
            <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-primary">{content.hero.eyebrow}</p>
            <h1 className="mt-5 max-w-3xl text-4xl font-black leading-tight text-primary-dark sm:text-5xl lg:text-6xl">{content.hero.title}</h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-onSurface-variant">{content.hero.body}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/auth-phone?intent=recruiter" className="inline-flex min-h-12 items-center justify-center rounded-xl bg-primary px-6 py-3 font-bold text-onPrimary transition-colors hover:bg-primary-dark">
                {content.hero.primaryCta}
              </Link>
              <a href="#workflow" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-outline-variant bg-surface-lowest px-6 py-3 font-bold text-primary-dark transition-colors hover:border-primary">
                {content.hero.secondaryCta}
              </a>
            </div>
            <p className="mt-4 text-sm text-outline">{content.hero.note}</p>
          </div>

          <div className="rounded-3xl border border-outline-variant bg-surface-lowest p-6 shadow-floating sm:p-8">
            <div className="flex items-center gap-4 border-b border-outline-variant pb-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Icon name="business_center" /></div>
              <div><p className="text-xs font-bold uppercase tracking-wider text-outline">{content.preview.eyebrow}</p><h2 className="mt-1 text-xl font-black text-primary-dark">{content.preview.title}</h2></div>
            </div>
            <div className="mt-6 space-y-3">
              {content.preview.items.map((item) => (
                <div key={item.label} className="flex items-start gap-3 rounded-2xl bg-surface-container p-4">
                  <Icon name={item.icon} />
                  <div><p className="font-black text-primary-dark">{item.label}</p><p className="mt-1 text-sm leading-relaxed text-onSurface-variant">{item.body}</p></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="workflow" className="border-y border-outline-variant bg-surface-container/60 py-20 lg:py-24">
        <div className="mx-auto max-w-[1280px] px-6 lg:px-12">
          <Reveal className="max-w-3xl"><h2 className="text-3xl font-black text-primary-dark sm:text-4xl">{content.workflow.title}</h2><p className="mt-4 text-lg text-onSurface-variant">{content.workflow.subtitle}</p></Reveal>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {content.workflow.items.map((item, index) => (
              <Reveal key={item.title} delay={index * 70}>
                <article className="h-full rounded-2xl border border-outline-variant bg-surface-lowest p-6 shadow-soft">
                  <div className="mb-5 flex items-center justify-between"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon name={item.icon} /></span><span className="text-sm font-black text-outline">0{index + 1}</span></div>
                  <h3 className="text-lg font-black text-primary-dark">{item.title}</h3><p className="mt-3 text-sm leading-relaxed text-onSurface-variant">{item.body}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section id="safeguards" className="mx-auto grid max-w-[1280px] gap-12 px-6 py-20 lg:grid-cols-[0.8fr_1.2fr] lg:px-12 lg:py-28">
        <Reveal><p className="text-sm font-extrabold uppercase tracking-[0.18em] text-primary">{content.safeguards.eyebrow}</p><h2 className="mt-4 text-3xl font-black text-primary-dark sm:text-4xl">{content.safeguards.title}</h2><p className="mt-5 leading-relaxed text-onSurface-variant">{content.safeguards.subtitle}</p></Reveal>
        <div className="grid gap-4 sm:grid-cols-2">
          {content.safeguards.items.map((item, index) => (
            <Reveal key={item.title} delay={index * 60}>
              <article className="h-full rounded-2xl border border-outline-variant p-5"><span className="text-primary"><Icon name={item.icon} /></span><h3 className="mt-4 font-black text-primary-dark">{item.title}</h3><p className="mt-2 text-sm leading-relaxed text-onSurface-variant">{item.body}</p></article>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="bg-primary-dark px-6 py-20 text-center text-surface-lowest">
        <Reveal><h2 className="text-3xl font-black sm:text-4xl">{content.finalCta.title}</h2><p className="mx-auto mt-4 max-w-2xl text-surface-container-high">{content.finalCta.body}</p><Link href="/auth-phone?intent=recruiter" className="mt-8 inline-flex min-h-12 items-center justify-center rounded-xl bg-primary-light px-6 py-3 font-bold text-primary-dark transition-opacity hover:opacity-90">{content.finalCta.cta}</Link><p className="mt-4 text-sm text-surface-container-high">{content.finalCta.note}</p></Reveal>
      </section>
    </main>
  );
}
