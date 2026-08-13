/*
 * Source unique des tokens de design — partagée par les deux applications :
 * l'espace candidat (user-app, Next.js) et l'espace opérationnel
 * recruteur/admin/agent (web-admin, Vite). Une couleur ne se définit qu'ici.
 *
 * Les deux surfaces consomment ce fichier de la même façon, via un `require`
 * relatif depuis leur propre `tailwind.config.js` : pas de dépendance npm à
 * installer, pas de chemin CSS à résoudre hors de la racine de chaque app.
 *
 * `preset`  → thème Tailwind (couleurs, typo, rayons, ombres, animations).
 * `cssVars` → les mêmes valeurs en variables CSS, pour le CSS qui ne passe
 *             pas par Tailwind (états natifs, styles tiers).
 */

/* ------------------------------------------------------------------ *
 * Palette Pillar Foundation — vert sarcelle (primaire), or (secondaire),
 * bordeaux (tertiaire). Reprise de la charte candidat, qui porte le logo.
 * ------------------------------------------------------------------ */
const palette = {
  primary: '#006266',
  primaryDark: '#004245',
  primaryLight: '#C8E5E6',
  onPrimary: '#FFFFFF',
  onPrimaryContainer: '#002021',

  secondary: '#D4AF37',
  secondaryDark: '#855300',
  secondaryLight: '#FFDF9A',
  onSecondary: '#FFFFFF',
  onSecondaryContainer: '#251A00',

  tertiary: '#800020',
  tertiaryDark: '#4A0012',
  tertiaryLight: '#FFD9DE',
  onTertiary: '#FFFFFF',
  onTertiaryContainer: '#3F000E',

  error: '#BA1A1A',
  errorLight: '#FFDAD6',
  onError: '#FFFFFF',
  onErrorContainer: '#410002',

  /* Le vert primaire fait aussi office de succès : deux verts distincts sur
     un même écran se liraient comme deux marques. */
  success: '#006266',
  successLight: '#C8E5E6',

  /* « Attention » couvre les états intermédiaires des écrans ops (dossier en
     attente, relance due). C'est l'or assombri jusqu'au ratio AA sur blanc. */
  attention: '#855300',
  attentionLight: '#FFDF9A',
  onAttentionContainer: '#251A00',

  surface: '#F9F9FF',
  surfaceBright: '#F9F9FF',
  surfaceDim: '#CFDAF2',
  surfaceLowest: '#FFFFFF',
  surfaceLow: '#F0F3FF',
  surfaceContainer: '#EDEEEF',
  surfaceHigh: '#E7E8E9',
  surfaceHighest: '#E1E3E4',

  onSurface: '#191C1D',
  onSurfaceVariant: '#43474E',

  outline: '#74777F',
  outlineVariant: '#C4C6CF',
};

/* ------------------------------------------------------------------ *
 * Thème Tailwind
 * ------------------------------------------------------------------ */
const preset = {
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: palette.primary,
          dark: palette.primaryDark,
          light: palette.primaryLight,
        },
        secondary: {
          DEFAULT: palette.secondary,
          dark: palette.secondaryDark,
          light: palette.secondaryLight,
        },
        tertiary: {
          DEFAULT: palette.tertiary,
          dark: palette.tertiaryDark,
          light: palette.tertiaryLight,
        },
        gold: {
          DEFAULT: palette.secondary,
          dark: palette.secondaryDark,
          light: palette.secondaryLight,
        },
        error: {
          DEFAULT: palette.error,
          light: palette.errorLight,
        },
        success: {
          DEFAULT: palette.success,
          light: palette.successLight,
        },
        attention: {
          DEFAULT: palette.attention,
          light: palette.attentionLight,
        },

        /* Conteneurs et « on- » en notation plate, telle qu'employée par les
           classes existantes de l'espace candidat. */
        'primary-container': palette.primary,
        'on-primary': palette.onPrimary,
        'on-primary-container': palette.onPrimaryContainer,
        'secondary-container': palette.secondary,
        'on-secondary': palette.onSecondary,
        'on-secondary-container': palette.onSecondaryContainer,
        'tertiary-container': palette.tertiary,
        'on-tertiary': palette.onTertiary,
        'on-tertiary-container': palette.onTertiaryContainer,
        'on-error': palette.onError,
        'on-error-container': palette.onErrorContainer,
        'on-attention-container': palette.onAttentionContainer,

        /* Et en notation imbriquée, pour `text-onSurface-variant` & co. */
        onPrimary: { DEFAULT: palette.onPrimary, container: palette.onPrimaryContainer },
        onSecondary: { DEFAULT: palette.onSecondary, container: palette.onSecondaryContainer },
        onTertiary: { DEFAULT: palette.onTertiary, container: palette.onTertiaryContainer },
        onError: { DEFAULT: palette.onError, container: palette.onErrorContainer },
        onGold: { DEFAULT: palette.onSecondaryContainer },

        surface: {
          DEFAULT: palette.surface,
          bright: palette.surfaceBright,
          dim: palette.surfaceDim,
          lowest: palette.surfaceLowest,
          low: palette.surfaceLow,
          container: palette.surfaceContainer,
          high: palette.surfaceHigh,
          highest: palette.surfaceHighest,
        },
        'surface-container-lowest': palette.surfaceLowest,
        'surface-container-low': palette.surfaceLow,
        'surface-container': palette.surfaceContainer,
        'surface-container-high': palette.surfaceHigh,
        'surface-container-highest': palette.surfaceHighest,
        'surface-bright': palette.surfaceBright,
        'surface-dim': palette.surfaceDim,

        onSurface: { DEFAULT: palette.onSurface, variant: palette.onSurfaceVariant },
        'on-surface': palette.onSurface,
        'on-surface-variant': palette.onSurfaceVariant,

        outline: { DEFAULT: palette.outline, variant: palette.outlineVariant },
        'outline-variant': palette.outlineVariant,
      },

      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        /* Réservée aux colonnes chiffrées des tableaux ops, où l'alignement
           des chiffres prime sur l'uniformité typographique. */
        mono: ['IBM Plex Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },

      spacing: {
        /* La hauteur de contrôle du produit — 52px, celle des boutons et des
           champs sur les deux surfaces. Absente de l'échelle Tailwind. */
        13: '3.25rem',
      },

      borderRadius: {
        pillar: '8px',
        element: '8px',
        card: '16px',
      },

      boxShadow: {
        soft: '0px 4px 20px rgba(0, 98, 102, 0.05)',
        floating: '0px 8px 30px rgba(0, 98, 102, 0.12)',
        subtle: '0px 4px 20px rgba(0, 0, 0, 0.05)',
      },

      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fillBar: {
          '0%': { transform: 'scaleX(0)' },
          '100%': { transform: 'scaleX(1)' },
        },
        pulseRing: {
          '0%': { transform: 'scale(0.95)', opacity: '0.8' },
          '50%': { transform: 'scale(1.05)', opacity: '0.4' },
          '100%': { transform: 'scale(0.95)', opacity: '0.8' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in': 'fadeIn 800ms cubic-bezier(0.4, 0, 0.2, 1) forwards',
        'fill-bar': 'fillBar 2.2s ease-out forwards',
        'pulse-ring': 'pulseRing 2s infinite ease-in-out',
        'slide-up': 'slideUp 500ms cubic-bezier(0.16, 1, 0.3, 1) forwards',
      },
    },
  },
};

/* ------------------------------------------------------------------ *
 * Variables CSS — mêmes valeurs, injectées sur :root par chaque app.
 * ------------------------------------------------------------------ */
const cssVars = {
  '--primary': palette.primary,
  '--primary-dark': palette.primaryDark,
  '--primary-light': palette.primaryLight,
  '--primary-container': palette.primary,
  '--on-primary': palette.onPrimary,

  '--secondary': palette.secondary,
  '--secondary-dark': palette.secondaryDark,
  '--gold': palette.secondary,

  '--tertiary': palette.tertiary,

  '--error': palette.error,
  '--error-light': palette.errorLight,
  '--success': palette.success,
  '--attention': palette.attention,
  '--attention-light': palette.attentionLight,

  '--background': palette.surface,
  '--surface': palette.surface,
  '--surface-lowest': palette.surfaceLowest,
  '--surface-container': palette.surfaceContainer,

  '--on-surface': palette.onSurface,
  '--on-surface-variant': palette.onSurfaceVariant,

  '--outline': palette.outline,
  '--outline-variant': palette.outlineVariant,

  '--font-body': "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  '--font-mono': "'IBM Plex Mono', ui-monospace, SFMono-Regular, monospace",

  '--sp-xs': '4px',
  '--sp-sm': '8px',
  '--sp-md': '16px',
  '--sp-lg': '24px',
  '--sp-xl': '32px',
  '--sp-xxl': '48px',

  '--radius-sm': '8px',
  '--radius-md': '8px',
  '--radius-lg': '16px',
};

module.exports = { palette, preset, cssVars };
