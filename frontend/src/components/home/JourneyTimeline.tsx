'use client';

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
 * Le parcours complet, du Maroc à l'Allemagne.
 *
 * Neuf étapes présentées comme une grille éditoriale : un filet en haut de
 * chaque étape, un numéro, une ligne de texte. La version précédente dessinait
 * un serpentin en SVG avec neuf teintes différentes et trois rendus séparés
 * (desktop / tablette / mobile) — spectaculaire au premier coup d'œil, mais
 * c'était le bloc le plus long de la page pour l'information la moins dense.
 */
export function JourneyTimeline() {
  const { journey } = useHomeContent();

  return (
    <section className="border-y border-outline-variant/50 bg-surface-container/40 py-20 lg:py-28">
      <div className="mx-auto max-w-[1280px] px-6 lg:px-12">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            <span>{journey.startLabel}</span>
            <Icon name="trending_flat" className="text-base rtl:rotate-180" />
            <span>{journey.endLabel}</span>
          </p>
          <h2 className="mt-3 text-3xl font-bold leading-tight tracking-tight text-primary-dark sm:text-4xl">
            {journey.title}
          </h2>
          <p className="mt-4 text-base leading-relaxed text-onSurface-variant sm:text-lg">
            {journey.subtitle}
          </p>
        </Reveal>

        <ol className="mt-14 grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
          {journey.items.map((step, index) => (
            <li key={step.title} className="h-full">
              <Reveal delay={(index % 3) * 70} className="h-full border-t border-outline-variant/70 pt-5">
                <div className="flex items-center gap-3">
                  <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${STEP_THEMES[index % STEP_THEMES.length].badgeBg}`}>
                    <Icon name={step.icon} className="text-xl" />
                  </span>
                  <span className="text-xs font-semibold tracking-[0.2em] text-outline">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                </div>

                <h3 className="mt-4 text-base font-bold leading-snug text-primary-dark">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-onSurface-variant">{step.body}</p>
              </Reveal>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
