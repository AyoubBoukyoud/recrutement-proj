'use client';

import Link from 'next/link';
import { useEmployeursContent } from '@/lib/useLocalizedContent';
import { Reveal, RevealNoScriptFallback } from '@/components/home/Reveal';
import { PrimaryCta, GhostCta } from '@/components/home/Cta';

function Icon({ name }: { name: string }) {
  return <span className="material-symbols-outlined text-2xl" aria-hidden="true">{name}</span>;
}

/** Public employer overview. Every action leads to an implemented route. */
export function EmployeursBody() {
  const content = useEmployeursContent();

  return (
    <main className="overflow-x-hidden bg-surface text-onSurface dark:bg-[#12100e] dark:text-[#e5e2e1] transition-colors">
      <RevealNoScriptFallback />

      <section className="relative overflow-hidden pb-20 pt-32 lg:pb-28 lg:pt-44">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.15),transparent_48%)]" />
        <div className="relative mx-auto grid max-w-[1280px] items-center gap-12 px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-12">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 dark:bg-emerald-500/15 px-4 py-1.5 text-xs font-black uppercase tracking-[0.18em] text-emerald-800 dark:text-emerald-300 shadow-xs">
              {content.hero.eyebrow}
            </span>
            <h1 className="mt-5 max-w-3xl text-4xl font-black leading-tight text-emerald-950 dark:text-white sm:text-5xl lg:text-6xl">{content.hero.title}</h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-onSurface-variant dark:text-zinc-300">{content.hero.body}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <PrimaryCta href="/auth-phone?intent=recruiter" size="lg">
                {content.hero.primaryCta}
              </PrimaryCta>
              <GhostCta href="#workflow" size="lg">
                {content.hero.secondaryCta}
              </GhostCta>
            </div>
            <p className="mt-4 text-sm font-semibold text-outline dark:text-zinc-400">{content.hero.note}</p>
          </div>

          <div className="rounded-3xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#1c1815] p-6 shadow-floating sm:p-8">
            <div className="flex items-center gap-4 border-b border-slate-200/60 dark:border-white/10 pb-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"><Icon name="business_center" /></div>
              <div><p className="text-xs font-bold uppercase tracking-wider text-outline dark:text-zinc-400">{content.preview.eyebrow}</p><h2 className="mt-1 text-xl font-black text-emerald-950 dark:text-white">{content.preview.title}</h2></div>
            </div>
            <div className="mt-6 space-y-3">
              {content.preview.items.map((item) => (
                <div key={item.label} className="flex items-start gap-3 rounded-2xl border border-slate-200/60 dark:border-white/10 bg-slate-50 dark:bg-[#25201c] p-4">
                  <span className="text-emerald-700 dark:text-emerald-400"><Icon name={item.icon} /></span>
                  <div><p className="font-black text-emerald-950 dark:text-white">{item.label}</p><p className="mt-1 text-sm leading-relaxed text-onSurface-variant dark:text-zinc-300">{item.body}</p></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="workflow" className="border-y border-slate-200/80 dark:border-white/10 bg-slate-50/70 dark:bg-[#151210] py-20 lg:py-24">
        <div className="mx-auto max-w-[1280px] px-6 lg:px-12">
          <Reveal className="max-w-3xl"><h2 className="text-3xl font-black text-emerald-950 dark:text-white sm:text-4xl">{content.workflow.title}</h2><p className="mt-4 text-lg text-onSurface-variant dark:text-zinc-300">{content.workflow.subtitle}</p></Reveal>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {content.workflow.items.map((item, index) => (
              <Reveal key={item.title} delay={index * 70}>
                <article className="h-full rounded-3xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#1c1815] p-6 shadow-soft hover:shadow-floating transition-all">
                  <div className="mb-5 flex items-center justify-between"><span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"><Icon name={item.icon} /></span><span className="text-sm font-black text-outline dark:text-zinc-500">0{index + 1}</span></div>
                  <h3 className="text-lg font-black text-emerald-950 dark:text-white">{item.title}</h3><p className="mt-3 text-sm leading-relaxed text-onSurface-variant dark:text-zinc-300">{item.body}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section id="safeguards" className="mx-auto grid max-w-[1280px] gap-12 px-6 py-20 lg:grid-cols-[0.8fr_1.2fr] lg:px-12 lg:py-28">
        <Reveal><span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 dark:bg-emerald-500/15 px-3.5 py-1 text-xs font-black uppercase tracking-[0.18em] text-emerald-800 dark:text-emerald-300">{content.safeguards.eyebrow}</span><h2 className="mt-4 text-3xl font-black text-emerald-950 dark:text-white sm:text-4xl">{content.safeguards.title}</h2><p className="mt-5 leading-relaxed text-onSurface-variant dark:text-zinc-300">{content.safeguards.subtitle}</p></Reveal>
        <div className="grid gap-4 sm:grid-cols-2">
          {content.safeguards.items.map((item, index) => (
            <Reveal key={item.title} delay={index * 60}>
              <article className="h-full rounded-3xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#1c1815] p-6 shadow-soft"><span className="text-emerald-700 dark:text-emerald-400"><Icon name={item.icon} /></span><h3 className="mt-4 font-black text-emerald-950 dark:text-white">{item.title}</h3><p className="mt-2 text-sm leading-relaxed text-onSurface-variant dark:text-zinc-300">{item.body}</p></article>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="bg-gradient-to-r from-[#00383a] via-[#002b2d] to-[#001c1d] px-6 py-20 text-center text-white">
        <Reveal><h2 className="text-3xl font-black sm:text-4xl">{content.finalCta.title}</h2><p className="mx-auto mt-4 max-w-2xl text-emerald-100/90">{content.finalCta.body}</p><div className="mt-8 flex justify-center"><PrimaryCta href="/auth-phone?intent=recruiter" size="lg" onDark>{content.finalCta.cta}</PrimaryCta></div><p className="mt-4 text-sm text-emerald-200/70">{content.finalCta.note}</p></Reveal>
      </section>
    </main>
  );
}
