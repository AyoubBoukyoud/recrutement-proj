import { createRequire } from 'node:module';
import withPWAInit from 'next-pwa';
import runtimeCaching from 'next-pwa/cache.js';

/*
 * La palette partagée, lue à la construction. Tout ce qui passe par Tailwind
 * tient ses couleurs du preset ; restent les endroits où il n'y a pas de
 * classe possible — `themeColor`, le manifeste PWA, un canvas de QR code, un
 * `stroke` SVG. Les exposer ici leur évite de recopier des valeurs qui
 * dériveraient ensuite de packages/design-tokens en silence.
 */
const { palette } = createRequire(import.meta.url)('../packages/design-tokens/tokens.cjs');

const withPWA = withPWAInit({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
  runtimeCaching,
  fallbacks: {
    document: '/offline',
  },
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    /*
     * Next ne substitue à la compilation que les variables `NEXT_PUBLIC_*`
     * réellement définies : absente, `process.env.NEXT_PUBLIC_USE_MOCKS`
     * reste une lecture à l'exécution, la condition des dépôts ne se replie
     * pas, et les jeux de données de `src/data` partent dans le bundle livré.
     *
     * Lui donner ici une valeur de repli garantit que la condition est
     * toujours une constante : un build sans variable d'environnement élimine
     * les maquettes au lieu de les embarquer. Le défaut est « éteint », de
     * sorte qu'un oubli parle à la vraie API plutôt que d'inventer.
     */
    NEXT_PUBLIC_USE_MOCKS: process.env.NEXT_PUBLIC_USE_MOCKS ?? '0',

    /* Couleurs de marque, issues de packages/design-tokens. */
    NEXT_PUBLIC_BRAND_PRIMARY: palette.primary,
    NEXT_PUBLIC_BRAND_SURFACE: palette.surface,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
    ],
  },
};

export default withPWA(nextConfig);
