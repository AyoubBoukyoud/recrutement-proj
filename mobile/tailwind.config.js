/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Pillar Foundation brand system — green (primary), gold (secondary), burgundy (tertiary).
        // Couleurs branchées sur les variables CSS de globals.css : DEFAULT/light permutent
        // en mode sombre (classe .dark sur <html>, pilotée par next-themes) pour rester lisibles.
        primary: {
          DEFAULT: 'var(--primary)',
          dark: 'var(--primary-dark)',
          light: 'var(--primary-light)',
        },
        'primary-container': 'var(--primary)',
        'on-primary': 'var(--on-primary)',
        'on-primary-container': '#92D5A4',
        onPrimary: {
          DEFAULT: 'var(--on-primary)',
          container: '#00210B',
        },
        secondary: {
          DEFAULT: 'var(--secondary)',
          dark: 'var(--secondary-dark)',
          light: 'var(--secondary-light)',
        },
        'secondary-container': 'var(--secondary)',
        'on-secondary': 'var(--on-secondary)',
        onSecondary: {
          DEFAULT: 'var(--on-secondary)',
          container: '#251A00',
        },
        tertiary: {
          DEFAULT: 'var(--tertiary)',
          dark: 'var(--tertiary-dark)',
          light: 'var(--tertiary-light)',
        },
        'tertiary-container': '#2A3A4F',
        'on-tertiary': 'var(--on-tertiary)',
        onTertiary: {
          DEFAULT: 'var(--on-tertiary)',
          container: '#3F000E',
        },
        gold: {
          DEFAULT: 'var(--gold)',
          dark: 'var(--gold-dark)',
          light: 'var(--gold-light)',
        },
        onGold: {
          DEFAULT: '#251A00',
        },
        error: {
          DEFAULT: 'var(--error)',
          light: 'var(--error-light)',
        },
        onError: {
          DEFAULT: 'var(--on-error)',
          container: '#410002',
        },
        surface: {
          DEFAULT: 'var(--background)',
          bright: 'var(--surface-bright)',
          container: 'var(--surface-container)',
          high: 'var(--surface-container-high)',
          highest: 'var(--surface-container-highest)',
          low: 'var(--surface-container-low)',
          lowest: 'var(--surface-lowest)',
          dim: 'var(--surface-dim)',
        },
        'surface-container-low': 'var(--surface-container-low)',
        'surface-container': 'var(--surface-container)',
        'surface-container-high': 'var(--surface-container-high)',
        'surface-container-highest': 'var(--surface-container-highest)',
        'surface-container-lowest': 'var(--surface-lowest)',
        'surface-bright': 'var(--surface-bright)',
        'surface-dim': 'var(--surface-dim)',
        onSurface: {
          DEFAULT: 'var(--on-surface)',
          variant: 'var(--on-surface-variant)',
        },
        'on-surface': 'var(--on-surface)',
        'on-surface-variant': 'var(--on-surface-variant)',
        outline: {
          DEFAULT: 'var(--outline)',
          variant: 'var(--outline-variant)',
        },
        'outline-variant': 'var(--outline-variant)',
        // Legacy aliases kept so any existing un-migrated class still resolves cleanly.
        navy: {
          900: '#1B5E37',
          800: '#004523',
          700: '#134A2B',
          100: '#C8E6C9',
        },
        amber: {
          500: '#D4AF37',
          600: '#855300',
          700: '#855300',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      borderRadius: {
        pillar: '8px',
        card: '16px',
        element: '8px',
      },
      boxShadow: {
        soft: '0px 4px 20px rgba(27, 94, 55, 0.05)',
        floating: '0px 8px 30px rgba(27, 94, 55, 0.12)',
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
  plugins: [],
};

