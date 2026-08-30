import { NextResponse, type NextRequest } from 'next/server';

/*
 * Les chemins de l'espace candidat. Cette liste et le `matcher` en bas
 * doivent rester identiques : le `matcher` décide où le middleware
 * s'exécute, la liste décide ce qu'il protège, et un chemin présent dans
 * l'une mais pas dans l'autre est une page ouverte sans que rien ne le
 * signale.
 */
const CANDIDATE_PATHS = [
  '/dashboard',
  '/matching-preferences',
  '/documents',
  '/video',
  '/test-langue',
  '/reclamation',
  '/faq',
  '/profil',
  '/profile-creation',
  '/lecon-jour',
  '/taches',
  '/offres',
  '/quiz-metier',
  '/visibilite',
  '/salaire',
  '/parrainage',
  '/verification-identite',
  '/candidatures',
  '/favoris',
  '/notifications',
  '/compte',
];

/**
 * Duplicate Stitch-template pages, superseded by a functional rewrite. The
 * page component's own `redirect()` only produces a client-side RSC hint
 * here (this route group's layout is a client component), not a real HTTP
 * redirect — middleware is what actually sends the 307, and it can do so
 * before the auth gate below even runs.
 */
const LEGACY_REDIRECTS: Record<string, string> = {
  '/simulateur-salaire': '/salaire',
  '/cours-allemand': '/lecon-jour',
};

/**
 * Les maquettes marketing restent disponibles pour les revues de design,
 * mais uniquement quand quelqu'un les active volontairement. Un serveur
 * `next dev` utilisé devant un client doit suivre le même parcours public que
 * la production par défaut.
 */
const SHOW_PROTOTYPES = process.env.NEXT_PUBLIC_ENABLE_PROTOTYPES === '1';

/**
 * Les portails `/amud` sont des prototypes localStorage. Ils restent dans le
 * dépôt comme références de design, mais une URL de production ne doit pas
 * donner l'impression que leurs données sont réelles.
 */
function realDestinationForAmud(pathname: string): string | null {
  if (!SHOW_PROTOTYPES && pathname.startsWith('/amud/marketing/employers')) return '/employeurs';
  if (!SHOW_PROTOTYPES && pathname.startsWith('/amud/marketing')) return '/accueil-public';
  if (!SHOW_PROTOTYPES && (pathname === '/amud' || pathname.startsWith('/amud/centre'))) return '/accueil-public';
  // Le back-office `/admin` a été retiré : il n'y a plus de console réelle
  // vers laquelle renvoyer, et `/admin/apercu` renverrait un 404. On suit donc
  // `destinationForRole('admin')`, qui envoie l'administrateur sur `/`.
  if (!SHOW_PROTOTYPES && pathname.startsWith('/amud/admin')) return '/';
  if (!SHOW_PROTOTYPES && (pathname.startsWith('/amud/entreprise') || pathname === '/amud/employer')) return '/recruiter';
  if (!SHOW_PROTOTYPES && pathname.startsWith('/amud/commercial')) return '/agent';
  return null;
}

function isCandidatePath(pathname: string) {
  return CANDIDATE_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

function isRecruiterPath(pathname: string) {
  return pathname.startsWith('/recruiter');
}

function isAgentPath(pathname: string) {
  return pathname.startsWith('/agent');
}

function redirectTo(request: NextRequest, targetPathname: string) {
  const url = request.nextUrl.clone();
  url.pathname = targetPathname;
  url.search = '';
  return NextResponse.redirect(url);
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const role = request.cookies.get('as_role')?.value;

  if (pathname === '/') return redirectTo(request, '/accueil-public');

  const amudDestination = realDestinationForAmud(pathname);
  if (amudDestination) return redirectTo(request, amudDestination);

  if (pathname in LEGACY_REDIRECTS) {
    return redirectTo(request, LEGACY_REDIRECTS[pathname]);
  }

  // Routes candidat : nécessite une session candidat.
  if (isCandidatePath(pathname)) {
    if (role !== 'candidate') {
      /*
       * Prototype maquette (NEXT_PUBLIC_USE_MOCKS=1, jamais en production) :
       * une première visite sans cookie du tout ouvre directement une session
       * candidat de démonstration, au lieu de renvoyer vers /auth-phone. Le
       * compte visé (id 101) est celui qu'un login démo réel produirait —
       * AuthContext sème le même localStorage au premier montage côté client.
       * Un rôle déjà présent (employer/admin/agent) garde le comportement
       * existant : ce n'est pas la première visite, donc pas de bascule.
       */
      if (!role && process.env.NEXT_PUBLIC_USE_MOCKS === '1') {
        const response = NextResponse.next();
        response.cookies.set('as_role', 'candidate', { path: '/' });
        response.cookies.set('as_uid', '101', { path: '/' });
        return response;
      }
      return redirectTo(request, '/auth-phone');
    }
  }

  // Routes recruteur : nécessite une session recruteur (rôle "employer").
  if (isRecruiterPath(pathname)) {
    if (role === 'candidate') {
      return redirectTo(request, '/dashboard');
    }
    if (role !== 'employer') {
      return redirectTo(request, '/auth-phone');
    }
  }

  // Routes agent commercial : nécessite une session agent.
  if (isAgentPath(pathname)) {
    if (role === 'candidate') {
      return redirectTo(request, '/dashboard');
    }
    if (role !== 'agent') {
      return redirectTo(request, '/auth-phone');
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/',
    '/simulateur-salaire/:path*',
    '/cours-allemand/:path*',
    '/dashboard/:path*',
    '/matching-preferences/:path*',
    '/documents/:path*',
    '/video/:path*',
    '/test-langue/:path*',
    '/reclamation/:path*',
    '/faq/:path*',
    '/profil/:path*',
    '/profile-creation/:path*',
    '/lecon-jour/:path*',
    '/taches/:path*',
    '/offres/:path*',
    '/quiz-metier/:path*',
    '/visibilite/:path*',
    '/salaire/:path*',
    '/parrainage/:path*',
    '/verification-identite/:path*',
    '/candidatures/:path*',
    '/favoris/:path*',
    '/notifications/:path*',
    '/compte/:path*',
    '/recruiter/:path*',
    '/agent/:path*',
    '/amud/:path*',
  ],
};
