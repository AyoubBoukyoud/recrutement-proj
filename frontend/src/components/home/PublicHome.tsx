'use client';

import Link from 'next/link';
import { useHomeContent, useTrades } from '@/lib/useLocalizedContent';
import { GhostCta, PrimaryCta } from './Cta';
import { Reveal, RevealNoScriptFallback } from './Reveal';

function Icon({ name, className = '' }: { name: string; className?: string }) {
  return <span className={`material-symbols-outlined ${className}`}>{name}</span>;
}

/** Canonical public home, composed from the factual localized content. */
export function PublicHome() {
  const content = useHomeContent();
  const { popular } = useTrades();

  return (
    <main className="force-light overflow-x-hidden bg-surface text-onSurface">
      <RevealNoScriptFallback />

      <section className="relative overflow-hidden pb-20 pt-28 sm:pt-36 lg:pb-28 lg:pt-44">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(27,94,55,0.13),transparent_46%)]" />
        <div className="relative mx-auto grid max-w-[1280px] items-center gap-12 px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-12">
          <div>
            <p className="mb-5 text-sm font-extrabold uppercase tracking-[0.18em] text-primary">{content.hero.eyebrow}</p>
            <h1 className="max-w-3xl text-4xl font-black leading-tight text-primary-dark sm:text-5xl lg:text-6xl">
              {content.hero.headline[0]} <span className="text-primary">{content.hero.headline[1]}</span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-onSurface-variant">{content.hero.subheadline}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <PrimaryCta href="/auth-phone" size="lg">{content.hero.cta}</PrimaryCta>
              <GhostCta href="/employeurs" size="lg">{content.recruiter.eyebrow}</GhostCta>
            </div>
            <p className="mt-4 text-sm font-semibold text-outline">{content.hero.microcopy}</p>
          </div>

          <div className="rounded-3xl border border-outline-variant bg-surface-lowest p-6 shadow-floating sm:p-8">
            <div className="flex items-center justify-between border-b border-outline-variant pb-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-outline">{content.hero.card.title}</p>
                <h2 className="mt-1 text-2xl font-black text-primary-dark">{content.hero.card.name}</h2>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Icon name="folder_supervised" className="text-2xl" /></div>
            </div>
            <dl className="mt-6 grid grid-cols-2 gap-4">
              <div className="rounded-2xl bg-surface-container p-4"><dt className="text-xs text-outline">{content.hero.card.levelLabel}</dt><dd className="mt-1 text-lg font-black text-primary">{content.hero.card.level}</dd></div>
              <div className="rounded-2xl bg-surface-container p-4"><dt className="text-xs text-outline">{content.hero.card.availabilityLabel}</dt><dd className="mt-1 text-sm font-black text-primary">{content.hero.card.availability}</dd></div>
            </dl>
            <div className="mt-5 flex flex-wrap gap-2">
              {content.hero.card.documents.map((document) => <span key={document} className="rounded-full border border-outline-variant px-3 py-1.5 text-xs font-bold text-onSurface-variant">{document}</span>)}
            </div>
            <p className="mt-5 text-xs text-outline">{content.hero.card.footnote}</p>
          </div>
        </div>
      </section>

      <section aria-label={content.trust.items.map((item) => item.label).join(', ')} className="border-y border-outline-variant bg-surface-container/70">
        <div className="mx-auto grid max-w-[1280px] gap-4 px-6 py-6 sm:grid-cols-3 lg:px-12">
          {content.trust.items.map((item) => <div key={item.label} className="flex items-center gap-3 text-sm font-bold text-onSurface-variant"><Icon name={item.icon} className="text-primary" />{item.label}</div>)}
        </div>
      </section>

      <section id="methodology" className="mx-auto max-w-[1280px] px-6 py-20 lg:px-12 lg:py-28">
        <Reveal className="max-w-2xl"><h2 className="text-3xl font-black text-primary-dark sm:text-4xl">{content.steps.title}</h2><p className="mt-4 text-lg text-onSurface-variant">{content.steps.subtitle}</p></Reveal>
        <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {content.steps.items.map((step, index) => (
            <Reveal key={step.title} delay={index * 70}><article className="h-full rounded-2xl border border-outline-variant bg-surface-lowest p-6 shadow-soft"><div className="mb-5 flex items-center justify-between"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon name={step.icon} /></div><span className="text-sm font-black text-outline">0{index + 1}</span></div><h3 className="text-lg font-black text-primary-dark">{step.title}</h3><p className="mt-3 text-sm leading-relaxed text-onSurface-variant">{step.body}</p></article></Reveal>
          ))}
        </div>
      </section>

      <section className="bg-primary-dark py-20 text-surface-lowest lg:py-24">
        <div className="mx-auto grid max-w-[1280px] gap-12 px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-12">
          <Reveal><p className="text-sm font-extrabold uppercase tracking-[0.18em] text-primary-light">{content.recruiter.eyebrow}</p><h2 className="mt-4 text-3xl font-black sm:text-4xl">{content.recruiter.title}</h2><p className="mt-5 leading-relaxed text-surface-container-high">{content.recruiter.subtitle}</p><div className="mt-7 flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row"><PrimaryCta href="/auth-phone?intent=recruiter" onDark>{content.recruiter.cta}</PrimaryCta><GhostCta href="/employeurs" onDark>{content.recruiter.secondaryCta}</GhostCta></div></Reveal>
          <div className="grid gap-4 md:grid-cols-3">
            {content.recruiter.points.map((point, index) => <Reveal key={point.title} delay={index * 80}><article className="h-full rounded-2xl border border-surface-lowest/15 bg-surface-lowest/5 p-5"><Icon name={point.icon} className="text-3xl text-primary-light" /><h3 className="mt-5 font-black">{point.title}</h3><p className="mt-3 text-sm leading-relaxed text-surface-container-high">{point.body}</p></article></Reveal>)}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1280px] px-6 py-20 lg:px-12 lg:py-28">
        <Reveal className="mx-auto max-w-3xl text-center"><h2 className="text-3xl font-black text-primary-dark sm:text-4xl">{content.credible.title}</h2><p className="mt-4 text-lg text-onSurface-variant">{content.credible.subtitle}</p></Reveal>
        <div className="mt-12 grid gap-5 md:grid-cols-2">
          {content.credible.items.map((item, index) => <Reveal key={item.title} delay={index * 60}><article className="flex h-full gap-4 rounded-2xl border border-outline-variant bg-surface-lowest p-6"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon name={item.icon} /></div><div><h3 className="font-black text-primary-dark">{item.title}</h3><p className="mt-2 text-sm leading-relaxed text-onSurface-variant">{item.body}</p></div></article></Reveal>)}
        </div>
      </section>

      <section id="sectors" className="bg-surface-container/60 py-20 lg:py-24">
        <div className="mx-auto max-w-[1280px] px-6 lg:px-12">
          <Reveal className="max-w-3xl"><h2 className="text-3xl font-black text-primary-dark sm:text-4xl">{content.trades.title}</h2><p className="mt-4 text-lg text-onSurface-variant">{content.trades.subtitle}</p></Reveal>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {popular.map((trade, index) => (
              <Reveal key={trade.slug} delay={index * 50}><Link href={`/metiers/${trade.slug}`} className="group flex h-full items-start gap-4 rounded-2xl border border-outline-variant bg-surface-lowest p-5 shadow-soft transition-colors hover:border-primary"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon name={trade.icon} /></div><div className="min-w-0"><h3 className="font-black text-primary-dark group-hover:text-primary">{trade.label}</h3><p className="mt-1 text-xs font-bold uppercase tracking-wide text-outline">{trade.sector}</p><p className="mt-3 text-sm text-onSurface-variant">{content.trades.levelPrefix} {trade.germanLevel}</p><span className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-primary">{content.trades.cardCta}<Icon name="arrow_forward" className="text-base" /></span></div></Link></Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1280px] px-6 py-20 lg:px-12 lg:py-28">
        <Reveal className="max-w-3xl"><h2 className="text-3xl font-black text-primary-dark sm:text-4xl">{content.proof.title}</h2><p className="mt-4 text-lg text-onSurface-variant">{content.proof.subtitle}</p></Reveal>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {content.proof.items.map((item, index) => <Reveal key={item.title} delay={index * 70}><article className="h-full rounded-2xl border border-outline-variant p-6"><Icon name={item.icon} className="text-3xl text-primary" /><h3 className="mt-5 font-black text-primary-dark">{item.title}</h3><p className="mt-3 text-sm leading-relaxed text-onSurface-variant">{item.body}</p></article></Reveal>)}
        </div>
      </section>

      <section className="border-y border-outline-variant bg-surface-lowest py-20">
        <div className="mx-auto max-w-4xl px-6">
          <Reveal className="text-center"><h2 className="text-3xl font-black text-primary-dark sm:text-4xl">{content.faq.title}</h2><p className="mt-4 text-onSurface-variant">{content.faq.subtitle}</p></Reveal>
          <div className="mt-10 divide-y divide-outline-variant rounded-2xl border border-outline-variant px-5 sm:px-7">
            {content.faq.items.map((item) => <details key={item.question} className="group py-5"><summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-black text-primary-dark">{item.question}<Icon name="expand_more" className="transition-transform group-open:rotate-180" /></summary><p className="mt-3 max-w-3xl text-sm leading-relaxed text-onSurface-variant">{item.answer}</p></details>)}
          </div>
        </div>
      </section>

      <section className="px-6 py-20 text-center lg:py-24">
        <Reveal><h2 className="text-3xl font-black text-primary-dark sm:text-4xl">{content.finalCta.title}</h2><p className="mx-auto mt-4 max-w-2xl text-lg text-onSurface-variant">{content.finalCta.subtitle}</p><PrimaryCta href="/auth-phone" size="lg" className="mt-8">{content.finalCta.cta}</PrimaryCta><p className="mt-4 text-sm text-outline">{content.finalCta.microcopy}</p></Reveal>
      </section>
    </main>
  );
}
