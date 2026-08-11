/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Pillar Foundation brand system — green (primary), gold (secondary), burgundy (tertiary).
        primary: {
          DEFAULT: '#1B5E37',
          dark: '#004523',
          light: '#C8E6C9',
        },
        'primary-container': '#1B5E37',
        'on-primary': '#FFFFFF',
        'on-primary-container': '#92D5A4',
        onPrimary: {
          DEFAULT: '#FFFFFF',
          container: '#00210B',
        },
        secondary: {
          DEFAULT: '#D4AF37',
          dark: '#855300',
          light: '#FFDF9A',
        },
        'secondary-container': '#D4AF37',
        'on-secondary': '#FFFFFF',
        onSecondary: {
          DEFAULT: '#FFFFFF',
          container: '#251A00',
        },
        tertiary: {
          DEFAULT: '#800020',
          dark: '#4A0012',
          light: '#FFD9DE',
        },
        'tertiary-container': '#2A3A4F',
        'on-tertiary': '#FFFFFF',
        onTertiary: {
          DEFAULT: '#FFFFFF',
          container: '#3F000E',
        },
        gold: {
          DEFAULT: '#D4AF37',
          dark: '#855300',
          light: '#FFDF9A',
        },
        onGold: {
          DEFAULT: '#251A00',
        },
        error: {
          DEFAULT: '#BA1A1A',
          light: '#FFDAD6',
        },
        onError: {
          DEFAULT: '#FFFFFF',
          container: '#410002',
        },
        surface: {
          DEFAULT: '#F9F9FF',
          bright: '#F9F9FF',
          container: '#EDEEEF',
          high: '#E7E8E9',
          highest: '#E1E3E4',
          low: '#F0F3FF',
          lowest: '#FFFFFF',
          dim: '#CFDAF2',
        },
        'surface-container-low': '#F0F3FF',
        'surface-container': '#EDEEEF',
        'surface-container-high': '#E7E8E9',
        'surface-container-highest': '#E1E3E4',
        'surface-container-lowest': '#FFFFFF',
        'surface-bright': '#F9F9FF',
        'surface-dim': '#CFDAF2',
        onSurface: {
          DEFAULT: '#191C1D',
          variant: '#43474E',
        },
        'on-surface': '#191C1D',
        'on-surface-variant': '#43474E',
        outline: {
          DEFAULT: '#74777F',
          variant: '#C4C6CF',
        },
        'outline-variant': '#C4C6CF',
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
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
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

