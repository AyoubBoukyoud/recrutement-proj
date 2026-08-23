/** @type {import('tailwindcss').Config} */
const plugin = require('tailwindcss/plugin');
const { preset, cssVars } = require('../packages/design-tokens/tokens.cjs');

/*
 * Palette du module `/amud` (espaces Admin / Commercial / Employeur / Candidat
 * portés depuis les maquettes Amud Skills). Namespace dédié (`amud-*`) pour ne
 * jamais entrer en collision avec les tokens `primary`/`secondary`/... du
 * preset partagé, qui gardent un sens différent sur le reste du produit.
 *
 * Toutes les teintes non-vertes sont reprises telles quelles des maquettes.
 * Les teintes vertes (primary*) sont recalculées à partir du vert du projet
 * (`palette.primary` = #006266, cf. packages/design-tokens/tokens.cjs) pour
 * respecter la charte existante plutôt que le vert forêt des maquettes.
 */
const amud = {
  primary: '#006266',
  'primary-dark': '#004245',
  'primary-light': '#C8E5E6',
  'primary-container': '#0B7A80',
  'on-primary': '#ffffff',
  'on-primary-container': '#002021',
  'primary-fixed': '#C8E5E6',
  'primary-fixed-dim': '#6FB3B6',
  'on-primary-fixed': '#002021',
  'on-primary-fixed-variant': '#004245',
  'inverse-primary': '#C8E5E6',
  'surface-tint': '#006266',

  secondary: '#b02d2c',
  'secondary-container': '#fe665f',
  'on-secondary': '#ffffff',
  'on-secondary-container': '#690009',
  'secondary-fixed': '#ffdad6',
  'secondary-fixed-dim': '#ffb3ad',
  'on-secondary-fixed': '#410003',
  'on-secondary-fixed-variant': '#8e1217',

  tertiary: '#4c3800',
  'tertiary-container': '#694e00',
  'on-tertiary': '#ffffff',
  'on-tertiary-container': '#f6bd1c',
  'tertiary-fixed': '#ffdf9a',
  'tertiary-fixed-dim': '#f7be1d',
  'on-tertiary-fixed': '#251a00',
  'on-tertiary-fixed-variant': '#5a4300',

  error: '#ba1a1a',
  'error-container': '#ffdad6',
  'on-error': '#ffffff',
  'on-error-container': '#93000a',

  background: '#f9f9ff',
  'on-background': '#111c2d',
  surface: '#f9f9ff',
  'surface-bright': '#f9f9ff',
  'surface-dim': '#cfdaf2',
  'surface-variant': '#d8e3fb',
  'surface-container-lowest': '#ffffff',
  'surface-container-low': '#f0f3ff',
  'surface-container': '#e7eeff',
  'surface-container-high': '#dee8ff',
  'surface-container-highest': '#d8e3fb',
  'on-surface': '#111c2d',
  'on-surface-variant': '#404941',
  'inverse-surface': '#263143',
  'inverse-on-surface': '#ecf1ff',

  outline: '#707970',
  'outline-variant': '#c0c9bf',
};

module.exports = {
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
      },
      animation: {
        'amud-fade-in': 'amud-fade-in 0.2s ease-out',
        'amud-scale-in': 'amud-scale-in 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
        'amud-slide-in-right': 'amud-slide-in-right 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        'amud-rise-in': 'amud-rise-in 0.25s ease-out both',
        'amud-sheet-up': 'amud-sheet-up 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [
    // Les mêmes tokens en variables CSS, pour le CSS hors Tailwind de globals.css.
    plugin(({ addBase }) => addBase({ ':root': cssVars })),
  ],
};
