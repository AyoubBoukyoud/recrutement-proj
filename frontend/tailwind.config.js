/** @type {import('tailwindcss').Config} */
const plugin = require('tailwindcss/plugin');
const { preset, cssVars } = require('../packages/design-tokens/tokens.cjs');

module.exports = {
  presets: [preset],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  plugins: [
    // Les mêmes tokens en variables CSS, pour le CSS hors Tailwind de globals.css.
    plugin(({ addBase }) => addBase({ ':root': cssVars })),
  ],
};
