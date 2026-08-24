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
 *
 * Les valeurs vivent dans ./colors.json (JSON pur, sans logique) :
 *   - success reprend primary : deux verts distincts sur un même écran se
 *     liraient comme deux marques ;
 *   - attention est l'or assombri jusqu'au ratio AA sur blanc, pour les
 *     états intermédiaires des écrans ops (dossier en attente, relance due).
 * ------------------------------------------------------------------ */
const palette = require('./colors.json');

/* ------------------------------------------------------------------ *
 * Thème Tailwind
 * ------------------------------------------------------------------ */
/*
 * Les couleurs référencent des variables CSS (`var(--x)`) plutôt que les
 * valeurs `palette.x` en dur : c'est ce qui permet au dark mode de repeindre
 * toute l'app en ne redéfinissant que les variables (cf. `.dark` dans
 * globals.css), sans toucher aux classes Tailwind elles-mêmes.
 */
const preset = {
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'var(--primary)',
          dark: 'var(--primary-dark)',
          light: 'var(--primary-light)',
        },
        secondary: {
          DEFAULT: 'var(--secondary)',
          dark: 'var(--secondary-dark)',
          light: 'var(--secondary-light)',
        },
        tertiary: {
          DEFAULT: 'var(--tertiary)',
          dark: 'var(--tertiary-dark)',
          light: 'var(--tertiary-light)',
        },
        gold: {
          DEFAULT: 'var(--secondary)',
          dark: 'var(--secondary-dark)',
          light: 'var(--secondary-light)',
        },
        error: {
          DEFAULT: 'var(--error)',
          light: 'var(--error-light)',
        },
        success: {
          DEFAULT: 'var(--success)',
          light: 'var(--success-light)',
        },
        attention: {
          DEFAULT: 'var(--attention)',
          light: 'var(--attention-light)',
        },

        /* Conteneurs et « on- » en notation plate, telle qu'employée par les
           classes existantes de l'espace candidat. */
        'primary-container': 'var(--primary)',
        'on-primary': 'var(--on-primary)',
        'on-primary-container': 'var(--on-primary-container)',
        'secondary-container': 'var(--secondary)',
        'on-secondary': 'var(--on-secondary)',
        'on-secondary-container': 'var(--on-secondary-container)',
        'tertiary-container': 'var(--tertiary)',
        'on-tertiary': 'var(--on-tertiary)',
        'on-tertiary-container': 'var(--on-tertiary-container)',
        'on-error': 'var(--on-error)',
        'on-error-container': 'var(--on-error-container)',
        'on-attention-container': 'var(--on-attention-container)',

        /* Et en notation imbriquée, pour `text-onSurface-variant` & co. */
        onPrimary: { DEFAULT: 'var(--on-primary)', container: 'var(--on-primary-container)' },
        onSecondary: { DEFAULT: 'var(--on-secondary)', container: 'var(--on-secondary-container)' },
        onTertiary: { DEFAULT: 'var(--on-tertiary)', container: 'var(--on-tertiary-container)' },
        onError: { DEFAULT: 'var(--on-error)', container: 'var(--on-error-container)' },
        onGold: { DEFAULT: 'var(--on-secondary-container)' },

        surface: {
          DEFAULT: 'var(--surface)',
          bright: 'var(--surface-bright)',
          dim: 'var(--surface-dim)',
          lowest: 'var(--surface-lowest)',
          low: 'var(--surface-low)',
          container: 'var(--surface-container)',
          high: 'var(--surface-high)',
          highest: 'var(--surface-highest)',
        },
        'surface-container-lowest': 'var(--surface-lowest)',
        'surface-container-low': 'var(--surface-low)',
        'surface-container': 'var(--surface-container)',
        'surface-container-high': 'var(--surface-high)',
        'surface-container-highest': 'var(--surface-highest)',
        'surface-bright': 'var(--surface-bright)',
        'surface-dim': 'var(--surface-dim)',

        onSurface: { DEFAULT: 'var(--on-surface)', variant: 'var(--on-surface-variant)' },
        'on-surface': 'var(--on-surface)',
        'on-surface-variant': 'var(--on-surface-variant)',

        outline: { DEFAULT: 'var(--outline)', variant: 'var(--outline-variant)' },
        'outline-variant': 'var(--outline-variant)',
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
  '--on-primary-container': palette.onPrimaryContainer,

  '--secondary': palette.secondary,
  '--secondary-dark': palette.secondaryDark,
  '--secondary-light': palette.secondaryLight,
  '--gold': palette.secondary,
  '--on-secondary': palette.onSecondary,
  '--on-secondary-container': palette.onSecondaryContainer,

  '--tertiary': palette.tertiary,
  '--tertiary-dark': palette.tertiaryDark,
  '--tertiary-light': palette.tertiaryLight,
  '--on-tertiary': palette.onTertiary,
  '--on-tertiary-container': palette.onTertiaryContainer,

  '--error': palette.error,
  '--error-light': palette.errorLight,
  '--on-error': palette.onError,
  '--on-error-container': palette.onErrorContainer,

  '--success': palette.success,
  '--success-light': palette.successLight,

  '--attention': palette.attention,
  '--attention-light': palette.attentionLight,
  '--on-attention-container': palette.onAttentionContainer,

  '--background': palette.surface,
  '--surface': palette.surface,
  '--surface-bright': palette.surfaceBright,
  '--surface-dim': palette.surfaceDim,
  '--surface-lowest': palette.surfaceLowest,
  '--surface-low': palette.surfaceLow,
  '--surface-container': palette.surfaceContainer,
  '--surface-high': palette.surfaceHigh,
  '--surface-highest': palette.surfaceHighest,

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
