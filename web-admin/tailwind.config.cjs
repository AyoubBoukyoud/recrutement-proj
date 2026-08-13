/** @type {import('tailwindcss').Config} */
const plugin = require('tailwindcss/plugin');
const { preset, cssVars } = require('../packages/design-tokens/tokens.cjs');

module.exports = {
  presets: [preset],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      // Densité « ops » : les écrans recruteur/admin affichent des tableaux,
      // là où l'espace candidat affiche des cartes. Même palette, pas dans
      // partout la même respiration.
      spacing: {
        row: '2.75rem',
      },
    },
  },
  plugins: [
    plugin(({ addBase }) => addBase({ ':root': cssVars })),
  ],
};
