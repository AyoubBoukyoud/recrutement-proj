import { createRequire } from 'node:module';
import withPWAInit from 'next-pwa';
import runtimeCaching from 'next-pwa/cache.js';
import { PHASE_PRODUCTION_BUILD } from 'next/constants.js';

/*
 * La palette partagée, lue à la construction. Tout ce qui passe par Tailwind
 * tient ses couleurs du preset ; restent les endroits où il n'y a pas de
 * classe possible — `themeColor`, le manifeste PWA, un canvas de QR code, un
 * `stroke` SVG. Les exposer ici leur évite de recopier des valeurs qui
 * dériveraient ensuite de packages/design-tokens en silence.
 */
const { palette } = createRequire(import.meta.url)('../packages/design-tokens/tokens.cjs');

/*
 * `NEXT_PUBLIC_SHOW_DEV_TOOLS=1` puts admin/recruiter/agent shortcuts, local
 * OTP codes, and a route catalogue on the public sign-in screen — meant for
 * `next dev` only (see auth-phone/page.tsx). CLIENT_DEMO_RUNBOOK.md requires
 * it off for any shared build, but that was only ever enforced by someone
 * remembering to check `.env.local` by hand. Failing the production build
 * instead makes that check the platform's, not a person's.
 */
if (process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_SHOW_DEV_TOOLS === '1') {
  throw new Error(
    'NEXT_PUBLIC_SHOW_DEV_TOOLS=1 in a production build. This exposes internal accounts and routes on the ' +
      'public sign-in screen — set it to 0 (or unset it) for any shared/demo/production build.',
  );
}

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
  // Ne pas annoncer le framework dans chaque réponse (`X-Powered-By: Next.js`).
  poweredByHeader: false,
  // The repository also contains a mobile lockfile and a legacy empty root
  // lockfile. Keep Next's trace boundary at this app instead of guessing the
  // monorepo root during production builds.
  outputFileTracingRoot: process.cwd(),
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
    // Même raison : le bouton Google doit être une constante du bundle.
    NEXT_PUBLIC_GOOGLE_SIGN_IN: process.env.NEXT_PUBLIC_GOOGLE_SIGN_IN ?? '0',

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
  /*
   * L'accueil vivait à `/accueil-public` avant de passer à la racine. La
   * redirection permanente transmet à `/` les liens partagés et l'indexation
   * acquise ; le navigateur conserve l'ancre (`#faq`, `#parcours`…).
   */
  async redirects() {
    return [{ source: '/accueil-public', destination: '/', permanent: true }];
  },
};

/*
 * `NEXT_PUBLIC_API_URL` est figée dans le bundle à la construction. Absente,
 * le client `fetch` (lib/api.ts) retombe sur `http://localhost:8000/api` —
 * valeur de développement qui, livrée, ferait appeler au navigateur du
 * visiteur sa propre machine — et le client axios (lib/opsApi.ts) sur des
 * chemins relatifs. La production définit `/api` (Dockerfile.prod,
 * deploy/docker-compose.prod.yml, CI) ; un build qui l'oublie doit échouer
 * plutôt que d'expédier une app qui ne parle à aucune API.
 */
export default function config(phase) {
  if (phase === PHASE_PRODUCTION_BUILD && !process.env.NEXT_PUBLIC_API_URL?.trim()) {
    throw new Error(
      'NEXT_PUBLIC_API_URL is not set for this production build. Set it to the API base the browser should call ' +
        '(`/api` behind the reverse proxy, or an absolute URL) — see frontend/.env.example.',
    );
  }
  return withPWA(nextConfig);
}
