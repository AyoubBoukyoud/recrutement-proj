/** @type {import('tailwindcss').Config} */
const plugin = require('tailwindcss/plugin');
const { preset, cssVars } = require('../packages/design-tokens/tokens.cjs');
const colorTokens = require('../packages/design-tokens/colors.json');

/*
 * Palette du module `/amud` (espaces Admin / Commercial / Employeur / Candidat
 * portés depuis les maquettes Amud Skills). Namespace dédié (`amud-*`) pour ne
 * jamais entrer en collision avec les tokens `primary`/`secondary`/... du
 * preset partagé, qui gardent un sens différent sur le reste du produit —
 * les deux vivent sous des clés distinctes (`brand`/`amud`) dans
 * packages/design-tokens/colors.json, jamais fusionnées.
 *
 * Valeurs claires « source de vérité » — converties en variables CSS
 * (`amud` ci-dessous) pour que le dark mode puisse les repeindre via `.dark`
 * dans globals.css, sans toucher aux classes Tailwind `bg-amud-*` elles-mêmes.
 */
const amudLight = colorTokens.amud.light;

// `bg-amud-primary` etc. résolvent vers `var(--amud-primary)` : la valeur
// vient de `amudLight` par défaut sur `:root` (injectée plus bas) et se
// repeint sous `.dark` dans globals.css.
const amud = Object.fromEntries(Object.keys(amudLight).map((key) => [key, `var(--amud-${key})`]));
const amudCssVars = Object.fromEntries(Object.entries(amudLight).map(([key, value]) => [`--amud-${key}`, value]));

module.exports = {
  darkMode: 'class',
  presets: [preset],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: { amud },
      // Échelle réutilisée telle quelle par les pages du module `/amud`
      // (identique dans les 19 maquettes sources).
      spacing: {
        xs: '4px',
        sm: '8px',
        base: '8px',
        md: '16px',
        lg: '24px',
        xl: '32px',
        gutter: '24px',
        'margin-mobile': '16px',
        'margin-desktop': '48px',
        // Ajoutée pour les 3 pages marketing `/amud/marketing/*`.
        'section-gap': '80px',
      },
      maxWidth: {
        'container-max': '1280px',
      },
      borderRadius: {
        DEFAULT: '0.25rem',
        lg: '0.5rem',
        xl: '0.75rem',
        full: '9999px',
      },
      fontSize: {
        'display-lg': ['48px', { lineHeight: '56px', letterSpacing: '-0.02em', fontWeight: '700' }],
        'headline-lg': ['32px', { lineHeight: '40px', letterSpacing: '-0.01em', fontWeight: '600' }],
        'headline-lg-mobile': ['28px', { lineHeight: '36px', fontWeight: '600' }],
        'headline-md': ['24px', { lineHeight: '32px', fontWeight: '600' }],
        'title-lg': ['20px', { lineHeight: '28px', fontWeight: '600' }],
        'body-lg': ['18px', { lineHeight: '28px', fontWeight: '400' }],
        'body-md': ['16px', { lineHeight: '24px', fontWeight: '400' }],
        'label-md': ['14px', { lineHeight: '20px', letterSpacing: '0.01em', fontWeight: '500' }],
        'label-sm': ['12px', { lineHeight: '16px', fontWeight: '600' }],
      },
      // Micro-animations Tailwind pur pour le module `/amud` (popups, toasts,
      // cartes, lignes de tableau) — pas de lib externe (framer-motion...).
      keyframes: {
        'amud-fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'amud-scale-in': { from: { opacity: '0', transform: 'scale(0.95)' }, to: { opacity: '1', transform: 'scale(1)' } },
        'amud-slide-in-right': { from: { opacity: '0', transform: 'translateX(16px)' }, to: { opacity: '1', transform: 'translateX(0)' } },
        'amud-rise-in': { from: { opacity: '0', transform: 'translateY(6px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        // Entrée des bottom-sheets mobiles (Modal < sm, Drawer anchor="bottom").
        'amud-sheet-up': { from: { opacity: '0', transform: 'translateY(24px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        // Entrée du tiroir de navigation mobile (SiteHeader, hors module /amud) :
        // ancré sous le header, donc glisse depuis le haut plutôt que le bas.
        'menu-drawer-in': { from: { opacity: '0', transform: 'translateY(-12px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
      },
      animation: {
        'amud-fade-in': 'amud-fade-in 0.2s ease-out',
        'amud-scale-in': 'amud-scale-in 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
        'amud-slide-in-right': 'amud-slide-in-right 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        'amud-rise-in': 'amud-rise-in 0.25s ease-out both',
        'amud-sheet-up': 'amud-sheet-up 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
        'menu-drawer-in': 'menu-drawer-in 0.28s cubic-bezier(0.16, 1, 0.3, 1) both',
      },
    },
  },
  plugins: [
    // Les mêmes tokens en variables CSS, pour le CSS hors Tailwind de globals.css.
    plugin(({ addBase }) => addBase({ ':root': { ...cssVars, ...amudCssVars } })),
  ],
};
