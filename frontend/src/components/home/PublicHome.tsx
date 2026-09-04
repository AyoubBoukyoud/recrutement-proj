'use client';

import Link from 'next/link';
import { useHomeContent, useTrades } from '@/lib/useLocalizedContent';
import { GhostCta, PrimaryCta } from './Cta';
import { Reveal, RevealNoScriptFallback } from './Reveal';
import { HeroVideo } from './HeroVideo';
import { JourneyTimeline } from './JourneyTimeline';
import { RecruiterPreview } from './RecruiterPreview';
import { TechPreview } from './TechPreview';
import { MobileActionBar } from './MobileActionBar';

function Icon({ name, className = '' }: { name: string; className?: string }) {
  return <span className={`material-symbols-outlined ${className}`}>{name}</span>;
}

// Soft, harmonious pastel visual styling for the 4 methodology steps
const STEP_STYLES = [
  {
    gradient: 'from-emerald-500/10 via-teal-500/5 to-surface-lowest',
    border: 'border-emerald-500/30 hover:border-emerald-500/70 hover:shadow-[0_8px_30px_rgba(16,185,129,0.15)]',
    badge: 'bg-emerald-500/15 text-emerald-700 border border-emerald-500/30',
    accentColor: 'text-emerald-800',
    stepTag: 'Étape 01 · Rapide',
    features: ['100% Gratuit', 'Code SMS sécurisé'],
    glowDot: 'bg-emerald-500',
  },
  {
    gradient: 'from-indigo-500/10 via-blue-500/5 to-surface-lowest',
    border: 'border-indigo-500/30 hover:border-indigo-500/70 hover:shadow-[0_8px_30px_rgba(99,102,241,0.15)]',
    badge: 'bg-indigo-500/15 text-indigo-700 border border-indigo-500/30',
    accentColor: 'text-indigo-800',
    stepTag: 'Étape 02 · Automatisé',
    features: ['OCR intelligent', 'Pré-remplissage CV'],
    glowDot: 'bg-indigo-500',
  },
  {
    gradient: 'from-cyan-500/10 via-teal-500/5 to-surface-lowest',
    border: 'border-cyan-500/30 hover:border-cyan-500/70 hover:shadow-[0_8px_30px_rgba(6,182,212,0.15)]',
    badge: 'bg-cyan-500/15 text-cyan-700 border border-cyan-500/30',
    accentColor: 'text-cyan-800',
    stepTag: 'Étape 03 · Audio IA',
    features: ['1 minute de parole', 'Niveaux CEFR A1-C1'],
    glowDot: 'bg-cyan-500',
  },
  {
    gradient: 'from-amber-500/10 via-orange-500/5 to-surface-lowest',
    border: 'border-amber-500/30 hover:border-amber-500/70 hover:shadow-[0_8px_30px_rgba(245,158,11,0.15)]',
    badge: 'bg-amber-500/15 text-amber-800 border border-amber-500/30',
    accentColor: 'text-amber-900',
    stepTag: 'Étape 04 · Opportunités',
    features: ['Entreprises vérifiées', 'Visibilité contrôlée'],
    glowDot: 'bg-amber-500',
  },
];

// Soft, harmonious pastel sector colors for trade cards
function getTradeBadgeStyle(sector: string) {
  switch (sector.toLowerCase()) {
    case 'santé':
      return {
        badgeBg: 'bg-emerald-500/15 text-emerald-800 border-emerald-500/30',
        iconBg: 'bg-emerald-500/15 text-emerald-700 border border-emerald-500/30',
        borderHover: 'hover:border-emerald-500/60 hover:shadow-[0_8px_30px_rgba(16,185,129,0.15)]',
        accent: 'text-emerald-800',
      };
    case 'bâtiment':
    case 'industrie':
      return {
        badgeBg: 'bg-amber-500/15 text-amber-900 border-amber-500/30',
        iconBg: 'bg-amber-500/15 text-amber-800 border border-amber-500/30',
        borderHover: 'hover:border-amber-500/60 hover:shadow-[0_8px_30px_rgba(245,158,11,0.15)]',
        accent: 'text-amber-900',
      };
    case 'hôtellerie-restauration':
    case 'gastronomie':
      return {
        badgeBg: 'bg-rose-500/15 text-rose-800 border-rose-500/30',
        iconBg: 'bg-rose-500/15 text-rose-700 border border-rose-500/30',
        borderHover: 'hover:border-rose-500/60 hover:shadow-[0_8px_30px_rgba(244,63,94,0.15)]',
        accent: 'text-rose-800',
      };
    default:
      return {
        badgeBg: 'bg-indigo-500/15 text-indigo-800 border-indigo-500/30',
        iconBg: 'bg-indigo-500/15 text-indigo-700 border border-indigo-500/30',
        borderHover: 'hover:border-indigo-500/60 hover:shadow-[0_8px_30px_rgba(99,102,241,0.15)]',
        accent: 'text-indigo-800',
      };
  }
}

/** Canonical public home with a scroll-controlled video journey. */
export function PublicHome() {
  const content = useHomeContent();
  const { popular } = useTrades();

  return (
    <main className="force-light overflow-x-clip bg-surface text-onSurface">
      <RevealNoScriptFallback />

      {/* ------------------------------------------------------------------------- */}
      {/* 1. FULL-SCREEN HERO VIDEO COVER AT THE TOP (Responsive Mobile & Desktop)   */}
      {/* ------------------------------------------------------------------------- */}
      <section
        id="hero-video-section"
        className="relative h-[calc(100svh-68px-env(safe-area-inset-top))] min-h-[480px] max-h-[740px] w-full overflow-hidden bg-black sm:h-screen sm:min-h-[640px] sm:max-h-none"
      >
        <HeroVideo />

        {/* Floating Dossier Card Over the Video with Bright, High-Contrast Text (Tablet & Desktop) */}
        <div className="absolute bottom-16 end-6 z-30 hidden sm:block md:end-12 md:bottom-20 lg:w-96">
          <div className="rounded-3xl border border-white/30 bg-black/75 p-6 text-white shadow-[0_20px_50px_rgba(0,0,0,0.6)] backdrop-blur-2xl transition-all duration-300 hover:border-white/50">
            <div className="flex items-center justify-between border-b border-white/20 pb-4">
              <div>
                <p className="text-[11px] font-black uppercase tracking-wider text-emerald-400">
                  {content.hero.card.title}
                </p>
                <h2 className="mt-1 text-2xl font-black text-white">
                  {content.hero.card.name}
                </h2>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/25 text-emerald-300 ring-1 ring-white/20">
                <Icon name="folder_supervised" className="text-2xl" />
              </div>
            </div>

            <dl className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-white/15 bg-white/10 p-3.5 backdrop-blur-md">
                <dt className="text-xs font-bold text-white/80">{content.hero.card.levelLabel}</dt>
                <dd className="mt-1 text-xl font-black text-emerald-300">{content.hero.card.level}</dd>
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/10 p-3.5 backdrop-blur-md">
                <dt className="text-xs font-bold text-white/80">{content.hero.card.availabilityLabel}</dt>
                <dd className="mt-1 text-sm font-black text-white">{content.hero.card.availability}</dd>
              </div>
            </dl>

            <div className="mt-4 flex flex-wrap gap-2">
              {content.hero.card.documents.map((document) => (
                <span key={document} className="inline-flex items-center gap-1 rounded-full border border-white/25 bg-white/15 px-3 py-1 text-xs font-bold text-white">
                  <Icon name="check_circle" className="text-xs text-emerald-400" />
                  {document}
                </span>
              ))}
            </div>
            <p className="mt-4 text-xs font-medium text-white/75">{content.hero.card.footnote}</p>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------------- */}
      {/* 2. RISING CONTENT SHEET (Slides UP over the Full-Screen Video)            */}
      {/* ------------------------------------------------------------------------- */}
      <div
        id="main-content"
        tabIndex={-1}
        className="relative z-20 -mt-6 outline-none sm:-mt-14 rounded-t-[2rem] sm:rounded-t-[3.5rem] border-t border-outline-variant/60 bg-surface shadow-[0_-25px_60px_rgba(0,0,0,0.18)]"
      >
        {/* HERO CONTENT SECTION: Travaillez en Allemagne. Nous préparons votre dossier avec vous. */}
        <section className="relative overflow-hidden pb-16 pt-16 sm:pb-20 sm:pt-20 lg:pt-24">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(16,185,129,0.15),transparent_50%)]" />

          <div className="relative mx-auto max-w-4xl px-6 text-center lg:px-12">
            {/* Eyebrow Pill */}
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 backdrop-blur-sm">
              <span className="text-base">🇲🇦</span>
              <span className="text-xs font-black uppercase tracking-[0.18em] text-primary">{content.hero.eyebrow}</span>
              <span className="text-base">🇩🇪</span>
            </div>

            {/* Main Headline */}
            <h1 className="mt-5 text-4xl font-black leading-tight tracking-tight text-primary-dark sm:text-5xl lg:text-6xl">
              {content.hero.headline[0]} <span className="bg-gradient-to-r from-primary via-emerald-600 to-teal-600 bg-clip-text text-transparent">{content.hero.headline[1]}</span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-onSurface-variant">
              {content.hero.subheadline}
            </p>

            {/* Main Action CTAs */}
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <PrimaryCta href="/auth-phone" size="lg" className="shadow-floating">
                <span className="flex items-center gap-2">
                  <span>{content.hero.cta}</span>
                  <Icon name="arrow_forward" className="text-xl rtl:rotate-180" />
                </span>
              </PrimaryCta>
              <Link
                href="/employeurs"
                className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-primary bg-primary/10 px-8 py-4 text-base font-black text-primary-dark shadow-sm transition-colors hover:bg-primary/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:scale-[0.99]"
              >
                <Icon name="business" className="text-xl" />
                <span>{content.recruiter.eyebrow}</span>
              </Link>
            </div>

            <p className="mt-4 text-xs font-bold text-outline sm:text-sm">
              {content.hero.microcopy}
            </p>
          </div>
        </section>

        {/* TRUST BANNER BAR */}
        <section aria-label={content.trust.items.map((item) => item.label).join(', ')} className="border-y border-outline-variant/60 bg-gradient-to-r from-surface-container/80 via-surface-container-high/40 to-surface-container/80 py-5">
          <div className="mx-auto grid max-w-[1280px] gap-4 px-6 sm:grid-cols-3 lg:px-12">
            {content.trust.items.map((item) => (
              <div key={item.label} className="flex items-center gap-3 rounded-xl bg-surface-lowest/80 p-3 text-sm font-bold text-onSurface-variant shadow-sm backdrop-blur-sm">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-700">
                  <Icon name={item.icon} className="text-2xl" />
                </div>
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ------------------------------------------------------------------------- */}
        {/* 3. THE SERPENTINE SNAKE-TRACK JOURNEY (Votre parcours, étape par étape)     */}
        {/* ------------------------------------------------------------------------- */}
        <JourneyTimeline />

        {/* ------------------------------------------------------------------------- */}
        {/* 4. METHODOLOGY SECTION: 4 STEPS (Quatre étapes, à votre rythme)          */}
        {/* ------------------------------------------------------------------------- */}
        <section id="methodology" className="relative overflow-hidden bg-surface py-24 lg:py-32">
          <div className="pointer-events-none absolute start-0 top-1/3 h-96 w-96 rounded-full bg-emerald-500/10 blur-[130px]" />
          <div className="pointer-events-none absolute end-0 bottom-10 h-96 w-96 rounded-full bg-cyan-500/10 blur-[130px]" />

          <div className="relative mx-auto max-w-[1280px] px-6 lg:px-12">
            {/* Section Header with Graphic */}
            <div className="grid items-center gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-12">
              <Reveal>
                <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/15 px-3.5 py-1 text-xs font-black uppercase tracking-wider text-emerald-700">
                  ⚡ Simple & Sans Déplacement
                </span>
                <h2 className="mt-3 text-3xl font-black text-primary-dark sm:text-4xl lg:text-5xl">
                  {content.steps.title}
                </h2>
                <p className="mt-4 text-lg leading-relaxed text-onSurface-variant">
                  {content.steps.subtitle}
                </p>
                <div className="mt-6">
                  <PrimaryCta href="/auth-phone" size="lg">
                    <span className="flex items-center gap-2">
                      <span>{content.steps.cta}</span>
                      <Icon name="arrow_forward" className="text-lg rtl:rotate-180" />
                    </span>
                  </PrimaryCta>
                </div>
              </Reveal>

              <Reveal delay={100}>
                <div className="relative overflow-hidden rounded-3xl border border-outline-variant/60 bg-surface-lowest p-3 shadow-floating">
                  <img
                    src="/assets/images/landing/candidate-profile-960.webp"
                    srcSet="/assets/images/landing/candidate-profile-480.webp 480w, /assets/images/landing/candidate-profile-960.webp 960w"
                    sizes="(min-width: 1024px) 520px, 100vw"
                    alt={content.steps.imageAlt}
                    loading="lazy"
                    className="mx-auto h-72 w-full rounded-2xl object-cover shadow-soft sm:h-80 lg:max-w-none"
                  />
                </div>
              </Reveal>
            </div>

            {/* Enhanced 4 Cards Grid with Refined Soft Pastel Themes and Larger Icons */}
            <div className="mt-16 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
              {content.steps.items.map((step, index) => {
                const style = STEP_STYLES[index] ?? STEP_STYLES[0];

                return (
                  <Reveal key={step.title} delay={index * 80}>
                    <article className={`group relative flex h-full flex-col rounded-3xl border ${style.border} bg-gradient-to-b ${style.gradient} p-7 shadow-soft transition-all duration-300 hover:-translate-y-2 hover:bg-surface-lowest`}>

                      {/* Step Header with Icon & Index */}
                      <div className="mb-6 flex items-center justify-between">
                        <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${style.badge} shadow-sm transition-transform duration-300 group-hover:scale-110`}>
                          <Icon name={step.icon} className="text-[30px]" />
                        </div>
                        <span className="text-2xl font-black text-outline/70">0{index + 1}</span>
                      </div>

                      {/* Step Tag */}
                      <span className="mb-2 inline-block text-xs font-extrabold uppercase tracking-wide text-primary">
                        {style.stepTag}
                      </span>

                      {/* Title & Body */}
                      <h3 className="text-xl font-black leading-tight text-primary-dark">
                        {step.title}
                      </h3>
                      <p className="mt-3 flex-1 text-sm leading-relaxed text-onSurface-variant">
                        {step.body}
                      </p>

                      {/* Micro Features / Chips */}
                      <div className="mt-6 flex flex-wrap gap-1.5 border-t border-outline-variant/40 pt-4">
                        {style.features.map((feat) => (
                          <span key={feat} className="inline-flex items-center gap-1 rounded-md bg-surface px-2.5 py-1 text-[11px] font-bold text-onSurface-variant shadow-xs">
                            <span className={`h-1.5 w-1.5 rounded-full ${style.glowDot}`} />
                            {feat}
                          </span>
                        ))}
                      </div>
                    </article>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------------------- */}
        {/* RECRUITER DARK BANNER SECTION                                             */}
        {/* ------------------------------------------------------------------------- */}
        <section className="relative overflow-hidden bg-primary-dark py-24 text-surface-lowest lg:py-28">
          <img
            src="/assets/images/landing/recruitment-company-1440.webp"
            srcSet="/assets/images/landing/recruitment-company-720.webp 720w, /assets/images/landing/recruitment-company-1440.webp 1440w"
            sizes="100vw"
            alt=""
            aria-hidden="true"
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover object-[center_25%] opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-primary-dark via-primary-dark/95 to-primary-dark/80" />

          <div className="relative mx-auto grid max-w-[1280px] gap-12 px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-12">
            <Reveal>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-light/20 px-3.5 py-1 text-xs font-black uppercase tracking-[0.18em] text-primary-light">
                <Icon name="verified" className="text-sm" />
                {content.recruiter.eyebrow}
              </span>
              <h2 className="mt-4 text-3xl font-black sm:text-4xl lg:text-5xl">
                {content.recruiter.title}
              </h2>
              <p className="mt-5 text-lg leading-relaxed text-surface-container-high">
                {content.recruiter.subtitle}
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
                <PrimaryCta href="/auth-phone?intent=recruiter" onDark>
                  {content.recruiter.cta}
                </PrimaryCta>
                <GhostCta href="/employeurs" onDark>
                  {content.recruiter.secondaryCta}
                </GhostCta>
              </div>
              <div className="mt-8">
                <RecruiterPreview />
              </div>
            </Reveal>

            <div className="grid gap-5 md:grid-cols-3">
              {content.recruiter.points.map((point, index) => (
                <Reveal key={point.title} delay={index * 80}>
                  <article className="h-full rounded-2xl border border-surface-lowest/20 bg-surface-lowest/10 p-6 backdrop-blur-sm transition-all hover:border-primary-light/40 hover:bg-surface-lowest/15">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-light/20 text-primary-light">
                      <Icon name={point.icon} className="text-2xl" />
                    </div>
                    <h3 className="mt-5 text-lg font-black text-white">{point.title}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-surface-container-high">{point.body}</p>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------------------- */}
        {/* 5. TRADES & SECTORS (Les métiers qui recrutent en Allemagne)             */}
        {/* ------------------------------------------------------------------------- */}
        <section id="sectors" className="relative overflow-hidden bg-surface-container/50 py-24 lg:py-32">
          <div className="relative mx-auto max-w-[1280px] px-6 lg:px-12">

            <Reveal className="max-w-3xl">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3.5 py-1 text-xs font-black uppercase tracking-wider text-primary">
                🇩🇪 Marché Allemand du Travail
              </span>
              <h2 className="mt-3 text-3xl font-black text-primary-dark sm:text-4xl lg:text-5xl">
                {content.trades.title}
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-onSurface-variant">
                {content.trades.subtitle}
              </p>
            </Reveal>

            {/* Enhanced Trade Cards Grid with Soft Pastel Themes and Larger Icons */}
            <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {popular.map((trade, index) => {
                const badgeStyle = getTradeBadgeStyle(trade.sector);

                return (
                  <Reveal key={trade.slug} delay={index * 60}>
                    <Link
                      href={`/metiers/${trade.slug}`}
                      className={`group flex h-full flex-col justify-between rounded-3xl border border-outline-variant/70 bg-surface-lowest p-6 shadow-soft transition-all duration-300 ${badgeStyle.borderHover} hover:-translate-y-2 hover:shadow-floating`}
                    >
                      <div>
                        {/* Card Header with Soft Pastel Icon & Sector Badge */}
                        <div className="flex items-start justify-between gap-3">
                          <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${badgeStyle.iconBg} shadow-sm transition-transform duration-300 group-hover:scale-110`}>
                            <Icon name={trade.icon} className="text-[30px]" />
                          </div>
                          <span className={`rounded-full border px-3 py-1 text-xs font-extrabold uppercase tracking-wide ${badgeStyle.badgeBg}`}>
                            {trade.sector}
                          </span>
                        </div>

                        {/* Trade Title */}
                        <h3 className="mt-5 text-xl font-black text-primary-dark transition-colors group-hover:text-primary">
                          {trade.label}
                        </h3>

                        <p className="mt-2 text-xs font-semibold leading-relaxed text-onSurface-variant line-clamp-2">
                          {trade.summary}
                        </p>

                        {/* Requirements & German Level Pills */}
                        <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-outline-variant/40 pt-4">
                          {/* German CEFR Level Badge */}
                          <div className="inline-flex items-center gap-1.5 rounded-lg border border-primary/25 bg-primary/10 px-2.5 py-1 text-xs font-black text-primary">
                            <Icon name="translate" className="text-sm" />
                            <span>{content.trades.levelPrefix} {trade.germanLevel}</span>
                          </div>

                          {/* Recognition Rule */}
                          <div className="inline-flex items-center gap-1 rounded-lg border border-outline-variant bg-surface px-2.5 py-1 text-[11px] font-bold text-onSurface-variant">
                            <Icon name="verified_user" className="text-xs text-outline" />
                            <span>
                              {trade.recognition === 'required'
                                ? content.trades.recognition.required
                                : trade.recognition === 'recommended'
                                  ? content.trades.recognition.recommended
                                  : content.trades.recognition.none}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Action Link Footer */}
                      <div className="mt-6 flex items-center justify-between border-t border-outline-variant/40 pt-4">
                        <span className="text-xs font-bold text-emerald-700">🔥 En forte tension</span>
                        <span className="inline-flex items-center gap-1.5 text-sm font-black text-primary transition-transform duration-200 group-hover:translate-x-1">
                          {content.trades.cardCta}
                          <Icon name="arrow_forward" className="text-base rtl:rotate-180" />
                        </span>
                      </div>
                    </Link>
                  </Reveal>
                );
              })}
            </div>

          </div>
        </section>

        {/* ------------------------------------------------------------------------- */}
        {/* CREDIBLE DOSSIER SECTION                                                  */}
        {/* ------------------------------------------------------------------------- */}
        <section className="mx-auto max-w-[1280px] px-6 py-24 lg:px-12 lg:py-32">
          <div className="grid items-center gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-12">
            <Reveal>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3.5 py-1 text-xs font-black uppercase tracking-wider text-emerald-700">
                🛡️ Conforme & Reconnu
              </span>
              <h2 className="mt-3 text-3xl font-black text-primary-dark sm:text-4xl lg:text-5xl">
                {content.credible.title}
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-onSurface-variant">
                {content.credible.subtitle}
              </p>
            </Reveal>
            <Reveal delay={100}>
              <img
                src="/assets/images/landing/training-skills-1440.webp"
                srcSet="/assets/images/landing/training-skills-720.webp 720w, /assets/images/landing/training-skills-1440.webp 1440w"
                sizes="(min-width: 1024px) 480px, 100vw"
                alt={content.credible.imageAlt}
                loading="lazy"
                className="w-full rounded-3xl shadow-floating"
              />
            </Reveal>
          </div>

          <div className="mt-14 grid gap-6 md:grid-cols-2">
            {content.credible.items.map((item, index) => (
              <Reveal key={item.title} delay={index * 60}>
                <article className="flex h-full gap-5 rounded-3xl border border-outline-variant/60 bg-surface-lowest p-6 shadow-soft transition-all hover:border-primary/50 hover:shadow-md">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Icon name={item.icon} className="text-2xl" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-primary-dark">{item.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-onSurface-variant">{item.body}</p>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </section>

        {/* Tech Preview Component */}
        <TechPreview />

        {/* ------------------------------------------------------------------------- */}
        {/* COMMITMENTS / PROOF SECTION                                               */}
        {/* ------------------------------------------------------------------------- */}
        <section className="mx-auto max-w-[1280px] px-6 py-20 lg:px-12 lg:py-28">
          <Reveal className="max-w-3xl">
            <h2 className="text-3xl font-black text-primary-dark sm:text-4xl">{content.proof.title}</h2>
            <p className="mt-4 text-lg text-onSurface-variant">{content.proof.subtitle}</p>
          </Reveal>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {content.proof.items.map((item, index) => (
              <Reveal key={item.title} delay={index * 70}>
                <article className="h-full rounded-3xl border border-outline-variant/60 bg-surface-lowest p-7 shadow-soft">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-700">
                    <Icon name={item.icon} className="text-2xl" />
                  </div>
                  <h3 className="mt-5 text-lg font-black text-primary-dark">{item.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-onSurface-variant">{item.body}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ------------------------------------------------------------------------- */}
        {/* FAQ ACCORDION SECTION (Responsive & Rich Interactive Mobile/Desktop)      */}
        {/* ------------------------------------------------------------------------- */}
        <section className="border-y border-outline-variant/60 bg-surface-lowest/70 py-20 lg:py-28">
          <div className="mx-auto max-w-4xl px-6">
            <Reveal className="text-center">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3.5 py-1 text-xs font-black uppercase tracking-wider text-primary">
                <Icon name="help" className="text-sm" />
                FAQ · Vos Questions
              </span>
              <h2 className="mt-3 text-3xl font-black text-primary-dark sm:text-4xl">{content.faq.title}</h2>
              <p className="mt-4 text-onSurface-variant">{content.faq.subtitle}</p>
            </Reveal>

            <div className="mt-12 space-y-3.5">
              {content.faq.items.map((item, index) => {
                const icons = ['toll', 'work_outline', 'visibility', 'lock', 'translate', 'schedule'];
                const icon = icons[index % icons.length];

                return (
                  <Reveal key={item.question} delay={index * 40}>
                    <details className="group rounded-2xl border border-outline-variant/70 bg-surface p-4 sm:p-6 shadow-xs transition-all duration-200 hover:border-primary/40 hover:shadow-soft">
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-black text-primary-dark sm:text-lg">
                        <div className="flex items-center gap-3">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary text-sm">
                            <Icon name={icon} className="text-lg" />
                          </span>
                          <span>{item.question}</span>
                        </div>
                        <Icon name="expand_more" className="text-2xl text-primary transition-transform duration-200 group-open:rotate-180 shrink-0" />
                      </summary>
                      <div className="mt-3.5 ps-11 pe-2 border-t border-outline-variant/40 pt-3">
                        <p className="text-sm leading-relaxed text-onSurface-variant sm:text-base">
                          {item.answer}
                        </p>
                      </div>
                    </details>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------------------- */}
        {/* FINAL CALL TO ACTION                                                      */}
        {/* ------------------------------------------------------------------------- */}
        <section className="relative overflow-hidden py-24 lg:py-32">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.12),transparent_70%)]" />

          <div className="relative mx-auto max-w-[1280px] px-6 lg:px-12">
            <div className="grid items-center gap-10 rounded-[3rem] border border-primary/20 bg-gradient-to-br from-primary/10 via-surface-lowest to-surface-lowest p-8 shadow-floating sm:p-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
              <Reveal className="order-last lg:order-first">
                <img
                  src="/assets/images/landing/career-success-960.webp"
                  srcSet="/assets/images/landing/career-success-480.webp 480w, /assets/images/landing/career-success-960.webp 960w"
                  sizes="(min-width: 1024px) 440px, 100vw"
                  alt={content.finalCta.imageAlt}
                  loading="lazy"
                  className="mx-auto w-full max-w-sm rounded-3xl shadow-floating lg:max-w-none"
                />
              </Reveal>

              <Reveal delay={100} className="text-center lg:text-start">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-black text-primary">
                  <span>🇲🇦</span>
                  <Icon name="arrow_forward" className="text-base rtl:rotate-180" />
                  <span>🇩🇪</span>
                  <span className="ms-1 text-xs">Accès direct recruteurs</span>
                </div>

                <h2 className="text-3xl font-black text-primary-dark sm:text-4xl lg:text-5xl">
                  {content.finalCta.title}
                </h2>
                <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-onSurface-variant lg:mx-0">
                  {content.finalCta.subtitle}
                </p>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start">
                  <PrimaryCta href="/auth-phone" size="lg" className="shadow-floating">
                    {content.finalCta.cta}
                  </PrimaryCta>
                </div>

                <p className="mt-4 text-xs font-semibold text-outline sm:text-sm">
                  {content.finalCta.microcopy}
                </p>
              </Reveal>
            </div>
          </div>
        </section>
      </div>

      {/* Barre d'action rapide flottante pour mobile */}
      <MobileActionBar />
    </main>
  );
}
