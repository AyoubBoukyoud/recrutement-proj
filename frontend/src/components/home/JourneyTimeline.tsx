'use client';

import { useState } from 'react';
import { useHomeContent } from '@/lib/useLocalizedContent';
import { Reveal } from './Reveal';

function Icon({ name, className = '' }: { name: string; className?: string }) {
  return <span className={`material-symbols-outlined ${className}`}>{name}</span>;
}

// Refined soft/pastel harmonious themes for the 9 journey steps in Light & Dark mode
const STEP_THEMES = [
  { bg: 'from-emerald-500/10 via-teal-500/5 to-white', border: 'border-emerald-500/30 dark:border-emerald-500/30', badgeBg: 'bg-emerald-500/15 text-emerald-800 dark:bg-emerald-500/25 dark:text-emerald-300 border border-emerald-500/30', text: 'text-emerald-800 dark:text-emerald-300', glow: 'shadow-[0_4px_20px_rgba(16,185,129,0.15)]', tag: '🇲🇦 Étape Maroc' },
  { bg: 'from-teal-500/10 via-cyan-500/5 to-white', border: 'border-teal-500/30 dark:border-teal-500/30', badgeBg: 'bg-teal-500/15 text-teal-800 dark:bg-teal-500/25 dark:text-teal-300 border border-teal-500/30', text: 'text-teal-800 dark:text-teal-300', glow: 'shadow-[0_4px_20px_rgba(20,184,166,0.15)]', tag: '⚡ IA & Test' },
  { bg: 'from-cyan-500/10 via-sky-500/5 to-white', border: 'border-cyan-500/30 dark:border-cyan-500/30', badgeBg: 'bg-cyan-500/15 text-cyan-800 dark:bg-cyan-500/25 dark:text-cyan-300 border border-cyan-500/30', text: 'text-cyan-800 dark:text-cyan-300', glow: 'shadow-[0_4px_20px_rgba(6,182,212,0.15)]', tag: '🤝 Matching' },
  { bg: 'from-blue-500/10 via-indigo-500/5 to-white', border: 'border-blue-500/30 dark:border-blue-500/30', badgeBg: 'bg-blue-500/15 text-blue-800 dark:bg-blue-500/25 dark:text-blue-300 border border-blue-500/30', text: 'text-blue-800 dark:text-blue-300', glow: 'shadow-[0_4px_20px_rgba(59,130,246,0.15)]', tag: '💬 Entretien' },
  { bg: 'from-indigo-500/10 via-slate-500/5 to-white', border: 'border-indigo-500/30 dark:border-indigo-500/30', badgeBg: 'bg-indigo-500/15 text-indigo-800 dark:bg-indigo-500/25 dark:text-indigo-300 border border-indigo-500/30', text: 'text-indigo-800 dark:text-indigo-300', glow: 'shadow-[0_4px_20px_rgba(99,102,241,0.15)]', tag: '📜 Dossier & Traduction' },
  { bg: 'from-violet-500/10 via-purple-500/5 to-white', border: 'border-violet-500/30 dark:border-violet-500/30', badgeBg: 'bg-violet-500/15 text-violet-800 dark:bg-violet-500/25 dark:text-violet-300 border border-violet-500/30', text: 'text-violet-800 dark:text-violet-300', glow: 'shadow-[0_4px_20px_rgba(139,92,246,0.15)]', tag: '🛂 Visa & Ambassade' },
  { bg: 'from-amber-500/10 via-yellow-500/5 to-white', border: 'border-amber-500/30 dark:border-amber-500/30', badgeBg: 'bg-amber-500/15 text-amber-900 dark:bg-amber-500/25 dark:text-amber-300 border border-amber-500/30', text: 'text-amber-900 dark:text-amber-300', glow: 'shadow-[0_4px_20px_rgba(245,158,11,0.15)]', tag: '✈️ Départ' },
  { bg: 'from-orange-500/10 via-amber-500/5 to-white', border: 'border-orange-500/30 dark:border-orange-500/30', badgeBg: 'bg-orange-500/15 text-orange-900 dark:bg-orange-500/25 dark:text-orange-300 border border-orange-500/30', text: 'text-orange-900 dark:text-orange-300', glow: 'shadow-[0_4px_20px_rgba(234,88,12,0.15)]', tag: '🇩🇪 Arrivée' },
  { bg: 'from-emerald-500/20 via-teal-500/10 to-white', border: 'border-emerald-500/60 dark:border-emerald-400', badgeBg: 'bg-emerald-600 text-white shadow-md', text: 'text-emerald-950 dark:text-emerald-200', glow: 'shadow-[0_4px_25px_rgba(16,185,129,0.3)]', tag: '🏆 Emploi CDI en Allemagne' },
];

/**
 * Récit visuel en « مسار دودي / True Serpentine Winding Snake Track » :
 * Row 1: 01 ➔ 02 ➔ 03 (Gauche à Droite)
 * Curve Right: 03 ⤵ 04
 * Row 2: 06 🠔 05 🠔 04 (Droite à Gauche)
 * Curve Left: 06 ⤵ 07
 * Row 3: 07 ➔ 08 ➔ 09 (Gauche à Droite ➔ Succès en Allemagne)
 */
export function JourneyTimeline() {
  const content = useHomeContent();
  const { journey } = content;
  const [activeStep, setActiveStep] = useState<number | null>(null);

  // Row 1: 0, 1, 2 (1 -> 2 -> 3)
  const row1Steps = [
    { step: journey.items[0], index: 0 },
    { step: journey.items[1], index: 1 },
    { step: journey.items[2], index: 2 },
  ];

  // Row 2: Rendered visually as [Step 6, Step 5, Step 4] so the snake flows right-to-left (4 <- 5 <- 6)
  const row2Steps = [
    { step: journey.items[5], index: 5 },
    { step: journey.items[4], index: 4 },
    { step: journey.items[3], index: 3 },
  ];

  // Row 3: 6, 7, 8 (7 -> 8 -> 9)
  const row3Steps = [
    { step: journey.items[6], index: 6 },
    { step: journey.items[7], index: 7 },
    { step: journey.items[8], index: 8 },
  ];

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-surface via-slate-50/50 to-surface dark:from-[#12100e] dark:via-[#161311] dark:to-[#12100e] py-20 lg:py-28 transition-colors">
      {/* Background ambient lighting */}
      <div className="pointer-events-none absolute -top-40 start-1/2 -translate-x-1/2 h-96 w-full max-w-7xl rounded-full bg-emerald-500/10 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-0 end-0 h-96 w-96 rounded-full bg-teal-500/10 blur-[100px]" />

      <div className="relative mx-auto max-w-[1360px] px-6 lg:px-12">
        {/* Section Header */}
        <div className="grid items-center gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-12">
          <Reveal>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 dark:bg-emerald-500/15 px-4 py-1.5 backdrop-blur-sm">
              <span className="text-base">🇲🇦</span>
              <span className="text-xs font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-300">{journey.startLabel}</span>
              <Icon name="trending_flat" className="text-emerald-700 dark:text-emerald-400 rtl:rotate-180" />
              <span className="text-base">🇩🇪</span>
              <span className="text-xs font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-300">{journey.endLabel}</span>
            </div>
            <h2 className="mt-4 text-3xl font-black text-emerald-950 dark:text-white sm:text-4xl lg:text-5xl">
              {journey.title}
            </h2>
            <p className="mt-4 max-w-2xl text-lg leading-relaxed text-onSurface-variant dark:text-zinc-300">
              {journey.subtitle}
            </p>
          </Reveal>

          <Reveal delay={100}>
            <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#1c1815] p-3 shadow-floating">
              <img
                src="/assets/images/landing/morocco-germany-1440.webp"
                srcSet="/assets/images/landing/morocco-germany-720.webp 720w, /assets/images/landing/morocco-germany-1440.webp 1440w"
                sizes="(min-width: 1024px) 560px, 100vw"
                alt={journey.imageAlt}
                loading="lazy"
                className="h-64 w-full rounded-2xl object-cover sm:h-72"
              />
              <div className="absolute inset-x-7 bottom-6 rounded-2xl border border-white/30 bg-black/70 p-3.5 text-white backdrop-blur-md">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    Parcours intégralement accompagné
                  </span>
                  <span className="rounded-lg bg-emerald-500/30 border border-emerald-400/30 px-2.5 py-0.5 text-emerald-300 font-black">9 étapes</span>
                </div>
              </div>
            </div>
          </Reveal>
        </div>

        {/* ------------------------------------------------------------------------- */}
        {/* DESKTOP SERPENTINE / TRUE SNAKE TRACK                                     */}
        {/* ------------------------------------------------------------------------- */}
        <div className="relative mt-20 hidden lg:block">
          <div className="relative space-y-20">
            
            {/* ROW 1: Steps 01 -> 02 -> 03 (Left to Right) */}
            <div className="relative">
              <div className="grid grid-cols-3 gap-8">
                {row1Steps.map(({ step, index }) => {
                  const theme = STEP_THEMES[index];
                  const isHovered = activeStep === index;

                  return (
                    <Reveal key={step.title} delay={index * 60}>
                      <div 
                        onMouseEnter={() => setActiveStep(index)}
                        onMouseLeave={() => setActiveStep(null)}
                        className={`group relative rounded-3xl border transition-all duration-300 ${theme.border} bg-gradient-to-b ${theme.bg} dark:bg-none dark:bg-[#1c1815] p-7 ${isHovered ? `${theme.glow} -translate-y-1.5 bg-white dark:bg-[#231f1c]` : 'bg-white/95 dark:bg-[#1c1815] shadow-soft'}`}
                      >
                        <div className="mb-5 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className={`flex h-14 w-14 items-center justify-center rounded-2xl ${theme.badgeBg} shadow-sm transition-transform duration-300 group-hover:scale-110`}>
                              <Icon name={step.icon} className="text-[28px]" />
                            </span>
                            <span className="text-2xl font-black text-outline/80 dark:text-zinc-500">0{index + 1}</span>
                          </div>
                          <span className="rounded-full border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#28231f] px-3 py-1 text-xs font-bold text-onSurface-variant dark:text-zinc-300">
                            {theme.tag}
                          </span>
                        </div>

                        <h3 className="text-lg font-black leading-snug text-emerald-950 dark:text-white">
                          {step.title}
                        </h3>
                        <p className="mt-2 text-sm leading-relaxed text-onSurface-variant dark:text-zinc-300">
                          {step.body}
                        </p>

                        <div className="mt-5 flex items-center justify-between border-t border-slate-200/60 dark:border-white/10 pt-3 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                          <span>Étape {index + 1}/9</span>
                          <Icon name="arrow_forward" className="text-base transition-transform group-hover:translate-x-1" />
                        </div>
                      </div>
                    </Reveal>
                  );
                })}
              </div>

              {/* Right Curving S-Path Connector: Step 03 down to Step 04 */}
              <div className="pointer-events-none absolute -bottom-20 end-20 flex h-20 w-32 items-center justify-center text-emerald-500">
                <svg width="100" height="80" viewBox="0 0 100 80" fill="none" className="overflow-visible">
                  <path 
                    d="M 10 0 C 85 0, 85 80, 10 80" 
                    stroke="url(#gradient-right)" 
                    strokeWidth="3.5" 
                    strokeDasharray="6 6"
                  />
                  <circle cx="10" cy="80" r="5" fill="#10B981" />
                  <defs>
                    <linearGradient id="gradient-right" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#06B6D4" />
                      <stop offset="100%" stopColor="#3B82F6" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            </div>

            {/* ROW 2: Steps 06 <- 05 <- 04 (Right to Left in the snake path) */}
            <div className="relative">
              <div className="grid grid-cols-3 gap-8">
                {row2Steps.map(({ step, index }) => {
                  const theme = STEP_THEMES[index];
                  const isHovered = activeStep === index;

                  return (
                    <Reveal key={step.title} delay={(5 - (index - 3)) * 60}>
                      <div 
                        onMouseEnter={() => setActiveStep(index)}
                        onMouseLeave={() => setActiveStep(null)}
                        className={`group relative rounded-3xl border transition-all duration-300 ${theme.border} bg-gradient-to-b ${theme.bg} dark:bg-none dark:bg-[#1c1815] p-7 ${isHovered ? `${theme.glow} -translate-y-1.5 bg-white dark:bg-[#231f1c]` : 'bg-white/95 dark:bg-[#1c1815] shadow-soft'}`}
                      >
                        <div className="mb-5 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className={`flex h-14 w-14 items-center justify-center rounded-2xl ${theme.badgeBg} shadow-sm transition-transform duration-300 group-hover:scale-110`}>
                              <Icon name={step.icon} className="text-[28px]" />
                            </span>
                            <span className="text-2xl font-black text-outline/80 dark:text-zinc-500">0{index + 1}</span>
                          </div>
                          <span className="rounded-full border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#28231f] px-3 py-1 text-xs font-bold text-onSurface-variant dark:text-zinc-300">
                            {theme.tag}
                          </span>
                        </div>

                        <h3 className="text-lg font-black leading-snug text-emerald-950 dark:text-white">
                          {step.title}
                        </h3>
                        <p className="mt-2 text-sm leading-relaxed text-onSurface-variant dark:text-zinc-300">
                          {step.body}
                        </p>

                        <div className="mt-5 flex items-center justify-between border-t border-slate-200/60 dark:border-white/10 pt-3 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                          <span>Étape {index + 1}/9</span>
                          <Icon name="arrow_back" className="text-base transition-transform group-hover:-translate-x-1" />
                        </div>
                      </div>
                    </Reveal>
                  );
                })}
              </div>

              {/* Left Curving S-Path Connector: Step 06 down to Step 07 */}
              <div className="pointer-events-none absolute -bottom-20 start-20 flex h-20 w-32 items-center justify-center text-indigo-500">
                <svg width="100" height="80" viewBox="0 0 100 80" fill="none" className="overflow-visible">
                  <path 
                    d="M 90 0 C 15 0, 15 80, 90 80" 
                    stroke="url(#gradient-left)" 
                    strokeWidth="3.5" 
                    strokeDasharray="6 6"
                  />
                  <circle cx="90" cy="80" r="5" fill="#F59E0B" />
                  <defs>
                    <linearGradient id="gradient-left" x1="100%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#8B5CF6" />
                      <stop offset="100%" stopColor="#F59E0B" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            </div>

            {/* ROW 3: Steps 07 -> 08 -> 09 (Left to Right -> Final Goal in Germany) */}
            <div className="relative">
              <div className="grid grid-cols-3 gap-8">
                {row3Steps.map(({ step, index }) => {
                  const theme = STEP_THEMES[index];
                  const isHovered = activeStep === index;
                  const isFinalStep = index === 8;

                  return (
                    <Reveal key={step.title} delay={index * 60}>
                      <div 
                        onMouseEnter={() => setActiveStep(index)}
                        onMouseLeave={() => setActiveStep(null)}
                        className={`group relative rounded-3xl border transition-all duration-300 ${theme.border} bg-gradient-to-b ${theme.bg} dark:bg-none dark:bg-[#1c1815] p-7 ${isFinalStep ? 'border-2 border-emerald-500 dark:border-emerald-400 bg-gradient-to-b from-emerald-500/15 via-teal-500/10 to-white dark:bg-none dark:bg-gradient-to-b dark:from-emerald-950/60 dark:via-[#1c1815] dark:to-[#1c1815] shadow-floating' : ''} ${isHovered ? `${theme.glow} -translate-y-1.5 bg-white dark:bg-[#231f1c]` : 'bg-white/95 dark:bg-[#1c1815] shadow-soft'}`}
                      >
                        {isFinalStep && (
                          <div className="absolute -top-3.5 end-6 rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-1 text-xs font-black text-white shadow-md">
                            🎯 Objectif Atteint
                          </div>
                        )}

                        <div className="mb-5 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className={`flex h-14 w-14 items-center justify-center rounded-2xl ${theme.badgeBg} shadow-sm transition-transform duration-300 group-hover:scale-110`}>
                              <Icon name={step.icon} className="text-[28px]" />
                            </span>
                            <span className="text-2xl font-black text-outline/80 dark:text-zinc-500">0{index + 1}</span>
                          </div>
                          <span className="rounded-full border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#28231f] px-3 py-1 text-xs font-bold text-onSurface-variant dark:text-zinc-300">
                            {theme.tag}
                          </span>
                        </div>

                        <h3 className="text-lg font-black leading-snug text-emerald-950 dark:text-white">
                          {step.title}
                        </h3>
                        <p className="mt-2 text-sm leading-relaxed text-onSurface-variant dark:text-zinc-300">
                          {step.body}
                        </p>

                        <div className="mt-5 flex items-center justify-between border-t border-slate-200/60 dark:border-white/10 pt-3 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                          <span>{isFinalStep ? 'Embauche directe' : `Étape ${index + 1}/9`}</span>
                          <Icon name={isFinalStep ? 'verified' : 'arrow_forward'} className="text-base" />
                        </div>
                      </div>
                    </Reveal>
                  );
                })}
              </div>
            </div>

          </div>
        </div>

        {/* ------------------------------------------------------------------------- */}
        {/* MOBILE & TABLET SERPENTINE FLOWING S-PATH                                 */}
        {/* ------------------------------------------------------------------------- */}
        <div className="relative mt-16 space-y-6 lg:hidden">
          {/* Flowing connector line behind steps */}
          <div className="absolute start-7 top-6 bottom-6 w-1 rounded-full bg-gradient-to-b from-emerald-500 via-teal-500 via-indigo-500 to-emerald-600" />

          {journey.items.map((step, index) => {
            const theme = STEP_THEMES[index];
            const isFinal = index === 8;
            const isSelected = activeStep === index;

            return (
              <Reveal key={step.title} delay={index * 40}>
                <div
                  onClick={() => setActiveStep(isSelected ? null : index)}
                  className="relative flex items-start gap-4 ps-2 cursor-pointer active:scale-[0.98] transition-transform"
                >
                  {/* Glowing Node Icon */}
                  <div className={`relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${theme.badgeBg} shadow-md ring-4 ring-surface dark:ring-[#12100e] ${isSelected ? 'scale-110 ring-emerald-500/40' : ''} transition-all`}>
                    <Icon name={step.icon} className="text-2xl" />
                  </div>

                  {/* Step Card Content */}
                  <div className={`flex-1 rounded-2xl border ${isSelected ? 'border-emerald-500 bg-white dark:bg-[#201c18] shadow-floating' : `${theme.border} bg-white dark:bg-[#1c1815]`} p-5 shadow-soft transition-all`}>
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <span className="text-xs font-black uppercase text-emerald-700 dark:text-emerald-400">
                        Étape 0{index + 1}
                      </span>
                      <span className="rounded-full bg-slate-100 dark:bg-[#28231f] px-2.5 py-0.5 text-[11px] font-bold text-onSurface-variant dark:text-zinc-300">
                        {theme.tag}
                      </span>
                    </div>
                    <h3 className="text-base font-black text-emerald-950 dark:text-white">
                      {step.title}
                    </h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-onSurface-variant dark:text-zinc-300">
                      {step.body}
                    </p>
                    {isFinal && (
                      <div className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 px-3 py-1.5 text-xs font-extrabold text-emerald-800 dark:text-emerald-300 shadow-xs">
                        <span>🎯 Objectif : CDI & Embauche directe en Allemagne</span>
                      </div>
                    )}
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>

      </div>
    </section>
  );
}
