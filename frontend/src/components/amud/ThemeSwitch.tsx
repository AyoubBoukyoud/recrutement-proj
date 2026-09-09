'use client';

import { useTheme } from '@/context/ThemeContext';

/**
 * Interrupteur clair/sombre à glissière (piste sombre, icône lune/soleil aux
 * extrémités) — remplace le bouton icône + menu à 3 options (`ThemeToggle`)
 * dans la console admin, où l'espace en tête de page privilégie un geste
 * direct plutôt qu'un menu. Bascule vers `light`/`dark` explicitement ; le
 * mode `system` reste accessible ailleurs (menu clair/sombre/système) pour
 * qui le préfère.
 */
export function ThemeSwitch() {
  const { resolvedTheme, setMode } = useTheme();
  const isDark = resolvedTheme === 'dark';

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? 'Passer en mode clair' : 'Passer en mode sombre'}
      onClick={() => setMode(isDark ? 'light' : 'dark')}
      className="relative inline-flex h-8 w-16 shrink-0 items-center rounded-full border border-white/10 bg-[#161c2c] px-1.5 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amud-primary"
    >
      <span
        className="material-symbols-outlined pointer-events-none absolute left-1.5 text-[16px] text-amber-400 transition-opacity duration-200"
        style={{ fontVariationSettings: "'FILL' 1", opacity: isDark ? 1 : 0 }}
      >
        nights_stay
      </span>
      <span
        className="material-symbols-outlined pointer-events-none absolute right-1.5 text-[16px] text-amber-300 transition-opacity duration-200"
        style={{ fontVariationSettings: "'FILL' 1", opacity: isDark ? 0 : 1 }}
      >
        light_mode
      </span>
      <span
        className={`z-10 h-6 w-6 rounded-full bg-slate-400 shadow-sm transition-transform duration-200 ${
          isDark ? 'translate-x-7' : 'translate-x-0'
        }`}
      />
    </button>
  );
}
