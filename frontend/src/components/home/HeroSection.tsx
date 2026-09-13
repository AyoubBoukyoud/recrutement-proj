'use client';

import { useHomeContent } from '@/lib/useLocalizedContent';
import { CoralButton, Eyebrow, Icon, OutlineButton } from './ui';
import { Reveal } from './Reveal';

export function HeroSection() {
  const { hero } = useHomeContent();

  return (
    <section className="relative overflow-hidden bg-home-sand">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-96 bg-[radial-gradient(ellipse_at_50%_0%,rgba(241,105,63,0.10),transparent_65%)]" />

      <div className="relative mx-auto grid max-w-[1280px] items-center gap-14 px-6 pb-20 pt-14 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:px-12 lg:pb-28 lg:pt-20">
        <Reveal>
          <Eyebrow>{hero.eyebrow}</Eyebrow>

          <h1 className="mt-6 text-4xl font-bold leading-[1.08] tracking-tight text-home-ink sm:text-5xl lg:text-[3.5rem]">
            {hero.headline[0]}
            <span className="block text-home-coral">{hero.headline[1]}</span>
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-relaxed text-home-slate">{hero.subheadline}</p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <CoralButton href="/auth-phone" size="lg">
              <span className="flex items-center gap-2">
                <span>{hero.cta}</span>
                <Icon name="arrow_forward" className="text-xl rtl:rotate-180" />
              </span>
            </CoralButton>
            <OutlineButton href="/accueil-public#methodology" size="lg">
              {hero.secondaryCta}
            </OutlineButton>
          </div>

          <p className="mt-5 text-sm font-medium text-home-slate/80">{hero.microcopy}</p>
        </Reveal>

        <Reveal delay={120} className="relative">
          <div className="overflow-hidden rounded-[2rem] border border-home-line bg-home-surface shadow-[0_24px_60px_rgba(16,35,58,0.14)]">
            <img
              src="/assets/images/landing/candidate-profile-960.webp"
              srcSet="/assets/images/landing/candidate-profile-480.webp 480w, /assets/images/landing/candidate-profile-960.webp 960w"
              sizes="(min-width: 1024px) 560px, 100vw"
              alt={hero.imageAlt}
              width={960}
              height={640}
              fetchPriority="high"
              className="h-72 w-full object-cover sm:h-[26rem] lg:h-[30rem]"
            />
          </div>

          <div className="relative z-10 -mt-10 mx-4 rounded-2xl border border-home-line bg-home-surface p-5 shadow-[0_18px_45px_rgba(16,35,58,0.16)] sm:mx-8 lg:absolute lg:-bottom-8 lg:-start-6 lg:mx-0 lg:mt-0 lg:w-80">
            <div className="flex items-center gap-3 border-b border-home-line pb-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-home-coral-soft text-home-coral-dark">
                <Icon name="task_alt" className="text-xl" />
              </span>
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-home-coral-dark">{hero.card.eyebrow}</p>
                <p className="mt-0.5 text-sm font-bold leading-snug text-home-ink">{hero.card.title}</p>
              </div>
            </div>

            <ul className="mt-4 space-y-2.5">
              {hero.card.items.map((item) => (
                <li key={item.label} className="flex items-center gap-3 text-sm font-semibold text-home-ink">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-home-ink/[0.05] text-home-ink">
                    <Icon name={item.icon} className="text-base" />
                  </span>
                  {item.label}
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
