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

/*
 * `next-pwa`'s default rules cache every same-origin GET under `/api/`
 * (NetworkFirst, a day) and every image/other file — which includes the
 * private ones: a candidate's profile and documents, a recruiter's search
 * results, and the signed `/storage/…` links to ID scans and videos. They
 * sat in Cache Storage after sign-out and were served to whoever used the
 * device next whenever the network was slow or off — on the shared phones
 * and cybercafé PCs this product is built for. This rule comes first, and
 * Workbox takes the first match, so none of that is ever stored. (A
 * function pattern is serialised into the worker: it cannot close over
 * anything here.)
 */
const neverCachePrivate = {
  urlPattern: ({ url }) =>
    self.origin === url.origin &&
    (url.pathname.startsWith('/api/') ||
      (url.pathname.startsWith('/storage/') && !url.pathname.startsWith('/storage/company-logos/'))),
  handler: 'NetworkOnly',
  // next-pwa reads `options` on every rule when an offline fallback is set.
  options: {},
};

const withPWA = withPWAInit({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
  runtimeCaching: [neverCachePrivate, ...runtimeCaching],
  fallbacks: {
    document: '/offline',
  },
});

/*
 * Content-Security-Policy for the pages Next serves (the API and the private
 * files come from Laravel through the proxy and carry their own headers).
 *
 * It cannot forbid inline scripts: Next.js writes its own (the RSC payload,
 * the theme bootstrap, the JSON-LD) and would need a nonce on each, which
 * means rendering every page per request. What it does is close the rest —
 * scripts only from this origin and Google Tag Manager, requests only to this
 * origin and Google Analytics (so injected script has nowhere to send a
 * stolen token), no plugins, no <base> tricks, nobody framing the app, forms
 * only to ourselves. Everything allowed below is something the app uses:
 * Google Fonts (and the service worker's fetches of them), Google profile
 * photos, camera/microphone recordings as blob: URLs, signed document
 * previews in a same-origin iframe, consent-gated Analytics.
 *
 * Not set in development: webpack's dev builds need `eval`.
 */
const googleAnalytics = 'https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com';
const contentSecurityPolicy = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://*.googletagmanager.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  `img-src 'self' data: blob: https://lh3.googleusercontent.com ${googleAnalytics}`,
  "media-src 'self' blob:",
  `connect-src 'self' https://fonts.googleapis.com https://fonts.gstatic.com ${googleAnalytics}`,
  "frame-src 'self'",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
].join('; ');

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
  /*
   * Les fichiers de `public/` (vidéo du hero, affiches, icônes) sont servis par
   * Next avec `max-age=0` : le navigateur les revalide à chaque visite, y
   * compris la vidéo de 4 Mo. Leurs noms ne portent pas d'empreinte, donc pas
   * d'`immutable` : un jour de cache franc, puis une semaine de revalidation
   * en arrière-plan, pour qu'un fichier remplacé finisse par arriver.
   * (`/_next/static/*`, lui, est déjà immuable.)
   */
  async headers() {
    const cache = [{ key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' }];
    const assets = ['/landing-assets/:path*', '/icons/:path*', '/assets/:path*', '/favicon.svg', '/favicon.png', '/favicon.ico'].map(
      (source) => ({ source, headers: cache }),
    );

    return process.env.NODE_ENV === 'production'
      ? [...assets, { source: '/:path*', headers: [{ key: 'Content-Security-Policy', value: contentSecurityPolicy }] }]
      : assets;
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
